"use client";

import RequireAuth from "@/components/auth/require-auth";
import Navbar from "@/components/main/navbar";

export default function DemoPage() {
  return (
    <RequireAuth>
      <main className="min-h-screen bg-[#0b0f1a] text-white">
        <Navbar />
        <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-20 lg:px-10">
          <h1 className="text-3xl font-semibold">Demo 결과 보기</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/70">
            승인된 사용자만 데모 결과를 확인할 수 있습니다. 샘플 DIF 이미지의 패턴
            분류와 Grad-CAM 히트맵을 제공합니다.
          </p>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="text-xs text-white/60">Demo Preview</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#0f172a]/80 p-5 text-sm text-white/70">
                패턴 결과 요약 영역
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0f172a]/80 p-5 text-sm text-white/70">
                Grad-CAM 히트맵 미리보기
              </div>
            </div>
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}
