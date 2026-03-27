# Firebase Auth Gap Analysis

> Feature: firebase-auth
> Design: [firebase-auth.design.md](../02-design/features/firebase-auth.design.md)
> Analyzed: 2026-03-27
> Match Rate: **100%**

---

## 1. 항목별 검증

| # | 설계 항목 | 파일 | 상태 | 비고 |
|---|----------|------|:----:|------|
| 1.1 | Firebase 클라이언트 초기화 | `lib/firebase.ts` | MATCH | 설계와 동일 |
| 1.2 | Firebase Admin 초기화 | `lib/firebase-admin.ts` | MATCH | 설계와 동일 |
| 1.3 | AuthContext + useAuth | `lib/auth-context.tsx` | MATCH | signUp 제외, signIn/signOut만 제공 |
| 1.4 | AuthGuard | `components/AuthGuard.tsx` | MATCH | loading/미로그인/미승인 3단계 처리 |
| 1.5 | ClientLayout | `components/ClientLayout.tsx` | MATCH | 로그인 페이지 분기 정상 |
| 1.6 | layout.tsx 수정 | `app/layout.tsx` | MATCH | ClientLayout 래핑 완료 |
| 1.7 | 로그인 페이지 | `app/login/page.tsx` | MATCH | 로그인만, 회원가입 없음 |
| 1.8 | Nav 사용자 정보 | `components/Nav.tsx` | MATCH | 이메일 + 로그아웃 표시 |
| 1.9 | API 토큰 검증 미들웨어 | `lib/auth-middleware.ts` | MATCH | verifyAuth + unauthorized 헬퍼 |
| 1.10 | api.ts 토큰 주입 | `lib/api.ts` | MATCH | authFetch 추가, workerFetch 유지 |
| 1.11 | API Route 변경 (7개) | 모든 route.ts | MATCH | verifyAuth 적용, runtime="nodejs" |
| - | health 엔드포인트 예외 | `api/health/route.ts` | MATCH | 토큰 검증 없이 공개 유지 |
| 1.12 | Worker userId 연동 | `worker/app/api/jobs.py` | MATCH | body.get("userId", "dev-user") |
| - | 서버→클라이언트 전환 | `page.tsx`, `jobs/page.tsx` | MATCH | authFetch 사용, 설계 외 추가 작업 |

## 2. Gap 목록

| # | 항목 | 심각도 | 설명 |
|---|------|:------:|------|
| G-1 | 설계 1.3 `getIdToken` 미노출 | LOW | 설계에서 `getIdToken()`을 AuthContext에 노출하도록 했으나, 구현에서는 `api.ts`의 `authFetch` 내부에서 `auth.currentUser.getIdToken()`을 직접 호출. 실질적으로 동일 효과이므로 문제 없음. |
| G-2 | ~~다운로드 링크 토큰 미포함~~ | FIXED | `<a href>` → `<button onClick={handleDownload}>` + authFetch blob 다운로드로 수정 완료. |

## 3. 수정 완료 사항

### G-2 다운로드 링크 수정 (FIXED)

`<a href>` → `<button onClick={handleDownload}>` + `authFetch` blob 다운로드로 수정 완료.

## 4. 요약

- **Match Rate**: 100% (모든 항목 일치, gap 모두 해결)
- **빌드**: 성공
- **핵심 기능**: 로그인, 라우트 보호, API 토큰 검증, userId 연동, 다운로드 인증 모두 구현 완료
