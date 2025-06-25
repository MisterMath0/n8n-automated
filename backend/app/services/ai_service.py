import time
import json
from typing import Dict, Any, Optional, List

import openai
import anthropic
import structlog
from google import genai
from google.genai import types

from ..models.workflow import AIModel, N8NWorkflow
from ..models.conversation import ChatMessage, ChatResponse
from ..core.config import settings
from ..core.config_loader import config_loader
from .tools import ToolBasedChatService
from .supabase_service import supabase_service
from ..core.auth import CurrentUser

logger = structlog.get_logger()

class AIServiceError(Exception):
    pass

def truncate_workflow_context(workflow_data: Dict[str, Any], max_nodes: int = 50) -> Dict[str, Any]:
    """Truncate workflow context for very large workflows to prevent token limit issues."""
    if not workflow_data or not isinstance(workflow_data, dict):
        return workflow_data
    
    # Create a copy to avoid modifying the original
    truncated_data = workflow_data.copy()
    
    # If there are too many nodes, truncate them
    nodes = truncated_data.get('nodes', [])
    if len(nodes) > max_nodes:
        truncated_data['nodes'] = nodes[:max_nodes]
        truncated_data['_truncated'] = True
        truncated_data['_original_node_count'] = len(nodes)
        logger.info("Truncated workflow context", 
                   original_nodes=len(nodes), 
                   truncated_nodes=max_nodes)
    
    # Also limit connections if present
    connections = truncated_data.get('connections', [])
    if len(connections) > max_nodes * 2:  # Reasonable ratio
        truncated_data['connections'] = connections[:max_nodes * 2]
    
    return truncated_data

def format_workflow_context_message(workflow: Dict[str, Any]) -> str:
    """Create a concise workflow context message for AI."""
    workflow_data = workflow.get('workflow_data', {})
    
    # Truncate if too large
    truncated_data = truncate_workflow_context(workflow_data)
    
    # Create a more concise context message
    context_parts = [
        f"CURRENT WORKFLOW CONTEXT:",
        f"Name: {workflow.get('name', 'Untitled')}",
        f"Description: {workflow.get('description', 'No description')}",
        f"Nodes: {len(truncated_data.get('nodes', []))} nodes",
        f"Last Updated: {workflow.get('updated_at')}"
    ]
    
    if truncated_data.get('_truncated'):
        context_parts.append(f"Note: Workflow context truncated from {truncated_data.get('_original_node_count')} to {len(truncated_data.get('nodes', []))} nodes for performance")
    
    # Add a simplified workflow structure instead of full JSON dump
    nodes = truncated_data.get('nodes', [])
    if nodes:
        context_parts.append("\nWorkflow Structure:")
        for i, node in enumerate(nodes[:10]):  # Show only first 10 nodes
            node_type = node.get('type', 'Unknown')
            node_name = node.get('name', f'Node {i+1}')
            context_parts.append(f"  {i+1}. {node_name} ({node_type})")
        
        if len(nodes) > 10:
            context_parts.append(f"  ... and {len(nodes) - 10} more nodes")
    
    context_parts.append("\nYou are helping the user modify, understand, or extend this specific n8n workflow.")
    
    return "\n".join(context_parts)


