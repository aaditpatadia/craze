import { NextResponse } from "next/server";
import { SITE } from "@/lib/config";
import { looksLikeSpam, validateInvestor, type InvestorInput } from "@/lib/forms";
import { guard, readJson, text } from "@/lib/security";
import { storeSubmission } from "@/lib/submissions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const blocked = guard(req, { key: "investor", limit: 5, maxBytes: 8 * 1024 });
  if (blocked) return blocked;
  const body = await readJson(req, 8 * 1024);
  if (!body) return NextResponse.json({ ok: false, error: "The request could not be read." }, { status: 400 });
  const input: InvestorInput = {
    name: text(body.name, 120),
    email: text(body.email, 254),
    firm: text(body.firm, 160),
    interest: text(body.interest, 80),
    message: text(body.message, 3000),
    website: text(body.website, 200),
    startedAt: Number(body.startedAt),
  };
  if (looksLikeSpam(input)) return NextResponse.json({ ok: true });
  const errors = validateInvestor(input);
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors }, { status: 422 });
  try {
    const { website: _w, startedAt: _s, ...data } = input;
    void _w;
    void _s;
    await storeSubmission({ kind: "investor", data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/investor] store failed", e);
    return NextResponse.json({ ok: false, error: `We could not send this. Please email ${SITE.contactEmail}.` }, { status: 500 });
  }
}
