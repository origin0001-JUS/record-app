import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATABASE_PATH = Path(os.getenv("DB_PATH", str(BASE_DIR / "data" / "app.db")))
DATABASE_URL = f"sqlite+aiosqlite:///{DATABASE_PATH}"

# Ensure directories exist
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

STORAGE_PATH = Path(os.getenv("STORAGE_PATH", str(BASE_DIR / "storage")))
UPLOADS_PATH = STORAGE_PATH / "uploads"
OUTPUTS_PATH = STORAGE_PATH / "outputs"
UPLOADS_PATH.mkdir(parents=True, exist_ok=True)
OUTPUTS_PATH.mkdir(parents=True, exist_ok=True)

MAX_CONCURRENT_JOBS = int(os.getenv("MAX_CONCURRENT_JOBS", "2"))
