import React from "react";
import { cn } from "@/lib/utils";

interface HeroProps {
  className?: string;
}

export default function Hero({ className }: HeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-[#0b0f1a] text-white",
        "before:absolute before:inset-0 before:bg-[radial-gradient(60%_80%_at_80%_10%,rgba(59,130,246,0.25),transparent_60%)]",
        "after:absolute after:inset-0 after:bg-[radial-gradient(40%_60%_at_10%_30%,rgba(14,165,233,0.20),transparent_60%)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <svg
          className="absolute -left-16 top-10 h-64 w-64 text-sky-400/30"
          viewBox="0 0 200 200"
          fill="none"
        >
          <defs>
            <linearGradient id="dif-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="80" stroke="url(#dif-ring)" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="55" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
          <path
            d="M40 120 C70 80, 130 140, 160 90"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="1"
          />
        </svg>
        <svg
          className="absolute right-0 top-0 h-80 w-80 text-cyan-300/30"
          viewBox="0 0 240 240"
          fill="none"
        >
          <defs>
            <radialGradient id="dif-heat" cx="0.4" cy="0.4" r="0.6">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="30" y="30" width="180" height="180" rx="24" stroke="currentColor" strokeOpacity="0.15" />
          <circle cx="90" cy="90" r="55" fill="url(#dif-heat)" />
          <circle cx="150" cy="150" r="40" fill="url(#dif-heat)" opacity="0.7" />
        </svg>
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20 sm:py-24 lg:flex-row lg:items-center lg:gap-14 lg:px-10">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/70">
            DIF Pattern Detector
          </div>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            Direct Immunofluorescence (DIF) 이미지로부터 패턴을 감지하고
            <span className="block text-sky-300">Grad-CAM 히트맵까지</span>
            한 번에 시각화합니다
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            DIF 이미지를 입력하면 모델이 패턴 결과와 핵심 근거 영역을 즉시 반환합니다.
            연구, 품질 검사, 자동화 리포트에 바로 활용 가능한 시각적 결과물을 제공합니다.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-full bg-sky-400 px-6 py-3 text-sm font-semibold text-[#0b0f1a] transition hover:bg-sky-300">
              DIF 이미지 업로드
            </button>
            <button className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white">
              데모 보기
            </button>
          </div>
          <div className="flex flex-wrap gap-6 pt-4 text-xs text-white/60">
            <div>
              <div className="text-lg font-semibold text-white">98.7%</div>
              정확도 기반 패턴 분류
            </div>
            <div>
              <div className="text-lg font-semibold text-white">1.2s</div>
              평균 추론 시간
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Grad-CAM</div>
              근거 영역 히트맵
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-[0_30px_120px_rgba(14,165,233,0.25)]">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Input: DIF_0421.tif</span>
              <span>Model: PatternNet v2</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-[#0f172a]/80 p-4">
                <div className="text-xs text-white/50">Pattern Result</div>
                <div className="mt-3 rounded-xl bg-white/5 p-3">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Class A</span>
                    <span>0.91</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[91%] rounded-full bg-sky-400" />
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-white/5 p-3">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Class B</span>
                    <span>0.07</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[7%] rounded-full bg-amber-300" />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0f172a]/80 p-4">
                <div className="text-xs text-white/50">Grad-CAM Heatmap</div>
                <div className="mt-3 h-40 overflow-hidden rounded-xl border border-white/10">
                  <svg viewBox="0 0 200 160" className="h-full w-full">
                    <defs>
                      <linearGradient id="heat-base" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#1e3a8a" />
                        <stop offset="50%" stopColor="#0f172a" />
                        <stop offset="100%" stopColor="#0b1020" />
                      </linearGradient>
                      <radialGradient id="heat-spot-1" cx="0.35" cy="0.35" r="0.5">
                        <stop offset="0%" stopColor="#fb923c" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient id="heat-spot-2" cx="0.7" cy="0.7" r="0.45">
                        <stop offset="0%" stopColor="#f87171" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <rect width="200" height="160" fill="url(#heat-base)" />
                    <circle cx="70" cy="60" r="55" fill="url(#heat-spot-1)" />
                    <circle cx="140" cy="110" r="45" fill="url(#heat-spot-2)" />
                    <path
                      d="M10 120 C40 90, 80 140, 120 100 C150 80, 175 110, 195 70"
                      stroke="#38bdf8"
                      strokeOpacity="0.3"
                      strokeWidth="1.5"
                      fill="none"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-white/60">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-white/80">입력 형식</div>
                <div className="mt-1 text-white/50">TIFF, PNG</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-white/80">출력</div>
                <div className="mt-1 text-white/50">패턴 라벨</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-white/80">시각화</div>
                <div className="mt-1 text-white/50">Heatmap PNG</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
