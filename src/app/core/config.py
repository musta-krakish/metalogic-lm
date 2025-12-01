from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # DATABASE
    DATABASE_URL: str

    # AUTH
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    # IIKO
    IIKO_API_URL: str
    IIKO_API_KEY: str

    # ARCA
    ARCA_BASE_URL: str
    ARCA_BASIC_USERNAME: str
    ARCA_BASIC_PASSWORD: str

    # TINDA
    TINDA_BASE_URL: str
    TINDA_USERNAME: str
    TINDA_PASSWORD: str

    # TSD
    TSD_BASE_URL: str
    TSD_USERNAME: str
    TSD_PASSWORD: str
    TSD_DEVICE_ID: str
    TSD_DEVICE_NAME: str
    TSD_ROLE: str

    # Logging / misc
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"

settings = Settings()
