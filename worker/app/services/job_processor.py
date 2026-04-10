import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import update, select
from app.config import OUTPUTS_PATH
from app.db.database import async_session
from app.db.models import Job
from app.services.notebooklm_service import notebooklm_service

logger = logging.getLogger(__name__)

JOB_TIMEOUT_SECONDS = 600  # 10 minutes


class JobProcessor:
    def __init__(self, max_concurrent: int = 2):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.tasks: dict[str, asyncio.Task] = {}

    @property
    def active_count(self) -> int:
        return sum(1 for t in self.tasks.values() if not t.done())

    async def submit(self, job_id: str, file_path: str, file_type: str, preset_config: dict):
        task = asyncio.create_task(self._run_with_timeout(job_id, file_path, file_type, preset_config))
        self.tasks[job_id] = task
        logger.info(f"Submitted job {job_id}")

    async def recover_interrupted_jobs(self):
        """Mark jobs stuck in non-terminal status as error on worker restart."""
        async with async_session() as session:
            result = await session.execute(
                select(Job).where(Job.status.notin_(["complete", "error", "pending"]))
            )
            stuck_jobs = result.scalars().all()
            for job in stuck_jobs:
                await session.execute(
                    update(Job).where(Job.id == job.id).values(
                        status="error",
                        errorMessage="Worker가 재시작되어 작업이 중단되었습니다. 다시 시도해주세요.",
                        statusMessage="Worker 재시작으로 중단됨",
                        updatedAt=datetime.now(timezone.utc),
                    )
                )
                logger.warning(f"Recovered interrupted job {job.id} (was: {job.status})")
            await session.commit()
            if stuck_jobs:
                logger.info(f"Recovered {len(stuck_jobs)} interrupted job(s)")

    async def _update_status(self, job_id: str, status: str, **kwargs):
        async with async_session() as session:
            values = {"status": status, "updatedAt": datetime.now(timezone.utc), **kwargs}
            await session.execute(
                update(Job).where(Job.id == job_id).values(**values)
            )
            await session.commit()

    async def _run_with_timeout(self, job_id: str, file_path: str, file_type: str, preset_config: dict):
        try:
            await asyncio.wait_for(
                self._run(job_id, file_path, file_type, preset_config),
                timeout=JOB_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            logger.error(f"Job {job_id} timed out after {JOB_TIMEOUT_SECONDS}s")
            await self._update_status(
                job_id, "error",
                errorMessage=f"작업 시간이 {JOB_TIMEOUT_SECONDS // 60}분을 초과했습니다.",
                statusMessage="타임아웃",
            )

    async def _run(self, job_id: str, file_path: str, file_type: str, preset_config: dict):
        async with self.semaphore:
            try:
                output_dir = OUTPUTS_PATH / job_id
                output_dir.mkdir(parents=True, exist_ok=True)

                output_formats = json.loads(preset_config.get("outputFormats", '["summary"]'))
                today = datetime.now().strftime("%Y년 %m월 %d일")
                prompt_template = preset_config.get("promptTemplate", "이 회의 내용을 요약해주세요.")
                prompt_template = f"[오늘 날짜: {today}] 모든 날짜 참조는 현재 기준({today})으로 작성하십시오.\n\n{prompt_template}"
                report_template = preset_config.get("reportTemplate", "briefing")
                slide_format = preset_config.get("slideFormat", "detailed")
                meeting_type = preset_config.get("meetingType", "custom")
                template_config = preset_config.get("templateConfig")

                # Step 1: Create notebook
                await self._update_status(job_id, "uploading", statusMessage="노트북 생성 중...")
                notebook_name = f"Meeting-{datetime.now().strftime('%Y%m%d-%H%M')}-{meeting_type}"
                notebook_id = await notebooklm_service.create_notebook(notebook_name)
                await self._update_status(job_id, "uploading", notebookId=notebook_id, statusMessage="소스 추가 중...")

                # Step 2: Add source
                if file_type in ("text", "stt_text"):
                    with open(file_path, "r", encoding="utf-8") as f:
                        text_content = f.read()
                    source_id = await notebooklm_service.add_source_text(
                        notebook_id, text_content, title=f"Meeting-{meeting_type}"
                    )
                else:
                    source_id = await notebooklm_service.add_source_file(notebook_id, file_path)
                await self._update_status(job_id, "processing", sourceId=source_id, statusMessage="소스 처리 중...")

                # Step 3: Generate summary via chat
                if "summary" in output_formats:
                    await self._update_status(job_id, "generating_summary", statusMessage="요약 생성 중...")
                    summary = await notebooklm_service.generate_summary(notebook_id, prompt_template)
                    summary_path = output_dir / "summary.txt"
                    summary_path.write_text(summary, encoding="utf-8")
                    await self._update_status(job_id, "generating_summary", summaryText=summary)

                # Step 4: Generate report (notebooklm-py v0.3.4 API)
                if "report" in output_formats:
                    await self._update_status(job_id, "generating_report", statusMessage="보고서 생성 중...")
                    report_custom_prompt = self._build_report_instructions(template_config)
                    # Map preset reportTemplate to NotebookLM ReportFormat values
                    report_format_map = {
                        "briefing": "briefing_doc",
                        "briefing_doc": "briefing_doc",
                        "blog": "blog_post",
                        "blog_post": "blog_post",
                        "study": "study_guide",
                        "study_guide": "study_guide",
                        "custom": "custom",
                    }
                    api_report_format = report_format_map.get(report_template, "briefing_doc")
                    await notebooklm_service.generate_report(
                        notebook_id, report_format=api_report_format, language="ko",
                        custom_prompt=report_custom_prompt,
                    )
                    report_path = str(output_dir / "report.md")
                    await notebooklm_service.download_report(notebook_id, report_path)
                    await self._update_status(job_id, "generating_report", reportPath=report_path)

                # Done (summary + report complete)
                await self._update_status(job_id, "complete", statusMessage="요약/보고서 완료")
                logger.info(f"Job {job_id} summary/report completed")

                # Step 5: Generate slides asynchronously (doesn't block completion)
                if "slides" in output_formats:
                    slide_instructions = self._build_slide_instructions(template_config)
                    asyncio.create_task(self._generate_slides_async(
                        job_id, notebook_id, output_dir, slide_instructions
                    ))

            except Exception as e:
                logger.error(f"Job {job_id} failed: {e}", exc_info=True)
                await self._update_status(
                    job_id, "error",
                    errorMessage=str(e),
                    statusMessage=f"오류 발생: {str(e)[:200]}"
                )


    def _build_report_instructions(self, template_config: dict | None) -> str | None:
        """Build report generation instructions from template config."""
        if not template_config:
            return None
        parts = []
        if template_config.get("description"):
            parts.append(f"톤앤매너: {template_config['description']}")
        if template_config.get("layoutGuide"):
            parts.append(f"구조: {template_config['layoutGuide']}")
        style = template_config.get("style", {})
        if style.get("font"):
            parts.append(f"폰트 분위기: {style['font']}")
        return "\n".join(parts) if parts else None

    def _build_slide_instructions(self, template_config: dict | None) -> str | None:
        """Build slide generation instructions from template config."""
        if not template_config:
            return None
        parts = []
        if template_config.get("name"):
            parts.append(f"슬라이드 스타일: {template_config['name']}")
        style = template_config.get("style", {})
        if style:
            parts.append(f"색상 톤: 배경 {style.get('bg', '')}, 텍스트 {style.get('text', '')}, 포인트 {style.get('accent', '')}")
            if style.get("font"):
                parts.append(f"폰트 분위기: {style['font']}")
        if template_config.get("layoutGuide"):
            parts.append(f"레이아웃: {template_config['layoutGuide']}")
        if template_config.get("description"):
            parts.append(f"톤앤매너: {template_config['description']}")
        return "\n".join(parts) if parts else None

    async def _generate_slides_async(self, job_id: str, notebook_id: str, output_dir: Path, instructions: str | None = None):
        """Generate slides in background with timeout. Job is already 'complete' for summary/report."""
        try:
            await self._update_status(job_id, "complete", statusMessage="슬라이드 생성 중 (백그라운드)...")
            await asyncio.wait_for(
                self._generate_slides_work(notebook_id, output_dir, instructions),
                timeout=300,  # 5분 타임아웃
            )
            slides_path = str(output_dir / "slides.pdf")
            await self._update_status(job_id, "complete", slidesPath=slides_path, statusMessage="전체 완료")
            logger.info(f"Job {job_id} slides completed (background)")
        except asyncio.TimeoutError:
            logger.error(f"Job {job_id} slides timed out after 300s")
            await self._update_status(job_id, "complete", statusMessage="슬라이드 생성 시간 초과 (5분)")
        except Exception as e:
            logger.error(f"Job {job_id} slides failed (background): {e}")
            await self._update_status(job_id, "complete", statusMessage=f"슬라이드 생성 실패: {str(e)[:100]}")

    async def _generate_slides_work(self, notebook_id: str, output_dir: Path, instructions: str | None = None):
        """Actual slide generation work, wrapped by timeout."""
        await notebooklm_service.generate_slides(notebook_id, language="ko", instructions=instructions)
        slides_path = str(output_dir / "slides.pdf")
        await notebooklm_service.download_slides(notebook_id, slides_path, output_format="pdf")


# Singleton
job_processor = JobProcessor()
