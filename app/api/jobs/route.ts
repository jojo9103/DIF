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
  const uploadRoot = path.join(process.cwd(), "data", "upload");
  const resultsRoot = path.join(process.cwd(), "data", "results");
  let deleted = 0;
  await Promise.all(
    ids.map(async (id: string) => {
      if (!id || typeof id !== "string") return;
      const target = path.join(userDir, `${id}.json`);
      try {
        const raw = await fs.readFile(target, "utf8");
        const job = JSON.parse(raw);
        const inputDir = job?.inputDir ? path.normalize(job.inputDir) : "";
        const outputDir = job?.outputDir ? path.normalize(job.outputDir) : "";
        if (inputDir && inputDir.startsWith(uploadRoot)) {
          await fs.rm(inputDir, { recursive: true, force: true });
        }
        if (outputDir && outputDir.startsWith(resultsRoot)) {
          await fs.rm(outputDir, { recursive: true, force: true });
        }
      } catch {
        // ignore read/remove errors
      }
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

export async function PATCH(request: Request) {
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
  const id = body?.id;
  const action = body?.action;
  if (!id || !action) {
    return NextResponse.json({ ok: false, message: "요청이 올바르지 않습니다." }, { status: 400 });
  }

  const userDir = path.join(jobsRoot, user.id.replace(/[^\w\-]+/g, "_"));
  const jobPath = path.join(userDir, `${id}.json`);
  try {
    const raw = await fs.readFile(jobPath, "utf8");
    const job = JSON.parse(raw);
    if (action === "cancel") {
      job.status = "canceled";
      job.canceledAt = new Date().toISOString();
      await fs.writeFile(jobPath, JSON.stringify(job, null, 2), "utf8");
      return NextResponse.json({ ok: true, job });
    }
    return NextResponse.json({ ok: false, message: "지원하지 않는 action입니다." }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, message: "job을 찾을 수 없습니다." }, { status: 404 });
  }
}
