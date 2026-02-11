import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sessionCookieName } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value;
  if (!token) {
    const next = encodeURIComponent(request.nextUrl.pathname);
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.search = `mode=login&next=${next}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/upload/:path*", "/demo/:path*", "/dashboard/:path*"],
};
