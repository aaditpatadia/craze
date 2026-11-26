import { NextResponse } from "next/server";
import { makeReference } from "@/lib/codes";
import { looksLikeSpam, validateSupplier, type SupplierInput } from "@/lib/forms";
import { clientIp, rateLimited, storeSubmission } from "@/lib/submissions";

export const runtime = "nodejs";

const str = (v: unknown) => (typeof v === "string" ? v : "");

export async function POST(req: Request) {
  if (rateLimited(clientIp(req))) {
    return NextResponse.json({ ok: false, error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "The application could not be read." }, { status: 400 });
  }
  const input: SupplierInput = {
    company: str(body.company),
    email: str(body.email),
    city: str(body.city),
    role: str(body.role),
    parts: str(body.parts),
    capacity: str(body.capacity),
    origin: str(body.origin),
    certifications: str(body.certifications),
    message: str(body.message),
    website: str(body.website),
    startedAt: Number(body.startedAt),
  };
  if (looksLikeSpam(input)) return NextResponse.json({ ok: true, reference: makeReference("TMA") });

  const errors = validateSupplier(input);
  if (Object.keys(errors).length > 0) return NextResponse.json({ ok: false, errors }, { status: 422 });

  try {
    const { website: _h, startedAt: _s, ...data } = input;
    void _h;
    void _s;
    const reference = makeReference("TMA");
    await storeSubmission({ kind: "supplier", data, reference });
    return NextResponse.json({ ok: true, reference });
  } catch (e) {
    console.error("[api/supplier] store failed", e);
    return NextResponse.json({ ok: false, error: "We could not save your application. Nothing was sent. Please try again." }, { status: 500 });
  }
}
