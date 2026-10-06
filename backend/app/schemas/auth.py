from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full Name of user")
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$", description="Valid Email address")
    password: str = Field(..., min_length=4, max_length=128, description="User password")

class LoginRequest(BaseModel):
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$", description="Registered Email address")
    password: str = Field(..., min_length=1, description="Password")
    name: Optional[str] = Field(None, description="Optional Name placeholder for login compatibility")

class UserInfo(BaseModel):
    id: int
    name: str
    email: str
    created_at: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo
    message: str

class CheckEmailResponse(BaseModel):
    email: str
    is_registered: bool
    message: str

class LogoutResponse(BaseModel):
    message: str
    revoked: bool

class BlacklistedTokenItem(BaseModel):
    id: int
    token_jti: Optional[str]
    user_email: Optional[str]
    blacklisted_at: str
    expires_at: Optional[str]

class BlacklistedTokensResponse(BaseModel):
    total_blacklisted: int
    tokens: List[BlacklistedTokenItem]
