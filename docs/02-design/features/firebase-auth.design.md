# Firebase Auth 연동 설계서

> Feature: firebase-auth
> Plan: [firebase-auth.plan.md](../../01-plan/features/firebase-auth.plan.md)
> Created: 2026-03-27
> Status: Design

---

## 1. 파일별 상세 설계

### 1.1 `web/src/lib/firebase.ts` [NEW]

Firebase 클라이언트 초기화. stitch_test와 동일한 config 사용.

```ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD8eSSRj2UH2sU7kkyD3v2lBZWf83aJmUI",
  authDomain: "ibkbaas-franchise-dashboard.firebaseapp.com",
  projectId: "ibkbaas-franchise-dashboard",
  storageBucket: "ibkbaas-franchise-dashboard.firebasestorage.app",
  messagingSenderId: "1036729387301",
  appId: "1:1036729387301:web:509ebd1f61a87a235872cc",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
```

- `getApps()` 체크: Next.js HMR 시 중복 초기화 방지
- `getStorage` 불필요 (record-app에서 Firebase Storage 안 씀)

---

### 1.2 `web/src/lib/firebase-admin.ts` [NEW]

서버 사이드 토큰 검증용. API Route에서만 import.

```ts
import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  // 방법 1: 서비스 계정 JSON (권장)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as ServiceAccount;
    return initializeApp({ credential: cert(serviceAccount) });
  }

  // 방법 2: 프로젝트 ID만으로 (공개키 기반 검증)
  return initializeApp({ projectId: "ibkbaas-franchise-dashboard" });
}

const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
```

- Vercel 환경변수: `FIREBASE_SERVICE_ACCOUNT` (JSON 문자열)
- 로컬 개발: 환경변수 없으면 projectId 기반 fallback

---

### 1.3 `web/src/lib/auth-context.tsx` [NEW]

클라이언트 인증 상태 관리. stitch_test `auth-context.tsx` 참고하되 **로그인만** 지원.

```ts
"use client";

interface UserProfile {
  uid: string;
  email: string;
  role: "USER" | "ADMIN";
  isApproved: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;          // Firebase Auth User
  profile: UserProfile | null; // Firestore 프로필
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>; // API 호출용
}
```

**핵심 로직:**

1. `onAuthStateChanged` → Firebase Auth 상태 감시
2. 로그인 성공 시 → Firestore `users/{uid}` 에서 프로필 조회
3. `getIdToken()` → `user.getIdToken()` 래핑 (API 호출 시 사용)
4. 회원가입 없음 — `signUp` 제공 안 함

**프로필 없는 경우 처리:**
- Firebase Auth에는 있지만 Firestore `users`에 문서 없을 수 있음
  (stitch_test 외부에서 Firebase Console로 직접 추가한 경우)
- → `profile === null` 이면 "승인 대기" 화면과 동일하게 처리

---

### 1.4 `web/src/components/AuthGuard.tsx` [NEW]

라우트 보호 클라이언트 컴포넌트.

```
AuthGuard 로직:
1. loading → 로딩 스피너
2. !user → redirect to /login
3. !profile || !profile.isApproved → "승인 대기" 화면
4. OK → children 렌더
```

layout.tsx에서 사용:
```tsx
<AuthProvider>
  {pathname === "/login" ? children : <AuthGuard>{Nav + children}</AuthGuard>}
</AuthProvider>
```

**주의: layout.tsx는 서버 컴포넌트**이므로 pathname 분기를 layout에서 직접 할 수 없음.
→ 별도 `ClientLayout.tsx` 클라이언트 컴포넌트를 만들어 그 안에서 AuthProvider + AuthGuard + Nav 관리.

---

### 1.5 `web/src/components/ClientLayout.tsx` [NEW]

layout.tsx에서 body 내부를 담당하는 클라이언트 컴포넌트.

```tsx
"use client";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <AuthProvider>
      {isLoginPage ? (
        children
      ) : (
        <AuthGuard>
          <Nav />
          <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
        </AuthGuard>
      )}
    </AuthProvider>
  );
}
```

---

### 1.6 `web/src/app/layout.tsx` [EDIT]

