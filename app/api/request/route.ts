import { SITE } from "@/lib/config";
import { NextResponse } from "next/server";
import { looksLikeSpam, validateRequest, type RequestInput } from "@/lib/forms";
import { makeReference } from "@/lib/codes";
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
    return NextResponse.json({ ok: false, error: "The request could not be read." }, { status: 400 });
  }
  const input: RequestInput = {
    company: str(body.company),
    email: str(body.email),
    role: str(body.role),
    parts: str(body.parts),
    quantity: str(body.quantity),
    timeline: str(body.timeline),
    message: str(body.message),
    website: str(body.website),
    startedAt: Number(body.startedAt),
  };
  // Spam gets the same success response, so bots learn nothing. Nothing is stored.
  if (looksLikeSpam(input)) return NextResponse.json({ ok: true, reference: makeReference("TMQ") });

  const errors = validateRequest(input);
  if (Object.keys(errors).length > 0) return NextResponse.json({ ok: false, errors }, { status: 422 });

  try {
    const { website: _honeypot, startedAt: _started, ...data } = input;
    void _honeypot;
    void _started;
    const reference = makeReference("TMQ");
    const { id } = await storeSubmission({ kind: "request", data, reference });
    return NextResponse.json({ ok: true, id, reference });
  } catch (e) {
    console.error("[api/request] store failed", e);
    return NextResponse.json({ ok: false, error: `We could not save your request. Nothing was sent. Please try again, or email ${SITE.contactEmail}.` }, { status: 500 });
  }
}
