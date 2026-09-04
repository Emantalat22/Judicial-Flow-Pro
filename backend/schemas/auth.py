from typing import Optional

from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None
