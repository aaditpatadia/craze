import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, validSession } from "@/lib/auth";

/**
 * Founder-only areas. Without a valid session the visitor goes to the sign-in page.
 * Each page checks the session again on the server, so this is the first lock, not the only one.
 */
export async function proxy(request: NextRequest) {
  if (await validSession(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/desk/:path*", "/admin/:path*"],
};
