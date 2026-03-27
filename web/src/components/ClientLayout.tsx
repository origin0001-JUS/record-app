"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/components/AuthGuard";
import { Nav } from "@/components/Nav";
import type { ReactNode } from "react";

export function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <AuthProvider>
      {isLoginPage ? (
        children
      ) : (
        <AuthGuard>
          <Nav />
          <main className="flex-1 container mx-auto px-4 py-6">
            {children}
          </main>
        </AuthGuard>
      )}
    </AuthProvider>
  );
}
