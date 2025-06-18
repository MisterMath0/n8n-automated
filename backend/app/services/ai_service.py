import time
import json
from typing import Dict, Any, Optional, Tuple, List
from abc import ABC, abstractmethod

import anthropic
import openai
from groq import Groq

from ..models.workflow import AIModel, AIProvider, N8NWorkflow
from ..core.config import settings
from ..core.config_loader import config_loader


class AIProviderError(Exception):
    pass


class AIProviderBase(ABC):
    @abstractmethod
    async def generate_workflow(
        self, 
        prompt: str, 
        model_id: str, 
        temperature: float = 0.3,
        max_tokens: int = 4000
    ) -> Tuple[str, Optional[int]]:
        pass

    @abstractmethod
    async def edit_workflow(
        self, 
        workflow_json: str,
        edit_instruction: str,
        model_id: str, 
        temperature: float = 0.3
    ) -> Tuple[str, Optional[int]]:
        pass


class AnthropicProvider(AIProviderBase):
    def __init__(self):
        if not settings.anthropic_api_key:
            raise AIProviderError("Anthropic API key not configured")
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    
    async def generate_workflow(
        self, 
        prompt: str, 
        model_id: str, 
        temperature: float = 0.3,
        max_tokens: int = 4000
    ) -> Tuple[str, Optional[int]]:
        try:
            system_prompt = config_loader.get_prompt_template("workflow_generation", "system")
            user_prompt = config_loader.get_prompt_template("workflow_generation", "user")
            
            response = self.client.messages.create(
                model=model_id,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[{
                    "role": "user", 
                    "content": user_prompt.format(description=prompt)
                }]
            )
            
            return response.content[0].text, response.usage.input_tokens + response.usage.output_tokens
            
        except Exception as e:
            raise AIProviderError(f"Anthropic API error: {str(e)}")

    async def edit_workflow(
        self, 
        workflow_json: str,
        edit_instruction: str,
        model_id: str, 
        temperature: float = 0.3
    ) -> Tuple[str, Optional[int]]:
        try:
            system_prompt = config_loader.get_prompt_template("workflow_editing", "system")
            user_prompt = config_loader.get_prompt_template("workflow_editing", "user")
            
            response = self.client.messages.create(
                model=model_id,
                max_tokens=4000,
                temperature=temperature,
                system=system_prompt.format(workflow_json=workflow_json),
                messages=[{
                    "role": "user", 
                    "content": user_prompt.format(edit_instruction=edit_instruction)
                }]
            )
            
            return response.content[0].text, response.usage.input_tokens + response.usage.output_tokens
            
        except Exception as e:
            raise AIProviderError(f"Anthropic API error: {str(e)}")


class OpenAIProvider(AIProviderBase):
    def __init__(self):
        if not settings.openai_api_key:
            raise AIProviderError("OpenAI API key not configured")
        self.client = openai.OpenAI(api_key=settings.openai_api_key)
    
    async def generate_workflow(
        self, 
        prompt: str, 
        model_id: str, 
        temperature: float = 0.3,
        max_tokens: int = 4000
    ) -> Tuple[str, Optional[int]]:
        try:
            system_prompt = config_loader.get_prompt_template("workflow_generation", "system")
            user_prompt = config_loader.get_prompt_template("workflow_generation", "user")
            
            response = self.client.chat.completions.create(
                model=model_id,
                max_tokens=max_tokens,
                temperature=temperature,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt.format(description=prompt)}
                ]
            )
            
            return response.choices[0].message.content, response.usage.total_tokens
            
        except Exception as e:
            raise AIProviderError(f"OpenAI API error: {str(e)}")

    async def edit_workflow(
        self, 
        workflow_json: str,
        edit_instruction: str,
        model_id: str, 
        temperature: float = 0.3
    ) -> Tuple[str, Optional[int]]:
        try:
            system_prompt = config_loader.get_prompt_template("workflow_editing", "system")
            user_prompt = config_loader.get_prompt_template("workflow_editing", "user")
            
            response = self.client.chat.completions.create(
                model=model_id,
                max_tokens=4000,
                temperature=temperature,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt.format(workflow_json=workflow_json)},
                    {"role": "user", "content": user_prompt.format(edit_instruction=edit_instruction)}
                ]
            )
            
            return response.choices[0].message.content, response.usage.total_tokens
            
        except Exception as e:
            raise AIProviderError(f"OpenAI API error: {str(e)}")


