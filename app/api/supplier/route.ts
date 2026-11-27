import { SITE } from "@/lib/config";
import { NextResponse } from "next/server";
import { makeReference } from "@/lib/codes";
import { getCategory } from "@/lib/content";
import { looksLikeSpam, validateSupplier, type SupplierInput } from "@/lib/forms";
import { storeSubmission } from "@/lib/submissions";
import { guard, readJson, text } from "@/lib/security";

export const runtime = "nodejs";

const str = (v: unknown) => text(v, 4000);

export async function POST(req: Request) {
  const blocked = guard(req, { key: "supplier", limit: 5 });
  if (blocked) return blocked;
  const body = await readJson(req);
  if (!body) return NextResponse.json({ ok: false, error: "The application could not be read." }, { status: 400 });
  const strs = (v: unknown, max = 20) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, max).map((x) => text(x, 120)) : []);
  const files = Array.isArray(body.certificateFiles)
    ? body.certificateFiles
        .filter((x): x is { name: unknown; url: unknown } => !!x && typeof x === "object")
        .map((x) => ({ name: str(x.name).slice(0, 200), url: str(x.url) }))
        .slice(0, 10)
    : [];
  const input: SupplierInput = {
    company: text(body.company, 200),
    email: text(body.email, 254),
    city: text(body.city, 120),
    role: text(body.role, 200),
    categories: strs(body.categories, 40),
    siteUrl: text(body.siteUrl, 500),
    parts: str(body.parts),
    capacity: text(body.capacity, 300),
    origin: text(body.origin, 300),
    certifications: strs(body.certifications),
    certificationsOther: text(body.certificationsOther, 300),
    certificateFiles: files,
    certificateLink: text(body.certificateLink, 500),
    message: str(body.message),
    website: text(body.website, 200),
    startedAt: Number(body.startedAt),
  };
  if (looksLikeSpam(input)) return NextResponse.json({ ok: true, reference: makeReference("TMA") });

  const errors = validateSupplier(input);
  if (Object.keys(errors).length > 0) return NextResponse.json({ ok: false, errors }, { status: 422 });

  try {
    const { website: _h, startedAt: _s, certificateFiles, categories, certifications, ...rest } = input;
    void _h;
    void _s;
    // Flatten for the email: one readable line per list.
    const data = {
      ...rest,
      categories: categories.map((id) => getCategory(id)?.name ?? id).join(", "),
      certifications: certifications.join(", "),
      certificateFiles: certificateFiles.map((f) => `${f.name}: ${f.url}`).join("\n"),
    };
    const reference = makeReference("TMA");
    await storeSubmission({ kind: "supplier", data, reference });
    return NextResponse.json({ ok: true, reference });
  } catch (e) {
    console.error("[api/supplier] store failed", e);
    return NextResponse.json({ ok: false, error: `We could not save your application. Nothing was sent. Please try again, or email ${SITE.contactEmail}.` }, { status: 500 });
  }
}
