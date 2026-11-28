/** Supplier accounts and portal submissions in the record store. Server only. */
import { cache } from "react";
import { makeReference } from "./codes";
import sampleSuppliers from "@/content/suppliers.json";
import { VAULT_FILE, checklist, type PortalFile, type PortalSubmission, type SupplierAccount } from "./portal";
import { text } from "./security";
import { deleteRecord, listRecords, saveRecord, secretId } from "./store";

export const ID_RE = /^[a-f0-9]{16}$/;

export const getAccounts = cache(async () => listRecords<SupplierAccount>("suppliers/"));
export const getSubmissions = cache(async () => listRecords<PortalSubmission>("subs/"));

export async function getAccount(id: string): Promise<SupplierAccount | null> {
  if (!ID_RE.test(id)) return null;
  return (await getAccounts()).find((a) => a.id === id) ?? null;
}

export async function accountByEmail(email: string): Promise<SupplierAccount | null> {
  const e = email.trim().toLowerCase();
  return (await getAccounts()).find((a) => a.emails.includes(e)) ?? null;
}

export async function submissionsFor(supplierId: string): Promise<PortalSubmission[]> {
  return (await getSubmissions()).filter((s) => s.supplierId === supplierId);
}

/** Next TMS code. Codes are never reused, so it counts past every code ever issued, sample ones included. */
export async function nextSupplierCode(): Promise<string> {
  const used = [...(sampleSuppliers as { code: string }[]).map((s) => s.code), ...(await getAccounts()).map((a) => a.code)];
  const max = used.reduce((m, c) => Math.max(m, Number(/^TMS-(\d+)$/.exec(c)?.[1] ?? 0)), 0);
  return `TMS-${String(max + 1).padStart(3, "0")}`;
}

export async function saveAccount(a: SupplierAccount, by: string, what?: string): Promise<SupplierAccount> {
  const now = new Date().toISOString();
  const next: SupplierAccount = { ...a, updatedAt: now, history: what ? [...a.history, { at: now, by, what }].slice(-200) : a.history };
  await saveRecord(`suppliers/${a.id}.json`, next);
  return next;
}

export async function createAccount(input: { company: string; emails: string[]; categories: string[]; meeting?: string; notes?: string }, by: string): Promise<SupplierAccount> {
  const now = new Date().toISOString();
  const a: SupplierAccount = {
    id: secretId(8),
    code: await nextSupplierCode(),
    company: input.company,
    emails: input.emails,
    categories: input.categories,
    status: "invited",
    ...(input.meeting ? { meeting: input.meeting } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
    requests: [],
    history: [],
    createdAt: now,
    updatedAt: now,
  };
  return saveAccount(a, by, `Invited by ${by}`);
}

export async function createSubmission(s: Omit<PortalSubmission, "id" | "ref" | "createdAt" | "updatedAt" | "status">): Promise<PortalSubmission> {
  const now = new Date().toISOString();
  const rec: PortalSubmission = { ...s, id: secretId(8), ref: makeReference(s.kind === "sample" ? "TMX" : "TMD"), status: "submitted", createdAt: now, updatedAt: now };
  await saveRecord(`subs/${rec.id}.json`, rec);
  return rec;
}

export async function saveSubmission(s: PortalSubmission) {
  const next = { ...s, updatedAt: new Date().toISOString() };
  await saveRecord(`subs/${s.id}.json`, next);
  return next;
}

export const removeSubmission = (id: string) => deleteRecord(`subs/${id}.json`);

/** Moves a supplier from onboarding to review once every required item is in. Never moves anyone backwards. */
export async function settleStatus(a: SupplierAccount, by: string): Promise<SupplierAccount> {
  const subs = await submissionsFor(a.id);
  const { readyForReview } = checklist(a, subs);
  if (a.status === "invited") return saveAccount({ ...a, status: "onboarding" }, by, "Signed in for the first time");
  if (a.status === "onboarding" && readyForReview) return saveAccount({ ...a, status: "review" }, by, "Every required item submitted: ready for review");
  return a;
}

const BLOB = /^https:\/\/[a-z0-9-]+\.(public|private)\.blob\.vercel-storage\.com\/vault\/([a-f0-9]{16})\//i;

/** Files the browser says it uploaded: only accepted if they sit in this supplier's own vault. */
export function vaultFiles(v: unknown, sid: string): PortalFile[] | null {
  if (!Array.isArray(v)) return [];
  const out: PortalFile[] = [];
  for (const f of v.slice(0, VAULT_FILE.maxFiles)) {
    if (!f || typeof f !== "object") return null;
    const r = f as Record<string, unknown>;
    const url = text(r.url, 600);
    const m = BLOB.exec(url);
    if (!m || m[2] !== sid) return null;
    out.push({ name: text(r.name, 200) || "file", url, size: Math.max(0, Math.round(Number(r.size) || 0)), type: text(r.type, 80) });
  }
  return out;
}

