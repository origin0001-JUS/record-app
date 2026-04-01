"use client";

import React, { useState, useMemo } from "react";
import { Check, Copy, Search, FileText, Presentation, BookOpen, Sparkles } from "lucide-react";

// ===== 보고서/슬라이드 전용 디자인 템플릿 =====
export interface ReportTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  style: {
    bg: string;
    text: string;
    accent: string;
    heading: string;
    font: string;
  };
  outputType: ("summary" | "report" | "slides")[];
  promptHint: string;
  layoutGuide: string;
}

const TEMPLATES: ReportTemplate[] = [
  // ========== 정기회의 (6) ==========
  {
    id: "weekly_standard",
    name: "주간회의 표준",
    category: "정기회의",
    description: "액션아이템 중심 실행 요약, 진행률 대시보드",
    style: { bg: "#FFFFFF", text: "#1F2937", accent: "#2563EB", heading: "#111827", font: "Pretendard" },
    outputType: ["summary", "report"],
    promptHint: "액션아이템, 담당자, 기한을 표 형태로 정리",
    layoutGuide: "상단 요약 → 안건별 결정사항 → 액션아이템 테이블 → 다음 회의 예고",
  },
  {
    id: "weekly_dashboard",
    name: "주간 대시보드",
    category: "정기회의",
    description: "KPI + 진행률 차트 중심 보고서",
    style: { bg: "#F8FAFC", text: "#334155", accent: "#0EA5E9", heading: "#0F172A", font: "Inter" },
    outputType: ["summary", "report", "slides"],
    promptHint: "핵심 지표를 수치와 전주 대비 변화로 정리",
    layoutGuide: "KPI 카드 → 주요 성과 → 이슈/블로커 → 다음 주 목표",
  },
  {
    id: "monthly_review",
    name: "월간 리뷰",
    category: "정기회의",
    description: "월간 성과 분석 및 트렌드 요약",
    style: { bg: "#FFFFFF", text: "#1E293B", accent: "#6366F1", heading: "#0F172A", font: "Noto Sans KR" },
    outputType: ["summary", "report", "slides"],
    promptHint: "월간 성과를 부서별로 정리하고 전월 대비 분석",
    layoutGuide: "월간 요약 → 부서별 성과 → 트렌드 분석 → 다음 달 계획",
  },
  {
    id: "standup",
    name: "데일리 스탠드업",
    category: "정기회의",
    description: "어제/오늘/블로커 3줄 요약",
    style: { bg: "#18181B", text: "#E4E4E7", accent: "#22C55E", heading: "#FAFAFA", font: "JetBrains Mono" },
    outputType: ["summary"],
    promptHint: "팀원별 어제 한 일 / 오늘 할 일 / 블로커를 간결하게",
    layoutGuide: "팀원별 3줄 요약 → 공통 블로커 → 오늘 우선순위",
  },
  {
    id: "quarterly_okr",
    name: "분기 OKR 리뷰",
    category: "정기회의",
    description: "OKR 달성률 분석 및 다음 분기 목표",
    style: { bg: "#FFFBEB", text: "#78350F", accent: "#F59E0B", heading: "#451A03", font: "Pretendard" },
    outputType: ["summary", "report", "slides"],
    promptHint: "Objective별 Key Result 달성률을 점수화하고 회고",
    layoutGuide: "OKR 스코어카드 → 달성/미달성 분석 → 학습 사항 → 다음 분기 OKR 초안",
  },
  {
    id: "all_hands",
    name: "전사 미팅",
    category: "정기회의",
    description: "CEO 발표, 부서 업데이트 종합 요약",
    style: { bg: "#0F172A", text: "#CBD5E1", accent: "#818CF8", heading: "#F1F5F9", font: "Inter" },
    outputType: ["summary", "report", "slides"],
    promptHint: "경영진 메시지, 부서별 하이라이트, Q&A 핵심을 정리",
    layoutGuide: "CEO 메시지 → 부서별 하이라이트 → 공지사항 → Q&A 요약",
  },

  // ========== 전략/의사결정 (6) ==========
  {
    id: "executive_briefing",
    name: "임원 브리핑",
    category: "전략/의사결정",
    description: "1페이지 핵심 요약, C-레벨 보고용",
    style: { bg: "#FFFFFF", text: "#1F2937", accent: "#1E40AF", heading: "#111827", font: "Noto Sans KR" },
    outputType: ["summary", "report"],
    promptHint: "핵심 결론을 먼저, 근거는 요약하여 1페이지 내",
    layoutGuide: "결론 → 핵심 근거 3개 → 리스크 → 요청 사항",
  },
  {
    id: "strategy_review",
    name: "전략 리뷰",
    category: "전략/의사결정",
    description: "전략적 의사결정 과정 문서화",
    style: { bg: "#F8FAFC", text: "#0F172A", accent: "#7C3AED", heading: "#1E1B4B", font: "Pretendard" },
    outputType: ["summary", "report", "slides"],
    promptHint: "논의된 옵션들, 각 옵션의 장단점, 최종 결정과 근거",
    layoutGuide: "배경 → 옵션 비교 → 결정 사항 → 실행 계획 → 리스크 완화",
  },
  {
    id: "board_meeting",
    name: "이사회 회의록",
    category: "전략/의사결정",
    description: "공식 의결 사항 및 경영 보고 기록",
    style: { bg: "#FFFFFF", text: "#1C1917", accent: "#B91C1C", heading: "#0C0A09", font: "Noto Serif KR" },
    outputType: ["summary", "report"],
    promptHint: "안건별 보고 내용, 질의응답, 의결 결과를 공식 형식으로",
    layoutGuide: "출석 → 전회 의사록 확인 → 안건별(보고/질의/의결) → 기타 → 폐회",
  },
  {
    id: "risk_assessment",
    name: "리스크 평가",
    category: "전략/의사결정",
    description: "리스크 식별, 영향도, 대응 전략 정리",
    style: { bg: "#FEF2F2", text: "#991B1B", accent: "#DC2626", heading: "#450A0A", font: "Inter" },
    outputType: ["summary", "report"],
    promptHint: "리스크를 심각도/발생확률로 분류하고 대응 방안 포함",
    layoutGuide: "리스크 매트릭스 → 상위 5개 리스크 상세 → 대응 전략 → 모니터링 계획",
  },
  {
    id: "budget_review",
    name: "예산 심의",
    category: "전략/의사결정",
    description: "예산 배분 논의 및 승인 사항",
    style: { bg: "#F0FDF4", text: "#14532D", accent: "#16A34A", heading: "#052E16", font: "Roboto" },
    outputType: ["summary", "report"],
    promptHint: "항목별 예산 요청, 조정 내역, 최종 승인 금액 정리",
    layoutGuide: "총 예산 개요 → 부서별 요청 vs 조정 → 의결 사항 → 집행 일정",
  },
  {
    id: "investment_review",
    name: "투자 심의",
    category: "전략/의사결정",
    description: "투자 검토 보고서, IR 미팅 정리",
    style: { bg: "#0D1B2A", text: "#E0E1DD", accent: "#00B4D8", heading: "#FFFFFF", font: "Montserrat" },
    outputType: ["summary", "report", "slides"],
    promptHint: "투자 대상 개요, 시장 분석, 리턴 전망, 리스크를 구조화",
    layoutGuide: "딜 개요 → 시장/경쟁 → 재무 전망 → 리스크 → 투자 조건 → 결론",
  },

  // ========== 외부/협력 (6) ==========
  {
    id: "client_meeting",
    name: "고객 미팅",
    category: "외부/협력",
    description: "고객 요구사항, 합의사항, 후속 조치",
    style: { bg: "#FFFFFF", text: "#1F2937", accent: "#0EA5E9", heading: "#0C4A6E", font: "Pretendard" },
    outputType: ["summary", "report"],
    promptHint: "고객 요구, 합의사항, 미해결 이슈, 후속 조치를 명확히",
    layoutGuide: "미팅 개요 → 고객 요구사항 → 합의 내용 → 미해결 이슈 → 다음 스텝",
  },
  {
    id: "partnership",
    name: "파트너십 협의",
    category: "외부/협력",
    description: "파트너 협력 조건 및 MOU 내용 정리",
    style: { bg: "#F5F3FF", text: "#4C1D95", accent: "#7C3AED", heading: "#2E1065", font: "Noto Sans KR" },
    outputType: ["summary", "report"],
    promptHint: "협력 범위, 역할 분담, 일정, 조건을 계약서 스타일로",
    layoutGuide: "협력 배경 → 범위/역할 → 주요 조건 → 일정 → 후속 조치",
  },
  {
    id: "vendor_review",
    name: "벤더 리뷰",
    category: "외부/협력",
    description: "외주/벤더 평가 및 개선 사항",
    style: { bg: "#FFF7ED", text: "#7C2D12", accent: "#EA580C", heading: "#431407", font: "Inter" },
    outputType: ["summary", "report"],
    promptHint: "벤더 성과 평가, 이슈, 개선 요청사항을 체계적으로",
    layoutGuide: "벤더 개요 → 성과 지표 → 이슈 사항 → 개선 요청 → SLA 확인",
  },
  {
    id: "negotiation",
    name: "협상 기록",
    category: "외부/협력",
    description: "협상 과정, 양보 사항, 잠정 합의 기록",
    style: { bg: "#1E293B", text: "#E2E8F0", accent: "#FBBF24", heading: "#F8FAFC", font: "Noto Sans KR" },
    outputType: ["summary", "report"],
    promptHint: "양측 입장, 논쟁점, 양보/합의 사항, 남은 쟁점 정리",
    layoutGuide: "참석자 → 핵심 쟁점 → 양측 입장 → 합의 내용 → 미해결 → 다음 라운드",
  },
  {
    id: "sales_meeting",
    name: "영업 미팅",
    category: "외부/협력",
    description: "영업 기회, 고객 반응, 파이프라인 관리",
    style: { bg: "#FFFFFF", text: "#1F2937", accent: "#10B981", heading: "#064E3B", font: "Pretendard" },
    outputType: ["summary", "report"],
    promptHint: "고객 니즈, 제안 내용, 반응, 성사 확률, 후속 액션",
    layoutGuide: "고객 정보 → 니즈 파악 → 제안/데모 → 고객 반응 → 후속 → 딜 스테이지",
  },
  {
    id: "government_report",
    name: "관공서 보고",
    category: "외부/협력",
    description: "공식 보고서, 정부 기관 미팅 기록",
    style: { bg: "#FFFFFF", text: "#1F2937", accent: "#4338CA", heading: "#000000", font: "Noto Serif KR" },
    outputType: ["summary", "report"],
    promptHint: "공식 형식: 보고일, 참석자, 안건, 주요 내용, 조치 사항",
    layoutGuide: "보고 개요 → 안건별 논의 → 지시/조치사항 → 향후 일정",
  },

  // ========== 기술/개발 (6) ==========
  {
    id: "sprint_retro",
    name: "스프린트 회고",
    category: "기술/개발",
    description: "Good/Bad/Try 구조 회고록",
    style: { bg: "#18181B", text: "#D4D4D8", accent: "#A855F7", heading: "#FAFAFA", font: "JetBrains Mono" },
    outputType: ["summary", "report"],
    promptHint: "Good (유지), Bad (개선), Try (시도) 분류로 정리",
    layoutGuide: "스프린트 목표 달성률 → Good → Bad → Try → 다음 스프린트 개선 계획",
  },
  {
    id: "tech_review",
    name: "기술 리뷰",
    category: "기술/개발",
    description: "아키텍처, 기술 선택, 코드 리뷰 논의",
    style: { bg: "#0F172A", text: "#E2E8F0", accent: "#38BDF8", heading: "#F0F9FF", font: "Fira Code" },
    outputType: ["summary", "report", "slides"],
    promptHint: "기술 논의 사항, 결정, 근거, 트레이드오프를 명확히",
    layoutGuide: "문제 정의 → 옵션 비교 → 기술 결정 → 트레이드오프 → 구현 계획",
  },
  {
    id: "incident_postmortem",
    name: "장애 포스트모템",
    category: "기술/개발",
    description: "장애 원인 분석, 타임라인, 재발 방지",
    style: { bg: "#FEF2F2", text: "#7F1D1D", accent: "#EF4444", heading: "#450A0A", font: "Inter" },
    outputType: ["summary", "report"],
    promptHint: "타임라인, 근본 원인, 영향 범위, 조치 사항, 재발 방지책",
    layoutGuide: "요약 → 타임라인 → 근본 원인 → 영향 범위 → 조치 → 재발 방지 → 후속 액션",
  },
  {
    id: "product_planning",
    name: "제품 기획",
    category: "기술/개발",
    description: "기능 기획, PRD, 로드맵 논의 정리",
    style: { bg: "#FFFFFF", text: "#1E293B", accent: "#6366F1", heading: "#312E81", font: "Pretendard" },
    outputType: ["summary", "report", "slides"],
    promptHint: "기능 요구사항, 우선순위, 일정, 리소스를 PRD 형식으로",
    layoutGuide: "배경 → 사용자 스토리 → 기능 명세 → 우선순위 → 일정 → 성공 지표",
  },
  {
    id: "design_review",
    name: "디자인 리뷰",
    category: "기술/개발",
    description: "UI/UX 피드백, 디자인 의사결정 기록",
    style: { bg: "#FAF5FF", text: "#581C87", accent: "#A855F7", heading: "#3B0764", font: "Inter" },
    outputType: ["summary", "report"],
    promptHint: "디자인 안건별 피드백, 수정 방향, 최종 결정 정리",
    layoutGuide: "디자인 컨셉 → 화면별 피드백 → 수정 사항 → 결정 → 다음 이터레이션",
  },
  {
    id: "security_review",
    name: "보안 리뷰",
    category: "기술/개발",
    description: "보안 취약점 논의, 점검 결과 보고",
    style: { bg: "#0C0A09", text: "#D6D3D1", accent: "#F97316", heading: "#FAFAF9", font: "Roboto Mono" },
    outputType: ["summary", "report"],
    promptHint: "취약점, 심각도, 조치 현황, 잔여 리스크를 매트릭스로",
    layoutGuide: "점검 개요 → 발견 취약점 목록 → 심각도별 분류 → 조치 계획 → 일정",
  },

  // ========== 강연/세미나 (5) ==========
  {
    id: "keynote_summary",
    name: "키노트 요약",
    category: "강연/세미나",
    description: "강연 핵심 인사이트, 슬라이드 형태 정리",
    style: { bg: "#111827", text: "#F3F4F6", accent: "#6366F1", heading: "#FFFFFF", font: "Inter" },
    outputType: ["summary", "slides"],
    promptHint: "핵심 메시지, 주요 인사이트, 인용구를 슬라이드용으로",
    layoutGuide: "연사 소개 → 핵심 메시지 3개 → 인사이트별 상세 → 핵심 인용 → 시사점",
  },
  {
    id: "workshop",
    name: "워크샵 기록",
    category: "강연/세미나",
    description: "실습 내용, 그룹 활동, 학습 결과 정리",
    style: { bg: "#ECFDF5", text: "#064E3B", accent: "#10B981", heading: "#022C22", font: "Noto Sans KR" },
    outputType: ["summary", "report"],
    promptHint: "세션별 활동 내용, 그룹별 산출물, 학습 포인트 정리",
    layoutGuide: "워크샵 개요 → 세션별 기록 → 그룹 산출물 → 학습 결과 → 적용 계획",
  },
  {
    id: "conference_notes",
    name: "컨퍼런스 노트",
    category: "강연/세미나",
    description: "다수 세션 핵심 정리, 트렌드 분석",
    style: { bg: "#F8FAFC", text: "#0F172A", accent: "#0EA5E9", heading: "#082F49", font: "Pretendard" },
    outputType: ["summary", "report", "slides"],
    promptHint: "세션별 핵심 3줄 요약, 전체 트렌드, 우리에게 시사점",
    layoutGuide: "컨퍼런스 개요 → 세션별 요약 → 트렌드 키워드 → 시사점 → 적용 방안",
  },
  {
    id: "training_record",
    name: "교육/연수",
    category: "강연/세미나",
    description: "교육 내용 정리, 학습 포인트, 평가",
    style: { bg: "#FEF3C7", text: "#78350F", accent: "#D97706", heading: "#451A03", font: "Noto Sans KR" },
    outputType: ["summary", "report"],
    promptHint: "교육 목표, 주요 내용, 핵심 학습, 실무 적용 방안",
    layoutGuide: "교육 개요 → 커리큘럼 → 핵심 내용 → 학습 포인트 → 실무 적용 계획",
  },
  {
    id: "panel_discussion",
    name: "패널 토론",
    category: "강연/세미나",
    description: "패널별 의견, 쟁점, 결론 정리",
    style: { bg: "#1E1B4B", text: "#E0E7FF", accent: "#A5B4FC", heading: "#FFFFFF", font: "Playfair Display" },
    outputType: ["summary", "report"],
    promptHint: "패널별 주요 주장, 쟁점별 의견 대비, 공통 결론",
    layoutGuide: "주제 → 패널 소개 → 쟁점별 의견 비교 → 합의/이견 → Q&A → 시사점",
  },

  // ========== 브레인스토밍 (4) ==========
  {
    id: "brainstorm_standard",
    name: "브레인스토밍",
    category: "브레인스토밍",
    description: "아이디어 발산, 카테고리 분류, 투표 결과",
    style: { bg: "#FDF2F8", text: "#831843", accent: "#EC4899", heading: "#500724", font: "Jua" },
    outputType: ["summary", "report"],
    promptHint: "아이디어를 주제별로 분류하고, 핵심 아이디어 Top 5 선정",
    layoutGuide: "주제 → 아이디어 목록 (카테고리별) → Top 5 → 실현 가능성 평가 → 다음 스텝",
  },
  {
    id: "design_thinking",
    name: "디자인 씽킹",
    category: "브레인스토밍",
    description: "공감-정의-발상-프로토타입-테스트 단계별 기록",
    style: { bg: "#FFFFFF", text: "#374151", accent: "#8B5CF6", heading: "#1F2937", font: "Inter" },
    outputType: ["summary", "report", "slides"],
    promptHint: "디자인 씽킹 5단계별 산출물을 구조화하여 정리",
    layoutGuide: "공감 맵 → 문제 정의 → 아이디어 → 프로토타입 계획 → 테스트 계획",
  },
  {
    id: "problem_solving",
    name: "문제 해결 회의",
    category: "브레인스토밍",
    description: "5 Why, 피시본 등 구조화된 문제 분석",
    style: { bg: "#FEF9C3", text: "#713F12", accent: "#CA8A04", heading: "#422006", font: "Noto Sans KR" },
    outputType: ["summary", "report"],
    promptHint: "문제 정의, 근본 원인 분석, 해결 방안, 우선순위",
    layoutGuide: "문제 정의 → 현상 분석 → 근본 원인 → 해결 방안 → 우선순위 → 실행 계획",
  },
  {
    id: "innovation_lab",
    name: "이노베이션 랩",
    category: "브레인스토밍",
    description: "신규 사업/서비스 아이디어 탐색",
    style: { bg: "#0F0F0F", text: "#E5E5E5", accent: "#00FF88", heading: "#FFFFFF", font: "Space Grotesk" },
    outputType: ["summary", "report", "slides"],
    promptHint: "신규 아이디어, 시장 기회, 실현 가능성, MVP 범위 정의",
    layoutGuide: "기회 영역 → 아이디어 목록 → 평가 기준 → Top 3 상세 → MVP 정의 → 타임라인",
  },

  // ========== 프로젝트 관리 (5) ==========
  {
    id: "kickoff",
    name: "프로젝트 킥오프",
    category: "프로젝트 관리",
    description: "프로젝트 시작, 목표/범위/일정 합의",
    style: { bg: "#FFFFFF", text: "#1F2937", accent: "#059669", heading: "#064E3B", font: "Pretendard" },
    outputType: ["summary", "report", "slides"],
    promptHint: "프로젝트 목표, 범위, 마일스톤, 역할, 리스크를 정의",
    layoutGuide: "프로젝트 개요 → 목표/성공 기준 → 범위 → 마일스톤 → 역할 → 리스크 → 커뮤니케이션 계획",
  },
  {
    id: "milestone_review",
    name: "마일스톤 리뷰",
    category: "프로젝트 관리",
    description: "마일스톤 달성 여부, 진행 상황 점검",
    style: { bg: "#F0FDF4", text: "#166534", accent: "#22C55E", heading: "#052E16", font: "Inter" },
    outputType: ["summary", "report"],
    promptHint: "마일스톤별 완료 항목, 지연 항목, 리스크, 일정 조정",
    layoutGuide: "마일스톤 개요 → 완료/진행/지연 → 리스크 → 일정 조정 → 다음 마일스톤",
  },
  {
    id: "stakeholder_update",
    name: "이해관계자 업데이트",
    category: "프로젝트 관리",
    description: "프로젝트 상태 보고, 경영진 대상",
    style: { bg: "#1E293B", text: "#CBD5E1", accent: "#3B82F6", heading: "#F1F5F9", font: "Noto Sans KR" },
    outputType: ["summary", "report", "slides"],
    promptHint: "진행률, 핵심 이슈, 예산 현황, 의사결정 요청 사항",
    layoutGuide: "프로젝트 상태 요약 → 주요 진전 → 이슈/리스크 → 예산 → 의사결정 요청",
  },
  {
    id: "lessons_learned",
    name: "교훈 공유",
    category: "프로젝트 관리",
    description: "프로젝트 완료 후 교훈 및 개선점 정리",
    style: { bg: "#FFFBEB", text: "#92400E", accent: "#F59E0B", heading: "#78350F", font: "Pretendard" },
    outputType: ["summary", "report"],
    promptHint: "잘한 점, 개선점, 다음 프로젝트에 적용할 교훈",
    layoutGuide: "프로젝트 요약 → 성공 요인 → 개선 영역 → 핵심 교훈 → 권장사항",
  },
  {
    id: "change_request",
    name: "변경 요청",
    category: "프로젝트 관리",
    description: "스코프/일정/예산 변경 요청 및 승인 기록",
    style: { bg: "#FFF1F2", text: "#9F1239", accent: "#F43F5E", heading: "#4C0519", font: "Inter" },
    outputType: ["summary", "report"],
    promptHint: "변경 내용, 영향 분석, 비용, 승인/거절 사유",
    layoutGuide: "변경 요청 개요 → 현재 vs 변경 → 영향 분석 → 비용 → 결정 → 실행 계획",
  },
];

