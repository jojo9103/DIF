import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { sessionCookieName, verifySession } from "@/lib/auth";

export const runtime = "nodejs";

const uploadRoot = path.join(process.cwd(), "data", "upload");
const jobsRoot = path.join(process.cwd(), "data", "jobs");
const modelsRoot = path.join(process.cwd(), "data", "models");

const sanitize = (value: string) => value.replace(/[^\w\-]+/g, "_");

const ensureDir = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
};

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

  const formData = await request.formData();
  const mode = (formData.get("mode") as string) || "single";
  const backbone = (formData.get("backbone") as string) || "resnext50_32x4d";
  const modelNumber = (formData.get("modelNumber") as string) || "";
  const projectName = (formData.get("projectName") as string) || "project";
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json({ ok: false, message: "파일이 없습니다." }, { status: 400 });
  }

  const safeUser = sanitize(user.id);
  const safeProject = mode === "single" ? sanitize(projectName) : "folder_upload";

  const baseDir = path.join(uploadRoot, safeUser, safeProject);
  await ensureDir(baseDir);

  for (const file of files) {
    const relPath = (file as any).webkitRelativePath || file.name;
    const safeRel = relPath.replace(/^(\.\.(\/|\\|$))+/, "").replace(/^\/+/, "");
    const targetPath = path.join(baseDir, safeRel);
    await ensureDir(path.dirname(targetPath));
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(targetPath, Buffer.from(arrayBuffer));
  }

  let weightsPath = "";
  try {
    const modelFiles = await fs.readdir(modelsRoot);
    const candidates = modelFiles
      .filter((f) => f.startsWith(`${backbone}_`) && f.endsWith("_best_model_512.pt"))
      .map((f) => path.join(modelsRoot, f));
    if (modelNumber) {
      const exact = candidates.find((p) =>
        path.basename(p).startsWith(`${backbone}_${modelNumber}_`)
      );
      if (exact) {
        weightsPath = exact;
      }
    }
    if (!weightsPath && candidates.length > 0) {
      const stats = await Promise.all(
        candidates.map(async (p) => ({ p, stat: await fs.stat(p) }))
      );
      stats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
      weightsPath = stats[0].p;
    }
  } catch {
    weightsPath = "";
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const userJobsDir = path.join(jobsRoot, safeUser);
  await ensureDir(userJobsDir);
  const job = {
    id: jobId,
    userId: user.id,
    project: safeProject,
    mode: mode === "folder" ? "folder" : "single",
    inputDir: baseDir,
    outputDir: path.join(process.cwd(), "data", "results", safeUser, safeProject),
    backbone,
    modelNumber,
    weightsPath,
    status: "queued",
    createdAt: new Date().toISOString(),
  };
  await fs.writeFile(
    path.join(userJobsDir, `${jobId}.json`),
    JSON.stringify(job, null, 2),
    "utf8"
  );

  return NextResponse.json({ ok: true, jobId });
}
