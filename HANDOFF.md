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
- **When**: 2026-04-01
- **Branch**: `master`
- **최신 커밋**: (최신)

### 이번 세션에서 완료한 것
- [x] GitHub 레포 클론 및 프로젝트 초기 셋업
- [x] Vercel GitHub 자동 배포 연결 (origin0001-JUS/record-app → web 프로젝트, root: web/)
- [x] 보고서 전용 디자인 템플릿 38개 추가 (/templates 페이지)
- [x] 프리셋 8개 카테고리 체계로 재구성
- [x] Worker 시드 로직 추가 (seed_presets.py)
- [x] HANDOFF.md, CLAUDE.md, docs/build-logs/ 생성
- [x] 글로벌 ~/.claude/CLAUDE.md 텔레그램 적응 워크플로우 설정
- [x] **업로드 플로우에 템플릿 선택 단계 통합** (파일→프리셋→템플릿→확인)
- [x] Worker에 templateConfig 전달 파이프라인 구축 (DB→API→JobProcessor→슬라이드 생성)
- [x] 템플릿 데이터 공유 모듈 분리 (web/src/lib/report-templates.ts)

### 블로커 / 주의사항
- Vercel CLI 인증: 토큰 방식 사용 중 (만료 시 재발급 필요)
- Worker(GCP VM)가 새 프리셋 시드를 반영하려면 Worker 재시작 필요
- 기존 DB에 이미 프리셋이 있으면 시드가 건너뜀 — 기존 프리셋 삭제 후 재시작하면 새 8개 시드 적용
- Worker DB에 templateConfig 컬럼 추가됨 — SQLAlchemy create_all이 자동 처리하지만, 기존 DB는 ALTER TABLE 필요할 수 있음

### 다음 에이전트의 할 일
1. `git pull` 실행
2. GCP VM Worker 재시작하여 새 프리셋 시드 적용
3. Vercel 배포 확인 (https://web-beta-five-10.vercel.app/templates)
4. Worker CORS에 Vercel 도메인 추가 (WEB_URL 환경변수)
5. 보고서 템플릿 ↔ 프리셋 연동 기능 구현 (템플릿 선택 시 프리셋 자동 적용)

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
| **Claude Code** | [작업 완료] | 템플릿+프리셋 재구성, Vercel 연결 | — |
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

- [x] `npm run build` 성공 확인 (로그: docs/build-logs/2026-04-01.txt)
- [x] 이 파일의 "최근 핸드오프" 섹션 업데이트
- [x] "누가 뭘 하고 있나" 테이블에서 내 상태를 [작업 완료]로 변경
- [x] **배포 확인**: master에 push → Vercel 자동 배포 트리거됨
- [x] `git add . && git commit && git push`
- [ ] 다음 작업 시작 시: `git pull` 실행
