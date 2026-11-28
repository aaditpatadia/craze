"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { CHECK_KINDS, statusOf, statusesFor, type Case } from "@/lib/pipeline";
import { fileHref } from "@/lib/portal";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/forms/Field";

const post = async (body: Record<string, unknown>) => {
  const res = await fetch("/api/desk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok || !data.ok) throw new Error(data.error ?? `Failed (${res.status}).`);
};

const when = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** One request or LOI, with its contact details and a status control. */
export function CaseRow({ c }: { c: Case }) {
  const router = useRouter();
  const [status, setStatus] = useState(c.status);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await post({ action: "status", id: c.id, status, note });
      setNote("");
      setMsg("Saved. The buyer's tracking page is updated.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-xl border border-line p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-semibold">
          {c.contact.company} <span className="text-sm font-normal text-fg-subtle">· {c.kind === "loi" ? "Letter of intent" : c.kind === "complaint" ? "Complaint" : "Request"}</span>
        </p>
        <p className="code-text text-xs text-fg-subtle">
          {c.ref} · opened {when(c.createdAt)} · {statusOf(c.status).label}
        </p>
      </div>
      <p className="mt-1 text-sm text-fg-muted">
        {[c.contact.name, c.contact.role, c.sector].filter(Boolean).join(" · ")}
        {c.contact.name || c.contact.role || c.sector ? " · " : ""}
        <a href={`mailto:${c.contact.email}?subject=${encodeURIComponent(c.ref)}`} className="text-accent hover:underline">
          {c.contact.email}
        </a>
        {c.contact.phone ? ` · ${c.contact.phone}` : ""}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="text-sm">
          {c.items.length ? (
            <ul className="space-y-1">
              {c.items.map((i) => (
                <li key={i.code} className="code-text break-all">
                  {i.code}
                  {i.qty ? <span className="text-fg-subtle"> × {i.qty.toLocaleString("en-IN")}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="whitespace-pre-wrap break-words text-fg-muted">{c.summary.slice(0, 500)}</p>
          )}
          {c.complaint ? (
            <div className="mt-2 space-y-1 text-fg-muted">
              <p>
                <span className="font-medium text-fg">{c.complaint.issue}</span>
                {c.complaint.batch ? ` · batch ${c.complaint.batch}` : ""}
                {c.complaint.orderRef ? ` · ${c.complaint.orderRef}` : ""}
              </p>
              <p className="whitespace-pre-wrap break-words">{c.summary.slice(0, 800)}</p>
              {c.complaint.files.length ? (
                <p className="flex flex-wrap gap-x-3">
                  {c.complaint.files.map((f) => (
                    <a key={f.url} href={fileHref(f.url)} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      {f.name}
                    </a>
                  ))}
                </p>
              ) : null}
            </div>
          ) : null}
          <p className="mt-2 text-fg-subtle">
            {c.timeline}
            {c.targetPrice ? ` · target ${c.targetPrice}` : ""}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <select value={status} onChange={(e) => setStatus(e.target.value as Case["status"])} aria-label="Status" className={cn(inputClass, "mt-0 h-10 w-auto border-line")}>
              {statusesFor(c.kind).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <Button onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Update"}
            </Button>
            <Link href={`/track/${c.id}`} target="_blank" className="inline-flex items-center text-sm text-accent hover:underline">
              Buyer&apos;s page
            </Link>
            <DeleteButton id={c.id} what="case" label={c.ref} />
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note the buyer will see (optional)" aria-label="Note" className={cn(inputClass, "mt-0 h-10 border-line")} />
          {msg ? <p className="text-sm text-fg-muted">{msg}</p> : null}
        </div>
      </div>
    </li>
  );
}

/** Removes a test or spam entry for good, after a confirmation. */
export function DeleteButton({ id, what, label }: { id: string; what: "case" | "check"; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm(`Delete ${label} for good? This cannot be undone, and it disappears from every page.`)) return;
        setBusy(true);
        try {
          await post({ action: "delete", what, id });
          router.refresh();
        } catch (e) {
          window.alert(e instanceof Error ? e.message : "Failed.");
        } finally {
          setBusy(false);
        }
      }}
      className="inline-flex items-center text-sm text-danger hover:underline disabled:opacity-50"
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}

/** Log a document review, sample measurement, lab report or batch test. */
export function CheckForm({ codes }: { codes: string[] }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const blank = { code: "", kind: "sample", date: today, result: "pass", supplier: "", batch: "", units: "", lines: "", notes: "", by: "" };
  const [v, setV] = useState(blank);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await post({ action: "check", ...v, units: Number(v.units) || undefined });
      setMsg({ ok: true, text: `Logged ${v.code}. It is on the public evidence page now.` });
      setV({ ...blank, by: v.by, supplier: v.supplier });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Failed." });
    } finally {
      setBusy(false);
    }
  };

  const label = "text-sm font-medium";
  return (
    <form onSubmit={submit} className="mt-6 space-y-5 rounded-xl border border-line p-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <label className={label}>
          TM code
          <input list="tm-codes" required value={v.code} onChange={set("code")} placeholder="TM-MOT-2807-1300" className={cn(inputClass, "code-text h-11 border-line")} />
          <datalist id="tm-codes">
            {codes.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className={label}>
          What was checked
          <select value={v.kind} onChange={set("kind")} className={cn(inputClass, "h-11 border-line")}>
            {CHECK_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Date
          <input type="date" required value={v.date} onChange={set("date")} className={cn(inputClass, "h-11 border-line")} />
        </label>
        <label className={label}>
          Result
          <select value={v.result} onChange={set("result")} className={cn(inputClass, "h-11 border-line")}>
            <option value="pass">Pass</option>
            <option value="fail">Fail, rejected</option>
            <option value="info">Recorded, no pass or fail</option>
          </select>
        </label>
        <label className={label}>
          Supplier code <span className="font-normal text-fg-subtle">(TMS, optional)</span>
          <input value={v.supplier} onChange={set("supplier")} placeholder="TMS-0001" className={cn(inputClass, "code-text h-11 border-line")} />
        </label>
        <label className={label}>
          Batch <span className="font-normal text-fg-subtle">(optional)</span>
          <input value={v.batch} onChange={set("batch")} placeholder="B2612-01" className={cn(inputClass, "code-text h-11 border-line")} />
        </label>
        <label className={label}>
          Units checked <span className="font-normal text-fg-subtle">(optional)</span>
          <input value={v.units} onChange={set("units")} inputMode="numeric" className={cn(inputClass, "h-11 border-line")} />
        </label>
        <label className={label}>
          Your initials
          <input required value={v.by} onChange={set("by")} maxLength={4} placeholder="AP" className={cn(inputClass, "h-11 border-line uppercase")} />
        </label>
      </div>
      <label className={cn(label, "block")}>
        Measurements and findings, one per line
        <textarea
          required
          rows={5}
          value={v.lines}
          onChange={set("lines")}
          placeholder={"KV: 1296 rpm/V at 12.0 V (band 1235–1365)\nPhase resistance: 42.1 mΩ, four-wire\nMass: 39.8 g\nMagnet origin declaration received"}
          className={cn(inputClass, "border-line py-3")}
        />
      </label>
      <label className={cn(label, "block")}>
        Notes <span className="font-normal text-fg-subtle">(optional, public)</span>
        <input value={v.notes} onChange={set("notes")} className={cn(inputClass, "h-11 border-line")} />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={busy}>
          {busy ? "Logging…" : "Log check"}
        </Button>
        {msg ? <p className={cn("text-sm", msg.ok ? "text-fg-muted" : "text-danger")}>{msg.text}</p> : null}
      </div>
    </form>
  );
}
