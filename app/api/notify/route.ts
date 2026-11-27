import { SITE } from "@/lib/config";
import { NextResponse } from "next/server";
import { looksLikeSpam, validateNotify, type NotifyInput } from "@/lib/forms";
import { storeSubmission } from "@/lib/submissions";
import { guard, readJson, text } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const blocked = guard(req, { key: "notify", limit: 10, maxBytes: 4096 });
  if (blocked) return blocked;
  const body = await readJson(req, 4096);
  if (!body) return NextResponse.json({ ok: false, error: "The request could not be read." }, { status: 400 });
  const input: NotifyInput = {
    email: text(body.email, 254),
    category: text(body.category, 80),
    website: text(body.website, 200),
    startedAt: Number(body.startedAt),
  };
  if (looksLikeSpam(input)) return NextResponse.json({ ok: true });
  const errors = validateNotify(input);
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors }, { status: 422 });
  try {
    await storeSubmission({ kind: "notify", data: { email: input.email, category: input.category } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/notify] store failed", e);
    return NextResponse.json({ ok: false, error: `We could not save that. Please try again, or email ${SITE.contactEmail}.` }, { status: 500 });
  }
}
