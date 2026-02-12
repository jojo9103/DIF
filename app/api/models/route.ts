import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

const modelsRoot = path.join(process.cwd(), "data", "models");

export async function GET() {
  try {
    const files = await fs.readdir(modelsRoot);
    const items = files
      .filter((f) => f.endsWith("_best_model_512.pt"))
      .map((f) => {
        const parts = f.replace("_best_model_512.pt", "").split("_");
        const number = parts.pop();
        const backbone = parts.join("_");
        return { file: f, backbone, number };
      })
      .filter((v) => v.backbone && v.number);

    const byBackbone: Record<string, string[]> = {};
    for (const item of items) {
      if (!byBackbone[item.backbone]) byBackbone[item.backbone] = [];
      byBackbone[item.backbone].push(item.number);
    }
    Object.keys(byBackbone).forEach((b) => {
      byBackbone[b].sort((a, b2) => Number(a) - Number(b2));
    });

    return NextResponse.json({ ok: true, models: byBackbone });
  } catch {
    return NextResponse.json({ ok: true, models: {} });
  }
}
