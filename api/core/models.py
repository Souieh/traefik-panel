from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    """Schema for the JWT access token response."""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema for the data payload embedded in the JWT token."""
    username: Union[str, None] = None


class UserRole(str, Enum):
    """Enumeration of available user roles."""
    ADMIN = "admin"
    OPERATOR = "operator"


class User(BaseModel):
    """Base User model representing shared user attributes."""
    username: str
    email: Union[str, None] = None
    full_name: Union[str, None] = None
    disabled: Union[bool, None] = None
    role: UserRole = UserRole.OPERATOR
    createdAt: Optional[datetime] = Field(default_factory=datetime.now)
    updatedAt: Optional[datetime] = Field(default_factory=datetime.now)

    class Config:
        orm_mode = True


class UserInDB(User):
    """User model as stored in the database, including the hashed password."""
    hashed_password: str


class UserCreate(User):
    """Schema for creating a new user, requiring a raw password."""
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user details. All fields are optional."""
    email: Union[str, None] = None
    full_name: Union[str, None] = None
    password: Union[str, None] = None
    disabled: Union[bool, None] = None
    role: Union[UserRole, None] = None


class UserLogin(BaseModel):
    """Schema for user login credentials."""
    username: str
    password: str


class UserChangePassword(BaseModel):
    """Schema for changing a user's password."""
    old_password: str
    new_password: str


class UserForgotPassword(BaseModel):
    """Schema for initiating a password reset via email."""
    email: str


class UserResetPassword(BaseModel):
    """Schema for completing a password reset using a token."""
    token: str
    new_password: str


class TraefikServer(BaseModel):
    """Represents a backend server URL in a Traefik service."""
    url: str


class TraefikLoadBalancer(BaseModel):
    """Configuration for a Traefik HTTP LoadBalancer."""
    servers: list[TraefikServer]


class TraefikService(BaseModel):
    """Represents a Traefik HTTP Service configuration."""
    loadBalancer: TraefikLoadBalancer


class TraefikTLS(BaseModel):
    """TLS configuration for a Traefik HTTP Router."""
    certResolver: Optional[str] = None
    passthrough: Optional[bool] = None
    options: Optional[str] = None


class TraefikRouter(BaseModel):
    """Represents a Traefik HTTP Router configuration."""
    entryPoints: Optional[List[str]] = None
    rule: str
    service: str
    middlewares: Optional[List[str]] = None
    priority: Optional[int] = None
    tls: Optional[TraefikTLS] = None


class TraefikMiddleware(BaseModel):
    """Represents various Traefik Middleware configurations."""
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
    """Container for HTTP-specific Traefik configurations (Routers, Services, Middlewares)."""
    routers: Optional[Dict[str, TraefikRouter]] = None
    services: Optional[Dict[str, TraefikService]] = None
    middlewares: Optional[Dict[str, TraefikMiddleware]] = None


class TraefikHttpConfig(BaseModel):
    """Root model for Traefik HTTP configuration."""
    http: Optional[TraefikHttpBlock] = None


class TraefikACMEConfig(BaseModel):
    """Configuration for ACME (Let's Encrypt) certificate resolvers."""
    email: Optional[EmailStr] = None
    # storage is controlled by backend, not frontend
    httpChallenge: Optional[Dict[str, Any]] = None
    tlsChallenge: Optional[Dict[str, Any]] = None
    dnsChallenge: Optional[Dict[str, Any]] = None

    class Config:
        extra = "allow"  # allows extra challenge types if added in future


class TraefikTCPServer(BaseModel):
    """Represents a backend server address for TCP services."""
    address: str


class TraefikTCPLoadBalancer(BaseModel):
    """Configuration for a Traefik TCP LoadBalancer."""
    servers: List[TraefikTCPServer]


class TraefikTCPService(BaseModel):
    """Represents a Traefik TCP Service configuration."""
    loadBalancer: TraefikTCPLoadBalancer


class TraefikTCPTLS(BaseModel):
    """TLS configuration for a Traefik TCP Router."""
    passthrough: Optional[bool] = None
    certResolver: Optional[str] = None
    options: Optional[str] = None
    domains: Optional[List[Dict[str, Any]]] = None


class TraefikTCPRouter(BaseModel):
    """Represents a Traefik TCP Router configuration."""
    entryPoints: Optional[List[str]] = None
    rule: str  # e.g. "HostSNI(`example.com`)"
    service: str
    priority: Optional[int] = None
    tls: Optional[TraefikTCPTLS] = None


class TraefikTCPBlock(BaseModel):
    """Container for TCP-specific Traefik configurations."""
    routers: Optional[Dict[str, TraefikTCPRouter]] = None
    services: Optional[Dict[str, TraefikTCPService]] = None


class TraefikUDPServer(BaseModel):
    """Represents a backend server address for UDP services."""
    address: str  # e.g. "10.0.0.1:53"


class TraefikUDPLoadBalancer(BaseModel):
    """Configuration for a Traefik UDP LoadBalancer."""
    servers: List[TraefikUDPServer]


class TraefikUDPService(BaseModel):
    """Represents a Traefik UDP Service configuration."""
    loadBalancer: TraefikUDPLoadBalancer


class TraefikUDPBlock(BaseModel):
    """Container for UDP-specific Traefik configurations."""
    services: Optional[Dict[str, TraefikUDPService]] = None


class TraefikDynamicConfig(BaseModel):
    """Root model for Traefik Dynamic Configuration (HTTP, TCP, UDP)."""
    http: Optional[TraefikHttpBlock] = None
    tcp: Optional[TraefikTCPBlock] = None
    udp: Optional[TraefikUDPBlock] = None


class TraefikCertResolver(BaseModel):
    """Configuration for Traefik Certificate Resolvers."""
    acme: Optional[TraefikACMEConfig] = None

    class Config:
        extra = "allow"  # allow unknown top-level fields (future resolvers)


class ManualCertificateCreate(BaseModel):
    """Schema for uploading manual certificates."""
    certificate_pem: str = Field(..., description="Full PEM certificate chain")
    private_key_pem: str = Field(..., description="PEM private key")
    domains: Optional[List[str]] = None  # optional metadata


class ManualCertificateOut(BaseModel):
    """Schema for outputting manual certificate details."""
    domain: str
    cert_path: str
    key_path: str


class TraefikTlsCertificatesBlock(BaseModel):
    """Represents a TLS certificate file pair configuration."""
    certFile: str
    keyFile: str


class TraefikCertificateConfig(BaseModel):
    """Root model for Traefik TLS Certificate configuration."""
    certificate: Optional[TraefikTlsCertificatesBlock] = None
