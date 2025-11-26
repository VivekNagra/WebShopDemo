from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Pippali POS"
    API_V1_STR: str = "/api/v1"
    # Database
    DATABASE_URL: str = "postgresql://pippali:pippali_password@localhost/pippali_db" 
    
    # AI
    GEMINI_API_KEY: str = "" 

    class Config:
        case_sensitive = True
        env_file = ".env"

from dotenv import load_dotenv
import os

# Force load .env
load_dotenv()

settings = Settings()
