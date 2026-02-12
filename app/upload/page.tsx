"use client";

import React from "react";
import RequireAuth from "@/components/auth/require-auth";
import DashboardNavbar from "@/components/dashboard/navbar";

export default function UploadPage() {
  const [mode, setMode] = React.useState<"single" | "folder">("single");
  const [projectName, setProjectName] = React.useState("");
  const [backbone, setBackbone] = React.useState("resnext50_32x4d");
  const [modelNumber, setModelNumber] = React.useState("");
  const [models, setModels] = React.useState<Record<string, string[]>>({});
  const [status, setStatus] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const loadModels = async () => {
      const res = await fetch("/api/models", { cache: "no-store" });
      const data = await res.json();
      if (data?.ok) {
        setModels(data.models || {});
        const firstBackbone = Object.keys(data.models || {})[0];
        if (firstBackbone) {
          setBackbone(firstBackbone);
          const nums = data.models[firstBackbone] || [];
          setModelNumber(nums[0] || "");
        }
      }
    };
    loadModels();
  }, []);

  React.useEffect(() => {
    const nums = models[backbone] || [];
    if (!nums.includes(modelNumber)) {
      setModelNumber(nums[0] || "");
    }
  }, [backbone, models, modelNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const files = inputRef.current?.files;
    if (!files || files.length === 0) {
      setStatus("업로드할 파일 또는 폴더를 선택해 주세요.");
      return;
    }
    if (mode === "single" && !projectName.trim()) {
      setStatus("프로젝트명을 입력해 주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("mode", mode);
    formData.append("backbone", backbone);
    formData.append("modelNumber", modelNumber);
    if (mode === "single") {
      formData.append("projectName", projectName.trim());
    }
    Array.from(files).forEach((file) => {
      formData.append("files", file, file.webkitRelativePath || file.name);
    });

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setStatus(data.message || "업로드에 실패했습니다.");
      return;
    }
    setStatus("업로드가 완료되었습니다.");
    setProjectName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <RequireAuth>
      <main className="min-h-screen bg-[#181818] text-white">
        <DashboardNavbar />
        <section className="relative min-h-screen px-6 pb-16 pt-28 lg:px-10">
          <div
            className="absolute inset-0 -z-10"
            style={{
              backgroundColor: "#181818",
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
          <div className="mx-auto w-full max-w-6xl">
            <h1 className="text-3xl font-semibold">DIF 이미지 업로드</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70">
              로그인된 사용자만 업로드할 수 있습니다. DIF 이미지를 선택하면 패턴 결과와
              Grad-CAM 히트맵을 생성합니다.
            </p>
            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8"
            >
              <div className="flex flex-wrap gap-3 text-xs text-white/70">
                <button
                  type="button"
                  onClick={() => setMode("single")}
                  className={`rounded-full border px-4 py-2 transition ${
                    mode === "single"
                      ? "border-white/60 bg-white/10 text-white"
                      : "border-white/10 bg-white/5 hover:border-white/30"
                  }`}
                >
                  이미지 1장
                </button>
                <button
                  type="button"
                  onClick={() => setMode("folder")}
                  className={`rounded-full border px-4 py-2 transition ${
                    mode === "folder"
                      ? "border-white/60 bg-white/10 text-white"
                      : "border-white/10 bg-white/5 hover:border-white/30"
                  }`}
                >
                  폴더 업로드
                </button>
              </div>

              <div>
                <div className="text-xs text-white/60">업로드 영역</div>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  {...(mode === "folder" ? { webkitdirectory: "true" } : {})}
                  className="mt-4 block w-full cursor-pointer rounded-2xl border border-dashed border-white/20 bg-[#0f172a]/60 px-4 py-6 text-sm text-white/60 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:text-white"
                />
              </div>

              {mode === "single" && (
                <div>
                  <label className="text-xs text-white/60">프로젝트명</label>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="예: project_alpha"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a]/80 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-white/60">Backbone 선택</label>
                <select
                  value={backbone}
                  onChange={(e) => setBackbone(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a]/80 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                >
                  {Object.keys(models).length === 0 && (
                    <option value="">모델이 없습니다</option>
                  )}
                  {Object.keys(models).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/60">모델 번호</label>
                <select
                  value={modelNumber}
                  onChange={(e) => setModelNumber(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a]/80 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                >
                  {(models[backbone] || []).map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-sky-400 px-6 py-3 text-sm font-semibold text-[#0b0f1a] transition hover:bg-sky-300"
                >
                  업로드
                </button>
                {status && <span className="text-xs text-white/70">{status}</span>}
              </div>
            </form>
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}
