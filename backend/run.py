import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload and settings.is_development,
        log_level=settings.log_level.lower(),
        access_log=settings.is_development
    )
