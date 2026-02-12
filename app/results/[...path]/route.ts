import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

const baseDir = path.join(process.cwd(), "data", "results");

const getContentType = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".csv":
      return "text/csv";
    default:
      return "application/octet-stream";
  }
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await context.params;
  if (!parts || !parts.length) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const safePath = path.normalize(parts.join(path.sep)).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(baseDir, safePath);

  if (!filePath.startsWith(baseDir)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  try {
    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: { "Content-Type": getContentType(filePath) },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
}
