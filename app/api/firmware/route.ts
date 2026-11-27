import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { canonical, validRecord, type FwRecord } from "@/lib/firmware";
import { isSignedIn } from "@/lib/auth";
import { guard, readJson } from "@/lib/security";

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
  const blocked = guard(request, { key: "firmware", limit: 20, maxBytes: 16 * 1024 });
  if (blocked) return blocked;
  const body = (await readJson(request, 16 * 1024)) as { action?: string; record?: unknown; seal?: string; key?: string } | null;
  if (!body) return NextResponse.json({ error: "The request could not be read." }, { status: 400 });
  if (!validRecord(body.record)) return NextResponse.json({ error: "That is not a complete firmware record." }, { status: 400 });
  const k = secret();
  if (body.action === "verify") {
    if (!k) return NextResponse.json({ configured: false, valid: false });
    return NextResponse.json({ configured: true, valid: typeof body.seal === "string" && same(body.seal, seal(body.record, k)) });
  }
  if (body.action === "seal") {
    if (!k) return NextResponse.json({ error: "Sealing is not set up on this site yet." }, { status: 503 });
    // A signed-in founder seals without typing the key; anyone else must give it.
    const allowed = (await isSignedIn(request)) || (typeof body.key === "string" && same(body.key, k));
    if (!allowed) {
      await new Promise((r) => setTimeout(r, 400));
      return NextResponse.json({ error: "Sign in as a founder, or give the issuing key." }, { status: 403 });
    }
    return NextResponse.json({ seal: seal(body.record, k) });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
