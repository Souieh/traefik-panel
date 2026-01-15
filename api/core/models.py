from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, EmailStr, Field


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


class TraefikMiddleware(BaseModel):
    basicauth: Optional[Dict[str, Any]] = None
    headers: Optional[Dict[str, Any]] = None
    digestauth: Optional[Dict[str, Any]] = None
    chain: Optional[Dict[str, Any]] = None
    compress: Optional[Dict[str, Any]] = None
    errorpage: Optional[Dict[str, Any]] = None
    ipwhitelist: Optional[Dict[str, Any]] = None
    ratelimit: Optional[Dict[str, Any]] = None
    redirectregex: Optional[Dict[str, Any]] = None
    redirectscheme: Optional[Dict[str, Any]] = None
    replacepath: Optional[Dict[str, Any]] = None
    replacepathregex: Optional[Dict[str, Any]] = None
    stripprefix: Optional[Dict[str, Any]] = None
    stripprefixregex: Optional[Dict[str, Any]] = None
    retry: Optional[Dict[str, Any]] = None
    requestheader: Optional[Dict[str, Any]] = None

    class Config:
        extra = "allow"  # still allows unknown or future middleware types


class TraefikHttpBlock(BaseModel):
    routers: Optional[Dict[str, TraefikRouter]] = None
    services: Optional[Dict[str, TraefikService]] = None
    middlewares: Optional[Dict[str, TraefikMiddleware]] = None


class TraefikHttpConfig(BaseModel):
    http: Optional[TraefikHttpBlock] = None


class TraefikACMEConfig(BaseModel):
    email: Optional[EmailStr] = None
    # storage is controlled by backend, not frontend
    httpChallenge: Optional[Dict[str, Any]] = None
    tlsChallenge: Optional[Dict[str, Any]] = None
    dnsChallenge: Optional[Dict[str, Any]] = None

    class Config:
        extra = "allow"  # allows extra challenge types if added in future


class TraefikCertResolver(BaseModel):
    acme: Optional[TraefikACMEConfig] = None

    class Config:
        extra = "allow"  # allow unknown top-level fields (future resolvers)


class ManualCertificateCreate(BaseModel):
    certificate_pem: str = Field(..., description="Full PEM certificate chain")
    private_key_pem: str = Field(..., description="PEM private key")
    domains: Optional[List[str]] = None  # optional metadata


class ManualCertificateOut(BaseModel):
    domain: str
    cert_path: str
    key_path: str


class TraefikTlsCertificatesBlock(BaseModel):
    certFile: str
    keyFile: str


class TraefikCertificateConfig(BaseModel):
    certificate: Optional[TraefikTlsCertificatesBlock] = None
