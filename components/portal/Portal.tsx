"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { SUBMISSION_KINDS, VAULT_FILE, fieldsOf, fileHref, kindOf, type PortalFile, type SubmissionKind, type SupplierProfile, type TeamRequest } from "@/lib/portal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { inputClass } from "@/components/forms/Field";
import { Uploader } from "./Uploader";

async function post(body: Record<string, unknown>) {
  const res = await fetch("/api/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; ref?: string };
  if (!res.ok || !data.ok) throw new Error(data.error ?? `Something went wrong (${res.status}). Please try again.`);
  return data;
}

const ctl = cn(inputClass, "mt-1.5 h-11 border-line");
const area = cn(inputClass, "mt-1.5 border-line py-2.5");
const lbl = "block text-sm font-medium";
const opt = <span className="font-normal text-fg-subtle"> (optional)</span>;

function Msg({ m }: { m: { ok: boolean; text: string } | null }) {
  return m ? (
    <p role={m.ok ? "status" : "alert"} className={cn("text-sm", m.ok ? "text-fg-muted" : "text-danger")}>
      {m.text}
    </p>
  ) : null;
}

const PROFILE_FIELDS: { k: keyof SupplierProfile; label: string; required?: boolean; long?: boolean; placeholder?: string; half?: boolean }[] = [
  { k: "legalName", label: "Legal name of the company", required: true, placeholder: "Shakti Motors Private Limited" },
  { k: "tradeName", label: "Trade name", placeholder: "If different" },
  { k: "address", label: "Registered address", required: true, long: true },
  { k: "city", label: "City", required: true, half: true },
  { k: "state", label: "State", required: true, half: true },
  { k: "gstin", label: "GSTIN", placeholder: "24ABCDE1234F1Z5", half: true },
  { k: "udyam", label: "Udyam registration number", placeholder: "UDYAM-GJ-01-0012345", half: true },
  { k: "founded", label: "Year founded", placeholder: "2014", half: true },
  { k: "employees", label: "People employed", placeholder: "45", half: true },
  { k: "website", label: "Website or online catalogue", placeholder: "shaktimotors.in" },
  { k: "contactName", label: "Main contact", required: true, half: true },
  { k: "contactRole", label: "Their role", required: true, placeholder: "Director, quality head…", half: true },
  { k: "phone", label: "Phone (WhatsApp if possible)", required: true, placeholder: "+91 98xxx xxxxx" },
  { k: "makes", label: "What you make", required: true, long: true, placeholder: "BLDC outrunner motors 22xx to 63xx, 300–2600 KV, in-house winding and balancing" },
  { k: "capacity", label: "Total monthly capacity", placeholder: "4,000 motors a month on two shifts" },
  { k: "customers", label: "Main customers or sectors", long: true, placeholder: "Agri-drone makers, two defence integrators, export to UAE" },
];

export function ProfileForm({ initial }: { initial?: SupplierProfile }) {
  const router = useRouter();
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries(PROFILE_FIELDS.map((f) => [f.k, (initial?.[f.k] as string | undefined) ?? ""])));
  const [busy, setBusy] = useState(false);
  const [m, setM] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setM(null);
        try {
          await post({ action: "profile", profile: v });
          setM({ ok: true, text: "Saved." });
          router.refresh();
        } catch (err) {
          setM({ ok: false, text: err instanceof Error ? err.message : "Failed." });
        } finally {
          setBusy(false);
        }
      }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {PROFILE_FIELDS.map((f) => (
        <label key={f.k} className={cn(lbl, f.half ? "" : "sm:col-span-2")}>
          {f.label}
          {f.required ? null : opt}
          {f.long ? (
            <textarea rows={3} required={f.required} value={v[f.k]} placeholder={f.placeholder} onChange={(e) => setV({ ...v, [f.k]: e.target.value })} className={area} />
          ) : (
            <input required={f.required} value={v[f.k]} placeholder={f.placeholder} onChange={(e) => setV({ ...v, [f.k]: e.target.value })} className={ctl} />
          )}
        </label>
      ))}
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Button type="submit" loading={busy} loadingLabel="Saving">
          Save profile
        </Button>
        <Msg m={m} />
      </div>
    </form>
  );
}

export function AgreementForm({ accepted }: { accepted?: { name: string; title: string; acceptedAt: string } }) {
  const router = useRouter();
  const [v, setV] = useState({ name: "", title: "", confirm: false });
  const [busy, setBusy] = useState(false);
  const [m, setM] = useState<{ ok: boolean; text: string } | null>(null);
  if (accepted)
    return (
      <p className="flex items-start gap-2 text-sm">
        <Icon name="check" size={18} className="mt-0.5 shrink-0 text-accent" />
        <span>
          Accepted by {accepted.name}, {accepted.title}, on{" "}
          {new Date(accepted.acceptedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}.{" "}
          <Link href="/legal/supplier-terms" target="_blank" className="text-accent hover:underline">
            Read the terms
          </Link>
        </span>
      </p>
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setM(null);
        try {
          await post({ action: "agree", ...v });
          router.refresh();
        } catch (err) {
          setM({ ok: false, text: err instanceof Error ? err.message : "Failed." });
          setBusy(false);
        }
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={lbl}>
          Your full name
          <input required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={ctl} autoComplete="name" />
        </label>
        <label className={lbl}>
          Your title
          <input required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} className={ctl} placeholder="Director" />
        </label>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" required checked={v.confirm} onChange={(e) => setV({ ...v, confirm: e.target.checked })} className="mt-1 size-4 accent-[var(--color-accent)]" />
        <span>
          I have read the{" "}
          <Link href="/legal/supplier-terms" target="_blank" className="text-accent hover:underline">
            Timule supplier terms
          </Link>
          , I am authorised to accept them for my company, and everything we submit in this portal is true and complete to the best of our knowledge.
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" loading={busy} loadingLabel="Recording">
          Accept the supplier terms
        </Button>
        <Msg m={m} />
      </div>
    </form>
  );
}

