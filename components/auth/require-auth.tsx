"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      const qs = searchParams?.toString();
      const nextPath = qs ? `${pathname}?${qs}` : pathname || "/";
      const next = encodeURIComponent(nextPath);
      router.replace(`/auth?mode=login&next=${next}`);
    }
  }, [isAuthenticated, isLoading, pathname, router, searchParams]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
