import os
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.config import UPLOADS_PATH

router = APIRouter(tags=["upload"])

MAX_FILE_SIZE = 200 * 1024 * 1024  # 200MB


@router.post("/api/upload")
async def upload_file(file: UploadFile = File(...), jobId: str = Form(...)):
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기가 200MB를 초과합니다")

    upload_dir = UPLOADS_PATH / jobId
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / file.filename
    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "filePath": str(file_path),
        "fileName": file.filename,
        "size": len(content),
    }
