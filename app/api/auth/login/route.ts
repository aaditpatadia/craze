import { NextResponse } from "next/server";
import { authConfigured, makeSession, sessionCookie } from "@/lib/auth";
import { checkTeamLogin } from "@/lib/team-accounts";
import { guard, readJson, text } from "@/lib/security";

export const runtime = "nodejs";

/** Team sign-in with username and password. Five tries a minute per address; every failure gets the same answer. */
export async function POST(req: Request) {
  const blocked = guard(req, { key: "login", limit: 5, maxBytes: 2048 });
  if (blocked) return blocked;
  if (!authConfigured()) return NextResponse.json({ ok: false, error: "Sign-in is not set up yet: TIMULE_ADMIN_KEY is missing in Vercel." }, { status: 503 });
  const body = await readJson(req, 2048);
  const username = text(body?.username, 64);
  const password = text(body?.password, 256);
  const started = Date.now();
  const account = username && password ? await checkTeamLogin(username, password) : null;
  // Every answer takes at least 600 ms, so guessing is slow and timing reveals nothing.
  await new Promise((r) => setTimeout(r, Math.max(0, 600 - (Date.now() - started))));
  if (!account) return NextResponse.json({ ok: false, error: "That username and password do not match." }, { status: 401 });
  const res = NextResponse.json({ ok: true, name: account.name });
  res.headers.append("Set-Cookie", sessionCookie(await makeSession({ role: "team", user: account.user, name: account.name, initials: account.initials })));
  res.headers.set("Cache-Control", "no-store");
  return res;
}
