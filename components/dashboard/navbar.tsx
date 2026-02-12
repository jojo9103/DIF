"use client";

import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { cn } from "@/lib/utils";

interface DashboardNavbarProps {
  className?: string;
}

export default function DashboardNavbar({ className }: DashboardNavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await logout();
    router.replace("/auth?mode=login");
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-40 border-b border-white/10 bg-[#141414]/90 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 lg:px-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur"
          >
            <Image src="/dif.png" alt="DIF logo" width={32} height={32} />
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-sm font-semibold text-white"
          >
            DIF Pattern Detector
          </button>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-white/70 lg:flex">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="transition hover:text-white"
          >
            Result
          </button>
          <button
            type="button"
            onClick={() => router.push("/demo")}
            className="transition hover:text-white"
          >
            Demo
          </button>
          <button
            type="button"
            onClick={() => router.push("/upload")}
            className="transition hover:text-white"
          >
            Start analysis
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard#status")}
            className="transition hover:text-white"
          >
            Status
          </button>
        </nav>

        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur"
          >
            <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-sky-400/40 via-cyan-200/10 to-transparent">
              <div className="flex h-full w-full items-center justify-center text-xs text-white/80">
                {user?.id?.slice(0, 2).toUpperCase() || "U"}
              </div>
            </div>
            <div className="hidden text-left text-xs text-white/70 sm:block">
              <div className="text-white">{user?.id ?? "사용자"}</div>
              <div className="text-white/50">{user?.affiliation ?? "연구팀"}</div>
            </div>
          </button>

          <div
            className={cn(
              "absolute right-0 mt-3 w-40 rounded-2xl border border-white/10 bg-[#202020]/95 p-3 text-xs text-white/70 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur transition",
              open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white transition hover:border-white/30"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
