"""
Unified AI calling service for all providers with simple schemas.
Handles function/tool calling across Google, OpenAI, and Anthropic.
"""

import json
from typing import Dict, Any, Optional
import structlog
from google.genai import types

logger = structlog.get_logger()


class AICallerService:
    """Unified AI calling service for all providers with simple schemas"""
    
    def __init__(self, client_manager):
        self.client_manager = client_manager
    
    async def call_with_schema(self, prompt: str, schema: Dict[str, Any], model) -> Dict[str, Any]:
        """Call AI model with schema - works for all providers"""
        client, model_config = self.client_manager.get_client_and_config(model)
        
        if model_config.provider == "google":
            return await self._call_google_with_schema(client, model_config, prompt, schema)
        elif model_config.provider == "anthropic":
            return await self._call_anthropic_with_schema(client, model_config, prompt, schema)
        elif model_config.provider in ["openai", "groq"]:
            return await self._call_openai_with_schema(client, model_config, prompt, schema)
        else:
            raise ValueError(f"Unsupported provider: {model_config.provider}")
    
    async def _call_google_with_schema(self, client, config, prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Google GenAI with response schema"""
        try:
            # Build generation config
            gen_config = types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type="application/json",
                response_schema=schema
            )
            
            # Add thinking configuration if available
            if hasattr(config, 'thinking_config') and config.thinking_config:
                thinking_config = config.thinking_config
                if thinking_config.get('enabled', False):
                    thinking_budget = thinking_config.get('thinking_budget', 8192)
                    gen_config.thinking_config = types.ThinkingConfig(
                        thinking_budget=thinking_budget
                    )
                    logger.info(f"Using thinking mode with budget: {thinking_budget} tokens")
                else:
                    # Explicitly disable thinking for fast mode
                    gen_config.thinking_config = types.ThinkingConfig(
                        thinking_budget=0
                    )
                    logger.info("Using fast mode (no thinking)")
            
            response = client.models.generate_content(
                model=config.model_id,
                contents=[{"role": "user", "parts": [{"text": prompt}]}],
                config=gen_config
            )
            
            # Try to get JSON from response.text first
            if hasattr(response, 'text') and response.text:
                return self._parse_json_response(response.text)
            
            # Fallback to parsed if available
            if hasattr(response, 'parsed') and response.parsed:
                return response.parsed
                
            raise ValueError("No JSON response received from Gemini")
                
        except Exception as e:
            logger.error("Google AI call failed", error=str(e))
            raise ValueError(f"Google AI call failed: {str(e)}")
    
    async def _call_anthropic_with_schema(self, client, config, prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Anthropic with tool calling"""
        tool = {
            "name": "generate_result",
            "description": "Generate structured result based on prompt",
            "input_schema": schema
        }
        
        try:
            response = client.messages.create(
                model=config.model_id,
                temperature=0.3,
                messages=[{"role": "user", "content": prompt}],
                tools=[tool],
                tool_choice={"type": "tool", "name": "generate_result"}
            )
            
            tool_call = next((block for block in response.content if block.type == 'tool_use' and block.name == 'generate_result'), None)
            if not tool_call:
                # Fallback: try to extract from text response
                text_content = ""
                for block in response.content:
                    if hasattr(block, 'text'):
                        text_content += block.text
                logger.warning("Anthropic did not return expected tool call, trying text extraction",
                              response_text=text_content[:200])
                return self._extract_json_from_text(text_content)
            
            return tool_call.input
            
        except Exception as e:
            logger.error("Anthropic call failed", error=str(e))
            raise ValueError(f"Anthropic call failed: {str(e)}")
    
    async def _call_openai_with_schema(self, client, config, prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """OpenAI with function calling"""
        tool = {
            "type": "function",
            "function": {
                "name": "generate_result",
                "description": "Generate structured result based on prompt",
                "parameters": schema
            }
        }
        
        try:
            response = client.chat.completions.create(
                model=config.model_id,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                tools=[tool],
                tool_choice={"type": "function", "function": {"name": "generate_result"}}
            )
            
            if response.choices[0].message.tool_calls:
                tool_call = response.choices[0].message.tool_calls[0]
                return json.loads(tool_call.function.arguments)
            else:
                # Fallback: try to extract from message content
                text_response = response.choices[0].message.content or ""
                logger.warning("OpenAI did not return expected tool call, trying text extraction",
                              response_text=text_response[:200])
                return self._extract_json_from_text(text_response)
                
        except Exception as e:
            logger.error("OpenAI call failed", error=str(e))
            raise ValueError(f"OpenAI call failed: {str(e)}")
    
    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Parse JSON response handling Gemini's quirks and truncation"""
        # Clean markdown artifacts that Gemini sometimes adds
        cleaned = text.strip()
        if cleaned.startswith('```json'):
            cleaned = cleaned[7:]
        if cleaned.endswith('```'):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        # Try direct parsing first
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass
        
        # Handle truncated JSON by finding complete objects
        return self._extract_complete_json_object(cleaned)
    
    def _extract_complete_json_object(self, text: str) -> Dict[str, Any]:
        """Extract complete JSON object even from truncated response"""
        # Find the first complete JSON object using bracket counting
        brace_count = 0
        start_idx = None
        
        for i, char in enumerate(text):
            if char == '{':
                if start_idx is None:
                    start_idx = i
                brace_count += 1
            elif char == '}' and start_idx is not None:
                brace_count -= 1
                if brace_count == 0:  # Found complete object
                    try:
                        json_str = text[start_idx:i+1]
                        return json.loads(json_str)
                    except json.JSONDecodeError:
                        # Continue looking for another complete object
                        start_idx = None
                        continue
        
        # If no complete object found, try to repair truncated JSON
        if start_idx is not None:
            truncated_json = text[start_idx:]
            logger.warning("JSON appears truncated, attempting repair", 
                          truncated_json=truncated_json[:200])
            return self._repair_truncated_json(truncated_json)
        
        logger.error("Could not extract valid JSON from text response", text=text[:200])
        raise ValueError("AI did not return valid structured output")
    
    def _repair_truncated_json(self, json_fragment: str) -> Dict[str, Any]:
        """Attempt to repair truncated JSON"""
        # Remove incomplete trailing content
        fragment = json_fragment.rstrip()
        
        # Remove incomplete string literals
        if fragment.endswith('"'):
            fragment = fragment[:-1]
        
        # Remove trailing commas
        if fragment.endswith(','):
            fragment = fragment[:-1]
        
        # Count unclosed braces and brackets
        open_braces = fragment.count('{') - fragment.count('}')
        open_brackets = fragment.count('[') - fragment.count(']')
        
        # Close unclosed structures
        repaired = fragment
        repaired += ']' * open_brackets
        repaired += '}' * open_braces
        
        try:
            result = json.loads(repaired)
            logger.info("Successfully repaired truncated JSON")
            return result
        except json.JSONDecodeError as e:
            logger.error("Failed to repair JSON", fragment=json_fragment[:100], error=str(e))
            raise ValueError("Could not repair truncated JSON response")
    
    def _extract_json_from_text(self, text: str) -> Dict[str, Any]:
        """Extract JSON from text response as fallback"""
        return self._parse_json_response(text)
