"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { cn } from "@/lib/utils";

interface NavbarProps {
  className?: string;
}

export default function Navbar({ className }: NavbarProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();
  const nextParam = encodeURIComponent(pathname || "/");
  const getStartedHref = isAuthenticated ? "/dashboard" : `/auth?mode=login&next=${nextParam}`;
  const statusHref = isAuthenticated
    ? "/dashboard#status"
    : `/auth?mode=login&next=${encodeURIComponent("/dashboard#status")}`;

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50",
        "bg-[#0b0f1a]/60 backdrop-blur border-b border-white/10",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-full border border-white/10 bg-white/5">
            <Image src="/dif.png" alt="DIF Pattern Detector logo" fill sizes="36px" />
          </div>
          <div className="text-sm font-semibold tracking-wide text-white">
            DIF Pattern Detector
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a className="transition hover:text-white" href="#info">
            Info
          </a>
          <Link className="transition hover:text-white" href={statusHref}>
            Status
          </Link>
          <Link className="transition hover:text-white" href="/dashboard">
            Result
          </Link>
          <a className="transition hover:text-white" href="#contract">
            Contract
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
                href={`/auth?mode=login&next=${nextParam}`}
              >
                로그인
              </Link>
              <Link
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
                href={`/auth?mode=signup&next=${nextParam}`}
              >
                회원 가입
              </Link>
              <Link
                className="rounded-full bg-sky-400 px-5 py-2 text-xs font-semibold text-[#0b0f1a] transition hover:bg-sky-300"
                href={getStartedHref}
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <div className="hidden text-xs text-white/60 sm:block">
                {user?.affiliation} · {user?.id}
              </div>
              <button
                onClick={logout}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
              >
                로그아웃
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
