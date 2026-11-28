import { NextResponse } from "next/server";
import { OAUTH_COOKIE, googleConfigured, isEmailHint, startFlow } from "@/lib/google";
import { clientIp, rateLimited } from "@/lib/submissions";

export const runtime = "nodejs";

/** Starts Google sign-in for the supplier portal. */
export async function GET(req: Request) {
  const back = new URL("/supplier/login", req.url);
  if (!googleConfigured()) {
    back.searchParams.set("error", "setup");
    return NextResponse.redirect(back);
  }
  if (rateLimited(`google:${clientIp(req)}`, 20)) {
    back.searchParams.set("error", "busy");
    return NextResponse.redirect(back);
  }
  const hint = new URL(req.url).searchParams.get("hint") ?? "";
  const { url, cookie } = startFlow(req, isEmailHint(hint) ? hint : undefined);
  const res = NextResponse.redirect(url);
  // Lax, so the browser sends it back when Google redirects to our callback. Ten minutes.
  res.headers.append("Set-Cookie", `${OAUTH_COOKIE}=${cookie}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
