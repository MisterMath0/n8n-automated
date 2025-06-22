import jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from pydantic import BaseModel
import structlog
from ..core.config import settings


logger = structlog.get_logger()

class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invalid authentication scheme."
                )
            payload = self.verify_jwt(credentials.credentials)
            if not payload:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invalid token or expired token."
                )
            return payload
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid authorization code."
            )

    def verify_jwt(self, token: str) -> Optional[dict]:
        try:
            # Validate token format first
            if not token or len(token) < 10:
                logger.warning("Invalid token format received")
                return None
                
            payload = jwt.decode(
                token, 
                settings.supabase_jwt_secret, 
                algorithms=["HS256"],
                audience="authenticated"
            )
            
            # Additional validation
            if not payload.get("sub") or not payload.get("email"):
                logger.warning("Token missing required claims")
                return None
                
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.info("Token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning("Invalid token", error=str(e))
            return None
        except Exception as e:
            logger.error("Token verification failed", error=str(e))
            return None


jwt_bearer = JWTBearer()


class CurrentUser(BaseModel):
    id: str
    email: str
    role: str = "authenticated"


async def get_current_user(token: dict = Depends(jwt_bearer)) -> CurrentUser:
    return CurrentUser(
        id=token.get("sub"),
        email=token.get("email"),
        role=token.get("role", "authenticated")
    )


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False))
) -> Optional[CurrentUser]:
    """Get user if valid token provided, return None otherwise (for optional auth)"""
    if not credentials:
        return None
    
    try:
        # Additional token validation
        if not credentials.credentials or len(credentials.credentials) < 10:
            logger.warning("Invalid token format in optional auth")
            return None
            
        payload = jwt.decode(
            credentials.credentials,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        # Validate required fields
        if not payload.get("sub") or not payload.get("email"):
            logger.warning("Token missing required claims in optional auth")
            return None
            
        return CurrentUser(
            id=payload.get("sub"),
            email=payload.get("email"),
            role=payload.get("role", "authenticated")
        )
        
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
        logger.info("Invalid token in optional auth", error=str(e))
        return None
    except Exception as e:
        logger.error("Unexpected error in optional auth", error=str(e))
        return None
