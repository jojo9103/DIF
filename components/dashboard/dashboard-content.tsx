"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DashboardViewer from "@/components/dashboard/dashboard-viewer";
import StatusPanel from "@/components/dashboard/status-panel";
import { ViewerSample } from "@/components/dashboard/viewer-tree";

interface DashboardContentProps {
  projectName?: string;
  samples: ViewerSample[];
  projects?: { name: string; samples: ViewerSample[] }[];
  initialSample: string;
  hasResults: boolean;
}

export default function DashboardContent({
  projectName,
  samples,
  projects = [],
  initialSample,
  hasResults,
}: DashboardContentProps) {
  const router = useRouter();
  const [view, setView] = React.useState<"result" | "status">(
    typeof window !== "undefined" && window.location.hash === "#status" ? "status" : "result"
  );

  React.useEffect(() => {
    const onHash = () => {
      setView(window.location.hash === "#status" ? "status" : "result");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const handleOpenResult = (project: string) => {
    if (!project) return;
    setView("result");
    router.push(`/dashboard?project=${encodeURIComponent(project)}`);
  };

  if (view === "status") {
    return <StatusPanel onOpenResult={handleOpenResult} />;
  }

  if (!hasResults) {
    return (
      <div className="space-y-6">
        <div className="mx-auto w-full max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
          <div>표시할 결과가 없습니다.</div>
          <div className="mt-2 text-white/70">
            업로드 후 결과를 확인하려면 아래 버튼을 눌러 분석을 시작하세요.
          </div>
          <button
            type="button"
            onClick={() => router.push("/upload")}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-2 text-xs font-semibold text-white transition hover:border-white/35 hover:bg-white/15"
          >
            Start analysis
          </button>
        </div>
        <StatusPanel onOpenResult={handleOpenResult} />
      </div>
    );
  }

  return (
    <DashboardViewer
      projectName={projectName}
      samples={samples}
      projects={projects}
      initialSample={initialSample}
    />
  );
}
