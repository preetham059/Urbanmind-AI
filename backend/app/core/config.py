from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://urbanmind:urbanmind123@localhost:5432/urbanmind"
    SECRET_KEY: str = "change-this-in-production"
    ROBOFLOW_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()