import { NextResponse } from "next/server";
import { makeSession, readCookie, supplierCookie } from "@/lib/auth";
import { OAUTH_COOKIE, finishFlow, googleConfigured } from "@/lib/google";
import { accountByEmail, saveAccount, settleStatus } from "@/lib/portal-server";

export const runtime = "nodejs";

/** Google sends the supplier back here. Only Google accounts the team has invited get in. */
export async function GET(req: Request) {
  const back = (error: string) => {
    const r = NextResponse.redirect(new URL(`/supplier/login?error=${error}`, req.url));
    r.headers.append("Set-Cookie", `${OAUTH_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    return r;
  };
  if (!googleConfigured()) return back("setup");
  let user;
  try {
    user = await finishFlow(req, readCookie(req, OAUTH_COOKIE));
  } catch (e) {
    console.error("[google] sign-in failed", e);
    return back("google");
  }
  if ("error" in user) return back(user.error);

  const account = await accountByEmail(user.email);
  if (!account) return back("not-invited");
  if (account.status === "paused") return back("paused");

  const by = user.email;
  const seen = await saveAccount({ ...account, lastSeenAt: new Date().toISOString() }, by);
  await settleStatus(seen, by);

  const res = NextResponse.redirect(new URL("/supplier", req.url));
  res.headers.append("Set-Cookie", `${OAUTH_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  res.headers.append("Set-Cookie", supplierCookie(await makeSession({ role: "supplier", sid: account.id, email: user.email, ...(user.name ? { name: user.name } : {}) })));
  res.headers.set("Cache-Control", "no-store");
  return res;
}
