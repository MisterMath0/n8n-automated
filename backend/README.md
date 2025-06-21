# N8N AI Workflow Generator - Backend

A production-grade FastAPI backend for generating and editing N8N workflows using AI.

## Features

- **Multi-AI Provider Support**: Claude 4, OpenAI GPT-4.1/o3, Groq Llama models
- **Modern Architecture**: Clean separation of concerns, configuration-driven
- **Production Ready**: Proper error handling, logging, validation
- **Type Safe**: Full Pydantic models and type hints
- **Extensible**: Easy to add new AI providers and models

## Quick Start

### 1. Installation

```bash
cd /Users/MisterMath/n8n-automated/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configuration

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```bash
ANTHROPIC_API_KEY="your_anthropic_api_key_here"
OPENAI_API_KEY="your_openai_api_key_here"
GROQ_API_KEY="your_groq_api_key_here"
```

### 3. Run

```bash
python run.py
```

API will be available at http://localhost:8000

### 4. Test

```bash
python test_generation.py
```

## API Endpoints

### Generate Workflow
```bash
POST /api/v1/workflows/generate
```

Example:
```json
{
  "description": "Create a webhook that receives data and sends it to Slack",
  "model": "claude-4-sonnet",
  "temperature": 0.3
}
```

### Edit Workflow
```bash
POST /api/v1/workflows/edit
```

### Get Available Models
```bash
GET /api/v1/workflows/models
```

### Health Check
```bash
GET /api/v1/workflows/health
```

## Architecture

```
app/
├── core/                 # Core configuration and dependencies
│   ├── config.py        # Pydantic settings
│   ├── config_loader.py # YAML config loader
│   ├── dependencies.py  # FastAPI dependencies
│   └── logging.py       # Structured logging setup
├── models/              # Pydantic models
│   └── workflow.py      # N8N workflow models
├── routers/             # FastAPI routers
│   └── workflows.py     # Workflow endpoints
├── services/            # Business logic
│   └── ai_service.py    # AI provider abstraction
├── utils/               # Utilities
│   └── workflow_utils.py # Validation helpers
└── main.py              # FastAPI app
```

## Configuration

### Models (config/models.yaml)
Define AI models with pricing, limits, and capabilities.

### Prompts (config/prompts.yaml)
Externalized prompt templates for different operations.

### Environment (.env)
Runtime configuration and API keys.

## AI Providers

### Anthropic Claude
- Claude 4 Sonnet (best balance)
- Claude 4 Opus (highest quality)

### OpenAI
- GPT-4.1 series (multimodal)

### Groq
- Llama 3.3 70B (fast inference)
- Llama 3.1 8B (ultra-fast)

## Error Handling

- Graceful failures with proper HTTP status codes
- Structured logging for debugging
- Input validation with Pydantic
- Provider-specific error handling

## Production Deployment

### Environment Variables
```bash
ENVIRONMENT=production
DEBUG=false
LOG_FORMAT=json
SECRET_KEY=your-secure-secret-key
```

### Docker (TODO)
```bash
docker build -t n8n-ai-backend .
docker run -p 8000:8000 --env-file .env n8n-ai-backend
```

## Development

### Code Style
- Clean, production-grade code
- No unnecessary comments
- Proper error handling
- Type hints everywhere

### Adding New AI Providers
1. Create provider class in `ai_service.py`
2. Add to provider factory
3. Update model mappings
4. Add configuration in `models.yaml`

### Testing
```bash
# Unit tests (TODO)
pytest tests/

# Integration test
python test_generation.py
```

## TODO

- [ ] Add rate limiting middleware
- [ ] Add authentication/authorization
- [ ] Add database persistence
- [ ] Add workflow templates
- [ ] Add batch processing
- [ ] Add metrics/monitoring
- [ ] Add Docker configuration
- [ ] Add comprehensive tests
