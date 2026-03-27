"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Firebase Auth에 있지만 Firestore 프로필 없거나 미승인
  if (!profile || !profile.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="bg-background p-8 rounded-xl shadow-lg max-w-md text-center border">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">&#x23F3;</span>
          </div>
          <h2 className="text-lg font-bold mb-2">관리자 승인 대기 중</h2>
          <p className="text-sm text-muted-foreground mb-4">
            계정이 확인되었으나 아직 관리자 승인이 완료되지 않았습니다.
            <br />
            승인 후 이용 가능합니다.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:underline"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
