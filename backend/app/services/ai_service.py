import uuid
import time
import asyncio
import json
from typing import Dict, Any, Optional, List, Tuple

import openai
import anthropic
import structlog
from google import genai
from google.genai import types

from ..models.workflow import AIModel, N8NWorkflow, N8NNode, N8NConnection
from ..models.conversation import ChatMessage, ChatResponse
from ..core.config import settings
from ..core.config_loader import config_loader
from .tools import ToolBasedChatService
from .supabase_service import supabase_service
from ..core.auth import get_current_user, CurrentUser
from ..utils.structured_output import (
    create_n8n_workflow_schema,
    parse_workflow_with_recovery,
    extract_json_from_response
)

logger = structlog.get_logger()


class AIServiceError(Exception):
    pass





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
            title_model = AIModel.GEMINI_2_5_FLASH
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
        model: AIModel = AIModel.GEMINI_2_5_FLASH,  # Default to free Gemini model
        temperature: float = 0.3,
        max_tokens: int = 4000
    ) -> ChatResponse:
        """Tool-based chat with workflow generation and documentation search"""
        # 1. Get conversation history
        history_messages = await supabase_service.get_conversation_messages(
            conversation_id=conversation_id,
            user_id=user.id,
            model_key=model.value
        )

        # 2. If no history exists, create the conversation first
        if not history_messages:
            try:
                # Create the conversation in the database
                await supabase_service.create_conversation(
                    user_id=user.id,
                    conversation_id=conversation_id,  # Pass the conversation ID
                    workflow_id=None,
                    title=None  # Will be set below
                )
                logger.info("Created new conversation", conversation_id=conversation_id, user_id=user.id)
            except Exception as e:
                logger.warning("Failed to create conversation (may already exist)", error=str(e), conversation_id=conversation_id)
                # Continue anyway - the conversation might already exist or there could be a race condition
            
            # Generate and set title
            title = await self._generate_conversation_title(user_message)
            try:
                await supabase_service.update_conversation_title(conversation_id, user.id, title)
                logger.info("Set conversation title", conversation_id=conversation_id, title=title)
            except Exception as e:
                logger.error("Failed to set conversation title", error=str(e), conversation_id=conversation_id)
                # Continue anyway - this is not critical
        
        # 3. Add new user message
        all_messages = history_messages + [{"role": "user", "content": user_message}]

        # 4. Call tool-based chat service
        return await self.tool_chat_service.chat(
            messages=[ChatMessage(**msg) for msg in all_messages],
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            conversation_id=conversation_id
        )

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

    async def generate_workflow(
        self,
        description: str,
        model: AIModel = AIModel.GEMINI_2_5_FLASH,
        temperature: float = 0.3,
        max_tokens: int = 4000
    ):
        """
        Generate an N8N workflow from a description using AI with structured output.
        This method is called by the WorkflowGeneratorTool.
        """
        start_time = time.time()
        
        try:
            # Get system prompt for workflow generation
            system_prompt = self.get_tool_prompt("workflow_generator", "system_prompt")
            
            # Create the full prompt
            full_prompt = f"{system_prompt}\n\nUser Description: {description}\n\nGenerate a valid N8N workflow JSON:"
            
            # Get client and config
            client, config = self._get_client_and_config(model)
            
            # Generate workflow JSON using the appropriate provider
            if config.provider == "google":
                # Use structured output with schema for Google GenAI
                workflow_schema = create_n8n_workflow_schema()
                
                logger.info("Using Google GenAI structured output for workflow generation")
                
                response = client.models.generate_content(
                    model=config.model_id,
                    contents=full_prompt,
                    config=types.GenerateContentConfig(
                        temperature=temperature,
                        max_output_tokens=max_tokens,
                        response_mime_type="application/json",
                        response_schema=workflow_schema
                    )
                )
                workflow_json_str = response.text.strip()
                tokens_used = response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') and response.usage_metadata else 0
                
                logger.info("Google GenAI structured output response", response_length=len(workflow_json_str), response_preview=workflow_json_str[:200])
                
            elif config.provider == "anthropic":
                # Use structured output with tool calls for Anthropic
                workflow_tool = {
                    "name": "workflow_generator",
                    "description": "Generate an N8N workflow JSON from a description",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "workflow": create_n8n_workflow_schema()
                        },
                        "required": ["workflow"]
                    }
                }
                
                response = client.messages.create(
                    model=config.model_id,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system_prompt,
                    messages=[
                        {"role": "user", "content": description}
                    ],
                    tools=[workflow_tool],
                    tool_choice={"type": "tool", "name": "workflow_generator"}
                )
                
                # Find the workflow generator tool call
                tool_call = next((block for block in response.content if block.type == 'tool_use' and block.name == 'workflow_generator'), None)
                if not tool_call:
                    raise AIServiceError("Anthropic did not return the expected workflow tool call")
                
                workflow_json_str = json.dumps(tool_call.input.get("workflow", tool_call.input))
                tokens_used = response.usage.input_tokens + response.usage.output_tokens
                
                logger.info("Anthropic structured output response", response_length=len(workflow_json_str), response_preview=workflow_json_str[:200])
                
            else:  # OpenAI compatible
                # Use structured output with function calling for OpenAI
                workflow_tool = {
                    "type": "function",
                    "function": {
                        "name": "workflow_generator",
                        "description": "Generate an N8N workflow JSON from a description",
                        "parameters": create_n8n_workflow_schema()
                    }
                }
                
                response = client.chat.completions.create(
                    model=config.model_id,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": description}
                    ],
                    max_tokens=max_tokens,
                    temperature=temperature,
                    tools=[workflow_tool],
                    tool_choice={"type": "function", "function": {"name": "workflow_generator"}}
                )
                
                # Extract the tool call from the response
                if response.choices[0].message.tool_calls:
                    tool_call = response.choices[0].message.tool_calls[0]
                    workflow_json_str = tool_call.function.arguments
                else:
                    # Fallback: try to extract from message content
                    workflow_json_str = response.choices[0].message.content or ""
                
                tokens_used = response.usage.total_tokens if response.usage else 0
                
                logger.info("OpenAI structured output response", response_length=len(workflow_json_str), response_preview=workflow_json_str[:200])
            
            # Parse and validate the generated workflow
            workflow = parse_workflow_with_recovery(workflow_json_str)
            
            generation_time = time.time() - start_time
            
            logger.info(
                "Workflow generated successfully with structured output",
                workflow_name=workflow.name,
                nodes_count=len(workflow.nodes),
                generation_time=generation_time,
                tokens_used=tokens_used,
                model=model.value,
                provider=config.provider
            )
            
            return workflow, generation_time, tokens_used
            
        except Exception as e:
            logger.error("Workflow generation failed", error=str(e))
            raise AIServiceError(f"Workflow generation failed: {str(e)}")

    async def edit_workflow(
        self,
        workflow: N8NWorkflow,
        description: str,
        model: AIModel = AIModel.GEMINI_2_5_FLASH,
        temperature: float = 0.3,
        max_tokens: int = 4000
    ):
        """
        Edit an N8N workflow from a description using AI with structured output.
        This method is called by the WorkflowEditorTool.
        """
        start_time = time.time()
        
        try:
            # Get system prompt for workflow editing
            system_prompt = self.get_tool_prompt("workflow_editor", "system_prompt")
            
            # Create the full prompt
            edit_prompt = f"{system_prompt}\n\nUser Description: {description}\n\nEdit the following N8N workflow JSON:\n{json.dumps(workflow.model_dump())}"
            
            # Get client and config
            client, config = self._get_client_and_config(model)
            
            # Generate edited workflow
            if config.provider == "google":
                # Use structured output with schema for Google GenAI
                workflow_schema = create_n8n_workflow_schema()
                
                response = client.models.generate_content(
                    model=config.model_id,
                    contents=edit_prompt,
                    config=types.GenerateContentConfig(
                        temperature=temperature,
                        max_output_tokens=max_tokens,
                        response_mime_type="application/json",
                        response_schema=workflow_schema
                    )
                )
                edited_workflow_json_str = response.text.strip()
                tokens_used = response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') and response.usage_metadata else 0
                
                # Parse the JSON response with recovery
                edited_workflow = parse_workflow_with_recovery(edited_workflow_json_str)
                
            elif config.provider == "anthropic":
                # Use structured output with tool calls for Anthropic
                workflow_editor_tool = {
                    "name": "workflow_editor",
                    "description": "Edit an N8N workflow JSON based on a description",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "workflow": create_n8n_workflow_schema()
                        },
                        "required": ["workflow"]
                    }
                }
                
                response = client.messages.create(
                    model=config.model_id,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system_prompt,
                    messages=[
                        {"role": "user", "content": edit_prompt}
                    ],
                    tools=[workflow_editor_tool],
                    tool_choice={"type": "tool", "name": "workflow_editor"}
                )
                
                # Find the workflow editor tool call
                tool_call = next((block for block in response.content if block.type == 'tool_use' and block.name == 'workflow_editor'), None)
                if not tool_call:
                    raise AIServiceError("Anthropic did not return the expected workflow tool call")
                
                edited_workflow_json_str = json.dumps(tool_call.input.get("workflow", tool_call.input))
                edited_workflow = parse_workflow_with_recovery(edited_workflow_json_str)
                tokens_used = response.usage.input_tokens + response.usage.output_tokens
                
            else:  # OpenAI compatible
                # Use structured output with function calling for OpenAI
                workflow_editor_tool = {
                    "type": "function",
                    "function": {
                        "name": "workflow_editor",
                        "description": "Edit an N8N workflow JSON based on a description",
                        "parameters": create_n8n_workflow_schema()
                    }
                }
                
                response = client.chat.completions.create(
                    model=config.model_id,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": edit_prompt}
                    ],
                    max_tokens=max_tokens,
                    temperature=temperature,
                    tools=[workflow_editor_tool],
                    tool_choice={"type": "function", "function": {"name": "workflow_editor"}}
                )
                
                # Extract the tool call from the response
                if response.choices[0].message.tool_calls:
                    tool_call = response.choices[0].message.tool_calls[0]
                    edited_workflow_json_str = tool_call.function.arguments
                else:
                    # Fallback: try to extract from message content
                    edited_workflow_json_str = response.choices[0].message.content or ""
                
                edited_workflow = parse_workflow_with_recovery(edited_workflow_json_str)
                tokens_used = response.usage.total_tokens if response.usage else 0
            
            generation_time = time.time() - start_time
            
            logger.info(
                "Workflow edited successfully with structured output",
                workflow_name=edited_workflow.name,
                nodes_count=len(edited_workflow.nodes),
                generation_time=generation_time,
                tokens_used=tokens_used,
                model=model.value,
                provider=config.provider
            )
            
            return edited_workflow, generation_time, tokens_used
            
        except Exception as e:
            logger.error("Workflow editing failed", error=str(e))
            raise AIServiceError(f"Workflow editing failed: {str(e)}")


ai_service = AIService()
