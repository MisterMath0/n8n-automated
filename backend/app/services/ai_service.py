import uuid
import time
import asyncio
import json
import re
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

logger = structlog.get_logger()


class AIServiceError(Exception):
    pass


def extract_json_from_response(response_text: str) -> str:
    """Extract JSON from AI response, handling markdown blocks and extra text."""
    # Remove any text before the first JSON block
    response_text = response_text.strip()
    
    # Try to find JSON in markdown code blocks
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
    if json_match:
        return json_match.group(1)
    
    # Try to find JSON object directly
    json_match = re.search(r'(\{.*\})', response_text, re.DOTALL)
    if json_match:
        return json_match.group(1)
    
    # If no JSON found, return the original text
    return response_text


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

        # 2. Generate title if it's the first message
        if not history_messages:
            title = await self._generate_conversation_title(user_message)
            await supabase_service.update_conversation_title(conversation_id, user.id, title)
        
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
        model: AIModel = AIModel.CLAUDE_4_SONNET,
        temperature: float = 0.3,
        max_tokens: int = 4000
    ):
        """
        Generate an N8N workflow from a description using AI.
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
                # Use correct Google GenAI SDK syntax
                response = client.models.generate_content(
                    model=config.model_id,
                    contents=full_prompt,
                    config=types.GenerateContentConfig(
                        temperature=temperature,
                        max_output_tokens=max_tokens
                    )
                )
                workflow_json_str = response.text.strip()
                tokens_used = response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') and response.usage_metadata else 0
                
                # Debug: Log the raw response
                logger.info("Raw AI response", response_length=len(workflow_json_str), response_preview=workflow_json_str[:200])
                
            elif config.provider == "anthropic":
                response = client.messages.create(
                    model=config.model_id,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system_prompt,
                    messages=[
                        {"role": "user", "content": description}
                    ],
                    tool_choice={"type": "tool", "name": "workflow_generator"}
                )
                
                # Find the workflow generator tool call
                tool_call = next((block for block in response.content if block.type == 'tool_use' and block.name == 'workflow_generator'), None)
                if not tool_call:
                    raise AIServiceError("Anthropic did not return the expected workflow tool call")
                
                workflow_json_str = json.dumps(tool_call.input)
                tokens_used = response.usage.input_tokens + response.usage.output_tokens
                
                # Debug: Log the raw response
                logger.info("Raw AI response", response_length=len(workflow_json_str), response_preview=workflow_json_str[:200])
                
            else:  # OpenAI compatible
                # For OpenAI, we need to provide tools when using tool_choice
                # Define the workflow generator tool for OpenAI
                workflow_tool = {
                    "type": "function",
                    "function": {
                        "name": "workflow_generator",
                        "description": "Generate an N8N workflow JSON from a description",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "workflow": {
                                    "type": "object",
                                    "description": "Complete N8N workflow JSON object"
                                }
                            },
                            "required": ["workflow"]
                        }
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
                
                # Debug: Log the raw response
                logger.info("Raw AI response", response_length=len(workflow_json_str), response_preview=workflow_json_str[:200])
            
            # Parse the generated JSON
            try:
                # Extract JSON from response (handles markdown blocks)
                extracted_json = extract_json_from_response(workflow_json_str)
                workflow_data = json.loads(extracted_json)
                workflow = N8NWorkflow(**workflow_data)
            except json.JSONDecodeError as e:
                logger.error("Failed to parse generated workflow JSON", error=str(e), raw_response=workflow_json_str[:500])
                raise AIServiceError(f"Generated workflow is not valid JSON: {str(e)}. Raw response: {workflow_json_str[:200]}")
            
            generation_time = time.time() - start_time
            
            logger.info(
                "Workflow generated successfully",
                workflow_name=workflow.name,
                nodes_count=len(workflow.nodes),
                generation_time=generation_time,
                tokens_used=tokens_used,
                model=model.value
            )
            
            return workflow, generation_time, tokens_used
            
        except Exception as e:
            logger.error("Workflow generation failed", error=str(e))
            raise AIServiceError(f"Workflow generation failed: {str(e)}")

    async def edit_workflow(
        self,
        workflow: N8NWorkflow,
        description: str,
        model: AIModel = AIModel.CLAUDE_4_SONNET,
        temperature: float = 0.3,
        max_tokens: int = 4000
    ):
        """
        Edit an N8N workflow from a description using AI.
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
                # Use correct Google GenAI SDK syntax
                response = client.models.generate_content(
                    model=config.model_id,
                    contents=edit_prompt,
                    config=types.GenerateContentConfig(
                        temperature=temperature,
                        max_output_tokens=max_tokens
                    )
                )
                edited_workflow_json_str = response.text.strip()
                tokens_used = response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') and response.usage_metadata else 0
                
                # Parse the JSON response
                extracted_json = extract_json_from_response(edited_workflow_json_str)
                edited_workflow_data = json.loads(extracted_json)
                edited_workflow = N8NWorkflow(**edited_workflow_data)
                
            elif config.provider == "anthropic":
                response = client.messages.create(
                    model=config.model_id,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system_prompt,
                    messages=[
                        {"role": "user", "content": edit_prompt}
                    ],
                    tool_choice={"type": "tool", "name": "workflow_editor"}
                )
                
                # Find the workflow editor tool call
                tool_call = next((block for block in response.content if block.type == 'tool_use' and block.name == 'workflow_editor'), None)
                if not tool_call:
                    raise AIServiceError("Anthropic did not return the expected workflow tool call")
                
                edited_workflow_data = tool_call.input
                edited_workflow = N8NWorkflow(**edited_workflow_data)
                tokens_used = response.usage.input_tokens + response.usage.output_tokens
                
            else:  # OpenAI compatible
                # For OpenAI, we need to provide tools when using tool_choice
                # Define the workflow editor tool for OpenAI
                workflow_editor_tool = {
                    "type": "function",
                    "function": {
                        "name": "workflow_editor",
                        "description": "Edit an N8N workflow JSON based on a description",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "workflow": {
                                    "type": "object",
                                    "description": "Complete edited N8N workflow JSON object"
                                }
                            },
                            "required": ["workflow"]
                        }
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
                    edited_workflow_data = json.loads(tool_call.function.arguments)
                else:
                    # Fallback: try to extract from message content
                    edited_workflow_json_str = response.choices[0].message.content or ""
                    extracted_json = extract_json_from_response(edited_workflow_json_str)
                    edited_workflow_data = json.loads(extracted_json)
                
                edited_workflow = N8NWorkflow(**edited_workflow_data)
                tokens_used = response.usage.total_tokens if response.usage else 0
            
            generation_time = time.time() - start_time
            
            logger.info(
                "Workflow edited successfully",
                workflow_name=edited_workflow.name,
                nodes_count=len(edited_workflow.nodes),
                generation_time=generation_time,
                tokens_used=tokens_used,
                model=model.value
            )
            
            return edited_workflow, generation_time, tokens_used
            
        except Exception as e:
            logger.error("Workflow editing failed", error=str(e))
            raise AIServiceError(f"Workflow editing failed: {str(e)}")


ai_service = AIService()
