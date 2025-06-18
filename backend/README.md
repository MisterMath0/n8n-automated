# N8N AI Workflow Generator - Backend

This is the FastAPI backend for the N8N AI Workflow Generator.

## Setup Instructions

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file with the following variables:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
DATABASE_URL=your_database_url_here
JWT_SECRET_KEY=your_jwt_secret_here
JWT_ALGORITHM=HS256
PORT=8000
HOST=0.0.0.0
```

4. Run the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

## API Documentation

Once the server is running, you can access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI application
│   ├── services/         # Business logic
│   ├── models/          # Pydantic models
│   └── routes/          # API routes
├── requirements.txt     # Python dependencies
└── .env                # Environment variables
``` 