import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { canonical, validRecord, type FwRecord } from "@/lib/firmware";
import { clientIp, rateLimited } from "@/lib/submissions";

export const runtime = "nodejs";

/**
 * Seals and checks firmware origin records. Sealing needs TIMULE_ADMIN_KEY, which only Timule
 * holds; checking is open to anyone. The seal is an HMAC-SHA256 of the record's canonical form
 * under a key derived from TIMULE_ADMIN_KEY, so a changed field breaks it.
 */
const secret = () => process.env.TIMULE_ADMIN_KEY ?? "";
const sealKey = (k: string) => createHash("sha256").update(`timule-firmware-seal:${k}`).digest();
const seal = (r: FwRecord, k: string) => createHmac("sha256", sealKey(k)).update(canonical(r)).digest("base64url");

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export async function POST(request: Request) {
  if (rateLimited(`firmware:${clientIp(request)}`, 30)) return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  let body: { action?: string; record?: unknown; seal?: string; key?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request could not be read." }, { status: 400 });
  }
  if (!validRecord(body.record)) return NextResponse.json({ error: "That is not a complete firmware record." }, { status: 400 });
  const k = secret();
  if (body.action === "verify") {
    if (!k) return NextResponse.json({ configured: false, valid: false });
    return NextResponse.json({ configured: true, valid: typeof body.seal === "string" && same(body.seal, seal(body.record, k)) });
  }
  if (body.action === "seal") {
    if (!k) return NextResponse.json({ error: "Sealing is not set up on this site yet." }, { status: 503 });
    if (typeof body.key !== "string" || !same(body.key, k)) return NextResponse.json({ error: "That issuing key is not right." }, { status: 403 });
    return NextResponse.json({ seal: seal(body.record, k) });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
