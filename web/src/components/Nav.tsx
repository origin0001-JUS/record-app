"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const links = [
  { href: "/", label: "대시보드" },
  { href: "/upload", label: "새 회의록" },
  { href: "/jobs", label: "작업 목록" },
  { href: "/presets", label: "프리셋 관리" },
  { href: "/templates", label: "디자인 템플릿" },
];

export function Nav() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 flex items-center h-14 gap-6">
        <Link href="/" className="font-bold text-lg">
          회의록 자동화
        </Link>
        <nav className="flex gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors hover:text-foreground ${
                pathname === link.href
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {profile?.email}
          </span>
          <button
            onClick={signOut}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
