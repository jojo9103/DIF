import { NextResponse } from "next/server";
import { sessionCookieName, verifySession } from "@/lib/auth";

export async function GET(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${sessionCookieName}=`));

  const token = match ? match.split("=")[1] : null;
  const user = verifySession(token);

  if (!user) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}
