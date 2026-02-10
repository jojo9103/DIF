"use client";

import Hero from "@/components/main/hero";
import Navbar from "@/components/main/navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0b0f1a]">
      <Navbar />
      <Hero className="pt-16" />
    </main>
  );
}
