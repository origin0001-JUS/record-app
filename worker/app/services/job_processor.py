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

    # ========== v2 Smart Flow: 2-Phase ==========

    async def submit_analyze(self, job_id: str, file_path: str, file_type: str):
        """Phase 1: 파일 업로드 + AI 분석 (프리셋 선택 전)"""
        task = asyncio.create_task(self._run_analyze(job_id, file_path, file_type))
        self.tasks[job_id] = task
        logger.info(f"Submitted analyze job {job_id}")

    async def submit_generate(self, job_id: str, notebook_id: str, preset_config: dict):
        """Phase 2: 프리셋/템플릿 선택 후 요약+슬라이드 생성"""
        task = asyncio.create_task(self._run_generate(job_id, notebook_id, preset_config))
        self.tasks[f"{job_id}-gen"] = task
        logger.info(f"Submitted generate job {job_id}")

    async def _run_analyze(self, job_id: str, file_path: str, file_type: str):
        """Phase 1: 노트북 생성 → 소스 추가 → 분석 질문 → analysisResult 저장"""
        async with self.semaphore:
            try:
                await self._update_status(job_id, "uploading", statusMessage="노트북 생성 중...")
                notebook_name = f"Record-{datetime.now().strftime('%Y%m%d-%H%M')}"
                notebook_id = await notebooklm_service.create_notebook(notebook_name)
                await self._update_status(job_id, "uploading", notebookId=notebook_id, statusMessage="소스 추가 중...")

                if file_type in ("text", "stt_text"):
                    with open(file_path, "r", encoding="utf-8") as f:
                        text_content = f.read()
                    source_id = await notebooklm_service.add_source_text(
                        notebook_id, text_content, title="Record"
                    )
                else:
                    source_id = await notebooklm_service.add_source_file(notebook_id, file_path)

                await self._update_status(job_id, "analyzing", sourceId=source_id, statusMessage="자료 분석 중...")

                # 분석 질문
                analysis_prompt = (
                    "이 자료의 종류와 핵심 주제를 JSON 형식으로 알려주세요.\n"
                    "종류는 다음 중 하나를 선택하세요:\n"
                    "- meeting_regular (정기회의, 주간/월간 미팅)\n"
                    "- meeting_strategy (전략/의사결정 회의)\n"
                    "- meeting_external (고객/파트너 외부 미팅)\n"
                    "- meeting_tech (기술/개발 회의)\n"
                    "- seminar (강연, 세미나, 교육)\n"
                    "- brainstorming (아이디어 발산, 기획)\n"
                    "- project (프로젝트 관리, 진행 점검)\n"
                    "- directive (지시, 전달, 공지)\n"
                    "- report (보고, 브리핑)\n"
                    "- general (기타)\n\n"
                    '응답 형식: {"type": "meeting_strategy", "topic": "주제", "summary": "한 줄 요약"}'
                )
                raw_answer = await notebooklm_service.generate_summary(notebook_id, analysis_prompt)

                # JSON 파싱 (실패 시 general 폴백)
                try:
                    # JSON 블록 추출 시도
                    import re
                    json_match = re.search(r'\{[^}]+\}', raw_answer)
                    if json_match:
                        analysis = json.loads(json_match.group())
                    else:
                        analysis = json.loads(raw_answer)
                except (json.JSONDecodeError, ValueError):
                    logger.warning(f"Job {job_id} analysis JSON parse failed, falling back to general")
                    analysis = {"type": "general", "topic": "분석 불가", "summary": raw_answer[:200]}

                # 추천 프리셋 매핑
                type_to_presets = {
                    "meeting_regular": ["regular", "internal_report", "directives"],
                    "meeting_strategy": ["strategy", "executive_report", "internal_report"],
                    "meeting_external": ["external", "internal_report"],
                    "meeting_tech": ["tech", "internal_report"],
                    "seminar": ["seminar"],
                    "brainstorming": ["brainstorming", "strategy"],
                    "project": ["project", "internal_report"],
                    "directive": ["directives", "internal_report"],
                    "report": ["executive_report", "internal_report", "strategy"],
                    "general": ["general", "internal_report"],
                }
                analysis["suggestedPresets"] = type_to_presets.get(analysis.get("type", "general"), ["general"])

                await self._update_status(
                    job_id, "analyzed",
                    analysisResult=json.dumps(analysis, ensure_ascii=False),
                    statusMessage="분석 완료",
                )
                logger.info(f"Job {job_id} analysis completed: {analysis.get('type')}")

            except Exception as e:
                logger.error(f"Job {job_id} analyze failed: {e}", exc_info=True)
                await self._update_status(
                    job_id, "error",
                    errorMessage=str(e),
                    statusMessage=f"분석 실패: {str(e)[:200]}"
                )

    async def _run_generate(self, job_id: str, notebook_id: str, preset_config: dict):
        """Phase 2: 요약 생성 + 슬라이드 생성 (백그라운드)"""
        async with self.semaphore:
            try:
                output_dir = OUTPUTS_PATH / job_id
                output_dir.mkdir(parents=True, exist_ok=True)

                output_formats = json.loads(preset_config.get("outputFormats", '["summary"]'))
                today = datetime.now().strftime("%Y년 %m월 %d일")
                prompt_template = preset_config.get("promptTemplate", "이 회의 내용을 요약해주세요.")
                prompt_template = f"[오늘 날짜: {today}] 모든 날짜 참조는 현재 기준({today})으로 작성하십시오.\n\n{prompt_template}"
                template_config = preset_config.get("templateConfig")

                # 요약 생성
                if "summary" in output_formats:
                    await self._update_status(job_id, "generating_summary", statusMessage="요약 생성 중...")
                    summary = await notebooklm_service.generate_summary(notebook_id, prompt_template)
                    summary_path = output_dir / "summary.txt"
                    summary_path.write_text(summary, encoding="utf-8")
                    await self._update_status(job_id, "generating_summary", summaryText=summary)

                # 완료 (슬라이드는 백그라운드)
                await self._update_status(job_id, "complete", statusMessage="요약 완료")
                logger.info(f"Job {job_id} generate completed")

                # 슬라이드 생성 (백그라운드)
                if "slides" in output_formats:
                    slide_instructions = self._build_slide_instructions(template_config)
                    asyncio.create_task(self._generate_slides_async(
                        job_id, notebook_id, output_dir, slide_instructions
                    ))

            except Exception as e:
                logger.error(f"Job {job_id} generate failed: {e}", exc_info=True)
                await self._update_status(
                    job_id, "error",
                    errorMessage=str(e),
                    statusMessage=f"생성 실패: {str(e)[:200]}"
                )

    # ========== Legacy + Common ==========

    async def recover_interrupted_jobs(self):
        """Mark jobs stuck in non-terminal status as error on worker restart."""
        async with async_session() as session:
            result = await session.execute(
                select(Job).where(Job.status.notin_(["complete", "error", "pending", "analyzed"]))
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
                timeout=660,  # 11분 (내부 API 타임아웃 10분 + 다운로드 여유 1분)
            )
            slides_path = str(output_dir / "slides.pdf")
            await self._update_status(job_id, "complete", slidesPath=slides_path, statusMessage="전체 완료")
            logger.info(f"Job {job_id} slides completed (background)")
        except asyncio.TimeoutError:
            logger.error(f"Job {job_id} slides timed out after 660s")
            await self._update_status(job_id, "complete", statusMessage="슬라이드 생성 시간 초과 (11분)")
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
