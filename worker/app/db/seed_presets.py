"""기본 프리셋 시드 데이터.

Worker 시작 시 DB에 기본 프리셋이 없으면 자동 생성.
"""

import json
from uuid import uuid4
from datetime import datetime, timezone

DEFAULT_PRESETS = [
    # ========== 1. 정기회의 ==========
    {
        "name": "정기회의 — 주간/월간 보고",
        "meetingType": "regular",
        "outputFormats": json.dumps(["summary"]),
        "promptTemplate": (
            "이 정기회의 녹취록을 바탕으로 회의 내용을 요약하세요.\n\n"
            "핵심 요약을 3줄 이내로 먼저 작성하고, "
            "안건별 결정사항(안건명, 논의 내용, 결정, 담당자)을 정리한 뒤, "
            "액션아이템(항목, 담당자, 기한)과 다음 회의 예고를 포함하세요.\n\n"
            "간결하고 실행 가능한 형태로 작성하세요."
        ),
        "reportTemplate": "briefing_doc",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 2. 전략/의사결정 ==========
    {
        "name": "전략회의 — 의사결정 기록",
        "meetingType": "strategy",
        "outputFormats": json.dumps(["summary", "slides"]),
        "promptTemplate": (
            "이 전략/의사결정 회의 녹취록을 바탕으로 회의 내용을 요약하세요.\n\n"
            "핵심 결론을 1~2문장으로 먼저 작성하고, "
            "배경 및 맥락, 논의된 옵션별 장단점과 리스크, "
            "최종 결정과 근거, 실행 계획(담당자, 일정), "
            "리스크 및 완화 방안을 포함하세요.\n\n"
            "C-레벨 보고에 적합한 간결하고 명확한 톤으로 작성하세요."
        ),
        "reportTemplate": "briefing_doc",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 3. 내부 보고 ==========
    {
        "name": "내부 보고 — 팀/부서 보고",
        "meetingType": "internal_report",
        "outputFormats": json.dumps(["summary"]),
        "promptTemplate": (
            "이 회의/미팅 녹취록을 바탕으로 내부 보고용으로 정리하세요.\n\n"
            "보고 배경과 목적을 먼저 작성하고, "
            "주요 논의 사항을 항목별로 정리한 뒤, "
            "결론 및 합의사항, 후속 조치 계획(담당, 기한)을 포함하세요.\n\n"
            "상급자가 빠르게 파악할 수 있도록 핵심 위주로 간결하게 작성하세요."
        ),
        "reportTemplate": "briefing_doc",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 4. 임원 보고 ==========
    {
        "name": "임원 보고 — 경영진 브리핑",
        "meetingType": "executive_report",
        "outputFormats": json.dumps(["summary", "slides"]),
        "promptTemplate": (
            "이 회의/미팅 녹취록을 바탕으로 임원 보고용으로 정리하세요.\n\n"
            "핵심 결론과 권고사항을 먼저 제시하고, "
            "사업적 임팩트(매출, 비용, 리스크), "
            "주요 의사결정 사항과 옵션별 분석, "
            "실행 로드맵(마일스톤, 일정, 담당 임원)을 포함하세요.\n\n"
            "경영진이 즉시 판단할 수 있도록 수치와 근거 중심으로 작성하세요."
        ),
        "reportTemplate": "briefing_doc",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 5. 지시사항 정리 ==========
    {
        "name": "지시사항 정리 — 업무 지시/전달사항",
        "meetingType": "directives",
        "outputFormats": json.dumps(["summary"]),
        "promptTemplate": (
            "이 회의/미팅 녹취록에서 지시사항과 전달사항을 추출하세요.\n\n"
            "지시자와 지시 배경을 먼저 작성하고, "
            "지시사항을 우선순위별로 정리(긴급/중요/일반)한 뒤, "
            "각 항목의 담당자, 기한, 완료 기준을 명확히 하고, "
            "참고 사항과 유의점을 포함하세요.\n\n"
            "실행자가 바로 착수할 수 있도록 구체적으로 작성하세요."
        ),
        "reportTemplate": "briefing_doc",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 6. 외부/협력 ==========
    {
        "name": "외부미팅 — 고객·파트너 협의",
        "meetingType": "external",
        "outputFormats": json.dumps(["summary"]),
        "promptTemplate": (
            "이 외부 미팅(고객/파트너) 녹취록을 바탕으로 회의 내용을 요약하세요.\n\n"
            "미팅 개요(참석자, 목적)를 먼저 작성하고, "
            "상대방 요구사항 및 관심사, 합의 내용(구체적 조건, 수치), "
            "미해결 이슈, 후속 조치(항목, 담당, 기한)를 포함하세요.\n\n"
            "협상 관점에서 상대방의 입장과 우리의 대응을 분석하세요."
        ),
        "reportTemplate": "briefing_doc",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 7. 기술/개발 ==========
    {
        "name": "기술회의 — 개발·아키텍처 리뷰",
        "meetingType": "tech",
        "outputFormats": json.dumps(["summary"]),
        "promptTemplate": (
            "이 기술/개발 회의 녹취록을 바탕으로 회의 내용을 요약하세요.\n\n"
            "기술 결정 요약을 먼저 작성하고, "
            "문제 정의(현재 상황, 문제점, 제약 조건), "
            "논의된 기술 옵션별 접근 방식과 트레이드오프, "
            "최종 기술 결정과 근거, 구현 계획(단계별 작업, 담당자), "
            "기술 부채 및 후속 과제를 포함하세요.\n\n"
            "개발자가 바로 실행할 수 있는 수준으로 구체적으로 작성하세요."
        ),
        "reportTemplate": "briefing_doc",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 8. 강연/세미나 ==========
    {
        "name": "강연·세미나 — 인사이트 정리",
        "meetingType": "seminar",
        "outputFormats": json.dumps(["summary", "slides"]),
        "promptTemplate": (
            "이 강연/세미나 녹취록을 바탕으로 내용을 요약하세요.\n\n"
            "핵심 메시지를 3개 이내로 먼저 작성하고, "
            "연사 소개, 주요 인사이트(상세 설명과 근거), "
            "언급된 사례와 데이터, 실무 적용 시사점, "
            "Q&A 하이라이트를 포함하세요.\n\n"
            "실무에 바로 적용 가능한 인사이트를 도출하세요."
        ),
        "reportTemplate": "briefing_doc",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 9. 브레인스토밍 ==========
    {
        "name": "브레인스토밍 — 아이디어 정리",
        "meetingType": "brainstorming",
        "outputFormats": json.dumps(["summary"]),
        "promptTemplate": (
            "이 브레인스토밍 회의 녹취록을 바탕으로 내용을 요약하세요.\n\n"
            "브레인스토밍 주제를 먼저 작성하고, "
            "아이디어를 카테고리별로 분류한 뒤, "
            "핵심 아이디어 Top 5(아이디어명, 설명, 기대 효과)를 선정하고, "
            "실현 가능성 평가(임팩트, 난이도, 우선순위)와 "
            "다음 스텝(추가 검증 사항, 담당자, 일정)을 포함하세요.\n\n"
            "발산된 아이디어를 체계적으로 분류하고 우선순위를 매기세요."
        ),
        "reportTemplate": "briefing_doc",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 10. 프로젝트 관리 ==========
    {
        "name": "프로젝트 — 진행 상황 점검",
        "meetingType": "project",
        "outputFormats": json.dumps(["summary", "slides"]),
        "promptTemplate": (
            "이 프로젝트 관리 회의 녹취록을 바탕으로 내용을 요약하세요.\n\n"
            "프로젝트 상태 요약(진행률, 일정, 예산)을 먼저 작성하고, "
            "주요 진전 사항, 이슈 및 리스크(심각도, 담당, 대응 방안), "
            "마일스톤 현황, 의사결정 요청 사항, "
            "다음 기간 계획을 포함하세요.\n\n"
            "프로젝트 매니저와 이해관계자 모두 이해할 수 있도록 작성하세요."
        ),
        "reportTemplate": "briefing_doc",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 11. 범용 ==========
    {
        "name": "범용 — 회의록 요약",
        "meetingType": "general",
        "outputFormats": json.dumps(["summary"]),
        "promptTemplate": (
            "이 회의 녹취록을 바탕으로 내용을 요약하세요.\n\n"
            "회의 개요(주제, 참석자, 일시)를 먼저 작성하고, "
            "주요 논의 내용을 안건별로 정리한 뒤, "
            "결정 사항과 후속 조치(항목, 담당자, 기한)를 포함하세요.\n\n"
            "간결하고 명확하게, 핵심만 추출하여 작성하세요."
        ),
        "reportTemplate": "briefing_doc",
        "slideFormat": "detailed",
        "isDefault": True,
    },
]


async def seed_default_presets():
    """DB에 기본 프리셋이 없으면 기본 프리셋을 생성."""
    from sqlalchemy import select, func
    from app.db.database import async_session
    from app.db.models import Preset

    async with async_session() as session:
        result = await session.execute(select(func.count()).select_from(Preset))
        count = result.scalar()

        if count > 0:
            return  # 이미 프리셋이 존재하면 건너뜀

        for preset_data in DEFAULT_PRESETS:
            preset = Preset(
                id=str(uuid4()),
                createdAt=datetime.now(timezone.utc),
                updatedAt=datetime.now(timezone.utc),
                **preset_data,
            )
            session.add(preset)

        await session.commit()
        import logging
        logging.getLogger(__name__).info(f"Seeded {len(DEFAULT_PRESETS)} default presets")
