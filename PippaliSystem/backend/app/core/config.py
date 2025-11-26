from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Pippali POS"
    API_V1_STR: str = "/api/v1"
    # Database
    DATABASE_URL: str = "postgresql://pippali:pippali_password@localhost/pippali_db" 

    class Config:
        case_sensitive = True

settings = Settings()
