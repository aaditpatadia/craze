"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { REVIEW_STATES, SUPPLIER_STATUSES, type SupplierAccount, type TeamRequest } from "@/lib/portal";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/forms/Field";

async function post(body: Record<string, unknown>) {
  const res = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; id?: string; code?: string; emailed?: boolean };
  if (!res.ok || !data.ok) throw new Error(data.error ?? `Failed (${res.status}).`);
  return data;
}

const ctl = cn(inputClass, "mt-1.5 h-11 border-line");
const lbl = "block text-sm font-medium";

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = async (body: Record<string, unknown>, ok: string, after?: (d: Awaited<ReturnType<typeof post>>) => void) => {
    setBusy(true);
    setMsg(null);
    try {
      const d = await post(body);
      setMsg({ ok: true, text: ok });
      after?.(d);
      router.refresh();
      return true;
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Failed." });
      return false;
    } finally {
      setBusy(false);
    }
  };
  const note = msg ? <p className={cn("text-sm", msg.ok ? "text-fg-muted" : "text-danger")}>{msg.text}</p> : null;
  return { busy, run, note };
}

/** Create a supplier account. The supplier then signs in with Google using one of these emails. */
export function InviteForm({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const blank = { company: "", emails: "", meeting: "", notes: "", categories: [] as string[] };
  const [v, setV] = useState(blank);
  const { busy, run, note } = useAction();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await run({ action: "invite", ...v, meeting: v.meeting ? new Date(v.meeting).toISOString() : "" }, "Supplier created.", (d) => {
          setV(blank);
          if (d.id) router.push(`/team/suppliers/${d.id}?new=1`);
        });
      }}
      className="space-y-5 rounded-xl border border-line p-5 sm:p-6"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <label className={lbl}>
          Company name
          <input required value={v.company} onChange={(e) => setV({ ...v, company: e.target.value })} className={ctl} placeholder="Shakti Motors Pvt Ltd" />
        </label>
        <label className={lbl}>
          Google sign-in email(s)
          <input required value={v.emails} onChange={(e) => setV({ ...v, emails: e.target.value })} className={ctl} placeholder="owner@gmail.com, qa@company.in" />
          <span className="mt-1 block text-xs font-normal text-fg-subtle">Gmail or Google Workspace addresses. Separate several with commas.</span>
        </label>
        <label className={lbl}>
          Onboarding meeting <span className="font-normal text-fg-subtle">(optional)</span>
          <input type="datetime-local" value={v.meeting} onChange={(e) => setV({ ...v, meeting: e.target.value })} className={ctl} />
        </label>
        <label className={lbl}>
          Team notes <span className="font-normal text-fg-subtle">(never shown to the supplier)</span>
          <input value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} className={ctl} placeholder="Met at the expo. Strong on 28xx motors." />
        </label>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">What they make</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((c) => {
            const on = v.categories.includes(c.id);
            return (
              <button
                type="button"
                key={c.id}
                aria-pressed={on}
                onClick={() => setV({ ...v, categories: on ? v.categories.filter((x) => x !== c.id) : [...v.categories, c.id] })}
                className={cn("min-h-9 rounded-full border px-3 text-sm transition-colors", on ? "border-accent bg-accent/10 text-fg" : "border-line text-fg-muted hover:border-line-strong")}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" loading={busy} loadingLabel="Creating">
          Create supplier and issue TMS code
        </Button>
        {note}
      </div>
    </form>
  );
}

/** Status, emails, meeting and notes for one supplier. */
export function SupplierSettings({ a, categories }: { a: SupplierAccount; categories: { id: string; name: string }[] }) {
  const toLocal = (iso?: string) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "");
  const [v, setV] = useState({ status: a.status, company: a.company, emails: a.emails.join(", "), meeting: toLocal(a.meeting), notes: a.notes ?? "", categories: a.categories });
  const { busy, run, note } = useAction();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void run({ action: "update", id: a.id, ...v, meeting: v.meeting ? new Date(v.meeting).toISOString() : "" }, "Saved.");
      }}
      className="space-y-4"
    >
      <label className={lbl}>
        Status
        <select value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as SupplierAccount["status"] })} className={ctl}>
          {SUPPLIER_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className={lbl}>
        Company name
        <input value={v.company} onChange={(e) => setV({ ...v, company: e.target.value })} className={ctl} />
      </label>
      <label className={lbl}>
        Google sign-in emails
        <input value={v.emails} onChange={(e) => setV({ ...v, emails: e.target.value })} className={ctl} />
      </label>
      <label className={lbl}>
        Onboarding meeting
        <input type="datetime-local" value={v.meeting} onChange={(e) => setV({ ...v, meeting: e.target.value })} className={ctl} />
      </label>
      <fieldset>
        <legend className="text-sm font-medium">Categories</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const on = v.categories.includes(c.id);
            return (
              <button
                type="button"
                key={c.id}
                aria-pressed={on}
                onClick={() => setV({ ...v, categories: on ? v.categories.filter((x) => x !== c.id) : [...v.categories, c.id] })}
                className={cn("min-h-8 rounded-full border px-2.5 text-xs transition-colors", on ? "border-accent bg-accent/10" : "border-line text-fg-muted hover:border-line-strong")}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className={lbl}>
        Team notes <span className="font-normal text-fg-subtle">(private)</span>
        <textarea rows={4} value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} className={cn(inputClass, "mt-1.5 border-line py-2.5")} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={busy} loadingLabel="Saving">
          Save
        </Button>
        {note}
      </div>
    </form>
  );
}

