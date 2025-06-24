import yaml
from pathlib import Path
from typing import Dict, Any, Optional
from ..core.config import AIModelConfig, ChatSettingsConfig

class ConfigLoader:
    def __init__(self):
        self.config_dir = Path(__file__).parent.parent.parent / "config"
        self._models_cache: Optional[Dict[str, AIModelConfig]] = None
        self._chat_settings_cache: Optional[ChatSettingsConfig] = None
        self._search_cache: Optional[Dict[str, Any]] = None
        self._generic_cache: Dict[str, Any] = {}

    def _load_yaml_file(self, file_path: Path) -> Dict[str, Any]:
        """Loads a YAML file."""
        if not file_path.exists():
            raise FileNotFoundError(f"Config file not found: {file_path}")
        with open(file_path, 'r') as f:
            return yaml.safe_load(f)

    def load_config(self, config_name: str) -> Dict[str, Any]:
        """
        Generic loader for any YAML config file in the config directory.
        Caches the result for future calls.
        Usage: config_loader.load_config("prompts")
        """
        if config_name in self._generic_cache:
            return self._generic_cache[config_name]
        
        config_file = self.config_dir / f"{config_name}.yaml"
        config_data = self._load_yaml_file(config_file)
        self._generic_cache[config_name] = config_data
        return config_data

    def load_models(self) -> Dict[str, AIModelConfig]:
        if self._models_cache is None:
            models_file = self.config_dir / "models.yaml"
            data = self._load_yaml_file(models_file)
            self._models_cache = {
                key: AIModelConfig(**config) 
                for key, config in data.get('models', {}).items()
            }
        return self._models_cache

    def load_chat_settings(self) -> ChatSettingsConfig:
        if self._chat_settings_cache is None:
            models_file = self.config_dir / "models.yaml"
            data = self._load_yaml_file(models_file)
            chat_settings_data = data.get('chat_settings', {})
            self._chat_settings_cache = ChatSettingsConfig(**chat_settings_data)
        return self._chat_settings_cache

    def get_model_context_window(self, model_key: str) -> int:
        """Get context window for a model, with fallback to default."""
        chat_settings = self.load_chat_settings()
        return chat_settings.model_context_windows.get(
            model_key, chat_settings.default_context_window
        )

    def get_model_config(self, model_key: str) -> AIModelConfig:
        models = self.load_models()
        if model_key not in models:
            raise ValueError(f"Unknown model: {model_key}")
        
        model_config = models[model_key]
        
        # Log thinking config for debugging
        thinking_config = getattr(model_config, 'thinking_config', {})
        if thinking_config:
            import structlog
            logger = structlog.get_logger()
            logger.info(
                "Model thinking configuration loaded",
                model=model_key,
                thinking_enabled=thinking_config.get('enabled', False),
                thinking_budget=thinking_config.get('thinking_budget', 0)
            )
        
        return model_config

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
