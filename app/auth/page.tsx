"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, register } = useAuth();

  const initialMode = (params.get("mode") as Mode) || "login";
  const nextPath = params.get("next") || "/dashboard";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: "",
    password: "",
    affiliation: "",
    email: "",
  });

  const isSignup = mode === "signup";

  useEffect(() => {
    const nextMode = (params.get("mode") as Mode) || "login";
    setMode(nextMode);
  }, [params]);

  const canSubmit = useMemo(() => {
    if (isSignup) {
      return (
        form.id.trim() &&
        form.password.trim() &&
        form.affiliation.trim() &&
        form.email.trim()
      );
    }
    return form.id.trim() && form.password.trim();
  }, [form, isSignup]);

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
    setSuccess(null);
    router.replace(`/auth?mode=${nextMode}&next=${encodeURIComponent(nextPath)}`);
  };

  const handleChange =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!canSubmit) {
      setError("필수 항목을 입력해 주세요.");
      return;
    }

    if (isSignup) {
      const email = form.email.trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) {
        setError("올바른 이메일 형식을 입력해 주세요.");
        return;
      }
      const result = await register({
        id: form.id.trim(),
        password: form.password,
        affiliation: form.affiliation.trim(),
        email,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      console.log("회원가입 저장 완료:", {
        id: form.id.trim(),
        affiliation: form.affiliation.trim(),
        email,
      });
      setSuccess(result.message);
      router.replace(nextPath);
      return;
    }

    const result = await login({ id: form.id.trim(), password: form.password });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSuccess(result.message);
    router.replace(nextPath);
  };

  return (
    <main
      className={cn(
        "min-h-screen bg-[#0b0f1a] text-white",
        "relative overflow-hidden",
        "before:absolute before:inset-0 before:bg-[radial-gradient(60%_80%_at_80%_10%,rgba(59,130,246,0.22),transparent_60%)]",
        "after:absolute after:inset-0 after:bg-[radial-gradient(45%_60%_at_10%_30%,rgba(14,165,233,0.18),transparent_60%)]",
        "before:pointer-events-none after:pointer-events-none before:z-0 after:z-0"
      )}
    >
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-20 lg:px-10">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/70">
              DIF Pattern Detector
            </div>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              제한된 연구 인원을 위한
              <span className="block text-sky-300">보안 로그인</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              로그인 후에만 DIF 이미지 업로드, 패턴 결과, Grad-CAM 히트맵을 확인할 수 있습니다.
              승인된 연구 인원만 접근할 수 있도록 간단한 인증 절차를 제공합니다.
            </p>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
              계정이 없으면 회원 가입을 먼저 진행해 주세요.
            </div>
          </section>

          <section className="pointer-events-auto rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 shadow-[0_30px_120px_rgba(14,165,233,0.25)]">
            <div className="pointer-events-auto flex items-center gap-3">
              <button
                onClick={() => handleModeChange("login")}
                className={cn(
                  "pointer-events-auto rounded-full px-4 py-2 text-xs font-semibold transition",
                  isSignup
                    ? "border border-white/20 text-white/70 hover:text-white"
                    : "bg-sky-400 text-[#0b0f1a]"
                )}
              >
                로그인
              </button>
              <button
                onClick={() => handleModeChange("signup")}
                className={cn(
                  "pointer-events-auto rounded-full px-4 py-2 text-xs font-semibold transition",
                  isSignup
                    ? "bg-sky-400 text-[#0b0f1a]"
                    : "border border-white/20 text-white/70 hover:text-white"
                )}
              >
                회원 가입
              </button>
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              {isSignup ? "새 계정 만들기" : "계정 로그인"}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              {isSignup
                ? "ID, 비밀번호, 소속, 이메일 주소를 입력해 주세요."
                : "등록된 ID와 비밀번호를 입력해 주세요."}
            </p>

            <form className="mt-6 space-y-4 pointer-events-auto" onSubmit={handleSubmit}>
              <label className="block text-xs text-white/70 pointer-events-auto">
                ID
                <input
                  type="text"
                  name="id"
                  autoComplete="username"
                  placeholder="연구자 ID"
                  value={form.id}
                  onChange={handleChange("id")}
                  className="pointer-events-auto mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a]/80 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-sky-300 focus:outline-none"
                />
              </label>
              <label className="block text-xs text-white/70 pointer-events-auto">
                비밀번호
                <input
                  type="password"
                  name="password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder="비밀번호 입력"
                  value={form.password}
                  onChange={handleChange("password")}
                  className="pointer-events-auto mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a]/80 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-sky-300 focus:outline-none"
                />
              </label>

              {isSignup && (
                <>
                  <label className="block text-xs text-white/70 pointer-events-auto">
                    소속
                    <input
                      type="text"
                      name="affiliation"
                      placeholder="기관/랩/팀"
                      value={form.affiliation}
                      onChange={handleChange("affiliation")}
                      className="pointer-events-auto mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a]/80 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-sky-300 focus:outline-none"
                    />
                  </label>
                  <label className="block text-xs text-white/70 pointer-events-auto">
                    이메일 주소
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="you@lab.ac.kr"
                      value={form.email}
                      onChange={handleChange("email")}
                      className="pointer-events-auto mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a]/80 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-sky-300 focus:outline-none"
                    />
                  </label>
                </>
              )}

              {error && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
                  {success}
                </div>
              )}

              <button
                type="submit"
                className={cn(
                  "mt-2 w-full rounded-full px-6 py-3 text-sm font-semibold transition",
                  canSubmit
                    ? "bg-sky-400 text-[#0b0f1a] hover:bg-sky-300"
                    : "cursor-not-allowed bg-white/10 text-white/40"
                )}
              >
                {isSignup ? "회원 가입" : "로그인"}
              </button>
            </form>

            <div className="mt-6 text-xs text-white/60">
              {isSignup ? "이미 계정이 있나요?" : "계정이 없나요?"}{" "}
              <button
                type="button"
                onClick={() => handleModeChange(isSignup ? "login" : "signup")}
                className="text-sky-300 hover:text-sky-200"
              >
                {isSignup ? "로그인으로 이동" : "회원 가입으로 이동"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
