import { NextResponse } from "next/server";
import { sessionCookie, supplierCookie } from "@/lib/auth";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

/** Signs out of the team area (default) or the supplier portal (?who=supplier). */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });
  const who = new URL(req.url).searchParams.get("who");
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", who === "supplier" ? supplierCookie("", 0) : sessionCookie("", 0));
  return res;
}