/** Ask the supplier for something specific. It shows at the top of their dashboard. */
export function AskForm({ id }: { id: string }) {
  const [v, setV] = useState({ title: "", detail: "", due: "" });
  const { busy, run, note } = useAction();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (await run({ action: "request", id, ...v }, "Added. The supplier sees it on their dashboard.")) setV({ title: "", detail: "", due: "" });
      }}
      className="space-y-3"
    >
      <input required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Send a 30-second video of the KV test on 5 units" aria-label="What you need" className={cn(ctl, "mt-0")} />
      <textarea rows={2} value={v.detail} onChange={(e) => setV({ ...v, detail: e.target.value })} placeholder="Details (optional)" aria-label="Details" className={cn(inputClass, "mt-0 border-line py-2.5")} />
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" value={v.due} onChange={(e) => setV({ ...v, due: e.target.value })} aria-label="Due date" className={cn(ctl, "mt-0 w-auto")} />
        <Button type="submit" variant="secondary" loading={busy} loadingLabel="Adding">
          Ask the supplier
        </Button>
      </div>
      {note}
    </form>
  );
}

export function RequestToggle({ id, r }: { id: string; r: TeamRequest }) {
  const { busy, run } = useAction();
  return (
    <button type="button" disabled={busy} onClick={() => void run({ action: "request-status", id, requestId: r.id, done: r.status !== "done" }, "")} className="text-xs text-accent hover:underline disabled:opacity-50">
      {r.status === "done" ? "Reopen" : "Mark done"}
    </button>
  );
}

/** Accept, ask for changes or reject one submission, with a note the supplier sees. */
export function ReviewControls({ subId, status }: { subId: string; status: string }) {
  const [v, setV] = useState({ status: status === "submitted" ? "accepted" : status, note: "" });
  const { busy, run, note } = useAction();
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <select value={v.status} onChange={(e) => setV({ ...v, status: e.target.value })} aria-label="Decision" className={cn(ctl, "mt-0 h-10 w-auto")}>
          {REVIEW_STATES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <Button onClick={() => void run({ action: "review", subId, ...v }, "Saved. The supplier sees the decision and your note.")} loading={busy} loadingLabel="Saving">
          Save decision
        </Button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Delete this submission for good? The supplier will no longer see it.")) void run({ action: "delete-submission", subId }, "Deleted.");
          }}
          className="text-sm text-danger hover:underline"
        >
          Delete
        </button>
      </div>
      <input value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} placeholder="Note to the supplier (needed for changes or rejection)" aria-label="Note to the supplier" className={cn(ctl, "mt-0 h-10")} />
      {note}
    </div>
  );
}

/** Opens the supplier's portal in this browser, for an onboarding meeting or to submit on their behalf. */
export function OpenAsButton({ id }: { id: string }) {
  const router = useRouter();
  const { busy, run, note } = useAction();
  return (
    <div className="space-y-2">
      <Button variant="secondary" loading={busy} loadingLabel="Opening" onClick={() => void run({ action: "open-as", id }, "", () => router.push("/supplier"))}>
        Open their portal
      </Button>
      {note}
    </div>
  );
}

export function DeleteSupplier({ a }: { a: SupplierAccount }) {
  const router = useRouter();
  const { busy, run, note } = useAction();
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          const typed = window.prompt(`This deletes ${a.company} and every submission record, for good. Type ${a.code} to confirm.`);
          if (typed && (await run({ action: "delete-supplier", id: a.id, confirm: typed.trim().toUpperCase() }, "Deleted."))) router.push("/team/suppliers");
        }}
        className="text-sm text-danger hover:underline disabled:opacity-50"
      >
        Delete this supplier
      </button>
      {note}
    </div>
  );
}

/** Send the supplier their invitation: automatically when email is set up, or as a ready Gmail draft. */
export function InvitePanel({ id, gmail, text, link, auto, emails, fresh }: { id: string; gmail: string; text: string; link: string; auto: boolean; emails: string[]; fresh: boolean }) {
  const { busy, run, note } = useAction();
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (what: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(what);
    setTimeout(() => setCopied(null), 2000);
  };
  return (
    <section className={cn("rounded-xl border p-5", fresh ? "border-accent bg-accent/5" : "border-line")}>
      <h2 className="font-semibold">{fresh ? "Supplier created. Now send the invitation" : "Invitation"}</h2>
      <p className="mt-1 text-sm text-fg-muted">
        It welcomes them, gives their TMS code, lists what to keep ready and links straight to sign-in with {emails.join(" or ")} pre-selected.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {auto ? (
          <Button loading={busy} loadingLabel="Sending" onClick={() => void run({ action: "send-invite", id }, "Invitation emailed.")}>
            Email the invitation
          </Button>
        ) : (
          <a
            href={gmail}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void run({ action: "invite-sent", id }, "Opened in Gmail. Press Send there.")}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-inverse px-5 text-sm font-medium text-inverse-fg hover:opacity-85"
          >
            Open the invitation in Gmail
          </a>
        )}
        <Button variant="secondary" onClick={() => void copy("text", text)}>
          {copied === "text" ? "Copied" : "Copy invitation text"}
        </Button>
        <Button variant="ghost" onClick={() => void copy("link", link)}>
          {copied === "link" ? "Copied" : "Copy sign-in link"}
        </Button>
      </div>
      <div className="mt-3">{note}</div>
    </section>
  );
}
