import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select, func

from app.api.schemas import ProcessRequest, JobStatus
from app.config import OUTPUTS_PATH
from app.db.database import async_session
from app.db.models import Job, Preset
from app.services.job_processor import job_processor

router = APIRouter(tags=["jobs"])


def _job_to_dict(job: Job, preset: Preset | None = None) -> dict:
    d = {
        "id": job.id,
        "userId": job.userId,
        "presetId": job.presetId,
        "status": job.status,
        "statusMessage": job.statusMessage,
        "originalFileName": job.originalFileName,
        "uploadedFilePath": job.uploadedFilePath,
        "fileType": job.fileType,
        "notebookId": job.notebookId,
        "sourceId": job.sourceId,
        "summaryText": job.summaryText,
        "reportPath": job.reportPath,
        "slidesPath": job.slidesPath,
        "templateConfig": job.templateConfig,
        "analysisResult": job.analysisResult,
        "errorMessage": job.errorMessage,
        "createdAt": job.createdAt.isoformat() if job.createdAt else None,
        "updatedAt": job.updatedAt.isoformat() if job.updatedAt else None,
    }
    if preset:
        d["preset"] = {
            "id": preset.id,
            "name": preset.name,
            "meetingType": preset.meetingType,
            "outputFormats": preset.outputFormats,
        }
    return d


# --- CRUD APIs ---

@router.get("/api/jobs")
async def list_jobs(page: int = 1, limit: int = 20):
    skip = (page - 1) * limit
    async with async_session() as session:
        total_result = await session.execute(select(func.count(Job.id)))
        total = total_result.scalar() or 0

        result = await session.execute(
            select(Job).order_by(Job.createdAt.desc()).offset(skip).limit(limit)
        )
        jobs = result.scalars().all()

        # Fetch presets for each job
        job_dicts = []
        for job in jobs:
            preset = None
            if job.presetId:
                p_result = await session.execute(select(Preset).where(Preset.id == job.presetId))
                preset = p_result.scalar_one_or_none()
            job_dicts.append(_job_to_dict(job, preset))

        return {"jobs": job_dicts, "total": total, "page": page, "limit": limit}


@router.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    async with async_session() as session:
        result = await session.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job을 찾을 수 없습니다")

        preset = None
        if job.presetId:
            p_result = await session.execute(select(Preset).where(Preset.id == job.presetId))
            preset = p_result.scalar_one_or_none()

        return _job_to_dict(job, preset)


@router.post("/api/jobs", status_code=201)
async def create_job(body: dict):
    preset_id = body.get("presetId")
    file_path = body.get("filePath")
    file_name = body.get("fileName")
    file_type = body.get("fileType")

    if not all([preset_id, file_path, file_name, file_type]):
        raise HTTPException(status_code=400, detail="presetId, filePath, fileName, fileType은 필수 항목입니다")

    async with async_session() as session:
        p_result = await session.execute(select(Preset).where(Preset.id == preset_id))
        preset = p_result.scalar_one_or_none()
        if not preset:
            raise HTTPException(status_code=400, detail="프리셋을 찾을 수 없습니다")

        template_config = body.get("templateConfig")

        job = Job(
            id=str(uuid4()),
            userId=body.get("userId", "dev-user"),
            presetId=preset_id,
            originalFileName=file_name,
            uploadedFilePath=file_path,
            fileType=file_type,
            templateConfig=json.dumps(template_config) if template_config else None,
            status="pending",
            createdAt=datetime.now(timezone.utc),
            updatedAt=datetime.now(timezone.utc),
        )
        session.add(job)
        await session.commit()
        await session.refresh(job)

        # Start processing
        await job_processor.submit(
            job_id=job.id,
            file_path=file_path,
            file_type=file_type,
            preset_config={
                "promptTemplate": preset.promptTemplate,
                "outputFormats": preset.outputFormats,
                "reportTemplate": preset.reportTemplate,
                "slideFormat": preset.slideFormat,
                "meetingType": preset.meetingType,
                "templateConfig": template_config,
            },
        )

        return _job_to_dict(job, preset)


