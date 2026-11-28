/** Opening and updating cases. Server only. */
import { makeReference } from "./codes";
import { codesIn, type Case, type CaseItem, type Check, type StatusId } from "./pipeline";
import { getRecord, saveRecord, secretId } from "./store";

export async function openCase(c: Omit<Case, "id" | "ref" | "createdAt" | "updatedAt" | "status" | "history" | "items"> & { items?: CaseItem[]; ref?: string }): Promise<Case> {
  const now = new Date().toISOString();
  const record: Case = {
    ...c,
    id: secretId(),
    ref: c.ref ?? makeReference(c.kind === "loi" ? "TMR" : c.kind === "complaint" ? "TMC" : "TMQ"),
    createdAt: now,
    updatedAt: now,
    status: "received",
    items: c.items?.length ? c.items : codesIn(c.summary).map((code) => ({ code, qty: 0 })),
    history: [{ at: now, status: "received" }],
  };
  await saveRecord(`cases/${record.id}.json`, record);
  return record;
}

export async function moveCase(id: string, status: StatusId, note?: string): Promise<Case | null> {
  if (!/^[a-f0-9]{32}$/.test(id)) return null;
  const c = await getRecord<Case>(`cases/${id}.json`);
  if (!c) return null;
  const now = new Date().toISOString();
  const next: Case = { ...c, status, updatedAt: now, history: [...c.history, { at: now, status, ...(note ? { note } : {}) }] };
  await saveRecord(`cases/${id}.json`, next);
  return next;
}

export async function logCheck(c: Omit<Check, "id" | "createdAt">): Promise<Check> {
  const record: Check = { ...c, id: `${c.date.replace(/-/g, "")}-${secretId(4)}`, ref: makeReference("TMV"), createdAt: new Date().toISOString() };
  await saveRecord(`checks/${record.id}.json`, record);
  return record;
}