class GroqProvider(AIProviderBase):
    def __init__(self):
        if not settings.groq_api_key:
            raise AIProviderError("Groq API key not configured")
        self.client = Groq(api_key=settings.groq_api_key)
    
    async def generate_workflow(
        self, 
        prompt: str, 
        model_id: str, 
        temperature: float = 0.3,
        max_tokens: int = 4000
    ) -> Tuple[str, Optional[int]]:
        try:
            system_prompt = config_loader.get_prompt_template("workflow_generation", "system")
            user_prompt = config_loader.get_prompt_template("workflow_generation", "user")
            
            response = self.client.chat.completions.create(
                model=model_id,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt.format(description=prompt)}
                ]
            )
            
            return response.choices[0].message.content, None
            
        except Exception as e:
            raise AIProviderError(f"Groq API error: {str(e)}")

    async def edit_workflow(
        self, 
        workflow_json: str,
        edit_instruction: str,
        model_id: str, 
        temperature: float = 0.3
    ) -> Tuple[str, Optional[int]]:
        try:
            system_prompt = config_loader.get_prompt_template("workflow_editing", "system")
            user_prompt = config_loader.get_prompt_template("workflow_editing", "user")
            
            response = self.client.chat.completions.create(
                model=model_id,
                max_tokens=4000,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": system_prompt.format(workflow_json=workflow_json)},
                    {"role": "user", "content": user_prompt.format(edit_instruction=edit_instruction)}
                ]
            )
            
            return response.choices[0].message.content, None
            
        except Exception as e:
            raise AIProviderError(f"Groq API error: {str(e)}")


class AIService:
    def __init__(self):
        self.providers: Dict[AIProvider, AIProviderBase] = {}
        self._initialize_providers()
        
        self.model_provider_map = {
            AIModel.CLAUDE_4_SONNET: AIProvider.ANTHROPIC,
            AIModel.CLAUDE_4_OPUS: AIProvider.ANTHROPIC,
            AIModel.GPT_4O: AIProvider.OPENAI,
            AIModel.O3: AIProvider.OPENAI,
            AIModel.LLAMA_3_3_70B: AIProvider.GROQ,
            AIModel.LLAMA_3_1_8B: AIProvider.GROQ,
        }

    def _initialize_providers(self):
        try:
            if settings.anthropic_api_key:
                self.providers[AIProvider.ANTHROPIC] = AnthropicProvider()
        except AIProviderError:
            pass
            
        try:
            if settings.openai_api_key:
                self.providers[AIProvider.OPENAI] = OpenAIProvider()
        except AIProviderError:
            pass
            
        try:
            if settings.groq_api_key:
                self.providers[AIProvider.GROQ] = GroqProvider()
        except AIProviderError:
            pass

    def _get_provider_and_model_id(self, model: AIModel) -> Tuple[AIProviderBase, str]:
        provider_type = self.model_provider_map.get(model)
        if not provider_type:
            raise ValueError(f"Unsupported model: {model}")
        
        provider = self.providers.get(provider_type)
        if not provider:
            raise ValueError(f"Provider not available: {provider_type}")
        
        model_config = config_loader.get_model_config(model.value)
        return provider, model_config.model_id

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
            provider, model_id = self._get_provider_and_model_id(model)
            
            response, tokens_used = await provider.generate_workflow(
                description, model_id, temperature, max_tokens
            )
            
            workflow = self._parse_workflow_json(response)
            generation_time = time.time() - start_time
            
            return workflow, generation_time, tokens_used
            
        except Exception as e:
            generation_time = time.time() - start_time
            raise Exception(f"Workflow generation failed: {str(e)}")

    async def edit_workflow(
        self,
        workflow: N8NWorkflow,
        edit_instruction: str,
        model: AIModel,
        temperature: float = 0.3
    ) -> Tuple[N8NWorkflow, float, Optional[int], List[str]]:
        start_time = time.time()
        
        try:
            provider, model_id = self._get_provider_and_model_id(model)
            
            workflow_json = workflow.model_dump_json(indent=2)
            
            response, tokens_used = await provider.edit_workflow(
                workflow_json, edit_instruction, model_id, temperature
            )
            
            edited_workflow = self._parse_workflow_json(response)
            changes_made = self._detect_changes(workflow, edited_workflow)
            
            generation_time = time.time() - start_time
            
            return edited_workflow, generation_time, tokens_used, changes_made
            
        except Exception as e:
            generation_time = time.time() - start_time
            raise Exception(f"Workflow editing failed: {str(e)}")

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
        return {
            provider.value: provider in self.providers 
            for provider in AIProvider
        }


ai_service = AIService()
