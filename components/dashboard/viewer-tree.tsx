"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  TreeProvider,
  TreeView,
  TreeNode,
  TreeNodeTrigger,
  TreeNodeContent,
  TreeExpander,
  TreeIcon,
  TreeLabel,
} from "@/components/ui/tree";

export type ViewerSample = {
  name: string;
  images: { src: string; label: string }[];
  stats?: {
    linearTarget?: string;
    linearProbability?: string;
    linearPrediction?: string;
    linearCorrect?: string;
    periTarget?: string;
    periProbability?: string;
    periPrediction?: string;
    periCorrect?: string;
  };
};

interface ViewerTreeProps {
  projectName?: string;
  projects?: { name: string; samples: ViewerSample[] }[];
  samples: ViewerSample[];
  activeSample: string;
  activeIndex: number;
  onSelectSample: (name: string) => void;
  onSelectImage: (index: number) => void;
  onSelectProject?: (name: string) => void;
}

export default function ViewerTree({
  projectName,
  projects = [],
  samples,
  activeSample,
  activeIndex,
  onSelectSample,
  onSelectImage,
  onSelectProject,
}: ViewerTreeProps) {
  const [query, setQuery] = React.useState("");
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [showSuggestions, setShowSuggestions] = React.useState(true);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return samples;
    return samples.filter((s) => s.name.toLowerCase().includes(q));
  }, [query, samples]);

  const suggestions = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return samples
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, samples]);

  const toggle = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleProject = (name: string) => {
    toggle(`project:${name}`);
  };

  const toggleSample = (project: string, sampleName: string) => {
    toggle(`sample:${project}:${sampleName}`);
  };

  const handleSuggestionClick = (name: string) => {
    setQuery(name);
    setShowSuggestions(false);
  };

  const handleReset = () => {
    setQuery("");
    setShowSuggestions(true);
  };

  return (
    <aside className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-white/50">Viewer Tree</div>
        <div className="relative mt-4">
          <div className="flex items-center rounded-2xl border border-white/10 bg-[#1a1a1a]/80 px-4 py-2">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-white/50"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Search sample..."
              className="ml-3 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            />
            {query && (
              <button
                type="button"
                onClick={handleReset}
                className="ml-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-white/40 hover:text-white"
                aria-label="Clear search"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 6l12 12" />
                  <path d="M18 6l-12 12" />
                </svg>
              </button>
            )}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-12 z-10 overflow-hidden rounded-2xl border border-white/10 bg-[#222]/95 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
              {suggestions.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    handleSuggestionClick(item.name);
                  }}
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-xs text-white/80 transition hover:bg-white/10"
                >
                  <span className="truncate">{item.name}</span>
                  <span className="text-[10px] text-white/40">
                    {item.images.length} images
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <TreeProvider
          defaultExpandedIds={[
            projectName ? `project:${projectName}` : "",
            projectName && activeSample ? `sample:${projectName}:${activeSample}` : "",
          ].filter(Boolean)}
          selectedIds={[
            activeIndex >= 0 && activeSample
              ? `image:${projectName}:${activeSample}:${activeIndex}`
              : activeSample
              ? `sample:${projectName}:${activeSample}`
              : projectName
              ? `project:${projectName}`
              : "",
          ].filter(Boolean)}
          showLines
          showIcons
          className="text-white/80"
        >
          <TreeView>
            {(projects.length ? projects : projectName ? [{ name: projectName, samples }] : [])
              .filter((project) => {
                if (!query.trim()) return true;
                return project.samples.some((sample) =>
                  sample.name.toLowerCase().includes(query.trim().toLowerCase())
                );
              })
              .map((project, projectIndex, projectArray) => {
                const isLastProject = projectIndex === projectArray.length - 1;
                const projectSamples = query.trim()
                  ? project.samples.filter((sample) =>
                      sample.name.toLowerCase().includes(query.trim().toLowerCase())
                    )
                  : project.samples;
                return (
                  <TreeNode
                    key={project.name}
                    nodeId={`project:${project.name}`}
                    level={0}
                    isLast={isLastProject}
                  >
                    <TreeNodeTrigger
                      className="border border-white/10 bg-white/5 text-white/70 hover:text-white"
                      onClick={() => {
                        onSelectProject?.(project.name);
                        toggleProject(project.name);
                      }}
                    >
                      <TreeExpander hasChildren />
                      <TreeIcon hasChildren />
                      <TreeLabel>{project.name}</TreeLabel>
                    </TreeNodeTrigger>
                    <TreeNodeContent hasChildren>
                      {projectSamples.map((sample, sampleIndex) => {
                        const isLastSample = sampleIndex === projectSamples.length - 1;
                        return (
                          <TreeNode
                            key={`${project.name}-${sample.name}`}
                            nodeId={`sample:${project.name}:${sample.name}`}
                            level={1}
                            isLast={isLastSample}
                            parentPath={[isLastProject]}
                          >
                            <TreeNodeTrigger
                              className="border border-white/10 bg-white/5 text-white/70 hover:text-white"
                              onClick={() => {
                                onSelectSample(sample.name);
                                toggleSample(project.name, sample.name);
                              }}
                            >
                              <TreeExpander hasChildren />
                              <TreeIcon hasChildren />
                              <TreeLabel>{sample.name}</TreeLabel>
                            </TreeNodeTrigger>
                            <TreeNodeContent hasChildren>
                              {sample.images.map((img, imgIndex) => {
                                const isLastImage = imgIndex === sample.images.length - 1;
                                return (
                                  <TreeNode
                                    key={`${project.name}-${sample.name}-${img.label}`}
                                    nodeId={`image:${project.name}:${sample.name}:${imgIndex}`}
                                    level={2}
                                    isLast={isLastImage}
                                    parentPath={[isLastProject, isLastSample]}
                                  >
                                    <TreeNodeTrigger
                                      className="border border-white/10 bg-white/5 text-white/60 hover:text-white"
                                      onClick={() => {
                                        onSelectSample(sample.name);
                                        onSelectImage(imgIndex);
                                      }}
                                    >
                                      <TreeExpander hasChildren={false} />
                                      <TreeIcon hasChildren={false} />
                                      <TreeLabel>{img.label}</TreeLabel>
                                    </TreeNodeTrigger>
                                  </TreeNode>
                                );
                              })}
                            </TreeNodeContent>
                          </TreeNode>
                        );
                      })}
                    </TreeNodeContent>
                  </TreeNode>
                );
              })}
          </TreeView>
        </TreeProvider>
        {query.trim() && !filtered.length && (
          <div className="text-xs text-white/50">검색 결과가 없습니다.</div>
        )}
      </div>
    </aside>
  );
}
