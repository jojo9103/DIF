import { NextResponse } from "next/server";
import {
  sessionCookieName,
  sessionMaxAge,
  signSession,
  verifyPassword,
} from "@/lib/auth";
import { readUsers } from "@/lib/server/users-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { id?: string; password?: string };
  const id = body.id?.trim();
  const password = body.password || "";

  if (!id || !password) {
    return NextResponse.json({ ok: false, message: "ID와 비밀번호를 입력해 주세요." }, { status: 400 });
  }

  const users = await readUsers();
  const user = users.find((u) => u.id === id);

  if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
    return NextResponse.json({ ok: false, message: "ID 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const session = signSession({ id: user.id, email: user.email, affiliation: user.affiliation });
  const response = NextResponse.json({ ok: true, message: "로그인되었습니다." });
  response.cookies.set(sessionCookieName, session, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAge,
  });

  return response;
}
