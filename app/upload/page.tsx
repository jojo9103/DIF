"use client";

import RequireAuth from "@/components/auth/require-auth";
import Navbar from "@/components/main/navbar";

export default function UploadPage() {
  return (
    <RequireAuth>
      <main className="min-h-screen bg-[#0b0f1a] text-white">
        <Navbar />
        <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-20 lg:px-10">
          <h1 className="text-3xl font-semibold">DIF 이미지 업로드</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/70">
            로그인된 사용자만 업로드할 수 있습니다. DIF 이미지를 선택하면 패턴 결과와
            Grad-CAM 히트맵을 생성합니다.
          </p>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="text-xs text-white/60">업로드 영역</div>
            <div className="mt-4 flex h-48 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-[#0f172a]/60 text-sm text-white/50">
              파일을 드래그하거나 클릭해서 업로드하세요.
            </div>
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}
