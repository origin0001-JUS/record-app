import asyncio
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAY_BASE = 2  # seconds, exponential backoff


async def _retry(fn, retries=MAX_RETRIES):
    """Retry an async callable with exponential backoff."""
    for attempt in range(retries):
        try:
            return await fn()
        except Exception as e:
            if attempt == retries - 1:
                raise
            delay = RETRY_DELAY_BASE ** (attempt + 1)
            logger.warning(f"Retry {attempt + 1}/{retries} after {delay}s: {e}")
            await asyncio.sleep(delay)


class NotebookLMService:
    """Wrapper around notebooklm-py v0.3.4 client for meeting processing.

    Uses async context manager pattern:
        async with NotebookLMClient.from_storage() as client:
            ...
    """

    async def _get_client(self):
        """Create a new client from stored auth (each call gets fresh client)."""
        from notebooklm import NotebookLMClient
        return await NotebookLMClient.from_storage()

    async def check_auth(self) -> bool:
        try:
            async with await self._get_client() as client:
                await client.notebooks.list()
            return True
        except Exception:
            return False

    async def create_notebook(self, name: str) -> str:
        async with await self._get_client() as client:
            async def _create():
                return await client.notebooks.create(title=name)
            notebook = await _retry(_create)
            logger.info(f"Created notebook: {notebook.id} - {name}")
            return notebook.id

    async def add_source_file(self, notebook_id: str, file_path: str) -> str:
        async with await self._get_client() as client:
            source = await client.sources.add_file(
                notebook_id=notebook_id,
                file_path=file_path,
                wait=True,
                wait_timeout=120.0,
            )
            logger.info(f"Added source file to notebook {notebook_id}: {source.id}")
            return source.id

    async def add_source_text(self, notebook_id: str, text: str, title: str = "Meeting Transcript") -> str:
        async with await self._get_client() as client:
            source = await client.sources.add_text(
                notebook_id=notebook_id,
                title=title,
                content=text,
                wait=True,
                wait_timeout=120.0,
            )
            logger.info(f"Added text source to notebook {notebook_id}: {source.id}")
            return source.id

    async def generate_summary(self, notebook_id: str, prompt: str) -> str:
        async with await self._get_client() as client:
            async def _ask():
                return await client.chat.ask(
                    notebook_id=notebook_id,
                    question=prompt,
                )
            result = await _retry(_ask)
            logger.info(f"Generated summary for notebook {notebook_id}")
            return result.answer if hasattr(result, 'answer') else str(result)

    async def generate_report(self, notebook_id: str, report_format: str = "briefing_doc", language: str = "ko", custom_prompt: str | None = None) -> str:
        """Generate report and wait for completion. Returns task_id."""
        from notebooklm.types import GenerationStatus
        async with await self._get_client() as client:
            status = await client.artifacts.generate_report(
                notebook_id=notebook_id,
                report_format=report_format,
                language=language,
                custom_prompt=custom_prompt,
            )
            # Wait for completion
            result = await client.artifacts.wait_for_completion(
                notebook_id=notebook_id,
                task_id=status.task_id if hasattr(status, 'task_id') else str(status),
                timeout=600.0,
            )
            logger.info(f"Generated report for notebook {notebook_id}")
            return result.artifact_id if hasattr(result, 'artifact_id') else str(result)

    async def download_report(self, notebook_id: str, output_path: str) -> str:
        async with await self._get_client() as client:
            await client.artifacts.download_report(
                notebook_id=notebook_id,
                output_path=output_path,
            )
            logger.info(f"Downloaded report to {output_path}")
            return output_path

    async def generate_slides(self, notebook_id: str, language: str = "ko", instructions: str | None = None) -> str:
        """Generate slide deck and wait for completion."""
        async with await self._get_client() as client:
            status = await client.artifacts.generate_slide_deck(
                notebook_id=notebook_id,
                language=language,
                instructions=instructions,
            )
            result = await client.artifacts.wait_for_completion(
                notebook_id=notebook_id,
                task_id=status.task_id if hasattr(status, 'task_id') else str(status),
                timeout=600.0,
            )
            logger.info(f"Generated slides for notebook {notebook_id}")
            return result.artifact_id if hasattr(result, 'artifact_id') else str(result)

    async def download_slides(self, notebook_id: str, output_path: str, output_format: str = "pdf") -> str:
        async with await self._get_client() as client:
            await client.artifacts.download_slide_deck(
                notebook_id=notebook_id,
                output_path=output_path,
                output_format=output_format,
            )
            logger.info(f"Downloaded slides to {output_path}")
            return output_path


# Singleton
notebooklm_service = NotebookLMService()
