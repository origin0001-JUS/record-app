# 회의록 자동화 웹앱 - 인수인계 문서

> 작성일: 2026-03-25 (최종 업데이트)
> 프로젝트: record-app (회의 녹음/STT → NotebookLM → 요약/보고서/슬라이드)
> GitHub: https://github.com/origin0001-JUS/record-app

---

## 1. 프로젝트 개요

### 목적
회의 녹음 파일 또는 STT(음성→텍스트) 파일을 업로드하면, 프리셋에 따라 NotebookLM을 통해 **회의록 요약**, **보고서**, **발표 슬라이드**를 자동 생성하는 웹앱.

### 사용자
안티그래비티 팀 내부 (2~10명)

### 핵심 플로우
```
[사용자] 파일 업로드 + 프리셋 선택
    ↓
[Next.js] 파일 저장 + Job 생성 + Worker 호출
    ↓
[Python Worker] NotebookLM 노트북 생성 → 소스 추가 → 요약/보고서/슬라이드 생성
    ↓
[사용자] 실시간 진행 상태 확인 → 결과 다운로드
```

---

## 2. 아키텍처

```
record-app/
├── web/                  Next.js 16 (App Router) — 프론트엔드 + API
├── worker/               Python FastAPI — NotebookLM 연동 + Job 처리
├── data/app.db           SQLite 데이터베이스 (공유)
└── storage/              파일 저장소 (uploads/, outputs/)
```

### 기술 스택
| 영역 | 기술 | 비고 |
|------|------|------|
| 프론트엔드 | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui v4 | App Router |
| BFF API | Next.js API Routes | 파일 업로드, CRUD, Worker 프록시 |
| Worker | Python FastAPI, notebooklm-py | 비동기 Job 큐 (asyncio) |
| DB | SQLite + Prisma 7 (web) / SQLAlchemy (worker) | WAL 모드 |
| ORM 어댑터 | @prisma/adapter-better-sqlite3 | Prisma 7 필수 |
| NotebookLM | notebooklm-py (비공식) | 브라우저 쿠키 인증 |

