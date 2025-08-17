import os
from pathlib import Path
from dotenv import load_dotenv


class Settings:

    def __init__(self) -> None:
        # Base and .env
        self.BASE_DIR = Path(__file__).resolve().parent.parent
        load_dotenv(dotenv_path=self.BASE_DIR / ".env")

        # Secrets and API keys
        self.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

        # CORS origins (comma-separated). Example: "http://localhost:5173,https://studylm.app"
        cors = os.getenv("CORS_ALLOW_ORIGINS", "*")
        self.CORS_ORIGINS = [o.strip() for o in cors.split(",") if o.strip()] or ["*"]

        # Developer docs toggle (disable by default in production)
        enable = os.getenv("ENABLE_API_DOCS", "0").strip().lower()
        self.ENABLE_API_DOCS = enable in {"1", "true", "yes", "on"}

        # Healthcheck token for internal probes
        self.HEALTHCHECK_TOKEN = os.getenv("HEALTHCHECK_TOKEN", "")

        # Token budget for chunks (allow much larger context)
        self.MAX_CHUNK_TOKENS = int(os.getenv("MAX_CHUNK_TOKENS", "2000"))

        # Vector store directory
        self.VECTOR_STORE_DIR = os.getenv("VECTOR_STORE_DIR", "vector_store")

        # Risk guardrails (allow much larger PDFs by default)
        self.MAX_PDF_MB = int(os.getenv("MAX_PDF_MB", "100"))
        self.MAX_PDF_PAGES = int(os.getenv("MAX_PDF_PAGES", "2000"))

        # Models
        self.EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
        self.CHAT_MODEL = os.getenv("CHAT_MODEL", "gpt-4o-mini")
        allowed = os.getenv("CHAT_MODELS_ALLOWED", "gpt-4o-mini,gpt-4o,gpt-4.1-mini,gpt-4.1")
        self.CHAT_MODELS_ALLOWED = [m.strip() for m in allowed.split(",") if m.strip()]

        # OCR settings (for scanned/image PDFs)
        # OCR always enabled by default, high DPI for better accuracy
        ocr_en = os.getenv("OCR_ENABLED", "1").strip().lower()
        self.OCR_ENABLED = ocr_en in {"1", "true", "yes", "on"}
        self.OCR_DPI = int(os.getenv("OCR_DPI", "300"))  # higher DPI for better OCR
        self.OCR_LANGUAGE = os.getenv("OCR_LANGUAGE", "eng")
        # Additional custom tesseract CLI flags; leave blank for defaults
        self.OCR_TESSERACT_CONFIG = os.getenv("OCR_TESSERACT_CONFIG", "--psm 3") or None

    # --- Future: Add more cool features here ---
    # self.ENABLE_IMAGE_QA = True
    # self.ENABLE_TABLE_EXTRACTION = True
    # self.ENABLE_AUDIO_TRANSCRIPTION = True


settings = Settings()