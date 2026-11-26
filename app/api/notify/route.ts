import { SITE } from "@/lib/config";
import { NextResponse } from "next/server";
import { looksLikeSpam, validateNotify, type NotifyInput } from "@/lib/forms";
import { clientIp, rateLimited, storeSubmission } from "@/lib/submissions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (rateLimited(clientIp(req), 10)) {
    return NextResponse.json({ ok: false, error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "The request could not be read." }, { status: 400 });
  }
  const input: NotifyInput = {
    email: typeof body.email === "string" ? body.email : "",
    category: typeof body.category === "string" ? body.category.slice(0, 80) : "",
    website: typeof body.website === "string" ? body.website : "",
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
