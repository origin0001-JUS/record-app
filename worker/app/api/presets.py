import json
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, delete

from app.db.database import async_session
from app.db.models import Preset

router = APIRouter(prefix="/api/presets", tags=["presets"])


class PresetCreate(BaseModel):
    name: str
    meetingType: str
    outputFormats: list[str]
    promptTemplate: str
    reportTemplate: str = "briefing"
    slideFormat: str = "detailed"
    isDefault: bool = False


class PresetUpdate(BaseModel):
    name: str | None = None
    meetingType: str | None = None
    outputFormats: list[str] | str | None = None
    promptTemplate: str | None = None
    reportTemplate: str | None = None
    slideFormat: str | None = None
    isDefault: bool | None = None


def _preset_to_dict(p: Preset) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "meetingType": p.meetingType,
        "outputFormats": p.outputFormats,
        "promptTemplate": p.promptTemplate,
        "reportTemplate": p.reportTemplate,
        "slideFormat": p.slideFormat,
        "isDefault": p.isDefault,
        "createdAt": p.createdAt.isoformat() if p.createdAt else None,
        "updatedAt": p.updatedAt.isoformat() if p.updatedAt else None,
    }


@router.get("")
async def list_presets():
    async with async_session() as session:
        result = await session.execute(select(Preset).order_by(Preset.createdAt))
        presets = result.scalars().all()
        return [_preset_to_dict(p) for p in presets]


@router.get("/{preset_id}")
async def get_preset(preset_id: str):
    async with async_session() as session:
        result = await session.execute(select(Preset).where(Preset.id == preset_id))
        preset = result.scalar_one_or_none()
        if not preset:
            raise HTTPException(status_code=404, detail="프리셋을 찾을 수 없습니다")
        return _preset_to_dict(preset)


@router.post("", status_code=201)
async def create_preset(body: PresetCreate):
    from uuid import uuid4
    async with async_session() as session:
        preset = Preset(
            id=str(uuid4()),
            name=body.name,
            meetingType=body.meetingType,
            outputFormats=json.dumps(body.outputFormats),
            promptTemplate=body.promptTemplate,
            reportTemplate=body.reportTemplate,
            slideFormat=body.slideFormat,
            isDefault=body.isDefault,
            createdAt=datetime.now(timezone.utc),
            updatedAt=datetime.now(timezone.utc),
        )
        session.add(preset)
        await session.commit()
        await session.refresh(preset)
        return _preset_to_dict(preset)


@router.put("/{preset_id}")
async def update_preset(preset_id: str, body: PresetUpdate):
    async with async_session() as session:
        result = await session.execute(select(Preset).where(Preset.id == preset_id))
        preset = result.scalar_one_or_none()
        if not preset:
            raise HTTPException(status_code=404, detail="프리셋을 찾을 수 없습니다")

        if body.name is not None:
            preset.name = body.name
        if body.meetingType is not None:
            preset.meetingType = body.meetingType
        if body.outputFormats is not None:
            preset.outputFormats = json.dumps(body.outputFormats) if isinstance(body.outputFormats, list) else body.outputFormats
        if body.promptTemplate is not None:
            preset.promptTemplate = body.promptTemplate
        if body.reportTemplate is not None:
            preset.reportTemplate = body.reportTemplate
        if body.slideFormat is not None:
            preset.slideFormat = body.slideFormat
        if body.isDefault is not None:
            preset.isDefault = body.isDefault
        preset.updatedAt = datetime.now(timezone.utc)

        await session.commit()
        await session.refresh(preset)
        return _preset_to_dict(preset)


@router.delete("/{preset_id}")
async def delete_preset(preset_id: str):
    async with async_session() as session:
        result = await session.execute(select(Preset).where(Preset.id == preset_id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="프리셋을 찾을 수 없습니다")
        await session.execute(delete(Preset).where(Preset.id == preset_id))
        await session.commit()
        return {"success": True}
