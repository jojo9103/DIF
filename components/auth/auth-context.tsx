"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthUser = {
  id: string;
  email: string;
  affiliation: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  register: (input: {
    id: string;
    password: string;
    affiliation: string;
    email: string;
  }) => Promise<{ ok: boolean; message: string }>;
  login: (input: { id: string; password: string }) => Promise<{ ok: boolean; message: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { ok: boolean; user: AuthUser | null };
      if (data.ok && data.user) {
        setUser(data.user);
      }
    };
    load();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isAuthenticated: Boolean(user),
      register: async (input) => {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = (await res.json()) as { ok: boolean; message: string };
        if (res.ok && data.ok) {
          const me = await fetch("/api/auth/me", { cache: "no-store" });
          if (me.ok) {
            const meData = (await me.json()) as { ok: boolean; user: AuthUser | null };
            if (meData.user) setUser(meData.user);
          }
        }
        return data;
      },
      login: async ({ id, password }) => {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, password }),
        });
        const data = (await res.json()) as { ok: boolean; message: string };
        if (res.ok && data.ok) {
          const me = await fetch("/api/auth/me", { cache: "no-store" });
          if (me.ok) {
            const meData = (await me.json()) as { ok: boolean; user: AuthUser | null };
            if (meData.user) setUser(meData.user);
          }
        }
        return data;
      },
      logout: async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
      },
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