@router.post("/api/jobs/analyze", status_code=201)
async def analyze_job(body: dict):
    """Phase 1: 파일 업로드 + AI 분석. 프리셋 선택 전에 자료 유형을 파악한다."""
    file_path = body.get("filePath")
    file_name = body.get("fileName")
    file_type = body.get("fileType")

    if not all([file_path, file_name, file_type]):
        raise HTTPException(status_code=400, detail="filePath, fileName, fileType은 필수 항목입니다")

    async with async_session() as session:
        job = Job(
            id=str(uuid4()),
            userId=body.get("userId", "dev-user"),
            presetId="",  # Phase 1에서는 미선택, Phase 2에서 설정
            originalFileName=file_name,
            uploadedFilePath=file_path,
            fileType=file_type,
            status="uploading",
            createdAt=datetime.now(timezone.utc),
            updatedAt=datetime.now(timezone.utc),
        )
        session.add(job)
        await session.commit()
        await session.refresh(job)

        # Phase 1 백그라운드 실행
        await job_processor.submit_analyze(
            job_id=job.id,
            file_path=file_path,
            file_type=file_type,
        )

        return _job_to_dict(job)


@router.post("/api/jobs/{job_id}/generate", status_code=200)
async def generate_job(job_id: str, body: dict):
    """Phase 2: 프리셋+템플릿 선택 후 요약/슬라이드 생성 시작."""
    preset_id = body.get("presetId")
    if not preset_id:
        raise HTTPException(status_code=400, detail="presetId는 필수 항목입니다")

    async with async_session() as session:
        result = await session.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job을 찾을 수 없습니다")
        if job.status != "analyzed":
            raise HTTPException(status_code=400, detail=f"분석이 완료되지 않았습니다 (현재: {job.status})")
        if not job.notebookId:
            raise HTTPException(status_code=400, detail="노트북이 생성되지 않았습니다")

        p_result = await session.execute(select(Preset).where(Preset.id == preset_id))
        preset = p_result.scalar_one_or_none()
        if not preset:
            raise HTTPException(status_code=400, detail="프리셋을 찾을 수 없습니다")

        template_config = body.get("templateConfig")
        job.presetId = preset_id
        job.templateConfig = json.dumps(template_config) if template_config else None
        job.status = "generating_summary"
        job.statusMessage = "요약 생성 중..."
        job.updatedAt = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(job)

        # Phase 2 백그라운드 실행
        await job_processor.submit_generate(
            job_id=job.id,
            notebook_id=job.notebookId,
            preset_config={
                "promptTemplate": preset.promptTemplate,
                "outputFormats": preset.outputFormats,
                "meetingType": preset.meetingType,
                "templateConfig": template_config,
            },
        )

        return _job_to_dict(job, preset)


@router.get("/api/jobs/{job_id}/download/{file_type}")
async def download_job_file(job_id: str, file_type: str):
    async with async_session() as session:
        result = await session.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job을 찾을 수 없습니다")

    output_dir = OUTPUTS_PATH / job_id

    if file_type == "summary":
        path = output_dir / "summary.txt"
        if not path.exists():
            path = output_dir / "summary.md"  # fallback
        media_type = "text/plain; charset=utf-8"
        filename = f"{job.originalFileName}-요약.txt"
    elif file_type == "report":
        path = Path(job.reportPath) if job.reportPath else output_dir / "report.md"
        media_type = "text/plain; charset=utf-8"
        filename = f"{job.originalFileName}-보고서.txt"
    elif file_type == "slides":
        path = Path(job.slidesPath) if job.slidesPath else output_dir / "slides.pdf"
        media_type = "application/pdf"
        filename = f"{job.originalFileName}-슬라이드.pdf"
    else:
        raise HTTPException(status_code=400, detail="잘못된 다운로드 타입")

    if not path.exists():
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")

    return FileResponse(path, media_type=media_type, filename=filename)


# --- Legacy endpoints (kept for compatibility) ---

@router.post("/process")
async def process_job(request: ProcessRequest):
    await job_processor.submit(
        job_id=request.job_id,
        file_path=request.file_path,
        file_type=request.file_type,
        preset_config=request.preset_config,
    )
    return {"job_id": request.job_id, "status": "submitted"}


@router.get("/status/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
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
