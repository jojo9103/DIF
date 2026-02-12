import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { sessionCookieName, verifySession } from "@/lib/auth";

export const runtime = "nodejs";

const jobsRoot = path.join(process.cwd(), "data", "jobs");

export async function GET(request: Request) {
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

  const userDir = path.join(jobsRoot, user.id.replace(/[^\w\-]+/g, "_"));
  try {
    const files = await fs.readdir(userDir);
    const jobs = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (file) => {
          const raw = await fs.readFile(path.join(userDir, file), "utf8");
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        })
    );
    return NextResponse.json({ ok: true, jobs: jobs.filter(Boolean) });
  } catch {
    return NextResponse.json({ ok: true, jobs: [] });
  }
}

export async function DELETE(request: Request) {
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
  const ids = Array.isArray(body?.ids) ? body.ids : [];
  if (!ids.length) {
    return NextResponse.json({ ok: false, message: "삭제할 job id가 없습니다." }, { status: 400 });
  }

  const userDir = path.join(jobsRoot, user.id.replace(/[^\w\-]+/g, "_"));
  let deleted = 0;
  await Promise.all(
    ids.map(async (id: string) => {
      if (!id || typeof id !== "string") return;
      const target = path.join(userDir, `${id}.json`);
      try {
        await fs.unlink(target);
        deleted += 1;
      } catch {
        // ignore missing
      }
    })
  );

  return NextResponse.json({ ok: true, deleted });
}
