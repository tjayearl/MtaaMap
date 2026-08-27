from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://mtaamap:mtaamap@localhost:5432/mtaamap"
    jwt_secret_key: str = "development-only-change-me"
    access_token_expire_minutes: int = 60
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()