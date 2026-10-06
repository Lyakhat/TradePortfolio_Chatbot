import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    UserInfo,
    AuthResponse,
    CheckEmailResponse,
    LogoutResponse,
    BlacklistedTokensResponse,
    BlacklistedTokenItem,
)
from app.services.auth_service import (
    auth_service,
    UserAlreadyExistsException,
    UserNotFoundException,
    InvalidCredentialsException,
    TokenRevokedException,
    InvalidTokenException,
)

logger = logging.getLogger("AuthAPI")
router = APIRouter(prefix="/auth", tags=["Authentication & Token Blacklist"])

security = HTTPBearer(auto_error=False)

def get_current_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    """Extracts raw JWT bearer token from Authorization header."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials

def get_current_user(token: str = Depends(get_current_token)) -> dict:
    """Validates JWT and verifies the token is NOT blacklisted."""
    try:
        user = auth_service.verify_token(token)
        return user
    except TokenRevokedException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InvalidTokenException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest):
    """
    Registers a new user. 
    If the email is already registered, returns HTTP 409 Conflict with guidance to log in.
    """
    try:
        user_dict, access_token = auth_service.register_user(
            name=request.name,
            email=request.email,
            password=request.password
        )
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserInfo(
                id=user_dict["id"],
                name=user_dict["name"],
                email=user_dict["email"]
            ),
            message="Account registered successfully! Welcome to TradePulse."
        )
    except UserAlreadyExistsException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": e.message,
                "is_registered": True,
                "email": request.email,
                "action": "login_required"
            }
        )
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during registration: {str(e)}"
        )


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest):
    """
    Authenticates an existing user and returns a signed JWT token.
    If the user is not found, informs them to register first.
    """
    try:
        user_dict, access_token = auth_service.login_user(
            email=request.email,
            password=request.password,
            name=request.name
        )
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserInfo(
                id=user_dict["id"],
                name=user_dict["name"],
                email=user_dict["email"],
                created_at=user_dict.get("created_at")
            ),
            message=f"Welcome back, {user_dict['name']}!"
        )
    except UserNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "message": e.message,
                "is_registered": False,
                "email": request.email,
                "action": "register_required"
            }
        )
    except InvalidCredentialsException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": e.message,
                "is_registered": True,
                "email": request.email,
                "action": "retry_password"
            }
        )
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during login: {str(e)}"
        )


@router.get("/check-email", response_model=CheckEmailResponse)
def check_email(email: str = Query(..., description="Email to check")):
    """
    Checks whether an email address is already registered in the system.
    """
    exists = auth_service.check_user_exists(email)
    if exists:
        return CheckEmailResponse(
            email=email,
            is_registered=True,
            message="This email is already registered. Please log in."
        )
    else:
        return CheckEmailResponse(
            email=email,
            is_registered=False,
            message="This email is available for registration."
        )


@router.get("/me", response_model=UserInfo)
def get_me(current_user: dict = Depends(get_current_user)):
    """
    Returns the currently authenticated user's profile.
    Automatically checks token validity and verifies it has not been blacklisted.
    """
    return UserInfo(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        created_at=current_user.get("created_at")
    )


@router.post("/logout", response_model=LogoutResponse)
def logout(token: str = Depends(get_current_token)):
    """
    Logs out the user and revokes the JWT access token by adding it to the Token Blacklist model.
    Any future request with this revoked token will receive a 401 Unauthorized.
    """
    success = auth_service.blacklist_token(token)
    if success:
        return LogoutResponse(
            message="Logged out successfully. Your access token has been revoked and blacklisted.",
            revoked=True
        )
    else:
        return LogoutResponse(
            message="Session terminated locally.",
            revoked=False
        )


@router.get("/blacklisted-tokens", response_model=BlacklistedTokensResponse)
def list_blacklisted_tokens(limit: int = Query(50, ge=1, le=100)):
    """
    Auditing endpoint to inspect blacklisted revoked tokens.
    """
    tokens = auth_service.get_blacklisted_tokens(limit=limit)
    total = auth_service.get_blacklisted_count()
    items = [
        BlacklistedTokenItem(
            id=t["id"],
            token_jti=t.get("token_jti"),
            user_email=t.get("user_email"),
            blacklisted_at=t.get("blacklisted_at", ""),
            expires_at=t.get("expires_at")
        )
        for t in tokens
    ]
    return BlacklistedTokensResponse(
        total_blacklisted=total,
        tokens=items
    )
