import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/auth";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", sessionCookie("", 0));
  return res;
}