/** Submit any item on the checklist: the fields for that kind, files and a note. */
export function SubmitForm({ sid, initialKind, requests, partCodes }: { sid: string; initialKind?: string; requests: TeamRequest[]; partCodes: string[] }) {
  const router = useRouter();
  const start = (kindOf(initialKind ?? "")?.id ?? "registration") as SubmissionKind;
  const [kind, setKind] = useState<SubmissionKind>(start);
  const [title, setTitle] = useState("");
  const [partCode, setPartCode] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<PortalFile[]>([]);
  const [note, setNote] = useState("");
  const [requestId, setRequestId] = useState("");
  const [busy, setBusy] = useState(false);
  const [m, setM] = useState<{ ok: boolean; text: string } | null>(null);
  const def = kindOf(kind)!;
  const open = requests.filter((r) => r.status === "open");

  const reset = (k: SubmissionKind) => {
    setKind(k);
    setFields({});
    setTitle("");
    setM(null);
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setM(null);
        try {
          const d = await post({ action: "submit", kind, title, partCode, fields, files, note, requestId });
          setM({ ok: true, text: `Submitted as ${d.ref}. The Timule team will review it.` });
          setFields({});
          setFiles([]);
          setTitle("");
          setNote("");
          setPartCode("");
          setRequestId("");
          router.refresh();
        } catch (err) {
          setM({ ok: false, text: err instanceof Error ? err.message : "Failed." });
        } finally {
          setBusy(false);
        }
      }}
      className="space-y-6"
    >
      <fieldset>
        <legend className="text-sm font-medium">What are you submitting?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SUBMISSION_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              aria-pressed={k.id === kind}
              onClick={() => reset(k.id)}
              className={cn(
                "min-h-11 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                k.id === kind ? "border-accent bg-accent/10 font-medium" : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
              )}
            >
              {k.short}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-fg-muted">{def.hint}</p>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={lbl}>
          Title{opt}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "product" ? "2807 1300 KV outrunner" : def.label} className={ctl} />
        </label>
        <label className={lbl}>
          TM code it relates to{opt}
          <input list="portal-codes" value={partCode} onChange={(e) => setPartCode(e.target.value.toUpperCase())} placeholder="TM-MOT-2807-1300" className={cn(ctl, "code-text")} />
          <datalist id="portal-codes">
            {partCodes.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        {fieldsOf(kind).map((f) => (
          <label key={`${kind}-${f.id}`} className={cn(lbl, f.long ? "sm:col-span-2" : "")}>
            {f.label}
            {f.required ? null : opt}
            {f.hint ? <span className="block text-xs font-normal text-fg-subtle">{f.hint}</span> : null}
            {f.long ? (
              <textarea rows={4} required={f.required} value={fields[f.id] ?? ""} placeholder={f.placeholder} onChange={(e) => setFields({ ...fields, [f.id]: e.target.value })} className={area} />
            ) : (
              <input required={f.required} value={fields[f.id] ?? ""} placeholder={f.placeholder} onChange={(e) => setFields({ ...fields, [f.id]: e.target.value })} className={ctl} />
            )}
          </label>
        ))}
      </div>

      <div>
        <p className="text-sm font-medium">
          Files
          {def.minFiles === 0 ? opt : <span className="font-normal text-fg-subtle"> ({def.minFiles === 1 ? "at least 1" : `at least ${def.minFiles}`})</span>}
        </p>
        <p className="text-xs text-fg-subtle">{def.files}</p>
        <Uploader
          folder={`vault/${sid}`}
          accept={VAULT_FILE.accept}
          types={VAULT_FILE.types}
          maxBytes={VAULT_FILE.maxBytes}
          maxFiles={VAULT_FILE.maxFiles}
          files={files}
          onChange={setFiles}
          preview={fileHref}
          hint={`Photos, videos (up to ${VAULT_FILE.maxBytes / 1024 / 1024} MB) and PDFs. Up to ${VAULT_FILE.maxFiles} files.`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={cn(lbl, open.length ? "" : "sm:col-span-2")}>
          Note to the Timule team{opt}
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={area} />
        </label>
        {open.length ? (
          <label className={lbl}>
            This answers a request{opt}
            <select value={requestId} onChange={(e) => setRequestId(e.target.value)} className={ctl}>
              <option value="">No</option>
              {open.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" loading={busy} loadingLabel="Submitting">
          Submit {def.short.toLowerCase()}
        </Button>
        <Msg m={m} />
      </div>
    </form>
  );
}

export function WithdrawButton({ id, code }: { id: string; code: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm(`Withdraw ${code}? You can submit it again afterwards.`)) return;
        setBusy(true);
        try {
          await post({ action: "withdraw", id });
          router.refresh();
        } catch (e) {
          window.alert(e instanceof Error ? e.message : "Failed.");
        } finally {
          setBusy(false);
        }
      }}
      className="text-sm text-fg-muted hover:text-danger hover:underline disabled:opacity-50"
    >
      {busy ? "Withdrawing…" : "Withdraw"}
    </button>
  );
}
