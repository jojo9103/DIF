"use client";

import React from "react";
import Link from "next/link";
import ImageViewer from "@/components/dashboard/image-viewer";
import ViewerTree, { ViewerSample } from "@/components/dashboard/viewer-tree";

interface DashboardViewerProps {
  projectName?: string;
  samples: ViewerSample[];
  projects?: { name: string; samples: ViewerSample[] }[];
  initialSample: string;
}

export default function DashboardViewer({
  projectName,
  samples,
  projects = [],
  initialSample,
}: DashboardViewerProps) {
  const initialProject = projectName || projects[0]?.name || "";
  const [activeProject, setActiveProject] = React.useState(initialProject);
  const [activeSample, setActiveSample] = React.useState(initialSample);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const projectSamples = React.useMemo(() => {
    if (!projects.length) return samples;
    return projects.find((p) => p.name === activeProject)?.samples || samples;
  }, [activeProject, projects, samples]);

  const current = React.useMemo(() => {
    return projectSamples.find((s) => s.name === activeSample) || projectSamples[0];
  }, [activeSample, projectSamples]);

  React.useEffect(() => {
    if (!current) return;
    if (current.name !== activeSample) {
      setActiveSample(current.name);
    }
  }, [activeSample, current]);

  React.useEffect(() => {
    if (!projects.length) return;
    if (!activeProject) {
      setActiveProject(projects[0]?.name || "");
      setActiveSample(projects[0]?.samples?.[0]?.name || "");
      setActiveIndex(0);
    }
  }, [activeProject, projects]);

  if (!current) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-white/60">
        <div>표시할 샘플이 없습니다.</div>
        <div className="text-white/70">
          업로드 후 결과를 확인하려면 아래 버튼을 눌러 분석을 시작하세요.
        </div>
        <div>
          <Link
            href="/upload"
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-2 text-xs font-semibold text-white transition hover:border-white/35 hover:bg-white/15"
          >
            Start analysis
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[280px_1fr]">
      <ViewerTree
        projectName={activeProject}
        projects={projects}
        samples={projectSamples}
        activeSample={current.name}
        activeIndex={activeIndex}
        onSelectSample={(name) => {
          setActiveSample(name);
          setActiveIndex(0);
        }}
        onSelectImage={(index) => setActiveIndex(index)}
        onSelectProject={(name) => {
          setActiveProject(name);
          const nextSamples = projects.find((p) => p.name === name)?.samples || [];
          setActiveSample(nextSamples[0]?.name || "");
          setActiveIndex(0);
        }}
      />
      <ImageViewer
        title={current.name}
        images={current.images}
        stats={current.stats}
        activeIndex={activeIndex}
        onIndexChange={setActiveIndex}
      />
    </div>
  );
}
