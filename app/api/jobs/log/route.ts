import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { sessionCookieName, verifySession } from "@/lib/auth";

export const runtime = "nodejs";

const jobsRoot = path.join(process.cwd(), "data", "jobs");

const readTail = async (filePath: string, maxBytes = 20000) => {
  const stat = await fs.stat(filePath);
  const size = stat.size;
  const start = Math.max(0, size - maxBytes);
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(size - start);
    await handle.read(buffer, 0, buffer.length, start);
    return buffer.toString("utf8");
  } finally {
    await handle.close();
  }
};

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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const download = searchParams.get("download");
  if (!id) {
    return NextResponse.json({ ok: false, message: "id가 필요합니다." }, { status: 400 });
  }

  const userDir = path.join(jobsRoot, user.id.replace(/[^\w\-]+/g, "_"));
  const jobPath = path.join(userDir, `${id}.json`);
  try {
    const raw = await fs.readFile(jobPath, "utf8");
    const job = JSON.parse(raw);
    const logPath = job.logPath;
    if (!logPath) {
      return NextResponse.json({ ok: false, message: "로그 경로가 없습니다." }, { status: 404 });
    }
    const log = await readTail(logPath);
    if (download === "1") {
      return new NextResponse(log, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename=\"${id}.log\"`,
        },
      });
    }
    return NextResponse.json({ ok: true, log });
  } catch {
    return NextResponse.json({ ok: false, message: "로그를 찾을 수 없습니다." }, { status: 404 });
  }
}
