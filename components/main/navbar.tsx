import Image from "next/image";
import { cn } from "@/lib/utils";

interface NavbarProps {
  className?: string;
}

export default function Navbar({ className }: NavbarProps) {
  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50",
        "bg-[#0b0f1a]/60 backdrop-blur border-b border-white/10",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-full border border-white/10 bg-white/5">
            <Image src="/dif.png" alt="DIF Pattern Detector logo" fill sizes="36px" />
          </div>
          <div className="text-sm font-semibold tracking-wide text-white">
            DIF Pattern Detector
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a className="transition hover:text-white" href="#info">
            Info
          </a>
          <a className="transition hover:text-white" href="#status">
            Status
          </a>
          <a className="transition hover:text-white" href="#result">
            Result
          </a>
          <a className="transition hover:text-white" href="#contract">
            Contract
          </a>
        </nav>

        <button className="rounded-full bg-sky-400 px-5 py-2 text-sm font-semibold text-[#0b0f1a] transition hover:bg-sky-300">
          Get Started
        </button>
      </div>
    </header>
  );
}
