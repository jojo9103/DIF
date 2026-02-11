import { NextResponse } from "next/server";
import { hashPassword, sessionCookieName, sessionMaxAge, signSession } from "@/lib/auth";
import { readUsers, writeUsers } from "@/lib/server/users-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    password?: string;
    affiliation?: string;
    email?: string;
  };

  const id = body.id?.trim();
  const password = body.password || "";
  const affiliation = body.affiliation?.trim();
  const email = body.email?.trim();

  if (!id || !password || !affiliation || !email) {
    return NextResponse.json({ ok: false, message: "모든 항목을 입력해 주세요." }, { status: 400 });
  }

  const users = await readUsers();
  const exists = users.some(
    (u) => u.id === id || u.email.toLowerCase() === email.toLowerCase()
  );
  if (exists) {
    return NextResponse.json({ ok: false, message: "이미 등록된 ID 또는 이메일입니다." }, { status: 409 });
  }

  const { salt, hash } = hashPassword(password);
  const nextUsers = [
    ...users,
    { id, email, affiliation, passwordHash: hash, salt },
  ];

  await writeUsers(nextUsers);

  const session = signSession({ id, email, affiliation });
  const response = NextResponse.json({ ok: true, message: "회원 가입이 완료되었습니다." });
  response.cookies.set(sessionCookieName, session, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAge,
  });

  return response;
}
