import { SITE } from "@/lib/config";
import { NextResponse } from "next/server";
import { looksLikeSpam, validateRequest, type RequestInput } from "@/lib/forms";
import { makeReference } from "@/lib/codes";
import { storeSubmission } from "@/lib/submissions";
import { guard, readJson, text } from "@/lib/security";
import { openCase } from "@/lib/cases";

export const runtime = "nodejs";


export async function POST(req: Request) {
  const blocked = guard(req, { key: "request", limit: 5 });
  if (blocked) return blocked;
  const body = await readJson(req);
  if (!body) return NextResponse.json({ ok: false, error: "The request could not be read." }, { status: 400 });
  const input: RequestInput = {
    company: text(body.company, 200),
    email: text(body.email, 254),
    role: text(body.role, 200),
    parts: text(body.parts, 8000),
    quantity: text(body.quantity, 200),
    timeline: text(body.timeline, 200),
    message: text(body.message, 4000),
    website: text(body.website, 200),
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
    // Open a tracked case first, so the emailed copy can carry the tracking link. A store failure never blocks the request.
    let track: string | null = null;
    try {
      const c = await openCase({
        ref: reference,
        kind: "request",
        summary: data.parts,
        timeline: data.timeline,
        contact: { company: data.company, email: data.email, role: data.role },
      });
      track = `/track/${c.id}`;
    } catch (e) {
      console.error("[api/request] case store failed", e);
    }
    const { id } = await storeSubmission({ kind: "request", data: { ...data, ...(track ? { track: `${SITE.url}${track}` } : {}) }, reference });
    return NextResponse.json({ ok: true, id, reference, track });
  } catch (e) {
    console.error("[api/request] store failed", e);
    return NextResponse.json({ ok: false, error: `We could not save your request. Nothing was sent. Please try again, or email ${SITE.contactEmail}.` }, { status: 500 });
  }
}
