import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import MAX_CONCURRENT_JOBS
from app.services.job_processor import job_processor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    from app.db.database import engine
    from app.db.models import Base

    # Auto-create tables if they don't exist (for fresh deployments)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables ensured")

    # Seed default presets if DB is empty
    from app.db.seed_presets import seed_default_presets
    await seed_default_presets()

    job_processor.semaphore = asyncio.Semaphore(MAX_CONCURRENT_JOBS)
    await job_processor.recover_interrupted_jobs()
    logger.info(f"Worker started (max concurrent jobs: {MAX_CONCURRENT_JOBS})")
    yield
    logger.info("Worker shutting down")


app = FastAPI(
    title="Record App Worker",
    description="Meeting recording automation worker with NotebookLM",
    version="0.1.0",
    lifespan=lifespan,
)

allowed_origins = [
    "http://localhost:3000",
]
# Add Render domain if set
web_url = os.getenv("WEB_URL")
if web_url:
    allowed_origins.append(web_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