변경사항: body 내부를 `ClientLayout`으로 교체.

```diff
- <body className="min-h-full flex flex-col">
-   <Nav />
-   <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
- </body>
+ <body className="min-h-full flex flex-col">
+   <ClientLayout>{children}</ClientLayout>
+ </body>
```

서버 컴포넌트 유지. `ClientLayout`만 "use client".

---

### 1.7 `web/src/app/login/page.tsx` [NEW]

로그인 전용 페이지. stitch_test `Login.tsx` 참고하되 간소화:

**포함 요소:**
- 이메일 입력 (placeholder: `admin@ibk.co.kr`)
- 비밀번호 입력
- 로그인 버튼
- 에러 메시지 표시 (잘못된 자격증명, 계정 없음 등)
- "stitch_test(IBK Franchise BaaS)에서 가입해주세요" 안내 문구

**미포함:**
- 회원가입 탭/폼
- 비밀번호 재설정

**UI 스타일:** 기존 record-app의 shadcn/ui + Tailwind 스타일에 맞춤 (stitch_test의 IBK 네이비 테마가 아닌 record-app 기존 테마).

---

### 1.8 `web/src/components/Nav.tsx` [EDIT]

변경사항: 우측에 사용자 정보 + 로그아웃 버튼 추가.

```diff
  <div className="container mx-auto px-4 flex items-center h-14 gap-6">
    <Link href="/" className="font-bold text-lg">회의록 자동화</Link>
    <nav className="flex gap-4">{/* links */}</nav>
+   <div className="ml-auto flex items-center gap-3">
+     <span className="text-sm text-muted-foreground">{profile?.email}</span>
+     <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground">
+       로그아웃
+     </button>
+   </div>
  </div>
```

`useAuth()` 훅에서 `profile`, `signOut` 가져옴.

---

### 1.9 `web/src/lib/auth-middleware.ts` [NEW]

API Route에서 공통으로 사용할 토큰 검증 유틸.

```ts
import { NextRequest } from "next/server";
import { adminAuth } from "./firebase-admin";

interface AuthResult {
  uid: string;
  email: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const token = authHeader.split("Bearer ")[1];
  const decoded = await adminAuth.verifyIdToken(token);

  return { uid: decoded.uid, email: decoded.email || "" };
}
```

**각 API Route 적용 패턴:**
```ts
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request).catch(() => null);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // 기존 로직...
}
```

**health 엔드포인트는 예외** — 토큰 검증 없이 접근 가능 (모니터링용).

---

### 1.10 `web/src/lib/api.ts` [EDIT]

클라이언트에서 Next.js API 호출 시 토큰 자동 주입.

```diff
+ import { auth } from "./firebase";
+
+ async function getAuthHeader(): Promise<HeadersInit> {
+   const user = auth.currentUser;
+   if (!user) return {};
+   const token = await user.getIdToken();
+   return { Authorization: `Bearer ${token}` };
+ }

  export async function workerFetch(path: string, init?: RequestInit) {
+   const authHeaders = await getAuthHeader();
    const url = `${WORKER_URL}${path}`;
    const res = await fetch(url, {
      ...init,
      headers: {
+       ...authHeaders,
        ...init?.headers,
      },
    });
    return res;
  }
```

**주의:** `workerFetch`는 이름과 달리 실제로 Next.js API를 호출하는 함수. 클라이언트→Next.js API 경로. Next.js API→Worker는 서버에서 직접 호출하므로 토큰 불필요.

---

### 1.11 API Route 변경 목록

| Route | 변경 | 비고 |
|-------|------|------|
| `api/jobs/route.ts` GET | `verifyAuth` 추가 | |
| `api/jobs/route.ts` POST | `verifyAuth` 추가 + userId를 Worker에 전달 | |
| `api/jobs/[id]/route.ts` GET | `verifyAuth` 추가 | |
| `api/jobs/[id]/download/[type]/route.ts` GET | `verifyAuth` 추가 | |
| `api/upload/route.ts` POST | `verifyAuth` 추가 | |
| `api/presets/route.ts` GET/POST | `verifyAuth` 추가 | |
| `api/presets/[id]/route.ts` GET/PUT/DELETE | `verifyAuth` 추가 | |
| `api/health/route.ts` GET | **변경 없음** | 모니터링용 공개 |

