import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";

// Optimistic redirects only. Every API route still checks the session itself.
const PROTECTED = ["/dashboard"];
const GUEST_ONLY = ["/", "/login", "/signup"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (PROTECTED.some((p) => path.startsWith(p)) && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (GUEST_ONLY.includes(path) && session) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|wav|ico)$).*)"],
};
