import { NextResponse } from "next/server";
import { adminSecret, authConfigured, makeSession, safeEqual, sessionCookie } from "@/lib/auth";
import { guard, readJson, text } from "@/lib/security";

export const runtime = "nodejs";

/** Founder sign-in. Five tries a minute per address; a wrong key gets the same short answer every time. */
export async function POST(req: Request) {
  const blocked = guard(req, { key: "login", limit: 5, maxBytes: 2048 });
  if (blocked) return blocked;
  if (!authConfigured()) return NextResponse.json({ ok: false, error: "Sign-in is not set up yet: TIMULE_ADMIN_KEY is missing in Vercel." }, { status: 503 });
  const body = await readJson(req, 2048);
  const key = text(body?.key, 256);
  // A fixed delay makes guessing slower and hides timing.
  await new Promise((r) => setTimeout(r, 400));
  if (!key || !safeEqual(key, adminSecret())) return NextResponse.json({ ok: false, error: "That key is not right." }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", sessionCookie(await makeSession()));
  res.headers.set("Cache-Control", "no-store");
  return res;
}
