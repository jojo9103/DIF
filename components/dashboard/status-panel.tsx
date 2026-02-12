"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type JobStatus = "queued" | "running" | "done" | "failed";

type Job = {
  id: string;
  project?: string;
  status?: JobStatus;
  createdAt?: string;
  error?: string;
  progress?: number;
};

export type StatusType = "success" | "error" | "warning" | "info" | "pending" | "default";

interface StatusConfig {
  icon: React.ReactNode;
  classNames: string;
  role: "status" | "alert" | "none";
}

const STATUS_MAP: Record<StatusType, StatusConfig> = {
  success: {
    icon: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
    classNames:
      "bg-green-500/10 text-green-300 border-green-500/20 hover:bg-green-500/20",
    role: "status",
  },
  error: {
    icon: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    ),
    classNames:
      "bg-red-500/10 text-red-300 border-red-500/20 hover:bg-red-500/20",
    role: "alert",
  },
  warning: {
    icon: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 9v4m0 4h.01" />
        <path d="M10 3h4l7 14H3z" />
      </svg>
    ),
    classNames:
      "bg-yellow-500/10 text-yellow-300 border-yellow-500/20 hover:bg-yellow-500/20",
    role: "alert",
  },
  info: {
    icon: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 8h.01M12 12v4" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
    classNames:
      "bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20",
    role: "status",
  },
  pending: {
    icon: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 6v6l4 2" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
    classNames:
      "bg-orange-500/10 text-orange-300 border-orange-500/20 hover:bg-orange-500/20",
    role: "status",
  },
  default: {
    icon: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14" />
      </svg>
    ),
    classNames: "bg-white/5 text-white/60 border-white/10 hover:bg-white/10",
    role: "none",
  },
};

export interface StatusBadgeProps {
  children: React.ReactNode;
  status: StatusType;
  className?: string;
  hideIcon?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  children,
  status,
  className,
  hideIcon = false,
}) => {
  const config = useMemo(() => STATUS_MAP[status] || STATUS_MAP.default, [status]);

  return (
    <Badge
      className={cn(
        "flex items-center gap-1 text-xs h-5 px-2 py-0 border transition-all duration-200 cursor-default",
        config.classNames,
        className
      )}
      role={config.role}
      aria-live={config.role === "alert" ? "assertive" : "polite"}
    >
      {!hideIcon && config.icon}
      <span className="truncate">{children}</span>
    </Badge>
  );
};

const mapStatus = (status?: JobStatus): StatusType => {
  switch (status) {
    case "running":
      return "info";
    case "done":
      return "success";
    case "failed":
      return "error";
    case "queued":
      return "pending";
    default:
      return "default";
  }
};

export default function StatusPanel() {
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [showRunningOnly, setShowRunningOnly] = React.useState(false);
  const [errorModal, setErrorModal] = React.useState<{ title: string; error: string } | null>(
    null
  );

  const fetchJobs = React.useCallback(async () => {
    const res = await fetch("/api/jobs", { cache: "no-store" });
    const data = await res.json();
    if (data?.ok) {
      const next = Array.isArray(data.jobs) ? data.jobs : [];
      next.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setJobs(next);
    }
  }, []);

  React.useEffect(() => {
    fetchJobs();
    const id = setInterval(fetchJobs, 5000);
    return () => clearInterval(id);
  }, [fetchJobs]);

  const activeJobs = React.useMemo(
    () => jobs.filter((job) => job.status === "queued" || job.status === "running"),
    [jobs]
  );

  const completedJobs = React.useMemo(
    () => jobs.filter((job) => job.status === "done" || job.status === "failed"),
    [jobs]
  );

  const visibleJobs = React.useMemo(() => {
    if (!showRunningOnly) return jobs;
    return jobs.filter((job) => job.status === "running");
  }, [jobs, showRunningOnly]);

  const clearCompleted = async () => {
    if (!completedJobs.length) return;
    await fetch("/api/jobs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: completedJobs.map((j) => j.id) }),
    });
    fetchJobs();
  };

  return (
    <section id="status" className="mt-12">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Status</h2>
            <p className="mt-1 text-xs text-white/60">5초마다 자동 갱신됩니다.</p>
          </div>
          <StatusBadge status={activeJobs.length ? "info" : "default"}>
            {activeJobs.length ? `${activeJobs.length} running` : "idle"}
          </StatusBadge>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              checked={showRunningOnly}
              onChange={(e) => setShowRunningOnly(e.target.checked)}
            />
            running만 보기
          </label>
        </div>

        <div className="mt-4 space-y-3">
          {visibleJobs.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              현재 표시할 프로젝트가 없습니다.
            </div>
          )}

          {visibleJobs.map((job) => {
            const isFailed = job.status === "failed";
            return (
              <div
                key={job.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-white">{job.project || "project"}</div>
                  <StatusBadge status={mapStatus(job.status)}>{job.status}</StatusBadge>
                </div>
                <div className="mt-1 text-[11px] text-white/50">{job.id}</div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-white/60">
                  <div>진행률</div>
                  <div className="text-white">{job.progress ?? "-"}</div>
                </div>
                {isFailed && (
                  <button
                    type="button"
                    onClick={() =>
                      setErrorModal({
                        title: job.project || "project",
                        error: job.error || "알 수 없는 오류",
                      })
                    }
                    className="mt-3 text-[11px] text-red-200 underline-offset-2 hover:underline"
                  >
                    실패 원인 보기
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={clearCompleted}
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/15"
          >
            완료된 프로젝트 삭제
          </button>
        </div>
      </div>
      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#141414] p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">실패 원인</h3>
              <button
                type="button"
                onClick={() => setErrorModal(null)}
                className="text-xs text-white/70 hover:text-white"
              >
                닫기
              </button>
            </div>
            <div className="mt-3 text-sm text-white/70">{errorModal.title}</div>
            <pre className="mt-4 max-h-64 overflow-auto rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-red-200">
              {errorModal.error}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
