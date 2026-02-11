"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type DashboardImage = {
  src: string;
  label: string;
};

export type HeatmapStats = {
  linearTarget?: string;
  linearProbability?: string;
  linearCorrect?: string;
  periTarget?: string;
  periProbability?: string;
  periCorrect?: string;
};

interface ImageViewerProps {
  title: string;
  images: DashboardImage[];
  stats?: HeatmapStats;
  activeIndex?: number;
  onIndexChange?: (index: number) => void;
  className?: string;
}

export default function ImageViewer({
  title,
  images,
  stats,
  activeIndex,
  onIndexChange,
  className,
}: ImageViewerProps) {
  const [index, setIndex] = React.useState(0);
  const [scale, setScale] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const dragStart = React.useRef({ x: 0, y: 0 });
  const offsetStart = React.useRef({ x: 0, y: 0 });
  const viewportRef = React.useRef<HTMLDivElement>(null);

  const resolvedIndex = typeof activeIndex === "number" ? activeIndex : index;

  const setSafeIndex = (next: number) => {
    if (!images.length) return;
    const safe = (next + images.length) % images.length;
    if (typeof activeIndex === "number") {
      onIndexChange?.(safe);
    } else {
      setIndex(safe);
      onIndexChange?.(safe);
    }
  };

  const prev = () => setSafeIndex(index - 1);
  const next = () => setSafeIndex(index + 1);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") {
        setScale(1);
        setOffset({ x: 0, y: 0 });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedIndex, images.length]);

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.min(4, Math.max(0.6, prev + delta)));
  };

  React.useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({ x: offsetStart.current.x + dx, y: offsetStart.current.y + dy });
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  if (!images.length) {
    return (
      <div
        className={cn(
          "flex h-[560px] w-full items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-sm text-white/50",
          className
        )}
      >
        표시할 이미지가 없습니다. `public/viewer/{샘플명}` 폴더를 추가해 주세요.
      </div>
    );
  }

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-6xl rounded-[32px] border border-white/10 bg-[#1c1c1c]/70 p-6 shadow-[0_25px_70px_rgba(0,0,0,0.45)]",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-white/50">Result Viewer</div>
          <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-white/30"
            aria-label="Previous image"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-white/70 transition group-hover:text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={next}
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-white/30"
            aria-label="Next image"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-white/70 transition group-hover:text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[110px_1fr]">
        <div className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible">
          {images.map((img, i) => {
            const active = i === resolvedIndex;
            return (
              <button
                key={img.src}
                type="button"
                onClick={() => setSafeIndex(i)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-0 transition",
                  active ? "border-white/60" : "border-white/10 hover:border-white/40"
                )}
              >
                <img
                  src={img.src}
                  alt={img.label}
                  className="h-20 w-20 object-cover lg:h-24 lg:w-24"
                  loading={i === 0 ? "eager" : "lazy"}
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] text-white/80">
                  {img.label}
                </div>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <div
            className={cn(
              "flex h-[560px] w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/30",
              dragging ? "cursor-grabbing" : "cursor-grab"
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ touchAction: "none" }}
            ref={viewportRef}
          >
            <img
              src={images[resolvedIndex].src}
              alt={images[resolvedIndex].label}
              className="h-full w-full object-contain"
              draggable={false}
              style={{
                userSelect: "none",
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transition: dragging ? "none" : "transform 120ms ease-out",
              }}
            />
          </div>
          <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70 backdrop-blur">
            {images[resolvedIndex].label}
          </div>
          <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70 backdrop-blur">
            <span>{Math.round(scale * 100)}%</span>
            <button
              type="button"
              onClick={() => setScale((prev) => Math.min(4, prev + 0.2))}
              className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/80 hover:border-white/40"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setScale((prev) => Math.max(0.6, prev - 0.2))}
              className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/80 hover:border-white/40"
            >
              -
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/80 hover:border-white/40"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {(() => {
        const linearProb = stats?.linearProbability ? Number(stats.linearProbability) : undefined;
        const periProb = stats?.periProbability ? Number(stats.periProbability) : undefined;
        const linearPercent = Number.isFinite(linearProb) ? Math.round(linearProb * 100) : null;
        const periPercent = Number.isFinite(periProb) ? Math.round(periProb * 100) : null;

        return (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                Pattern Result
              </div>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-[#151515]/70 p-4">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>Linear Pattern Probability</span>
                    <span>{linearPercent !== null ? `${linearPercent}%` : "-"}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-sky-400"
                      style={{ width: `${linearPercent ?? 0}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#151515]/70 p-4">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>Peri-vascular Pattern Probability</span>
                    <span>{periPercent !== null ? `${periPercent}%` : "-"}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-amber-300"
                      style={{ width: `${periPercent ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                Output Summary
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
                  <div className="text-white/50">Linear Pattern</div>
                  <div className="mt-2 text-sm text-white">
                    Ground Truth: {stats?.linearTarget ?? "-"}
                  </div>
                  <div className="mt-1 text-sm text-white">
                    Correct: {stats?.linearCorrect ?? "-"}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
                  <div className="text-white/50">Peri-vascular Pattern</div>
                  <div className="mt-2 text-sm text-white">
                    Ground Truth: {stats?.periTarget ?? "-"}
                  </div>
                  <div className="mt-1 text-sm text-white">
                    Correct: {stats?.periCorrect ?? "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}
