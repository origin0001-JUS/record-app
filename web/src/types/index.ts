export interface Preset {
  id: string;
  name: string;
  meetingType: string;
  outputFormats: string; // JSON array
  promptTemplate: string;
  reportTemplate: string;
  slideFormat: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  userId: string;
  presetId: string;
  status: string;
  statusMessage: string | null;
  originalFileName: string;
  uploadedFilePath: string;
  fileType: string;
  notebookId: string | null;
  sourceId: string | null;
  summaryText: string | null;
  reportPath: string | null;
  slidesPath: string | null;
  templateConfig: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  preset?: Preset;
}

export type MeetingType =
  | "regular"
  | "strategy"
  | "internal_report"
  | "executive_report"
  | "directives"
  | "external"
  | "tech"
  | "seminar"
  | "brainstorming"
  | "project"
  | "general";

export type OutputFormat = "summary" | "report" | "slides";
export type JobStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "generating_summary"
  | "generating_report"
  | "generating_slides"
  | "complete"
  | "error";

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  regular: "정기회의",
  strategy: "전략/의사결정",
  internal_report: "내부 보고",
  executive_report: "임원 보고",
  directives: "지시사항 정리",
  external: "외부/협력",
  tech: "기술/개발",
  seminar: "강연/세미나",
  brainstorming: "브레인스토밍",
  project: "프로젝트 관리",
  general: "기타/범용",
};

export const MEETING_TYPE_DESCRIPTIONS: Record<MeetingType, string> = {
  regular: "주간/월간 정기회의 — 액션아이템 중심 실행 요약",
  strategy: "전략/임원 회의 — 의사결정 과정 문서화 및 실행 계획",
  internal_report: "팀/부서 내부 보고 — 핵심 위주 간결한 보고서",
  executive_report: "경영진 브리핑 — 수치·근거 중심 의사결정 지원",
  directives: "업무 지시/전달사항 — 우선순위별 정리, 담당·기한 명확화",
  external: "고객/파트너 미팅 — 합의사항, 협상 전략, 후속 조치",
  tech: "기술/아키텍처 리뷰 — 기술 결정, 트레이드오프, 구현 계획",
  seminar: "강연/세미나/워크샵 — 인사이트 합성 및 실무 적용",
  brainstorming: "아이디어 발산 — 카테고리별 분류 및 우선순위 평가",
  project: "프로젝트 관리 — 진행 상황, 마일스톤, 리스크 점검",
  general: "범용 회의록 — 핵심 논의사항 및 후속 조치 요약",
};

export const OUTPUT_FORMAT_LABELS: Record<OutputFormat, string> = {
  summary: "요약",
  report: "보고서",
  slides: "슬라이드",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: "대기 중",
  uploading: "업로드 중",
  processing: "처리 중",
  generating_summary: "요약 생성 중",
  generating_report: "보고서 생성 중",
  generating_slides: "슬라이드 생성 중",
  complete: "완료",
  error: "오류",
};
