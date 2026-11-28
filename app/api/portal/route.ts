import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supplierFrom } from "@/lib/auth";
import { SITE } from "@/lib/config";
import { AGREEMENT_VERSION, KIND_IDS, fieldsOf, kindOf, type SubmissionKind, type SupplierProfile } from "@/lib/portal";
import { createSubmission, vaultFiles, getAccount, getSubmissions, removeSubmission, saveAccount, settleStatus } from "@/lib/portal-server";
import { guard, readJson, text } from "@/lib/security";
import { storeSubmission } from "@/lib/submissions";

export const runtime = "nodejs";

const err = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

/** Everything a signed-in supplier can do: save the profile, accept the terms, submit, withdraw. */
export async function POST(req: Request) {
  const blocked = guard(req, { key: "portal", limit: 40, maxBytes: 64 * 1024 });
  if (blocked) return blocked;
  const session = await supplierFrom(req);
  if (!session) return err("Your session has ended. Sign in again.", 403);
  const account = await getAccount(session.sid);
  if (!account || (!account.emails.includes(session.email) && !session.via)) return err("This account is no longer active.", 403);
  if (account.status === "paused") return err("Your account is paused. Write to the Timule team.", 403);
  const body = await readJson(req, 64 * 1024);
  if (!body) return err("The request could not be read.");
  const by = session.via ? `team:${session.via}` : session.email;

  if (body.action === "profile") {
    const p = (body.profile ?? {}) as Record<string, unknown>;
    const s = (k: keyof SupplierProfile, max = 300) => text(p[k], max).trim();
    const profile: SupplierProfile = {
      legalName: s("legalName", 200),
      tradeName: s("tradeName", 200),
      address: s("address", 600),
      city: s("city", 120),
      state: s("state", 120),
      gstin: s("gstin", 20).toUpperCase(),
      udyam: s("udyam", 40).toUpperCase(),
      founded: s("founded", 10),
      employees: s("employees", 20),
      website: s("website", 300),
      contactName: s("contactName", 120),
      contactRole: s("contactRole", 120),
      phone: s("phone", 40),
      makes: s("makes", 2000),
      capacity: s("capacity", 300),
      customers: s("customers", 1000),
    };
    const missing = (["legalName", "address", "city", "state", "contactName", "contactRole", "phone", "makes"] as const).filter((k) => profile[k].length < 2);
    if (missing.length) return err("Fill in every field marked required.", 422);
    if (profile.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(profile.gstin)) return err("That GSTIN does not look right: 15 characters, like 24ABCDE1234F1Z5.", 422);
    const next = await saveAccount({ ...account, profile }, by, "Company profile saved");
    await settleStatus(next, by);
    revalidatePath("/supplier");
    return NextResponse.json({ ok: true });
  }

  if (body.action === "agree") {
    const name = text(body.name, 120).trim();
    const title = text(body.title, 120).trim();
    if (name.length < 2 || title.length < 2 || body.confirm !== true) return err("Type your full name and title, and tick the box.", 422);
    const next = await saveAccount(
      { ...account, agreement: { version: AGREEMENT_VERSION, acceptedAt: new Date().toISOString(), name, title, email: session.email } },
      by,
      `Supplier terms ${AGREEMENT_VERSION} accepted by ${name}, ${title}`,
    );
    await settleStatus(next, by);
    revalidatePath("/supplier");
    return NextResponse.json({ ok: true });
  }

  if (body.action === "submit") {
    const kind = text(body.kind, 20) as SubmissionKind;
    const def = kindOf(kind);
    if (!def || !KIND_IDS.includes(kind)) return err("Choose what you are submitting.");
    const files = vaultFiles(body.files, account.id);
    if (!files) return err("Upload the files again.");
    if (files.length < def.minFiles) return err(def.minFiles === 1 ? "Upload at least one file." : `Upload at least ${def.minFiles} files.`, 422);
    const raw = (body.fields ?? {}) as Record<string, unknown>;
    const fields: Record<string, string> = {};
    for (const f of fieldsOf(kind)) {
      const v = text(raw[f.id], f.long ? 3000 : 300).trim();
      if (f.required && !v) return err(`Fill in "${f.label}".`, 422);
      if (v) fields[f.id] = v;
    }
    const title = text(body.title, 160).trim() || def.label;
    const partCode = text(body.partCode, 60).trim().toUpperCase();
    if (partCode && !/^TM-[A-Z]{3}(-[A-Z0-9]+)+$/.test(partCode)) return err("A TM code looks like TM-MOT-2807-1300.", 422);
    const requestId = text(body.requestId, 20);
    const sub = await createSubmission({
      supplierId: account.id,
      supplierCode: account.code,
      kind,
      title,
      ...(partCode ? { partCode } : {}),
      fields,
      files,
      ...(text(body.note, 2000).trim() ? { note: text(body.note, 2000).trim() } : {}),
      ...(account.requests.some((r) => r.id === requestId) ? { requestId } : {}),
      by,
    });
    await settleStatus(await saveAccount(account, by, `${sub.ref} submitted: ${def.label}, ${title}`), by);
    // Tell the team by email. A failure here never loses the submission.
    try {
      await storeSubmission({
        kind: "portal",
        reference: sub.ref,
        data: { subject: `${account.code} ${account.company}: ${def.label}`, supplier: `${account.code} ${account.company}`, what: `${def.label}: ${title}`, files: String(files.length), by, review: `${SITE.url}/team/suppliers/${account.id}` },
      });
    } catch (e) {
      console.error("[portal] notify failed", e);
    }
    revalidatePath("/supplier");
    return NextResponse.json({ ok: true, ref: sub.ref });
  }

  if (body.action === "withdraw") {
    const id = text(body.id, 20);
    const sub = (await getSubmissions()).find((s) => s.id === id && s.supplierId === account.id);
    if (!sub) return err("Not found.", 404);
    if (sub.status !== "submitted") return err("Only submissions still waiting for review can be withdrawn.", 409);
    await removeSubmission(sub.id);
    await saveAccount(account, by, `${sub.ref} withdrawn`);
    revalidatePath("/supplier");
    return NextResponse.json({ ok: true });
  }

  return err("Unknown action.");
}