const CATEGORIES = ["전체", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];

const OUTPUT_ICONS: Record<string, React.ReactNode> = {
  summary: <FileText size={10} />,
  report: <BookOpen size={10} />,
  slides: <Presentation size={10} />,
};
const OUTPUT_LABELS: Record<string, string> = {
  summary: "요약",
  report: "보고서",
  slides: "슬라이드",
};

function MiniPreview({ template }: { template: ReportTemplate }) {
  const { style } = template;
  return (
    <div className="relative w-full h-full" style={{ backgroundColor: style.bg }}>
      {/* 헤더 바 */}
      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: style.accent }} />
      {/* 제목 */}
      <div
        className="absolute top-4 left-3 right-3 text-[7px] font-bold truncate"
        style={{ color: style.heading }}
      >
        {template.name}
      </div>
      {/* 본문 라인 */}
      <div className="absolute top-8 left-3 right-3 space-y-1">
        {[80, 65, 50].map((w, i) => (
          <div key={i} className="h-[2px] rounded" style={{ width: `${w}%`, backgroundColor: style.text + "20" }} />
        ))}
      </div>
      {/* 액센트 블록 */}
      <div className="absolute bottom-3 left-3 w-6 h-3 rounded-sm" style={{ backgroundColor: style.accent + "30" }} />
      <div className="absolute bottom-3 left-10 w-4 h-3 rounded-sm" style={{ backgroundColor: style.accent + "18" }} />
    </div>
  );
}