### 통신 구조
- **브라우저 ↔ Next.js**: HTTP (fetch)
- **Next.js ↔ Worker**: REST API (http://localhost:8000)
- **Worker → NotebookLM**: notebooklm-py (비공식 API)
- **공유 DB**: 양쪽 모두 `data/app.db` 읽기/쓰기

---

## 3. 프로젝트 구조 (상세)

### web/ (Next.js)
```
web/src/
├── app/
│   ├── page.tsx                          # 대시보드 (서버 컴포넌트)
│   ├── upload/page.tsx                   # 파일 업로드 + 프리셋 선택 (클라이언트)
│   ├── jobs/
│   │   ├── page.tsx                      # Job 목록 (서버 컴포넌트)
│   │   └── [id]/page.tsx                 # Job 상세 - 진행률/결과 (클라이언트, 3초 폴링)
│   ├── presets/page.tsx                  # 프리셋 CRUD 관리 (클라이언트)
│   └── api/
│       ├── upload/route.ts               # POST: 파일 업로드 → storage/uploads/{jobId}/
│       ├── jobs/route.ts                 # GET: 목록, POST: Job 생성 + Worker 호출
│       ├── jobs/[id]/route.ts            # GET: Job 상세
│       ├── jobs/[id]/download/[type]/route.ts  # GET: 파일 다운로드 (summary/report/slides)
│       ├── presets/route.ts              # GET/POST: 프리셋 목록/생성
│       └── presets/[id]/route.ts         # GET/PUT/DELETE: 프리셋 단건
├── components/
│   ├── Nav.tsx                           # 네비게이션 바
│   └── ui/                               # shadcn/ui 컴포넌트
├── lib/
│   ├── db.ts                             # Prisma 클라이언트 싱글톤
│   ├── constants.ts                      # WORKER_URL, 파일 크기 제한 등
│   └── utils.ts                          # cn() 유틸리티
└── types/index.ts                        # 공유 타입 + 한국어 레이블
```

### worker/ (Python)
```
worker/app/
├── main.py                      # FastAPI 앱, CORS, lifespan
├── config.py                    # 경로, DB URL, 환경 변수
├── api/
│   ├── router.py                # 라우터 통합
│   ├── jobs.py                  # POST /process, GET /status/{job_id}
│   ├── health.py                # GET /health (인증 상태 확인)
│   └── schemas.py               # Pydantic 모델
├── services/
│   ├── notebooklm_service.py    # NotebookLM 클라이언트 래퍼 (핵심)
│   └── job_processor.py         # 비동기 Job 큐 + 파이프라인
└── db/
    ├── database.py              # SQLAlchemy async 세션
    └── models.py                # ORM 모델 (Prisma 스키마 미러)
```

---

## 4. 데이터 모델

### User
| 필드 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | cuid |
| email | TEXT UNIQUE | 이메일 |
| name | TEXT | 이름 |
| createdAt | DATETIME | 생성일 |

### Preset (프리셋)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | cuid |
| name | TEXT | "주간회의 - 요약+보고서" |
| meetingType | TEXT | weekly / brainstorming / client / reporting / custom |
| outputFormats | TEXT | JSON 배열: `["summary","report","slides"]` |
| promptTemplate | TEXT | NotebookLM에 전달할 프롬프트 |
| reportTemplate | TEXT | briefing (기본값) |
| slideFormat | TEXT | detailed (기본값) |
| isDefault | BOOLEAN | 기본 프리셋 여부 |

### Job (작업)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | cuid |
| userId | TEXT FK | 사용자 |
| presetId | TEXT FK | 프리셋 |
| status | TEXT | pending → uploading → processing → generating_summary → generating_report → generating_slides → complete / error |
| statusMessage | TEXT? | 현재 단계 한국어 메시지 |
| originalFileName | TEXT | 원본 파일명 |
| uploadedFilePath | TEXT | 업로드 경로 |
| fileType | TEXT | audio / video / text / stt_text |
| notebookId | TEXT? | NotebookLM 노트북 ID |
| summaryText | TEXT? | 생성된 요약 본문 |
| reportPath | TEXT? | 보고서 파일 경로 |
| slidesPath | TEXT? | 슬라이드 파일 경로 |
| errorMessage | TEXT? | 에러 내용 |

### 기본 프리셋 (시드 데이터, 5개)
1. **주간회의 - 요약만**: summary만 생성
2. **주간회의 - 요약+보고서**: summary + report
3. **브레인스토밍 - 전체**: summary + report + slides
4. **고객미팅 - 요약+보고서**: summary + report
5. **보고회의 - 전체**: summary + report + slides

---

## 5. API 명세

### Next.js API (포트 3000)

| Method | 경로 | 설명 | 요청 | 응답 |
|--------|------|------|------|------|
| POST | `/api/upload` | 파일 업로드 | multipart (file, jobId) | `{filePath, fileName, size}` |
| GET | `/api/presets` | 프리셋 목록 | - | `Preset[]` |
| POST | `/api/presets` | 프리셋 생성 | JSON body | `Preset` |
| GET | `/api/presets/:id` | 프리셋 상세 | - | `Preset` |
| PUT | `/api/presets/:id` | 프리셋 수정 | JSON body | `Preset` |
| DELETE | `/api/presets/:id` | 프리셋 삭제 | - | `{success}` |
| GET | `/api/jobs?page=1&limit=20` | Job 목록 | query params | `{jobs, total, page, limit}` |
| POST | `/api/jobs` | Job 생성 + Worker 호출 | `{presetId, filePath, fileName, fileType}` | `Job` |
| GET | `/api/jobs/:id` | Job 상세 (프리셋 포함) | - | `Job` |
| GET | `/api/jobs/:id/download/:type` | 결과 다운로드 | type: summary/report/slides | binary |

### Python Worker API (포트 8000)

| Method | 경로 | 설명 |
|--------|------|------|
| POST | `/process` | Job 처리 시작 (비동기) |
| GET | `/status/{job_id}` | Job 상태 조회 |
| GET | `/health` | 헬스 체크 + NotebookLM 인증 상태 |

---

## 6. 환경 설정

### web/.env
```env
DATABASE_URL="file:../../data/app.db"
WORKER_URL="http://localhost:8000"
```

### worker/.env (필요 시)
```env
MAX_CONCURRENT_JOBS=2
```

---

## 7. 실행 방법

### 사전 요구사항
- Node.js 20+
- Python 3.11+
- notebooklm-py 설치 + 인증

### 초기 설정 (최초 1회)
```bash
# 1. 루트 의존성
npm install

# 2. Next.js 의존성
cd web && npm install && cd ..

# 3. Python 의존성
cd worker && pip install -e . && cd ..

# 4. NotebookLM 인증 (브라우저 팝업)
notebooklm login

# 5. DB 시드 (이미 완료되어 있음, 필요 시)
cd web && npx tsx prisma/seed.ts && cd ..
```

### 개발 서버 실행
```bash
# 방법 1: 동시 실행
npm run dev

# 방법 2: 각각 실행
cd web && npm run dev          # localhost:3000
cd worker && uvicorn app.main:app --reload --port 8000
```

### DB 스키마 변경 시
```bash
cd web
# 1. schema.prisma 수정
# 2. 마이그레이션 생성 + 적용
npx prisma migrate dev --name <설명>
# 3. Prisma 클라이언트 재생성
npx prisma generate
```

---

## 8. 현재 구현 상태

### 완료된 항목
- [x] 모노레포 구조 (web + worker)
- [x] DB 스키마 (User, Preset, Job) + Prisma 마이그레이션
- [x] 5개 기본 프리셋 시드 데이터
- [x] Python Worker: FastAPI 서버, NotebookLM 서비스 래퍼, Job 프로세서
- [x] Next.js API: 파일 업로드, 프리셋 CRUD, Job CRUD, 파일 다운로드
- [x] UI: 대시보드, 업로드 페이지, Job 목록/상세(실시간 폴링), 프리셋 관리
- [x] Next.js 빌드 성공 확인

### 미완료 / 추가 작업 필요
- [ ] **notebooklm-py 실제 API 검증**: 현재 `notebooklm_service.py`는 추정 API 기반. 실제 설치 후 메서드명/파라미터 확인 필요
- [ ] **`notebooklm login` 실행**: Worker 서버에서 브라우저 인증 1회 필요
- [ ] **E2E 테스트**: 실제 파일로 전체 플로우 테스트
- [ ] **인증**: NextAuth.js Google OAuth (현재는 dev-user 하드코딩)
- [ ] **에러 처리 강화**: Worker 재시작 시 중단된 Job 처리, 재시도 로직
- [ ] **배포 설정**: docker-compose 또는 서버 배포 구성

---

## 9. QA 체크리스트

### 기능 테스트

#### 프리셋 관리
- [ ] 프리셋 목록 조회 (`/presets`)
- [ ] 새 프리셋 생성 (이름, 회의 유형, 산출물, 프롬프트)
- [ ] 프리셋 수정
- [ ] 프리셋 삭제
- [ ] 삭제 시 confirm 다이얼로그 표시

#### 파일 업로드
- [ ] 드래그 앤 드롭 파일 업로드 (`/upload`)
- [ ] 파일 선택(클릭) 업로드
- [ ] 지원 형식: .mp3, .wav, .mp4, .txt, .md, .pdf
- [ ] 200MB 초과 파일 거부
- [ ] 파일 선택 후 파일명/크기 표시

#### 프리셋 선택
- [ ] 프리셋 카드 목록 표시
- [ ] 프리셋 선택 시 하이라이트
- [ ] 산출물 뱃지 표시 (요약/보고서/슬라이드)
- [ ] 파일 + 프리셋 선택 완료 시 확인 섹션 표시

#### Job 생성 및 처리
- [ ] "회의록 처리 시작" 클릭 → Job 생성
- [ ] Job 상세 페이지 자동 이동
- [ ] 상태 진행률 바 표시 (3초 폴링)
- [ ] 단계별 상태 메시지 한국어 표시
- [ ] Worker 미실행 시 에러 메시지 표시

#### 결과 확인
- [ ] 완료 시 요약 텍스트 인라인 표시
- [ ] 보고서 다운로드 버튼
- [ ] 슬라이드 다운로드 버튼
- [ ] 다운로드 파일 정상 열림

#### 대시보드
- [ ] 전체 작업 수 표시
- [ ] 프리셋 수 표시
- [ ] 최근 5개 작업 목록
- [ ] 작업 클릭 시 상세 페이지 이동

#### Job 목록
- [ ] 전체 작업 목록 (`/jobs`)
- [ ] 상태 뱃지 색상 구분 (완료=green, 에러=red, 진행중=blue)
- [ ] 프리셋명, 회의 유형, 생성일시 표시

### 비기능 테스트
- [ ] 네비게이션 동작 (대시보드, 새 회의록, 작업 목록, 프리셋 관리)
- [ ] 현재 페이지 네비게이션 하이라이트
- [ ] 반응형 레이아웃 (모바일/데스크톱)
- [ ] 에러 상태 페이지 표시

### Worker 테스트 (notebooklm-py 설치 후)
- [ ] `GET /health` → NotebookLM 인증 상태 확인
- [ ] `POST /process` → 텍스트 파일 처리
- [ ] 요약 생성 정상 동작
- [ ] 보고서 생성 + 다운로드
- [ ] 슬라이드 생성 + 다운로드
- [ ] 동시 2개 Job 처리 (세마포어)
- [ ] 에러 발생 시 Job 상태 "error" 업데이트

---

## 10. 알려진 이슈 및 주의사항

### 중요
1. **notebooklm-py API 불일치 가능**: `notebooklm_service.py`의 메서드 호출은 추정 기반. `pip install notebooklm-py` 후 실제 API 문서/소스 확인하여 수정 필요.
2. **인증 만료**: NotebookLM 브라우저 쿠키 기반 인증은 만료됨. `/health` 엔드포인트로 주기적 확인 필요.
3. **비공식 API 리스크**: Google이 내부 API를 변경하면 notebooklm-py가 깨질 수 있음.

### 기술적 주의
4. **Prisma 7.x 어댑터**: `PrismaBetterSqlite3` (소문자 'q'). `new PrismaClient({ adapter })` 필수.
5. **shadcn/ui v4**: `asChild` prop 제거됨. `<a>` 태그에 직접 스타일 적용.
6. **Next.js 16 params**: Route handler의 `params`가 `Promise` 타입. `await params` 필요.
7. **SQLite WAL 모드**: 동시 쓰기 시 충돌 방지. Next.js와 Worker가 동시에 같은 DB 사용.

### 디렉토리
8. `storage/`, `data/`는 `.gitignore`에 포함. 배포 시 디렉토리 생성 필요.
9. `web/src/generated/prisma/`는 `npx prisma generate`로 생성. 커밋 불필요.

---

## 11. 파일 맵 (핵심 파일 Quick Reference)

| 파일 | 역할 | 수정 빈도 |
|------|------|-----------|
| `web/prisma/schema.prisma` | DB 스키마 정의 | 모델 변경 시 |
| `web/src/lib/db.ts` | Prisma 클라이언트 싱글톤 | 거의 없음 |
| `web/src/types/index.ts` | 타입 + 한국어 레이블 | 새 상태/유형 추가 시 |
| `web/src/lib/constants.ts` | Worker URL, 파일 제한 | 환경 변경 시 |
| `web/src/app/upload/page.tsx` | 업로드 + 프리셋 선택 UI | UI 변경 시 |
| `web/src/app/jobs/[id]/page.tsx` | Job 상세 (폴링, 결과) | UI 변경 시 |
| `web/src/app/presets/page.tsx` | 프리셋 CRUD 관리 | UI 변경 시 |
| `web/src/app/api/jobs/route.ts` | Job 생성 + Worker 호출 | 로직 변경 시 |
| `worker/app/services/notebooklm_service.py` | **NotebookLM 통합 핵심** | API 변경 시 (최우선) |
| `worker/app/services/job_processor.py` | 비동기 파이프라인 | 플로우 변경 시 |
| `worker/app/main.py` | FastAPI 서버 설정 | 설정 변경 시 |
| `web/prisma/seed.ts` | 기본 프리셋 데이터 | 프리셋 추가/변경 시 |

---

## 12. 다음 단계 (우선순위)

1. **notebooklm-py 설치 + API 검증** → `notebooklm_service.py` 수정
2. **`notebooklm login` + E2E 테스트** (텍스트 파일 → 요약 생성)
3. **QA 체크리스트 수행** (위 9번 섹션)
4. **인증 추가** (NextAuth.js Google OAuth)
5. **배포 구성** (docker-compose 또는 서버 직접 배포)
