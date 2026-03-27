# Firebase Auth 연동 계획서

> Feature: firebase-auth
> Created: 2026-03-27
> Status: Plan

---

## 1. 목표

record-app에 Firebase Auth를 연동하여, ibk-franchise-dashboard(stitch_test)와 **같은 Firebase 프로젝트를 공유**한다. 이미 가입+승인된 IBK 직원이 별도 가입 없이 record-app에 바로 로그인할 수 있게 한다.

## 2. 현황 분석

### 현재 상태
- 인증 시스템 **없음** (모든 API 완전 개방)
- Worker에서 userId를 `"dev-user"`로 하드코딩
- 누구든 Worker URL만 알면 Job 생성/다운로드 가능
- 회의 녹음/요약 등 민감 데이터가 무방비 노출

### stitch_test 인증 체계 (재사용 대상)
- Firebase 프로젝트: `ibkbaas-franchise-dashboard`
- 이메일/비밀번호 인증, `@ibk.co.kr` 도메인 제한
- Firestore `users` 컬렉션에 프로필 저장 (`role`, `isApproved`)
- 첫 번째 가입자 자동 ADMIN, 이후 관리자 승인 필요

## 3. 구현 범위

### 3.1 In-Scope (이번에 구현)

| # | 항목 | 설명 |
|---|------|------|
| 1 | **Firebase 클라이언트 설정** | 동일 Firebase config, `firebase` 패키지 추가 |
| 2 | **로그인 페이지** | `/login` — 이메일/비밀번호 로그인 (stitch_test UI 참고) |
| 3 | **AuthContext** | 클라이언트 측 인증 상태 관리 (React Context) |
| 4 | **미승인 사용자 차단** | isApproved=false면 "승인 대기" 화면 표시 |
| 5 | **라우트 보호** | 미로그인 시 `/login`으로 리다이렉트 |
| 6 | **API 토큰 전달** | 프론트→Next.js API 호출 시 Authorization 헤더에 Firebase ID Token 포함 |
| 7 | **Next.js API 토큰 검증** | `firebase-admin`으로 ID Token 검증 미들웨어 |
| 8 | **userId 연동** | 하드코딩 `"dev-user"` → Firebase UID로 교체 |
| 9 | **Nav에 사용자 정보** | 로그인 사용자 이메일 표시 + 로그아웃 버튼 |

### 3.2 Out-of-Scope (이번엔 안 함)

| 항목 | 이유 |
|------|------|
| 회원가입 기능 | stitch_test에서 이미 가입 가능, record-app에서 중복 구현 불필요 |
| 관리자 승인 대시보드 | stitch_test AdminDashboard에서 관리 |
| Worker API 직접 토큰 검증 | Worker는 내부망(localhost)에서만 접근, Next.js가 게이트키퍼 역할 |
| Job 데이터 사용자 격리 | 팀 내부(~10명) 공유 도구이므로, 모든 승인 사용자가 전체 Job 열람 가능 |
| 비밀번호 재설정 | stitch_test Login에 이미 있음, record-app에선 로그인만 |

## 4. 기술 설계 요약

### 아키텍처 변경

```
[Before]
Browser → Next.js API → Worker (모두 개방)

[After]
Browser → /login (Firebase Auth) → Next.js API (ID Token 검증) → Worker
          ↕                           ↕
     Firebase Auth              firebase-admin SDK
     (클라이언트)               (서버 토큰 검증)
```

### 패키지 추가

| 패키지 | 위치 | 용도 |
|--------|------|------|
| `firebase` | web (client) | Firebase Auth 클라이언트 |
| `firebase-admin` | web (server) | ID Token 검증 (API Route) |

### 파일 구조 (추가/수정)

