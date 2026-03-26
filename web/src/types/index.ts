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
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  preset?: Preset;
}

export type MeetingType = "weekly" | "brainstorming" | "client" | "reporting" | "custom";
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
  weekly: "정기회의",
  brainstorming: "브레인스토밍",
  client: "외부/협력회의",
  reporting: "의사결정회의",
  custom: "강연/세미나",
};

export const MEETING_TYPE_DESCRIPTIONS: Record<MeetingType, string> = {
  weekly: "주간/월간 정기회의 — 액션아이템 중심 실행 요약",
  brainstorming: "아이디어 발산 회의 — 카테고리별 아이디어 분류",
  client: "외부 협력/고객 미팅 — 협상 전략 및 합의사항 분석",
  reporting: "전략/임원 회의 — 의사결정 프로세스 및 KPI 도출",
  custom: "외부 강연/세미나 — 심층 지식 합성 및 인사이트 도출",
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
