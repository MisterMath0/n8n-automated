import time
import json
import os
from typing import Dict, Any, Optional, Tuple, List

import openai
import anthropic

from ..models.workflow import AIModel, N8NWorkflow
from ..core.config import settings
from ..core.config_loader import config_loader


class AIServiceError(Exception):
    pass


class AIService:
    def __init__(self):
        self.openai_clients: Dict[str, openai.OpenAI] = {}
        self.anthropic_client: Optional[anthropic.Anthropic] = None
        self._initialize_clients()

    def _initialize_clients(self):
        models_config = config_loader.load_models()
        
        for model_key, model_config in models_config.items():
            api_key = os.getenv(model_config.api_key_env)
            if not api_key:
                continue
                
            try:
                if model_config.provider == "anthropic":
                    if not self.anthropic_client:
                        self.anthropic_client = anthropic.Anthropic(api_key=api_key)
                
                elif model_config.provider in ["openai", "groq"]:
                    client = openai.OpenAI(
                        api_key=api_key,
                        base_url=model_config.base_url
                    )
                    self.openai_clients[model_key] = client
                    
            except Exception:
                continue

    def _get_client_and_config(self, model: AIModel) -> Tuple[Any, Any]:
        model_config = config_loader.get_model_config(model.value)
        
        if model_config.provider == "anthropic":
            if not self.anthropic_client:
                raise AIServiceError(f"Anthropic client not available for model: {model.value}")
            return self.anthropic_client, model_config
            
        elif model_config.provider in ["openai", "groq"]:
            if model.value not in self.openai_clients:
                raise AIServiceError(f"OpenAI client not available for model: {model.value}")
            return self.openai_clients[model.value], model_config
            
        else:
            raise AIServiceError(f"Unsupported provider: {model_config.provider}")

    def _build_messages(self, prompt_type: str, **kwargs) -> List[Dict[str, str]]:
        system_prompt = config_loader.get_prompt_template(prompt_type, "system")
        user_prompt = config_loader.get_prompt_template(prompt_type, "user")
        
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        if prompt_type == "workflow_generation":
            messages.append({
                "role": "user", 
                "content": user_prompt.format(description=kwargs.get("description", ""))
            })
        elif prompt_type == "workflow_editing":
            messages[0]["content"] = system_prompt.format(
                workflow_json=kwargs.get("workflow_json", "")
            )
            messages.append({
                "role": "user",
                "content": user_prompt.format(
                    edit_instruction=kwargs.get("edit_instruction", "")
                )
            })
        
        return messages

    def _parse_workflow_json(self, json_str: str) -> N8NWorkflow:
        try:
            json_str = json_str.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            if json_str.endswith("```"):
                json_str = json_str[:-3]
            json_str = json_str.strip()
            
            workflow_dict = json.loads(json_str)
            return N8NWorkflow(**workflow_dict)
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {str(e)}")
        except Exception as e:
            raise ValueError(f"Invalid workflow structure: {str(e)}")

    async def generate_workflow(
        self,
        description: str,
        model: AIModel,
        temperature: float = 0.3,
        max_tokens: int = 4000
    ) -> Tuple[N8NWorkflow, float, Optional[int]]:
        start_time = time.time()
        
        try:
            client, model_config = self._get_client_and_config(model)
            messages = self._build_messages("workflow_generation", description=description)
            
            if model_config.provider == "anthropic":
                response = client.messages.create(
                    model=model_config.model_id,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=messages[0]["content"],
                    messages=messages[1:]
                )
                content = response.content[0].text
                tokens_used = response.usage.input_tokens + response.usage.output_tokens
                
            else:  # OpenAI or Groq via OpenAI SDK
                response = client.chat.completions.create(
                    model=model_config.model_id,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    response_format={"type": "json_object"} if model_config.supports_json_mode else None
                )
                content = response.choices[0].message.content
                tokens_used = getattr(response.usage, 'total_tokens', None) if response.usage else None
            
            workflow = self._parse_workflow_json(content)
            generation_time = time.time() - start_time
            
            return workflow, generation_time, tokens_used
            
        except Exception as e:
            generation_time = time.time() - start_time
            raise AIServiceError(f"Workflow generation failed: {str(e)}")

    async def edit_workflow(
        self,
        workflow: N8NWorkflow,
        edit_instruction: str,
        model: AIModel,
        temperature: float = 0.3
    ) -> Tuple[N8NWorkflow, float, Optional[int], List[str]]:
        start_time = time.time()
        
        try:
            client, model_config = self._get_client_and_config(model)
            workflow_json = workflow.model_dump_json(indent=2)
            
            messages = self._build_messages(
                "workflow_editing", 
                workflow_json=workflow_json,
                edit_instruction=edit_instruction
            )
            
            if model_config.provider == "anthropic":
                response = client.messages.create(
                    model=model_config.model_id,
                    max_tokens=4000,
                    temperature=temperature,
                    system=messages[0]["content"],
                    messages=messages[1:]
                )
                content = response.content[0].text
                tokens_used = response.usage.input_tokens + response.usage.output_tokens
                
            else:  # OpenAI or Groq via OpenAI SDK
                response = client.chat.completions.create(
                    model=model_config.model_id,
                    messages=messages,
                    max_tokens=4000,
                    temperature=temperature,
                    response_format={"type": "json_object"} if model_config.supports_json_mode else None
                )
                content = response.choices[0].message.content
                tokens_used = getattr(response.usage, 'total_tokens', None) if response.usage else None
            
            edited_workflow = self._parse_workflow_json(content)
            changes_made = self._detect_changes(workflow, edited_workflow)
            
            generation_time = time.time() - start_time
            
            return edited_workflow, generation_time, tokens_used, changes_made
            
        except Exception as e:
            generation_time = time.time() - start_time
            raise AIServiceError(f"Workflow editing failed: {str(e)}")

    def _detect_changes(self, original: N8NWorkflow, edited: N8NWorkflow) -> List[str]:
        changes = []
        
        if len(original.nodes) != len(edited.nodes):
            diff = len(edited.nodes) - len(original.nodes)
            if diff > 0:
                changes.append(f"Added {diff} node(s)")
            else:
                changes.append(f"Removed {abs(diff)} node(s)")
        
        original_names = {node.name for node in original.nodes}
        edited_names = {node.name for node in edited.nodes}
        
        new_nodes = edited_names - original_names
        removed_nodes = original_names - edited_names
        
        if new_nodes:
            changes.append(f"New nodes: {', '.join(new_nodes)}")
        if removed_nodes:
            changes.append(f"Removed nodes: {', '.join(removed_nodes)}")
        
        if original.name != edited.name:
            changes.append(f"Renamed workflow from '{original.name}' to '{edited.name}'")
        
        if not changes:
            changes.append("Modified node parameters or connections")
        
        return changes

    def get_available_providers(self) -> Dict[str, bool]:
        models_config = config_loader.load_models()
        providers = {}
        
        for model_key, model_config in models_config.items():
            provider = model_config.provider
            if provider == "anthropic":
                providers[provider] = self.anthropic_client is not None
            else:
                providers[provider] = model_key in self.openai_clients
        
        return providers

    def get_available_models(self) -> List[str]:
        available_models = []
        if self.anthropic_client:
            models_config = config_loader.load_models()
            for model_key, model_config in models_config.items():
                if model_config.provider == "anthropic":
                    available_models.append(model_key)
        
        available_models.extend(list(self.openai_clients.keys()))
        return available_models


ai_service = AIService()
