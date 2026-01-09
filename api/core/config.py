from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    database_url: str
    default_user_username: str
    default_user_password: str
    default_user_email: str
    default_user_full_name: str

    smtp_server: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    sender_email: str

    traefik_config_file: str = "data/dynamic/traefik_dynamic.yaml"
    traefik_config_resolver_file: str = "./data/static/resolver.yml"
    traefik_api_url: str  

    tpm_panel_url:str 


    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()