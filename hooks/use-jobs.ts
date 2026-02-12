"use client";

import React from "react";

type JobStatus = "queued" | "running" | "done" | "failed" | "canceled";

export type Job = {
  id: string;
  project?: string;
  status?: JobStatus;
  createdAt?: string;
  error?: string;
  progress?: number;
};

export function useJobs(pollMs = 5000) {
  const [jobs, setJobs] = React.useState<Job[]>([]);

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
    const id = setInterval(fetchJobs, pollMs);
    return () => clearInterval(id);
  }, [fetchJobs, pollMs]);

  const activeJobs = React.useMemo(
    () => jobs.filter((job) => job.status === "queued" || job.status === "running"),
    [jobs]
  );

  const completedJobs = React.useMemo(
    () => jobs.filter((job) => job.status === "done" || job.status === "failed" || job.status === "canceled"),
    [jobs]
  );

  return { jobs, setJobs, fetchJobs, activeJobs, completedJobs };
}
