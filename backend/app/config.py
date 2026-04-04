from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str = ""
    BRAVE_SEARCH_API_KEY: str = ""
    SECRET_KEY: str = "change-me-in-production"
    DB_PATH: str = "data/daily_kernel.db"
    CLAUDE_MODEL: str = "claude-sonnet-4-20250514"
    CARDS_PER_BRIEFING_DEFAULT: int = 10

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
