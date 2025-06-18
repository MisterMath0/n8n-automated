import yaml
from pathlib import Path
from typing import Dict, Any
from ..core.config import AIModelConfig

class ConfigLoader:
    def __init__(self):
        self.config_dir = Path(__file__).parent.parent.parent / "config"
        self._models_cache = None
        self._prompts_cache = None
    
    def load_models(self) -> Dict[str, AIModelConfig]:
        if self._models_cache is None:
            models_file = self.config_dir / "models.yaml"
            with open(models_file, 'r') as f:
                data = yaml.safe_load(f)
            
            self._models_cache = {
                key: AIModelConfig(**config) 
                for key, config in data['models'].items()
            }
        return self._models_cache
    
    def load_prompts(self) -> Dict[str, Dict[str, str]]:
        if self._prompts_cache is None:
            prompts_file = self.config_dir / "prompts.yaml"
            with open(prompts_file, 'r') as f:
                self._prompts_cache = yaml.safe_load(f)
        return self._prompts_cache
    
    def get_model_config(self, model_key: str) -> AIModelConfig:
        models = self.load_models()
        if model_key not in models:
            raise ValueError(f"Unknown model: {model_key}")
        return models[model_key]
    
    def get_prompt_template(self, template_type: str, role: str) -> str:
        prompts = self.load_prompts()
        if template_type not in prompts:
            raise ValueError(f"Unknown template type: {template_type}")
        if role not in prompts[template_type]:
            raise ValueError(f"Unknown role: {role}")
        return prompts[template_type][role]


config_loader = ConfigLoader()
