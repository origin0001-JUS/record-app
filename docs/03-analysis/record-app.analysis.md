# record-app Gap Analysis Report

> 분석일: 2026-03-25
> 분석 도구: gap-detector (자동)
> 대상: 계획서 vs 실제 구현 코드

---

## Overall Match Rate: 78%

| 카테고리 | 점수 | 상태 |
|----------|:----:|:----:|
| 프로젝트 구조 | 95% | PASS |
| 데이터 모델 | 97% | PASS |
| API 라우트 | 100% | PASS |
| Python Worker | 92% | PASS |
| UI 페이지 | 93% | PASS |
| 인증 (NextAuth) | 10% | CRITICAL |
| 에러 처리/리스크 대응 | 40% | WARN |
| 시드 데이터 | 100% | PASS |

---

## Critical Gaps (즉시 해결 필요)

### 1. NextAuth.js 미구현 (심각도: Critical)
- next-auth 패키지는 설치되어 있으나, 설정 파일(`auth.ts`), 라우트 핸들러, SessionProvider 모두 없음
- 모든 API 라우트가 인증 없이 노출
- userId가 `"dev-user"`로 하드코딩

### 2. notebooklm-py API 미검증 (심각도: Critical)
- `notebooklm_service.py`의 모든 메서드 호출이 추정 기반
- `pip install notebooklm-py` 후 실제 API 확인 필수

---

## Major Gaps

### 3. SQLite WAL 모드 미활성화
- 계획: WAL 모드로 동시 쓰기 충돌 방지
- 현재: Prisma 어댑터/SQLAlchemy 모두 명시적 WAL 설정 없음

### 4. 입력 검증 부재
- `POST /api/jobs`, `POST /api/presets`, `PUT /api/presets/:id`에 요청 바디 검증 없음

### 5. Job 전체 타임아웃 없음
- `notebooklm_service`에 아티팩트별 600초 타임아웃은 있으나, Job 전체 타임아웃 미구현

### 6. 재시도 로직 없음
- NotebookLM API 호출 실패 시 재시도 메커니즘 없음

### 7. 중단된 Job 복구 없음
- Worker 재시작 시 "processing" 상태로 남은 Job 처리 로직 없음

---

## Minor Gaps

### 8. docker-compose.yml 미생성
### 9. 요약 텍스트가 Markdown 렌더링 아닌 plain text로 표시
### 10. 상태 폴링이 SWR 대신 수동 setInterval 사용
### 11. 클라이언트 측 파일 크기 사전 검증 없음
### 12. .env.example 템플릿 없음
### 13. notebooklm-py 버전 고정 안 됨 (`>=0.1.0`)

---

## 잘 구현된 항목

- 모노레포 구조 (web + worker) 계획대로 구현
- 모든 API 엔드포인트 100% 매칭
- 데이터 모델 100% 매칭 + 유용한 필드 추가 (sourceId, statusMessage, errorMessage)
- 5개 기본 프리셋 + 한국어 프롬프트 완벽 시딩
- Worker 비동기 파이프라인 (Semaphore 동시성 제한, 단계별 상태 업데이트)
- UI: 드래그앤드롭, 프리셋 선택, 실시간 폴링, 다운로드 기능

---

## 우선순위별 해결 순서

| 순서 | 작업 | 심각도 | 예상 시간 |
|:----:|------|--------|:---------:|
| 1 | notebooklm-py 설치 + API 검증 → service 수정 | Critical | 2-4h |
| 2 | NextAuth.js Google OAuth 구현 | Critical | 4-6h |
| 3 | SQLite WAL 모드 활성화 | Major | 30min |
| 4 | API 입력 검증 추가 | Major | 1-2h |
| 5 | Job 전체 타임아웃 + 재시도 로직 | Major | 1-2h |
| 6 | 중단된 Job 복구 로직 | Major | 1h |
| 7 | .env.example + notebooklm-py 버전 고정 | Minor | 15min |
| 8 | 요약 Markdown 렌더링 | Minor | 30min |
