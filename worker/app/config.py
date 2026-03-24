import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATABASE_PATH = BASE_DIR / "data" / "app.db"
DATABASE_URL = f"sqlite+aiosqlite:///{DATABASE_PATH}"
STORAGE_PATH = BASE_DIR / "storage"
UPLOADS_PATH = STORAGE_PATH / "uploads"
OUTPUTS_PATH = STORAGE_PATH / "outputs"
MAX_CONCURRENT_JOBS = int(os.getenv("MAX_CONCURRENT_JOBS", "2"))
