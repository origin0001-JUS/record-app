# 작업 인수인계 (Cross-Environment Handoff)

> **⚠️ 모든 에이전트 필독 — 이 파일이 유일한 상태 소스(SSOT)입니다.**
>
> **작업 시작 전**: `git pull` → 이 파일 읽기 → "누가 뭘 하고 있나" 테이블에서 내 상태 [작업 중]으로 변경
> **작업 종료 시**: `npm run build` → 로그 저장(`docs/build-logs/`) → 이 파일 업데이트 → `git push`
>
> 📋 **상세 프로토콜**: CLAUDE.md의 "하이브리드 협업 규칙" 섹션 (Rule #13~16) 참조

---

## 최근 핸드오프 (Latest Handoff)

- **From**: Claude Code (텔레그램 세션)
- **When**: 2026-04-08
- **Branch**: `master`
- **최신 커밋**: (최신)

### 이번 세션에서 완료한 것
- [x] 프로젝트 상태 점검 및 이전 세션 TODO 소화
- [x] Worker 실행 확인, GCP 방화벽 8000 오픈, Vercel 연동 확인
- [x] Job 타입에 templateConfig 필드 추가 + Job 상세 페이지 표시
- [x] **QA: 업로드 UI 개선** — 프리셋/템플릿 역할 설명 추가
- [x] **QA: 보고서 생성에 templateConfig 반영** — hardcoded → reportTemplate + custom_prompt 사용
- [x] **QA: promptTemplate 간소화** — 마크다운 구조 지시 제거, 자연어 기반으로 변경
- [x] **QA: Job 상세 상태 표시 개선** — 슬라이드 백그라운드 polling, 스피너, 기본 스타일 표시
- [x] 빌드 성공 (Next.js 16.2.1, 로그: docs/build-logs/2026-04-08-qa.txt)

### 블로커 / 주의사항
- Vercel CLI 인증: 토큰 방식 사용 중 (만료 시 재발급 필요)
- promptTemplate 변경은 기존 DB도 API로 업데이트 완료됨
- Worker 재시작 시 새 seed_presets.py 반영 (기존 프리셋 있으면 건너뜀)

### 다음 에이전트의 할 일
1. E2E 테스트 — 실제 파일 업로드 → 요약/보고서/슬라이드 품질 확인
2. 요약 내용에 여전히 이상한 말이 나오면 promptTemplate 추가 튜닝

---

## 프로젝트 현재 상태

- **Web (Next.js 16)**: Vercel 자동 배포 연결됨, 빌드 성공
- **Worker (FastAPI)**: GCP VM에서 운영 중 (정확한 IP는 Vercel WORKER_URL 환경변수에 설정됨)
- **DB**: SQLite (Worker 소유)
- **인증**: Firebase Auth (ibkbaas-franchise-dashboard 프로젝트 공유)

---

## 누가 뭘 하고 있나 (Who is doing what)

| 에이전트 | 상태 | 현재 작업 | 블로커 |
|----------|------|----------|--------|
| **Antigravity** | [대기] | — | — |
| **Claude Code** | [작업 완료] | QA 4건 수정 (UI, 보고서, 프롬프트, 상태표시) | — |
| **Claude Web** | [대기] | — | — |

---

## 필수 환경변수

```
# Vercel (web)
WORKER_URL=http://<GCP_VM_IP>:8000
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# GCP VM (worker)
WEB_URL=https://web-beta-five-10.vercel.app
MAX_CONCURRENT_JOBS=2
```

---

## 배포 규칙 (Branch & Deployment Policy)

### 배포 구조
- **배포 브랜치**: `master` → Vercel 자동 배포
- **작업 브랜치**: `claude/*` — 개발 및 실험용

### 필수 합의 사항
1. **머지 전 반드시 사용자에게 확인**: 작업 브랜치를 master에 머지하기 전에 반드시 사용자와 합의할 것
2. **배포 영향 고지**: master에 푸시하면 Vercel 자동 배포되므로, 푸시 전에 "이 푸시는 프로덕션에 배포됩니다"라고 명시할 것
3. **브랜치 상태 기록**: 핸드오프 시 현재 작업 브랜치와 master의 커밋 차이를 명시할 것

### 절대 금지
- 사용자 확인 없이 master에 머지/푸시하지 말 것
- 배포 브랜치(master)를 force push하지 말 것
- 작업 브랜치에서만 작업하고 master 머지를 잊은 채 핸드오프하지 말 것

---

## 핸드오프 체크리스트 (매 세션 종료 시)

- [x] `npm run build` 성공 확인 (로그: docs/build-logs/2026-04-08.txt)
- [x] 이 파일의 "최근 핸드오프" 섹션 업데이트
- [x] "누가 뭘 하고 있나" 테이블에서 내 상태를 [작업 완료]로 변경
- [x] **배포 확인**: master에 push → Vercel 자동 배포 트리거됨
- [x] `git add . && git commit && git push`
- [ ] 다음 작업 시작 시: `git pull` 실행
