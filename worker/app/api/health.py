from fastapi import APIRouter

from app.api.schemas import HealthResponse
from app.services.notebooklm_service import notebooklm_service
from app.services.job_processor import job_processor

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check worker health and NotebookLM authentication status."""
    authenticated = await notebooklm_service.check_auth()
    return HealthResponse(
        status="ok" if authenticated else "degraded",
        notebooklm_authenticated=authenticated,
        active_jobs=job_processor.active_count,
    )
