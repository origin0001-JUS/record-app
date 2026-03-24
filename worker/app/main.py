import logging
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
