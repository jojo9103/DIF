"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Tree, TreeItem, TreeItemLabel, ItemInstance } from "@/components/ui/tree";

export type ViewerSample = {
  name: string;
  images: { src: string; label: string }[];
  stats?: {
    linearTarget?: string;
    linearProbability?: string;
    linearCorrect?: string;
    periTarget?: string;
    periProbability?: string;
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

  const makeProjectItem = (name: string, isActive: boolean): ItemInstance => ({
    getItemName: () => name,
    getItemMeta: () => ({ level: 0 }),
    isFolder: () => true,
    isExpanded: () => expanded[`project:${name}`] ?? isActive,
    isSelected: () => isActive,
    isMatchingSearch: () => false,
  });

  const makeSampleItem = (
    project: string,
    sampleName: string,
    isActive: boolean
  ): ItemInstance => ({
    getItemName: () => sampleName,
    getItemMeta: () => ({ level: 1 }),
    isFolder: () => true,
    isExpanded: () => expanded[`sample:${project}:${sampleName}`] ?? isActive,
    isSelected: () => isActive,
    isMatchingSearch: () =>
      query.trim() ? sampleName.toLowerCase().includes(query.toLowerCase()) : false,
  });

  const makeImageItem = (name: string, index: number, isActive: boolean): ItemInstance => ({
    getItemName: () => name,
    getItemMeta: () => ({ level: 2 }),
    isFolder: () => false,
    isExpanded: () => false,
    isSelected: () => isActive,
    isMatchingSearch: () =>
      query.trim() ? name.toLowerCase().includes(query.toLowerCase()) : false,
  });

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
        <Tree indent={18} className="gap-1 text-white/80">
          {(projects.length ? projects : projectName ? [{ name: projectName, samples }] : [])
            .filter((project) => {
              if (!query.trim()) return true;
              return project.samples.some((sample) =>
                sample.name.toLowerCase().includes(query.trim().toLowerCase())
              );
            })
            .map((project) => {
              const isActiveProject = project.name === projectName;
              const projectOpen = expanded[`project:${project.name}`] ?? isActiveProject;
              const projectSamples = query.trim()
                ? project.samples.filter((sample) =>
                    sample.name.toLowerCase().includes(query.trim().toLowerCase())
                  )
                : project.samples;

              return (
                <div key={project.name} className="mb-1">
                  <TreeItem
                    item={makeProjectItem(project.name, isActiveProject)}
                    onClick={() => {
                      onSelectProject?.(project.name);
                      toggleProject(project.name);
                    }}
                    className={cn(
                      "flex w-full items-center rounded-xl border px-2 py-1.5 text-left text-sm transition",
                      isActiveProject
                        ? "border-white/60 bg-white/10 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                    )}
                  >
                    <TreeItemLabel className="text-xs text-white/80">
                      {project.name}
                    </TreeItemLabel>
                  </TreeItem>

                  {projectOpen && (
                    <div className="mt-1 space-y-1">
                      {projectSamples.map((sample) => {
                        const isActive = sample.name === activeSample;
                        const sampleOpen =
                          expanded[`sample:${project.name}:${sample.name}`] ?? isActive;
                        const item = makeSampleItem(project.name, sample.name, isActive);
                        return (
                          <div key={`${project.name}-${sample.name}`} className="mb-1">
                            <TreeItem
                              item={item}
                              onClick={() => {
                                onSelectSample(sample.name);
                                toggleSample(project.name, sample.name);
                              }}
                              className={cn(
                                "flex w-full items-center justify-between rounded-xl border px-2 py-1.5 text-left text-sm transition",
                                isActive
                                  ? "border-white/60 bg-white/10 text-white"
                                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                              )}
                            >
                              <TreeItemLabel className="text-xs text-white/80">
                                {sample.name}
                              </TreeItemLabel>
                            </TreeItem>

                            {sampleOpen && (
                              <div className="mt-1 space-y-1">
                                {sample.images.map((img, index) => {
                                  const active = isActive && index === activeIndex;
                                  const childItem = makeImageItem(img.label, index, active);
                                  return (
                                    <TreeItem
                                      key={img.src}
                                      item={childItem}
                                      onClick={() => {
                                        onSelectSample(sample.name);
                                        onSelectImage(index);
                                      }}
                                      className={cn(
                                        "flex w-full items-center rounded-lg border px-2 py-1 text-left text-xs transition",
                                        active
                                          ? "border-sky-300/70 bg-sky-400/10 text-white"
                                          : "border-white/5 bg-white/5 text-white/60 hover:border-white/20"
                                      )}
                                    >
                                      <TreeItemLabel className="text-[11px] text-white/70">
                                        {img.label}
                                      </TreeItemLabel>
                                    </TreeItem>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </Tree>
        {query.trim() && !filtered.length && (
          <div className="text-xs text-white/50">검색 결과가 없습니다.</div>
        )}
      </div>
    </aside>
  );
}