```
web/src/
├── lib/
│   ├── firebase.ts              [NEW] Firebase 클라이언트 초기화
│   ├── firebase-admin.ts        [NEW] Firebase Admin 초기화 (서버용)
│   ├── auth-context.tsx         [NEW] AuthProvider + useAuth hook
│   └── api.ts                   [EDIT] fetch에 Authorization 헤더 추가
├── app/
│   ├── login/page.tsx           [NEW] 로그인 페이지
│   ├── layout.tsx               [EDIT] AuthProvider 래핑
│   └── api/
│       └── (모든 route)          [EDIT] 토큰 검증 미들웨어 적용
├── components/
│   ├── Nav.tsx                  [EDIT] 사용자 정보 + 로그아웃
│   └── AuthGuard.tsx            [NEW] 라우트 보호 컴포넌트
```

### 핵심 고려사항

1. **Next.js 16 App Router + 서버 컴포넌트**
   - AuthContext는 클라이언트 컴포넌트에서만 사용
   - API Route에서는 `firebase-admin`으로 서버사이드 토큰 검증
   - 서버 컴포넌트에서 인증이 필요하면 cookie/header 기반 처리

2. **Firebase Admin 서비스 계정**
   - Vercel 배포 시 `FIREBASE_SERVICE_ACCOUNT` 환경변수 필요
   - 또는 `FIREBASE_PROJECT_ID`만으로 ID Token 검증 가능 (공개키 방식)

3. **SWR + 토큰 자동 주입**
   - 기존 `workerFetch()` 함수에 토큰 주입 로직 추가
   - SWR fetcher도 동일하게 토큰 포함

4. **Worker는 변경 최소화**
   - Worker API 자체에 토큰 검증 추가 안 함 (내부망 통신)
   - Next.js API가 검증 후 Worker에 userId만 전달
   - Worker의 하드코딩 `"dev-user"` → Next.js가 넘겨주는 userId 사용

## 5. 구현 순서

| 순서 | 작업 | 예상 변경 |
|------|------|-----------|
| **1** | Firebase 패키지 설치 + 클라이언트 초기화 | `firebase.ts` 생성 |
| **2** | AuthContext + useAuth 훅 | `auth-context.tsx` 생성 |
| **3** | 로그인 페이지 UI | `login/page.tsx` 생성 |
| **4** | AuthGuard + layout 래핑 | 미로그인 리다이렉트 |
| **5** | Nav에 사용자 정보/로그아웃 | `Nav.tsx` 수정 |
| **6** | firebase-admin 설정 | `firebase-admin.ts` + 환경변수 |
| **7** | API 미들웨어 (토큰 검증) | 유틸 함수 + 각 route 적용 |
| **8** | 프론트 fetch에 토큰 주입 | `api.ts` 수정 |
| **9** | Worker userId 연동 | Next.js→Worker 요청에 userId 포함 |
| **10** | Vercel 환경변수 설정 + 배포 테스트 | 배포 확인 |

## 6. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Firebase Admin SDK가 Vercel Edge에서 안 돌 수 있음 | 토큰 검증 불가 | Node.js runtime 명시 (`export const runtime = 'nodejs'`) |
| Firestore users 컬렉션에 record-app 전용 필드 필요할 수 있음 | 스키마 충돌 | 기존 필드만 읽기, 추가 필드 불필요 (isApproved만 확인) |
| stitch_test에서 사용자 삭제 시 record-app 영향 | 로그인 불가 | Firebase Auth 자체가 관리하므로 자동 반영 |

## 7. 완료 기준

- [ ] `/login`에서 이메일/비밀번호로 로그인 가능
- [ ] 미로그인 시 모든 페이지가 `/login`으로 리다이렉트
- [ ] 미승인 사용자(isApproved=false)는 "대기" 화면 표시
- [ ] API 호출 시 유효한 Firebase ID Token 필수
- [ ] stitch_test에서 가입+승인된 계정으로 record-app 로그인 성공
- [ ] Nav에 로그인 사용자 이메일 표시 + 로그아웃 동작
- [ ] Vercel 배포 환경에서 정상 동작
