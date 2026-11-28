import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { SITE } from "@/lib/config";
import { openCase } from "@/lib/cases";
import { makeReference } from "@/lib/codes";
import { looksLikeSpam } from "@/lib/forms";
import { COMPLAINT_ISSUES, COMPLAINT_SEVERITY, codesIn } from "@/lib/pipeline";
import { guard, readJson, text } from "@/lib/security";
import { storeSubmission } from "@/lib/submissions";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FILE = /^https:\/\/[a-z0-9-]+\.(public|private)\.blob\.vercel-storage\.com\/complaints\//i;

/** A customer complaint (TMC). Opens a tracked case, emails the team, and returns the buyer's tracking link. */
export async function POST(req: Request) {
  const blocked = guard(req, { key: "complaint", limit: 5, maxBytes: 24 * 1024 });
  if (blocked) return blocked;
  const b = await readJson(req, 24 * 1024);
  if (!b) return NextResponse.json({ ok: false, error: "The complaint could not be read." }, { status: 400 });
  const v = {
    company: text(b.company, 200).trim(),
    name: text(b.name, 120).trim(),
    email: text(b.email, 254).trim(),
    phone: text(b.phone, 40).trim(),
    codes: text(b.codes, 1000).trim(),
    orderRef: text(b.orderRef, 80).trim().toUpperCase(),
    batch: text(b.batch, 60).trim(),
    affected: Math.max(0, Math.round(Number(b.affected) || 0)),
    issue: text(b.issue, 80),
    severity: text(b.severity, 120),
    description: text(b.description, 5000).trim(),
    website: text(b.website, 200),
    startedAt: Number(b.startedAt),
  };
  if (looksLikeSpam(v)) return NextResponse.json({ ok: true, reference: makeReference("TMC") });
  const errors: Record<string, string> = {};
  if (v.company.length < 2) errors.company = "Enter your company name.";
  if (v.name.length < 2) errors.name = "Enter your name.";
  if (!EMAIL.test(v.email)) errors.email = "Enter an email address.";
  if (!codesIn(v.codes).length) errors.codes = "Enter the TM code of the affected part, like TM-MOT-2807-1300.";
  if (!(COMPLAINT_ISSUES as readonly string[]).includes(v.issue)) errors.issue = "Choose what went wrong.";
  if (!(COMPLAINT_SEVERITY as readonly string[]).includes(v.severity)) errors.severity = "Choose how serious it is.";
  if (v.description.length < 20) errors.description = "Describe what happened in a few sentences: when, how many, what you measured.";
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors }, { status: 422 });

  const files = (Array.isArray(b.files) ? b.files : [])
    .slice(0, 12)
    .map((f) => (f && typeof f === "object" ? (f as Record<string, unknown>) : {}))
    .map((f) => ({ name: text(f.name, 200) || "file", url: text(f.url, 600), size: Math.round(Number(f.size) || 0), type: text(f.type, 80) }))
    .filter((f) => FILE.test(f.url));

  const reference = makeReference("TMC");
  let track: string | null = null;
  try {
    const c = await openCase({
      ref: reference,
      kind: "complaint",
      summary: v.description,
      items: codesIn(v.codes).map((code) => ({ code, qty: v.affected })),
      timeline: v.severity,
      contact: { company: v.company, name: v.name, email: v.email, ...(v.phone ? { phone: v.phone } : {}) },
      complaint: {
        issue: v.issue,
        severity: v.severity,
        ...(v.orderRef ? { orderRef: v.orderRef } : {}),
        ...(v.batch ? { batch: v.batch } : {}),
        ...(v.affected ? { affected: v.affected } : {}),
        files,
      },
    });
    track = `/track/${c.id}`;
    revalidatePath("/desk/pipeline");
  } catch (e) {
    console.error("[api/complaint] case store failed", e);
  }
  try {
    const { website: _w, startedAt: _s, ...data } = v;
    void _w;
    void _s;
    await storeSubmission({
      kind: "complaint",
      reference,
      data: { ...data, files: files.map((f) => f.name).join(", "), ...(track ? { track: `${SITE.url}${track}` } : {}) },
    });
  } catch (e) {
    console.error("[api/complaint] email failed", e);
    if (!track) return NextResponse.json({ ok: false, error: `We could not save this. Please email ${SITE.contactEmail} and quote the TM code and batch.` }, { status: 500 });
  }
  return NextResponse.json({ ok: true, reference, track });
}
