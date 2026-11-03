from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "FinSentry AI"
    TAGLINE: str = "Your money. Your patterns. Your protection."
    API_V1_PREFIX: str = "/api"
    DATABASE_URL: str = "sqlite:///./data/finsentry.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://finsentry.pages.dev"
    ]
    
    # Financial Settings
    DEFAULT_CURRENCY: str = "INR"
    CURRENCY_SYMBOL: str = "₹"
    
    # ML Anomaly Detection Settings
    ISOLATION_FOREST_CONTAMINATION: float = 0.05
    MIN_TRANSACTIONS_FOR_ML: int = 20
    
    # AI Provider Settings (ollama | cloudflare | deterministic)
    AI_PROVIDER: str = "ollama"
    
    # Local Ollama Settings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:7b"
    OLLAMA_TIMEOUT: float = 60.0
    OLLAMA_KEEP_ALIVE: str = "15m"
    OLLAMA_NUM_CTX: int = 2048
    OLLAMA_NUM_PREDICT: int = 350
    OLLAMA_AVAILABLE_MODELS: List[str] = ["qwen2.5:7b", "qwen2.5:0.5b"]
    
    # Cloudflare Workers AI Settings (Production)
    CLOUDFLARE_ACCOUNT_ID: Optional[str] = None
    CLOUDFLARE_API_TOKEN: Optional[str] = None
    CLOUDFLARE_MODEL: str = "@cf/meta/llama-3.1-8b-instruct"

    model_config = ConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
