from typing import Union 
from pydantic import BaseModel, ConfigDict
from enum import Enum
from typing import List, Optional



class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Union[str, None] = None

class UserRole(str, Enum):
    ADMIN = "admin"
    OPERATOR = "operator"
class User(BaseModel):
    username: str
    email: Union[str, None] = None
    full_name: Union[str, None] = None
    disabled: Union[bool, None] = None
    role: UserRole = UserRole.OPERATOR

class UserInDB(User):
    hashed_password: str

class UserCreate(User):
    password: str

class UserUpdate(BaseModel):
    email: Union[str, None] = None
    full_name: Union[str, None] = None
    password: Union[str, None] = None
    disabled: Union[bool, None] = None
    role: Union[UserRole, None] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserChangePassword(BaseModel):
    old_password: str
    new_password: str

class UserForgotPassword(BaseModel):
    email: str

class UserResetPassword(BaseModel):
    token: str
    new_password: str

class TraefikServer(BaseModel):
    url: str

class TraefikLoadBalancer(BaseModel):
    servers: list[TraefikServer]

class TraefikService(BaseModel):
    loadBalancer: TraefikLoadBalancer

class TraefikTLS(BaseModel):
    certResolver: Optional[str] = None
    passthrough: Optional[bool] = None
    options: Optional[str] = None

class TraefikRouter(BaseModel):
    entryPoints: Optional[List[str]] = None
    rule: str
    service: str
    middlewares: Optional[List[str]] = None
    priority: Optional[int] = None
    tls: Optional[TraefikTLS] = None