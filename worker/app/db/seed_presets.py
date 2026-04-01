"""8개 카테고리 기본 프리셋 시드 데이터.

Worker 시작 시 DB에 기본 프리셋이 없으면 자동 생성.
"""

import json
from uuid import uuid4
from datetime import datetime, timezone

DEFAULT_PRESETS = [
    # ========== 1. 정기회의 ==========
    {
        "name": "정기회의 — 주간 보고",
        "meetingType": "regular",
        "outputFormats": json.dumps(["summary", "report"]),
        "promptTemplate": (
            "이 정기회의 내용을 다음 구조로 정리하세요:\n\n"
            "## 핵심 요약 (3줄 이내)\n"
            "## 안건별 결정사항\n"
            "  - 안건명, 논의 내용, 결정 사항, 담당자\n"
            "## 액션아이템 테이블\n"
            "  | 항목 | 담당자 | 기한 | 상태 |\n"
            "## 다음 회의 예고\n\n"
            "모든 내용은 간결하게, 실행 가능한 형태로 작성하세요."
        ),
        "reportTemplate": "briefing",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 2. 전략/의사결정 ==========
    {
        "name": "전략회의 — 의사결정 기록",
        "meetingType": "strategy",
        "outputFormats": json.dumps(["summary", "report", "slides"]),
        "promptTemplate": (
            "이 전략/의사결정 회의 내용을 다음 구조로 정리하세요:\n\n"
            "## 핵심 결론 (1~2문장)\n"
            "## 배경 및 맥락\n"
            "## 논의된 옵션\n"
            "  - 각 옵션의 장점, 단점, 리스크\n"
            "## 최종 결정 및 근거\n"
            "## 실행 계획\n"
            "  - 담당자, 일정, 마일스톤\n"
            "## 리스크 및 완화 방안\n\n"
            "C-레벨 보고에 적합한 간결하고 명확한 톤으로 작성하세요."
        ),
        "reportTemplate": "briefing",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 3. 외부/협력 ==========
    {
        "name": "외부미팅 — 고객·파트너 협의",
        "meetingType": "external",
        "outputFormats": json.dumps(["summary", "report"]),
        "promptTemplate": (
            "이 외부 미팅(고객/파트너) 내용을 다음 구조로 정리하세요:\n\n"
            "## 미팅 개요\n"
            "  - 참석자 (우리 측 / 상대 측)\n"
            "  - 미팅 목적\n"
            "## 상대방 요구사항 및 관심사\n"
            "## 합의 내용\n"
            "  - 구체적 합의사항, 조건, 수치\n"
            "## 미해결 이슈\n"
            "## 후속 조치 (Follow-up)\n"
            "  | 항목 | 담당 | 기한 |\n\n"
            "협상 전략 관점에서 상대방의 입장과 우리의 대응을 분석하세요."
        ),
        "reportTemplate": "briefing",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 4. 기술/개발 ==========
    {
        "name": "기술회의 — 개발·아키텍처 리뷰",
        "meetingType": "tech",
        "outputFormats": json.dumps(["summary", "report"]),
        "promptTemplate": (
            "이 기술/개발 회의 내용을 다음 구조로 정리하세요:\n\n"
            "## 기술 결정 요약\n"
            "## 문제 정의\n"
            "  - 현재 상황, 문제점, 제약 조건\n"
            "## 논의된 기술 옵션\n"
            "  - 각 옵션: 접근 방식, 장단점, 트레이드오프\n"
            "## 최종 기술 결정\n"
            "  - 선택한 방안, 근거, 예상 영향\n"
            "## 구현 계획\n"
            "  - 단계별 작업, 담당자, 일정\n"
            "## 기술 부채 및 후속 과제\n\n"
            "개발자가 바로 실행할 수 있는 수준으로 구체적으로 작성하세요."
        ),
        "reportTemplate": "briefing",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 5. 강연/세미나 ==========
    {
        "name": "강연·세미나 — 인사이트 정리",
        "meetingType": "seminar",
        "outputFormats": json.dumps(["summary", "report", "slides"]),
        "promptTemplate": (
            "이 강연/세미나 내용을 다음 구조로 정리하세요:\n\n"
            "## 핵심 메시지 (3개 이내)\n"
            "## 연사 소개 및 배경\n"
            "## 주요 인사이트\n"
            "  - 인사이트별 상세 설명과 근거\n"
            "  - 핵심 인용구 (있을 경우)\n"
            "## 사례 및 데이터\n"
            "  - 언급된 사례, 통계, 연구 결과\n"
            "## 우리에게 시사점\n"
            "  - 실무에 적용할 수 있는 포인트\n"
            "## Q&A 하이라이트\n\n"
            "심층적인 지식 합성을 통해 실무에 바로 적용 가능한 인사이트를 도출하세요."
        ),
        "reportTemplate": "briefing",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 6. 브레인스토밍 ==========
    {
        "name": "브레인스토밍 — 아이디어 정리",
        "meetingType": "brainstorming",
        "outputFormats": json.dumps(["summary", "report"]),
        "promptTemplate": (
            "이 브레인스토밍 회의 내용을 다음 구조로 정리하세요:\n\n"
            "## 브레인스토밍 주제\n"
            "## 아이디어 목록 (카테고리별 분류)\n"
            "  - 카테고리 1: 아이디어 목록\n"
            "  - 카테고리 2: 아이디어 목록\n"
            "  - ...\n"
            "## Top 5 핵심 아이디어\n"
            "  - 아이디어명, 설명, 기대 효과\n"
            "## 실현 가능성 평가\n"
            "  | 아이디어 | 임팩트 | 난이도 | 우선순위 |\n"
            "## 다음 스텝\n"
            "  - 추가 검증 필요 사항, 담당자, 일정\n\n"
            "발산된 아이디어를 체계적으로 분류하고 실행 가능성 기준으로 우선순위를 매기세요."
        ),
        "reportTemplate": "briefing",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 7. 프로젝트 관리 ==========
    {
        "name": "프로젝트 — 진행 상황 점검",
        "meetingType": "project",
        "outputFormats": json.dumps(["summary", "report", "slides"]),
        "promptTemplate": (
            "이 프로젝트 관리 회의 내용을 다음 구조로 정리하세요:\n\n"
            "## 프로젝트 상태 요약\n"
            "  - 전체 진행률, 일정 준수 여부, 예산 현황\n"
            "## 주요 진전 사항\n"
            "  - 이번 기간 완료된 작업\n"
            "## 이슈 및 리스크\n"
            "  | 이슈 | 심각도 | 담당 | 대응 방안 |\n"
            "## 마일스톤 현황\n"
            "  | 마일스톤 | 계획일 | 예상일 | 상태 |\n"
            "## 의사결정 요청 사항\n"
            "## 다음 기간 계획\n\n"
            "프로젝트 매니저와 이해관계자 모두 이해할 수 있는 명확한 형식으로 작성하세요."
        ),
        "reportTemplate": "briefing",
        "slideFormat": "detailed",
        "isDefault": True,
    },
    # ========== 8. 기타/범용 ==========
    {
        "name": "범용 — 회의록 요약",
        "meetingType": "general",
        "outputFormats": json.dumps(["summary"]),
        "promptTemplate": (
            "이 회의 내용을 다음 구조로 요약하세요:\n\n"
            "## 회의 개요\n"
            "  - 주제, 참석자, 일시\n"
            "## 주요 논의 내용\n"
            "  - 안건별 핵심 내용 (번호 매기기)\n"
            "## 결정 사항\n"
            "## 후속 조치\n"
            "  | 항목 | 담당자 | 기한 |\n\n"
            "간결하고 명확하게, 핵심만 추출하여 작성하세요."
        ),
        "reportTemplate": "briefing",
        "slideFormat": "detailed",
        "isDefault": True,
    },
]


async def seed_default_presets():
    """DB에 기본 프리셋이 없으면 8개 카테고리 기본 프리셋을 생성."""
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
