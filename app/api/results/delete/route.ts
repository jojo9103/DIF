import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { sessionCookieName, verifySession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const token = cookie
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${sessionCookieName}=`))
    ?.split("=")[1];
  const user = verifySession(token);
  if (!user) {
    return NextResponse.json({ ok: false, message: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const project = body?.project;
  if (!project || typeof project !== "string") {
    return NextResponse.json({ ok: false, message: "project가 필요합니다." }, { status: 400 });
  }

  const safeProject = project.replace(/[^\w\-]+/g, "_");
  const userDir = path.join(process.cwd(), "data", "results", user.id.replace(/[^\w\-]+/g, "_"));
  const targetDir = path.join(userDir, safeProject);
  try {
    if (targetDir.startsWith(userDir)) {
      await fs.rm(targetDir, { recursive: true, force: true });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "삭제 실패" }, { status: 500 });
  }
}
