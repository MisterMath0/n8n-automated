import yaml
from pathlib import Path
from typing import Dict, Any
from ..core.config import AIModelConfig

class ConfigLoader:
    def __init__(self):
        self.config_dir = Path(__file__).parent.parent.parent / "config"
        self._models_cache = None
        self._search_cache = None
        self._generic_cache = {}

    def load_config(self, config_name: str) -> Dict[str, Any]:
        """
        Generic loader for any YAML config file in the config directory.
        Caches the result for future calls.
        Usage: config_loader.load_config("prompts")
        """
        if config_name in self._generic_cache:
            return self._generic_cache[config_name]
        config_file = self.config_dir / f"{config_name}.yaml"
        if not config_file.exists():
            raise FileNotFoundError(f"Config file not found: {config_file}")
        with open(config_file, 'r') as f:
            config_data = yaml.safe_load(f)
        self._generic_cache[config_name] = config_data
        return config_data

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

    def get_model_config(self, model_key: str) -> AIModelConfig:
        models = self.load_models()
        if model_key not in models:
            raise ValueError(f"Unknown model: {model_key}")
        return models[model_key]

    def load_search_config(self) -> Dict[str, Any]:
        """Load search configuration from search.yaml"""
        if self._search_cache is None:
            search_file = self.config_dir / "search.yaml"
            if not search_file.exists():
                raise FileNotFoundError(f"Search config file not found: {search_file}")
            with open(search_file, 'r') as f:
                self._search_cache = yaml.safe_load(f)
        return self._search_cache["search"]  # Return the 'search' section


config_loader = ConfigLoader()
