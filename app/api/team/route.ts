import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { makeSession, supplierCookie, teamFrom } from "@/lib/auth";
import { getCategories } from "@/lib/content";
import { REVIEW_STATES, SUPPLIER_STATUSES, type ReviewState, type SupplierStatus } from "@/lib/portal";
import { createAccount, getAccount, getAccounts, getSubmissions, removeSubmission, saveAccount, saveSubmission } from "@/lib/portal-server";
import { guard, readJson, text } from "@/lib/security";
import { deleteRecord, secretId } from "@/lib/store";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const err = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

const emailsFrom = (v: unknown) =>
  [...new Set(text(v, 2000).toLowerCase().split(/[\s,;]+/).filter(Boolean))].slice(0, 10);

const categoriesFrom = (v: unknown) => {
  const ids = new Set(getCategories().map((c) => c.id));
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && ids.has(x)).slice(0, 30) : [];
};

/** Team-only actions on supplier accounts and their submissions. */
export async function POST(req: Request) {
  const blocked = guard(req, { key: "team", limit: 80, maxBytes: 32 * 1024 });
  if (blocked) return blocked;
  const team = await teamFrom(req);
  if (!team) return err("Sign in first.", 403);
  const body = await readJson(req, 32 * 1024);
  if (!body) return err("The request could not be read.");
  const by = team.user;
  const done = (extra: Record<string, unknown> = {}) => {
    revalidatePath("/team", "layout");
    revalidatePath("/supplier");
    return NextResponse.json({ ok: true, ...extra });
  };

  if (body.action === "invite") {
    const company = text(body.company, 200).trim();
    const emails = emailsFrom(body.emails);
    if (company.length < 2) return err("Enter the company name.", 422);
    if (!emails.length || emails.some((e) => !EMAIL.test(e))) return err("Enter the Google email address the supplier will sign in with.", 422);
    const taken = (await getAccounts()).find((a) => a.emails.some((e) => emails.includes(e)));
    if (taken) return err(`${taken.code} ${taken.company} already uses that email.`, 409);
    const a = await createAccount(
      { company, emails, categories: categoriesFrom(body.categories), meeting: text(body.meeting, 30) || undefined, notes: text(body.notes, 3000).trim() || undefined },
      by,
    );
    return done({ id: a.id, code: a.code });
  }

  const account = body.id ? await getAccount(text(body.id, 20)) : null;

  if (body.action === "update") {
    if (!account) return err("Supplier not found.", 404);
    const next = { ...account };
    const changes: string[] = [];
    if (typeof body.status === "string") {
      if (!SUPPLIER_STATUSES.some((s) => s.id === body.status)) return err("Unknown status.");
      if (body.status !== account.status) changes.push(`status ${account.status} → ${body.status}`);
      next.status = body.status as SupplierStatus;
    }
    if (body.company !== undefined) next.company = text(body.company, 200).trim() || account.company;
    if (body.emails !== undefined) {
      const emails = emailsFrom(body.emails);
      if (!emails.length || emails.some((e) => !EMAIL.test(e))) return err("Enter at least one valid email.", 422);
      const taken = (await getAccounts()).find((a) => a.id !== account.id && a.emails.some((e) => emails.includes(e)));
      if (taken) return err(`${taken.code} already uses one of those emails.`, 409);
      if (emails.join() !== account.emails.join()) changes.push("sign-in emails changed");
      next.emails = emails;
    }
    if (body.categories !== undefined) next.categories = categoriesFrom(body.categories);
    if (body.meeting !== undefined) next.meeting = text(body.meeting, 30) || undefined;
    if (body.notes !== undefined) next.notes = text(body.notes, 3000).trim() || undefined;
    await saveAccount(next, by, changes.length ? `Updated by ${by}: ${changes.join(", ")}` : `Details updated by ${by}`);
    return done();
  }

  if (body.action === "request") {
    if (!account) return err("Supplier not found.", 404);
    const title = text(body.title, 200).trim();
    if (title.length < 3) return err("Say what you need from the supplier.", 422);
    const r = { id: secretId(4), title, detail: text(body.detail, 2000).trim() || undefined, due: text(body.due, 10) || undefined, status: "open" as const, createdAt: new Date().toISOString(), by };
    await saveAccount({ ...account, requests: [...account.requests, r] }, by, `Asked for: ${title}`);
    return done();
  }

  if (body.action === "request-status") {
    if (!account) return err("Supplier not found.", 404);
    const rid = text(body.requestId, 20);
    const status = body.done === true ? "done" : "open";
    const r = account.requests.find((x) => x.id === rid);
    if (!r) return err("Request not found.", 404);
    await saveAccount({ ...account, requests: account.requests.map((x) => (x.id === rid ? { ...x, status } : x)) }, by, `${status === "done" ? "Closed" : "Reopened"}: ${r.title}`);
    return done();
  }

  if (body.action === "review") {
    const sub = (await getSubmissions()).find((s) => s.id === text(body.subId, 20));
    if (!sub) return err("Submission not found.", 404);
    const status = text(body.status, 20) as ReviewState;
    if (!REVIEW_STATES.some((r) => r.id === status)) return err("Choose a decision.");
    const note = text(body.note, 2000).trim();
    if ((status === "changes" || status === "rejected") && note.length < 3) return err("Tell the supplier what to change or why it was not accepted.", 422);
    await saveSubmission({ ...sub, status, review: { at: new Date().toISOString(), by, ...(note ? { note } : {}) } });
    const owner = await getAccount(sub.supplierId);
    if (owner) await saveAccount(owner, by, `${sub.ref} reviewed by ${by}: ${status}${note ? ` (${note.slice(0, 120)})` : ""}`);
    return done();
  }

  if (body.action === "delete-submission") {
    const sub = (await getSubmissions()).find((s) => s.id === text(body.subId, 20));
    if (!sub) return err("Submission not found.", 404);
    await removeSubmission(sub.id);
    const owner = await getAccount(sub.supplierId);
    if (owner) await saveAccount(owner, by, `${sub.ref} deleted by ${by}`);
    return done();
  }

  if (body.action === "delete-supplier") {
    if (!account) return err("Supplier not found.", 404);
    if (text(body.confirm, 20) !== account.code) return err(`Type ${account.code} to confirm.`, 422);
    const subs = (await getSubmissions()).filter((s) => s.supplierId === account.id);
    await Promise.all(subs.map((s) => removeSubmission(s.id)));
    await deleteRecord(`suppliers/${account.id}.json`);
    return done();
  }

  if (body.action === "open-as") {
    if (!account) return err("Supplier not found.", 404);
    const res = done();
    res.headers.append("Set-Cookie", supplierCookie(await makeSession({ role: "supplier", sid: account.id, email: account.emails[0] ?? "", name: team.name, via: team.user }), 8 * 3600));
    return res;
  }

  return err("Unknown action.");
}
