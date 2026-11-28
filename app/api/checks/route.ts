import { NextResponse } from "next/server";
import { baseCode, getChecks } from "@/lib/metrics";

export const runtime = "nodejs";
export const revalidate = 60;

/** Public: the verification log for one TM code, newest first. Maker names are never stored, only TMS codes. */
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  if (!/^TM-[A-Z]{3}(-[A-Z0-9]+)+$/i.test(code)) return NextResponse.json({ checks: [] });
  const k = baseCode(code);
  const checks = (await getChecks()).filter((c) => baseCode(c.code) === k).slice(0, 20);
  return NextResponse.json({ checks }, { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
