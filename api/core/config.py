import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    secret_key: str = "dev-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    database_url: str = "sqlite:///./dev.db"
    default_user_username: str = "admin"
    default_user_password: str = "admin"
    default_user_email: str = "admin@example.com"
    default_user_full_name: str = "Admin User"

    smtp_server: str = "smtp.example.com"
    smtp_port: int = 587
    smtp_username: str = "user"
    smtp_password: str = "pass"
    sender_email: str = "noreply@example.com"

    traefik_config_path: str = os.environ.get("TRAEFIK_CONFIG_PATH", "/app/data")

    traefik_api_url: str = "http://localhost:8080"
    tp_panel_url: str = "http://localhost:8000"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()  # Pydantic loads values from .env
