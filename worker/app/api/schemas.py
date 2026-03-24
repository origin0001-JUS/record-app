from pydantic import BaseModel


class ProcessRequest(BaseModel):
    job_id: str
    file_path: str
    file_type: str  # audio | video | text | stt_text
    preset_config: dict  # { promptTemplate, outputFormats, reportTemplate, slideFormat, meetingType }


class JobStatus(BaseModel):
    job_id: str
    status: str
    status_message: str | None = None
    error_message: str | None = None
    summary_text: str | None = None
    report_path: str | None = None
    slides_path: str | None = None


class HealthResponse(BaseModel):
    status: str
    notebooklm_authenticated: bool
    active_jobs: int