function DetailModal({
  template,
  onClose,
  onCopy,
}: {
  template: ReportTemplate;
  onClose: () => void;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 프리뷰 헤더 */}
        <div className="relative h-36 rounded-t-2xl overflow-hidden" style={{ backgroundColor: template.style.bg }}>
          <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: template.style.accent }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <h2 className="text-lg font-bold" style={{ color: template.style.heading }}>
              {template.name}
            </h2>
            <p className="text-[11px] mt-1 text-center" style={{ color: template.style.text }}>
              {template.description}
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* 산출물 타입 */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 mb-1.5">산출물</h3>
            <div className="flex gap-2">
              {template.outputType.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-zinc-100 text-zinc-700"
                >
                  {OUTPUT_ICONS[t]}
                  {OUTPUT_LABELS[t]}
                </span>
              ))}
            </div>
          </div>

          {/* 컬러 팔레트 */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 mb-1.5">컬러 팔레트</h3>
            <div className="flex gap-3">
              {[
                { label: "배경", color: template.style.bg },
                { label: "본문", color: template.style.text },
                { label: "제목", color: template.style.heading },
                { label: "포인트", color: template.style.accent },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded border border-zinc-200" style={{ backgroundColor: color }} />
                  <div>
                    <div className="text-[9px] text-zinc-400">{label}</div>
                    <div className="text-[10px] font-mono text-zinc-500">{color}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 프롬프트 힌트 */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 mb-1">프롬프트 가이드</h3>
            <p className="text-sm text-zinc-600 bg-zinc-50 rounded-lg p-2.5">{template.promptHint}</p>
          </div>

          {/* 레이아웃 가이드 */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 mb-1">보고서 구조</h3>
            <p className="text-sm text-zinc-600">{template.layoutGuide}</p>
          </div>

          {/* 폰트 */}
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="text-xs font-semibold text-zinc-500">폰트:</span>
            <span>{template.style.font}</span>
          </div>

          {/* 복사 버튼 */}
          <button
            onClick={handleCopy}
            className="w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all text-white"
            style={{ backgroundColor: copied ? "#22C55E" : template.style.accent }}
          >
            {copied ? (
              <>
                <Check size={16} /> 복사됨!
              </>
            ) : (
              <>
                <Copy size={16} /> 템플릿 설정 복사
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((t) => {
      const matchCategory = selectedCategory === "전체" || t.category === selectedCategory;
      const matchSearch =
        searchQuery === "" ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.promptHint.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCopyTemplate = (template: ReportTemplate) => {
    const data = {
      id: template.id,
      name: template.name,
      style: template.style,
      outputType: template.outputType,
      promptHint: template.promptHint,
      layoutGuide: template.layoutGuide,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const handleQuickCopy = (e: React.MouseEvent, template: ReportTemplate) => {
    e.stopPropagation();
    handleCopyTemplate(template);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={20} className="text-indigo-500" />
          <h1 className="text-2xl font-bold">보고서 템플릿</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {TEMPLATES.length}개의 회의 보고서 디자인 중 선택하세요
        </p>
      </div>

      {/* 검색 */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="템플릿 검색 (이름, 설명, 키워드...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                selectedCategory === cat
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 카운트 */}
      <p className="text-sm text-zinc-500">{filteredTemplates.length}개 템플릿</p>

      {/* 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            className="group cursor-pointer rounded-xl border border-zinc-200 overflow-hidden hover:shadow-lg hover:border-zinc-300 transition-all hover:-translate-y-0.5"
          >
            {/* 프리뷰 */}
            <div className="relative h-20 overflow-hidden">
              <MiniPreview template={template} />
              <button
                onClick={(e) => handleQuickCopy(e, template)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40"
              >
                {copiedId === template.id ? <Check size={10} /> : <Copy size={10} />}
              </button>
            </div>
            {/* 정보 */}
            <div className="p-2.5">
              <div className="text-xs font-medium text-zinc-800 truncate">{template.name}</div>
              <div className="text-[10px] text-zinc-400 truncate mt-0.5">{template.description}</div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[9px] text-zinc-400">{template.category}</span>
                <span className="text-zinc-300">·</span>
                <div className="flex gap-0.5">
                  {template.outputType.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center px-1 py-0.5 text-[8px] rounded bg-zinc-100 text-zinc-500"
                    >
                      {OUTPUT_LABELS[t]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-zinc-400">
          <Search size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">검색 결과가 없습니다</p>
        </div>
      )}

      {/* 상세 모달 */}
      {selectedTemplate && (
        <DetailModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onCopy={() => handleCopyTemplate(selectedTemplate)}
        />
      )}
    </div>
  );
}
