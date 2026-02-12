"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImageViewer from "@/components/dashboard/image-viewer";
import ClinicalTable from "@/components/dashboard/clinical-table";
import ViewerTree, { ViewerSample } from "@/components/dashboard/viewer-tree";

interface DashboardViewerProps {
  projectName?: string;
  samples: ViewerSample[];
  projects?: {
    name: string;
    samples: ViewerSample[];
    clinical?: { columns: string[]; rows: Record<string, string>[] };
  }[];
  initialSample: string;
  allowDelete?: boolean;
}

export default function DashboardViewer({
  projectName,
  samples,
  projects = [],
  initialSample,
  allowDelete = false,
}: DashboardViewerProps) {
  const router = useRouter();
  const initialProject = projectName || projects[0]?.name || "";
  const [activeProject, setActiveProject] = React.useState(initialProject);
  const [activeSample, setActiveSample] = React.useState(initialSample);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const projectSamples = React.useMemo(() => {
    if (!projects.length) return samples;
    return projects.find((p) => p.name === activeProject)?.samples || samples;
  }, [activeProject, projects, samples]);

  const projectClinical = React.useMemo(() => {
    if (!projects.length) return null;
    return projects.find((p) => p.name === activeProject)?.clinical || null;
  }, [activeProject, projects]);

  const current = React.useMemo(() => {
    return projectSamples.find((s) => s.name === activeSample) || projectSamples[0];
  }, [activeSample, projectSamples]);

  const summaryTable = React.useMemo(() => {
    const sampleMap = new Map(projectSamples.map((s) => [s.name, s]));

    const formatPair = (linear?: string, peri?: string) => {
      const l = linear ?? "";
      const p = peri ?? "";
      if (l === "" && p === "") return "";
      return `L:${l || "-"} / P:${p || "-"}`;
    };

    if (projectClinical?.rows?.length) {
      const clinicalCols = projectClinical.columns || [];
      const columns = [
        ...(clinicalCols.includes("Sample") ? [] : ["Sample"]),
        ...clinicalCols,
        "Ground Truth",
        "Prediction",
        "Correct",
        "Status",
      ];

      const rows = projectClinical.rows.map((row) => {
        const imageName =
          row.Image_name ||
          row.image_name ||
          row["Image Name"] ||
          row["image name"] ||
          row.Sample ||
          "";
        const sample = sampleMap.get(imageName);
        const gt = sample?.stats
          ? formatPair(sample.stats.linearTarget, sample.stats.periTarget)
          : "";
        const pred = sample?.stats
          ? formatPair(sample.stats.linearPrediction, sample.stats.periPrediction)
          : "";
        const correct = sample?.stats
          ? formatPair(sample.stats.linearCorrect, sample.stats.periCorrect)
          : "";
        const ready = pred !== "";
        const status = sample ? (ready ? "Ready" : "Pending") : "Missing";

        return {
          Sample: imageName || row.Sample || "",
          ...row,
          "Ground Truth": gt,
          Prediction: pred,
          Correct: correct,
          Status: status,
          __sampleName: sample ? sample.name : "",
        } as Record<string, string>;
      });

      return { columns, rows };
    }

    const columns = ["Sample", "Ground Truth", "Prediction", "Correct", "Status"];
    const rows = projectSamples.map((sample) => {
      const gt = formatPair(sample.stats?.linearTarget, sample.stats?.periTarget);
      const pred = formatPair(sample.stats?.linearPrediction, sample.stats?.periPrediction);
      const correct = formatPair(sample.stats?.linearCorrect, sample.stats?.periCorrect);
      const status = pred ? "Ready" : "Pending";
      return {
        Sample: sample.name,
        "Ground Truth": gt,
        Prediction: pred,
        Correct: correct,
        Status: status,
        __sampleName: sample.name,
      } as Record<string, string>;
    });

    return { columns, rows };
  }, [projectClinical, projectSamples]);

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

  const handleDeleteProject = async (name: string) => {
    if (!allowDelete || !name) return;
    await fetch("/api/results/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: name }),
    });
    router.refresh();
  };

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
        onDeleteProject={handleDeleteProject}
        allowDelete={allowDelete}
      />
      <div>
        <ImageViewer
          title={current.name}
          images={current.images}
          stats={current.stats}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
        />
        <ClinicalTable
          title={projectClinical ? "Clinical + Results" : "Results"}
          subtitle={
            projectClinical
              ? "Clinical data matched by Image_name"
              : "Results summary by sample"
          }
          data={summaryTable}
          onRowClick={(name) => {
            if (!name) return;
            setActiveSample(name);
            setActiveIndex(0);
          }}
        />
      </div>
    </div>
  );
}
