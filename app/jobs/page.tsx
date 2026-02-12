"use client";

import React from "react";
import { cn } from "@/lib/utils";

type JobStatus = "queued" | "running" | "done" | "failed";

type Job = {
  id: string;
  userId?: string;
  project?: string;
  status?: JobStatus;
  createdAt?: string;
  error?: string;
  progress?: number;
};

type StatusType = "success" | "error" | "warning" | "info" | "pending" | "default";

const STATUS_MAP: Record<StatusType, { classNames: string; icon: React.ReactNode }> = {
  success: {
    classNames: "bg-green-500/10 text-green-300 border-green-500/20",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
  error: {
    classNames: "bg-red-500/10 text-red-300 border-red-500/20",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    ),
  },
  warning: {
    classNames: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 9v4m0 4h.01" />
        <path d="M10 3h4l7 14H3z" />
      </svg>
    ),
  },
  info: {
    classNames: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 8h.01M12 12v4" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  pending: {
    classNames: "bg-orange-500/10 text-orange-300 border-orange-500/20",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 6v6l4 2" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  default: {
    classNames: "bg-white/5 text-white/60 border-white/10",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14" />
      </svg>
    ),
  },
};

const StatusBadge = ({
  status,
  children,
  className,
}: {
  status: StatusType;
  children: React.ReactNode;
  className?: string;
}) => {
  const config = STATUS_MAP[status] || STATUS_MAP.default;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        config.classNames,
        className
      )}
    >
      {config.icon}
      {children}
    </span>
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

export default function JobsPage() {
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);

  const fetchJobs = React.useCallback(async () => {
    const res = await fetch("/api/jobs", { cache: "no-store" });
    const data = await res.json();
    if (data?.ok) {
      setJobs(data.jobs || []);
      setLastUpdated(new Date());
    }
  }, []);

  React.useEffect(() => {
    fetchJobs();
    const id = setInterval(fetchJobs, 5000);
    return () => clearInterval(id);
  }, [fetchJobs]);

  const summary = React.useMemo(() => {
    const counts = { queued: 0, running: 0, done: 0, failed: 0 };
    jobs.forEach((j) => {
      if (j.status && counts[j.status] !== undefined) counts[j.status] += 1;
    });
    return counts;
  }, [jobs]);

  return (
    <main className="min-h-screen bg-[#181818] text-white">
      <section className="relative min-h-screen px-6 pb-16 pt-10 lg:px-10">
        <div className="mx-auto w-full max-w-6xl">
          <h1 className="text-3xl font-semibold">Job Status</h1>
          <p className="mt-2 text-sm text-white/60">
            5초마다 자동 갱신됩니다.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs">
              <div className="text-white/50">Queued</div>
              <div className="mt-2 text-lg">{summary.queued}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs">
              <div className="text-white/50">Running</div>
              <div className="mt-2 text-lg">{summary.running}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs">
              <div className="text-white/50">Done</div>
              <div className="mt-2 text-lg">{summary.done}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs">
              <div className="text-white/50">Failed</div>
              <div className="mt-2 text-lg">{summary.failed}</div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
            마지막 갱신: {lastUpdated ? lastUpdated.toLocaleTimeString() : "대기 중"}
          </div>

          <div className="mt-6 space-y-3">
            {jobs.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
                현재 처리 중인 작업이 없습니다.
              </div>
            )}

            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-white">
                      {job.project || "프로젝트 없음"}
                    </div>
                    <div className="mt-1 text-[11px] text-white/50">
                      {job.id}
                    </div>
                  </div>
                  <StatusBadge status={mapStatus(job.status)}>
                    {job.status || "unknown"}
                  </StatusBadge>
                </div>

                <div className="mt-3 grid gap-3 text-[11px] text-white/60 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <div className="text-white/40">진행률</div>
                    <div className="mt-1 text-white">
                      {typeof job.progress === "number"
                        ? `${Math.round(job.progress)}%`
                        : "표시 없음"}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40">시작 시간</div>
                    <div className="mt-1 text-white">
                      {job.createdAt || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40">상태 요약</div>
                    <div className="mt-1 text-white">
                      {job.status === "running"
                        ? "모델 실행 중"
                        : job.status === "queued"
                        ? "대기 중"
                        : job.status === "done"
                        ? "완료"
                        : job.status === "failed"
                        ? "실패"
                        : "알 수 없음"}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40">에러</div>
                    <div className="mt-1 text-white">
                      {job.error || "-"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
