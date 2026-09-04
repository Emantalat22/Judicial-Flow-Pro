from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 60
    groq_api_key: Optional[str] = None
    groq_model_name: str = "llama-3.3-70b-versatile"
    ai_provider: str = "groq"
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    ai_model_name: str = "llama-3.3-70b-versatile"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
