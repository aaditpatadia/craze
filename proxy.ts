import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, SUPPLIER_COOKIE, supplierSession, teamSession } from "@/lib/auth";

/**
 * Private areas. Without a valid session the visitor goes to the right sign-in page:
 * the team area to /team/login, the supplier portal to /supplier/login.
 * Each page and API route checks the session again on the server, so this is the first lock, not the only one.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/team/login" || path === "/supplier/login") return NextResponse.next();

  if (path === "/supplier" || path.startsWith("/supplier/")) {
    if (await supplierSession(request.cookies.get(SUPPLIER_COOKIE)?.value)) return NextResponse.next();
    return NextResponse.redirect(new URL("/supplier/login", request.url));
  }

  if (await teamSession(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  const url = new URL("/team/login", request.url);
  url.searchParams.set("next", path + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/desk/:path*", "/admin/:path*", "/team/:path*", "/team", "/supplier/:path*", "/supplier"],
};
