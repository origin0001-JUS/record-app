from fastapi import APIRouter
from app.api.jobs import router as jobs_router
from app.api.health import router as health_router
from app.api.presets import router as presets_router
from app.api.upload import router as upload_router

api_router = APIRouter()
api_router.include_router(jobs_router)
api_router.include_router(health_router)
api_router.include_router(presets_router)
api_router.include_router(upload_router)