모든 API Route에 `export const runtime = "nodejs"` 추가 (firebase-admin이 Node.js 필요).

---

### 1.12 Worker userId 연동

**현재:** `jobs.py:108`에서 `userId="dev-user"` 하드코딩.

**변경:** Next.js API가 Job 생성 요청 시 `userId` 필드를 body에 포함하여 Worker에 전달.

```diff
# Next.js api/jobs/route.ts POST
  export async function POST(request: NextRequest) {
+   const auth = await verifyAuth(request).catch(() => null);
+   if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
+   body.userId = auth.uid;  // Firebase UID 주입

    const res = await workerFetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
-     body,
+     body: JSON.stringify(body),
    });
    // ...
  }
```

```diff
# Worker jobs.py - ProcessRequest 스키마
  class ProcessRequest(BaseModel):
      presetId: str
      filePath: str
      fileName: str
      fileType: str
+     userId: str = "dev-user"  # 기본값 유지 (하위호환)
```

Worker의 Job 생성 코드에서 `userId=request.userId` 사용.

---

## 2. 환경변수

### 로컬 개발 (`web/.env.local`)
```env
# 기존
WORKER_URL=http://localhost:8000

# 추가 (선택 — 없으면 projectId 기반 fallback)
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":...}
```

### Vercel 배포
```env
WORKER_URL=http://136.117.169.239:8000
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"ibkbaas-franchise-dashboard",...}
```

Firebase 서비스 계정 키는 Firebase Console > 프로젝트 설정 > 서비스 계정 > 새 비공개 키 생성.

---

## 3. 패키지 설치

```bash
cd web
npm install firebase firebase-admin
```

---

## 4. 구현 순서 (체크리스트)

| # | 파일 | 작업 | 의존성 |
|---|------|------|--------|
| 1 | `npm install` | `firebase`, `firebase-admin` 설치 | - |
| 2 | `lib/firebase.ts` | Firebase 클라이언트 초기화 | 1 |
| 3 | `lib/firebase-admin.ts` | Firebase Admin 초기화 | 1 |
| 4 | `lib/auth-context.tsx` | AuthProvider + useAuth | 2 |
| 5 | `app/login/page.tsx` | 로그인 페이지 UI | 4 |
| 6 | `components/AuthGuard.tsx` | 라우트 보호 컴포넌트 | 4 |
| 7 | `components/ClientLayout.tsx` | 클라이언트 레이아웃 래퍼 | 4, 6 |
| 8 | `app/layout.tsx` | ClientLayout 적용 | 7 |
| 9 | `components/Nav.tsx` | 사용자 정보 + 로그아웃 | 4 |
| 10 | `lib/auth-middleware.ts` | API 토큰 검증 유틸 | 3 |
| 11 | `lib/api.ts` | fetch에 토큰 자동 주입 | 2 |
| 12 | API Routes (7개) | `verifyAuth` 적용 | 10 |
| 13 | `api/jobs/route.ts` POST | userId Worker 전달 | 10, 12 |
| 14 | Worker `schemas.py` | ProcessRequest에 userId 필드 추가 | - |
| 15 | Worker `jobs.py` | request.userId 사용 | 14 |
| 16 | Vercel 환경변수 | `FIREBASE_SERVICE_ACCOUNT` 설정 | - |

---

## 5. 주의사항

1. **Next.js 16 App Router**: `layout.tsx`는 서버 컴포넌트 유지. 인증 로직은 `ClientLayout`에 격리.
2. **shadcn/ui v4**: `asChild` prop 없음. 로그인 페이지 버튼은 `<button>` 직접 사용.
3. **firebase-admin + Vercel**: 모든 API Route에 `export const runtime = "nodejs"` 필수.
4. **토큰 갱신**: Firebase ID Token은 1시간 유효. `getIdToken()`이 자동 갱신 처리.
5. **Firestore 보안규칙**: record-app은 `users` 컬렉션 읽기만 함. 기존 stitch_test 규칙에 영향 없음.
