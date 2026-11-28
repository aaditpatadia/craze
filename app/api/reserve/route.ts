import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { SITE } from "@/lib/config";
import { openCase } from "@/lib/cases";
import { makeReference } from "@/lib/codes";
import { looksLikeSpam, parseReserveItems, validateReserve, type ReserveInput } from "@/lib/forms";
import { guard, readJson, text } from "@/lib/security";
import { storeSubmission } from "@/lib/submissions";

export const runtime = "nodejs";

/** A non-binding letter of intent against one or more TM codes. Opens a tracked case and emails the founders. */
export async function POST(req: Request) {
  const blocked = guard(req, { key: "reserve", limit: 5, maxBytes: 16 * 1024 });
  if (blocked) return blocked;
  const body = await readJson(req, 16 * 1024);
  if (!body) return NextResponse.json({ ok: false, error: "The request could not be read." }, { status: 400 });
  const input: ReserveInput = {
    items: text(body.items, 3000),
    timeline: text(body.timeline, 80),
    targetPrice: text(body.targetPrice, 200),
    company: text(body.company, 200),
    name: text(body.name, 120),
    email: text(body.email, 254),
    phone: text(body.phone, 40),
    sector: text(body.sector, 40),
    notes: text(body.notes, 3000),
    agree: body.agree === true,
    website: text(body.website, 200),
    startedAt: Number(body.startedAt),
  };
  if (looksLikeSpam(input)) return NextResponse.json({ ok: true, reference: makeReference("TMR") });
  const errors = validateReserve(input);
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors }, { status: 422 });

  const items = parseReserveItems(input.items);
  const reference = makeReference("TMR");
  let track: string | null = null;
  try {
    const c = await openCase({
      ref: reference,
      kind: "loi",
      summary: input.items,
      items,
      timeline: input.timeline,
      sector: input.sector,
      ...(input.targetPrice ? { targetPrice: input.targetPrice } : {}),
      contact: { company: input.company, name: input.name, email: input.email, ...(input.phone ? { phone: input.phone } : {}) },
    });
    track = `/track/${c.id}`;
    revalidatePath("/investors");
    revalidatePath("/evidence");
  } catch (e) {
    console.error("[api/reserve] case store failed", e);
  }
  try {
    const { website: _w, startedAt: _s, agree: _a, ...data } = input;
    void _w;
    void _s;
    void _a;
    await storeSubmission({ kind: "loi", data: { ...data, ...(track ? { track: `${SITE.url}${track}` } : {}) }, reference });
  } catch (e) {
    console.error("[api/reserve] email failed", e);
    if (!track) return NextResponse.json({ ok: false, error: `We could not save this. Nothing was sent. Please email ${SITE.contactEmail}.` }, { status: 500 });
  }
  return NextResponse.json({ ok: true, reference, track });
}
