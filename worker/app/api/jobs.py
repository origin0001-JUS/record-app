from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.api.schemas import ProcessRequest, JobStatus
from app.db.database import async_session
from app.db.models import Job
from app.services.job_processor import job_processor

router = APIRouter()


@router.post("/process")
async def process_job(request: ProcessRequest):
    """Submit a job for processing via NotebookLM."""
    await job_processor.submit(
        job_id=request.job_id,
        file_path=request.file_path,
        file_type=request.file_type,
        preset_config=request.preset_config,
    )
    return {"job_id": request.job_id, "status": "submitted"}


@router.get("/status/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """Get the current status of a processing job."""
    async with async_session() as session:
        result = await session.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return JobStatus(
            job_id=job.id,
            status=job.status,
            status_message=job.statusMessage,
            error_message=job.errorMessage,
            summary_text=job.summaryText,
            report_path=job.reportPath,
            slides_path=job.slidesPath,
        )
