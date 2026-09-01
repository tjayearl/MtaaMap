from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://mtaamap:mtaamap@localhost:5432/mtaamap"
    jwt_secret_key: str = "development-only-change-me"
    access_token_expire_minutes: int = 60
    frontend_origin: str = "http://localhost:5173"
    firebase_credentials_path: str | None = None
    sentry_dsn: str | None = None
    rate_limit_requests_per_minute: int = 60

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()