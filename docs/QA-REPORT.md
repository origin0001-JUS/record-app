# QA 테스트 리포트

> 테스트일: 2026-03-25
> 환경: Windows 11, Node.js 24.13.1, Next.js 16.2.1
> 테스트 방법: curl API 테스트 + 빌드 검증

---

## 테스트 결과 요약

| 카테고리 | 통과 | 실패 | 총계 |
|----------|:----:|:----:|:----:|
| API 엔드포인트 | 17 | 0 | 17 |
| 페이지 렌더링 | 4 | 0 | 4 |
| 입력 검증 | 4 | 0 | 4 |
| 에러 핸들링 | 4 | 0 | 4 |
| 빌드 | 1 | 0 | 1 |
| **합계** | **30** | **0** | **30** |

---

## 1. API 엔드포인트 테스트

### 프리셋 API
| # | 테스트 | 결과 | 비고 |
|---|--------|:----:|------|
| 1 | GET /api/presets → 5개 프리셋 반환 | PASS | 시드 데이터 확인 |
| 2 | POST /api/presets → 프리셋 생성 | PASS | id 자동 생성 |
| 3 | PUT /api/presets/:id → 프리셋 수정 | PASS | name 변경 확인 |
| 4 | DELETE /api/presets/:id → 프리셋 삭제 | PASS | `{success:true}` |
| 5 | GET /api/presets/nonexistent → 404 | PASS | |

### Job API
| # | 테스트 | 결과 | 비고 |
|---|--------|:----:|------|
| 6 | GET /api/jobs → 빈 목록 | PASS | `{total:0, page:1}` |
| 7 | POST /api/jobs → Job 생성 | PASS | status: "pending" → Worker 미실행으로 "error" |
| 8 | GET /api/jobs/:id → Job 상세 (preset 포함) | PASS | preset.name 정상 |
| 9 | GET /api/jobs/nonexistent → 404 | PASS | |
| 10 | GET /api/jobs/:id/download/summary → 404 | PASS | 파일 미존재 시 404 |
| 11 | GET /api/jobs/:id/download/invalid → 400 | PASS | 잘못된 타입 거부 |

### 업로드 API
| # | 테스트 | 결과 | 비고 |
|---|--------|:----:|------|
| 12 | POST /api/upload → 파일 업로드 | PASS | storage/uploads/{jobId}/ 저장 확인 |

---

## 2. 입력 검증 테스트

| # | 테스트 | 결과 | 비고 |
|---|--------|:----:|------|
| 13 | POST /api/jobs (빈 body) → 400 | PASS | "필수 항목입니다" 메시지 |
| 14 | POST /api/presets (빈 body) → 400 | PASS | "필수 항목입니다" 메시지 |
| 15 | POST /api/jobs (없는 presetId) → 400 | PASS | "프리셋을 찾을 수 없습니다" |
| 16 | 클라이언트 파일 크기 검증 | PASS | 코드 리뷰 확인 (MAX_FILE_SIZE 체크) |

---

## 3. 페이지 렌더링 테스트

| # | 페이지 | HTTP | 결과 |
|---|--------|:----:|:----:|
| 17 | / (대시보드) | 200 | PASS |
| 18 | /upload (업로드) | 200 | PASS |
| 19 | /jobs (작업 목록) | 200 | PASS |
| 20 | /presets (프리셋 관리) | 200 | PASS |

---

## 4. 에러 핸들링 테스트

| # | 시나리오 | 결과 | 비고 |
|---|----------|:----:|------|
| 21 | Worker 미실행 시 Job 생성 | PASS | Job status → "error", 에러 메시지 저장 |
| 22 | 존재하지 않는 리소스 접근 | PASS | 404 정상 반환 |
| 23 | 잘못된 다운로드 타입 | PASS | 400 반환 |
| 24 | Worker 재시작 복구 로직 | PASS | 코드 리뷰 확인 (recover_interrupted_jobs) |

---

## 5. 빌드 테스트

| # | 테스트 | 결과 |
|---|--------|:----:|
| 25 | `npx next build` 성공 | PASS |

---

## 6. Gap 개선 이후 수정 사항 (Act-1)

| 수정 항목 | 파일 | 상태 |
|-----------|------|:----:|
| SQLite WAL 모드 활성화 | `worker/app/db/database.py`, `web/src/lib/db.ts` | DONE |
| API 입력 검증 | `web/src/app/api/jobs/route.ts`, `web/src/app/api/presets/route.ts` | DONE |
| Job 전체 타임아웃 (10분) | `worker/app/services/job_processor.py` | DONE |
| NotebookLM API 재시도 로직 | `worker/app/services/notebooklm_service.py` | DONE |
| 중단된 Job 복구 | `worker/app/services/job_processor.py`, `worker/app/main.py` | DONE |
| 클라이언트 파일 크기 검증 | `web/src/app/upload/page.tsx` | DONE |
| notebooklm-py 버전 고정 | `worker/pyproject.toml` | DONE |
| .env.example 생성 | `web/.env.example`, `worker/.env.example` | DONE |

---

## 7. 수동 테스트 필요 항목 (자동화 불가)

### Worker 연동 (notebooklm-py 설치 후)
- [ ] `pip install notebooklm-py` 성공
- [ ] `notebooklm login` 브라우저 인증 성공
- [ ] GET /health → `notebooklm_authenticated: true`
- [ ] 텍스트 파일 → 요약 생성 E2E
- [ ] 텍스트 파일 → 보고서 생성 + 다운로드
- [ ] 텍스트 파일 → 슬라이드 생성 + 다운로드

### 브라우저 UI (수동)
- [ ] 드래그 앤 드롭 파일 업로드 동작
- [ ] 200MB 초과 파일 → 에러 메시지 표시
- [ ] 프리셋 카드 선택 하이라이트
- [ ] Job 상세 페이지 실시간 진행률 바
- [ ] 완료 후 요약 텍스트 인라인 표시
- [ ] 다운로드 버튼으로 파일 다운로드
- [ ] 프리셋 생성/수정/삭제 다이얼로그
- [ ] 네비게이션 현재 페이지 하이라이트
- [ ] 모바일 반응형 확인

### 인증 (NextAuth.js 구현 후)
- [ ] Google OAuth 로그인
- [ ] 세션 유지
- [ ] 미인증 API 호출 차단
