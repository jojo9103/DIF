"use client";

import React from "react";
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
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-white/60">
        표시할 샘플이 없습니다. `public/viewer/{프로젝트}/{샘플}` 폴더를 추가해 주세요.
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