class AIService:
    def __init__(self):
        self.openai_clients: Dict[str, openai.OpenAI] = {}
        self.anthropic_client: Optional[anthropic.Anthropic] = None
        self.google_client = None
        self._initialize_clients()
        
        # Tool-based chat service
        self.tool_chat_service = ToolBasedChatService(self)

    def _initialize_clients(self):
        models_config = config_loader.load_models()
        
        for model_key, model_config in models_config.items():
            api_key = getattr(settings, model_config.api_key_env.lower(), None)
            if not api_key:
                continue
                
            try:
                if model_config.provider == "google":
                    if not self.google_client:
                        # Use the new Google Gen AI SDK
                        try:
                            self.google_client = genai.Client(api_key=api_key)
                            logger.info("Google AI client initialized in AIService")
                        except ImportError:
                            logger.warning("google-genai package not installed, skipping Google models")
                            continue
                
                elif model_config.provider == "anthropic":
                    if not self.anthropic_client:
                        self.anthropic_client = anthropic.Anthropic(api_key=api_key)
                        logger.info("Anthropic client initialized")
                
                elif model_config.provider in ["openai", "groq"]:
                    client = openai.OpenAI(
                        api_key=api_key,
                        base_url=model_config.base_url
                    )
                    self.openai_clients[model_key] = client
                    logger.info("OpenAI-compatible client initialized", model=model_key, provider=model_config.provider)
                    
            except Exception as e:
                logger.warning("Failed to initialize client", model=model_key, error=str(e))
                continue

    async def _generate_conversation_title(self, user_message: str) -> str:
        """Generates a conversation title from the first user message."""
        try:
            title_model = AIModel.GEMINI_2_5_FLASH_FAST
            if not self.tool_chat_service.client_manager.is_model_available(title_model):
                return (user_message[:75] + '...') if len(user_message) > 75 else user_message

            client, config = self._get_client_and_config(title_model)
            
            prompt = f"Summarize the following user query into a short, concise title (4-8 words). Do not use quotes. Query: \"{user_message}\""
            
            if config.provider == "google":
                response = client.models.generate_content(
                    model=config.model_id,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.1,
                        max_output_tokens=25
                    )
                )
                return response.text.strip()
            elif config.provider == "anthropic":
                response = client.messages.create(
                    model=config.model_id,
                    max_tokens=25,
                    temperature=0.1,
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.content[0].text.strip()
            else: # OpenAI compatible
                response = client.chat.completions.create(
                    model=config.model_id,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=25,
                    temperature=0.1
                )
                return response.choices[0].message.content.strip()
        except Exception:
            logger.warning("AI title generation failed, falling back to truncation.")
            return (user_message[:75] + '...') if len(user_message) > 75 else user_message

    def _get_client_and_config(self, model: AIModel):
        """Get client and config for a model (used by tools)"""
        model_config = config_loader.get_model_config(model.value)
        
        if model_config.provider == "google":
            if not self.google_client:
                raise AIServiceError(f"Google client not available for model: {model.value}")
            return self.google_client, model_config
            
        elif model_config.provider == "anthropic":
            if not self.anthropic_client:
                raise AIServiceError(f"Anthropic client not available for model: {model.value}")
            return self.anthropic_client, model_config
            
        elif model_config.provider in ["openai", "groq"]:
            if model.value not in self.openai_clients:
                raise AIServiceError(f"OpenAI client not available for model: {model.value}")
            return self.openai_clients[model.value], model_config
            
        else:
            raise AIServiceError(f"Unsupported provider: {model_config.provider}")

    async def chat_with_tools(
        self,
        user_message: str,
        conversation_id: str,
        user: CurrentUser,
        workflow_id: Optional[str] = None,  # Add workflow context!
        model: AIModel = AIModel.GEMINI_2_5_FLASH,  # Default to free Gemini model
        temperature: float = 0.3,
        max_tokens: int = 4000
    ) -> ChatResponse:
        """Tool-based chat with workflow generation and documentation search"""
        # 1. Get workflow context if workflow_id is provided
        workflow_context = None
        if workflow_id:
            try:
                workflow_context = await supabase_service.get_workflow(workflow_id, user.id)
                logger.info("Retrieved workflow context", 
                           workflow_id=workflow_id, 
                           workflow_found=workflow_context is not None,
                           workflow_name=workflow_context.get('name', 'Unknown') if workflow_context else None,
                           has_workflow_data=bool(workflow_context.get('workflow_data')) if workflow_context else False,
                           workflow_data_keys=list(workflow_context.get('workflow_data', {}).keys()) if workflow_context and workflow_context.get('workflow_data') else [])
            except Exception as e:
                logger.error("Failed to retrieve workflow context", workflow_id=workflow_id, error=str(e))
                workflow_context = None
        
        # 2. Get conversation history
        history_messages = await supabase_service.get_conversation_messages(
            conversation_id=conversation_id,
            user_id=user.id,
            model_key=model.value
        )

        # 3. If no history exists, check if conversation exists, create if needed
        if not history_messages:
            try:
                # First check if conversation already exists
                existing_conversation = await supabase_service.get_conversation_by_id(conversation_id, user.id)
                
                if existing_conversation:
                    logger.info("Conversation already exists", conversation_id=conversation_id, user_id=user.id)
                    conversation = existing_conversation
                else:
                    # Create new conversation only if it doesn't exist
                    conversation = await supabase_service.create_conversation(
                        user_id=user.id,
                        conversation_id=conversation_id,
                        workflow_id=workflow_id,
                        title=None
                    )
                    if conversation:
                        logger.info("Created new conversation", conversation_id=conversation_id, user_id=user.id, workflow_id=workflow_id)
                    else:
                        logger.warning("No conversation returned from create_conversation", conversation_id=conversation_id)
            except Exception as e:
                logger.error("Failed to check/create conversation", error=str(e), conversation_id=conversation_id)
                # Continue anyway - we can still try to save messages
                conversation = None
            
            # Generate and set title (only if conversation was successfully created)
            if conversation:
                title = await self._generate_conversation_title(user_message)
                try:
                    await supabase_service.update_conversation_title(conversation_id, user.id, title)
                    logger.info("Set conversation title", conversation_id=conversation_id, title=title)
                except Exception as e:
                    logger.error("Failed to set conversation title", error=str(e), conversation_id=conversation_id)
                    # Continue anyway - this is not critical
        
        # 4. Add workflow context to message history if available
        if workflow_context:
            # Use the new concise workflow context formatter
            workflow_system_message = {
                "role": "system", 
                "content": format_workflow_context_message(workflow_context)
            }
            all_messages = [workflow_system_message] + history_messages + [{"role": "user", "content": user_message}]
            logger.info("Added workflow context to messages", 
                       workflow_name=workflow_context.get('name'),
                       system_message_length=len(workflow_system_message['content']),
                       total_messages=len(all_messages))
        else:
            all_messages = history_messages + [{"role": "user", "content": user_message}]
            logger.warning("No workflow context available - AI will not know about workflow", 
                          workflow_id=workflow_id,
                          reason="workflow_context is None")

        # 5. Save user message to database BEFORE processing
        try:
            user_token_count = len(user_message.split())  # Simple token estimation
            await supabase_service.add_message(
                conversation_id=conversation_id,
                content=user_message,
                role="user",
                message_type="text",
                workflow_data=None,
                token_count=user_token_count
            )
            logger.info("Saved user message to database", conversation_id=conversation_id)
        except Exception as e:
            logger.error("Failed to save user message", error=str(e), conversation_id=conversation_id)
            # Continue anyway - chat can still work without saving

        # 6. Call tool-based chat service
        response = await self.tool_chat_service.chat(
            messages=[ChatMessage(**msg) for msg in all_messages],
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            conversation_id=conversation_id
        )

        # 7. Save AI response to database AFTER processing
        try:
            ai_token_count = response.tokens_used or len(response.message.split())  # Use actual or estimate
            
            # Prepare workflow data if present
            workflow_data = None
            if response.workflow:
                workflow_data = response.workflow.model_dump()
                
            await supabase_service.add_message(
                conversation_id=conversation_id,
                content=response.message,
                role="assistant",
                message_type="workflow" if response.workflow else "text",
                workflow_data=workflow_data,
                token_count=ai_token_count
            )
            logger.info("Saved AI response to database", conversation_id=conversation_id, has_workflow=response.workflow is not None)
        except Exception as e:
            logger.error("Failed to save AI response", error=str(e), conversation_id=conversation_id)
            # Continue anyway - user still gets the response

        return response

    async def chat_with_tools_streaming(
        self,
        user_message: str,
        conversation_id: str,
        user: CurrentUser,
        workflow_id: Optional[str] = None,
        model: AIModel = AIModel.GEMINI_2_5_FLASH,
        temperature: float = 0.3,
        max_tokens: int = 4000
    ):
        """Streaming version of chat_with_tools"""
        # 1. Get workflow context if workflow_id is provided
        workflow_context = None
        if workflow_id:
            try:
                workflow_context = await supabase_service.get_workflow(workflow_id, user.id)
                logger.info("Retrieved workflow context", 
                           workflow_id=workflow_id, 
                           workflow_found=workflow_context is not None)
            except Exception as e:
                logger.error("Failed to retrieve workflow context", workflow_id=workflow_id, error=str(e))
                workflow_context = None
        
        # 2. Get conversation history
        history_messages = await supabase_service.get_conversation_messages(
            conversation_id=conversation_id,
            user_id=user.id,
            model_key=model.value
        )

        # 3. If no history exists, check if conversation exists, create if needed
        if not history_messages:
            try:
                # First check if conversation already exists
                existing_conversation = await supabase_service.get_conversation_by_id(conversation_id, user.id)
                
                if existing_conversation:
                    logger.info("Conversation already exists", conversation_id=conversation_id, user_id=user.id)
                    conversation = existing_conversation
                else:
                    # Create new conversation only if it doesn't exist
                    conversation = await supabase_service.create_conversation(
                        user_id=user.id,
                        conversation_id=conversation_id,
                        workflow_id=workflow_id,
                        title=None
                    )
                    if conversation:
                        logger.info("Created new conversation", conversation_id=conversation_id, user_id=user.id)
                    else:
                        logger.warning("No conversation returned from create_conversation", conversation_id=conversation_id)
            except Exception as e:
                logger.error("Failed to check/create conversation", error=str(e), conversation_id=conversation_id)
                # Continue anyway - we can still try to save messages
                conversation = None
            
            # Generate and set title (only if conversation was successfully created)
            if conversation:
                title = await self._generate_conversation_title(user_message)
                try:
                    await supabase_service.update_conversation_title(conversation_id, user.id, title)
                except Exception as e:
                    logger.error("Failed to set conversation title", error=str(e))
        
        # 4. Add workflow context to message history if available
        if workflow_context:
            # Use the new concise workflow context formatter
            workflow_system_message = {
                "role": "system", 
                "content": format_workflow_context_message(workflow_context)
            }
            all_messages = [workflow_system_message] + history_messages + [{"role": "user", "content": user_message}]
        else:
            all_messages = history_messages + [{"role": "user", "content": user_message}]

        # 5. Save user message to database BEFORE processing
        try:
            user_token_count = len(user_message.split())
            await supabase_service.add_message(
                conversation_id=conversation_id,
                content=user_message,
                role="user",
                message_type="text",
                workflow_data=None,
                token_count=user_token_count
            )
        except Exception as e:
            logger.error("Failed to save user message", error=str(e))

        # 6. Stream the tool-based chat response
        final_response = None
        async for event in self.tool_chat_service.chat_streaming(
            messages=[ChatMessage(**msg) for msg in all_messages],
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            conversation_id=conversation_id
        ):
            if event.get("type") == "final_response":
                final_response = event.get("response")
            yield event

        # 7. Save AI response to database AFTER processing completes
        if final_response:
            try:
                ai_token_count = final_response.tokens_used or len(final_response.message.split())
                workflow_data = None
                if final_response.workflow:
                    workflow_data = final_response.workflow.model_dump()
                    
                await supabase_service.add_message(
                    conversation_id=conversation_id,
                    content=final_response.message,
                    role="assistant",
                    message_type="workflow" if final_response.workflow else "text",
                    workflow_data=workflow_data,
                    token_count=ai_token_count
                )
            except Exception as e:
                logger.error("Failed to save AI response", error=str(e))

    def get_available_providers(self) -> Dict[str, bool]:
        models_config = config_loader.load_models()
        providers = {}
        
        for model_key, model_config in models_config.items():
            provider = model_config.provider
            if provider == "google":
                providers[provider] = self.google_client is not None
            elif provider == "anthropic":
                providers[provider] = self.anthropic_client is not None
            else:
                providers[provider] = model_key in self.openai_clients
        
        return providers

    def get_available_models(self) -> List[str]:
        available_models = []
        models_config = config_loader.load_models()
        
        # Add Google models
        if self.google_client:
            for model_key, model_config in models_config.items():
                if model_config.provider == "google":
                    available_models.append(model_key)
        
        # Add Anthropic models
        if self.anthropic_client:
            for model_key, model_config in models_config.items():
                if model_config.provider == "anthropic":
                    available_models.append(model_key)
        
        # Add OpenAI/Groq models
        available_models.extend(list(self.openai_clients.keys()))
        return available_models
    
    def get_tool_info(self) -> Dict[str, Any]:
        """Get information about available tools"""
        return self.tool_chat_service.get_tool_info()

    def get_system_prompt(self, prompt_type: str = "default") -> str:
        """Get system prompt from configuration"""
        prompts_config = config_loader.load_config("prompts")
        return prompts_config["chat_system"][prompt_type]

    def get_tool_prompt(self, tool_name: str, prompt_type: str = "description") -> str:
        """Get tool-specific prompt from configuration"""
        prompts_config = config_loader.load_config("prompts")
        return prompts_config["tools"][tool_name][prompt_type]

    # Workflow generation now handled by WorkflowOrchestratorTool
    # This method is deprecated and will be removed

    # Workflow editing now handled by multi-step tools
    # This method is deprecated and will be removed


ai_service = AIService()
