"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { COMPLAINT_ISSUES, COMPLAINT_SEVERITY } from "@/lib/pipeline";
import type { PortalFile } from "@/lib/portal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Uploader } from "@/components/portal/Uploader";
import { Field, Honeypot, inputClass } from "./Field";

const FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "video/mp4", "video/quicktime"];

type V = { company: string; name: string; email: string; phone: string; codes: string; orderRef: string; batch: string; affected: string; issue: string; severity: string; description: string; website: string };
const blank: V = { company: "", name: "", email: "", phone: "", codes: "", orderRef: "", batch: "", affected: "", issue: "", severity: "", description: "", website: "" };
const ORDER: (keyof V)[] = ["codes", "issue", "severity", "description", "company", "name", "email"];

export function ComplaintForm({ initialCode = "", initialOrder = "" }: { initialCode?: string; initialOrder?: string }) {
  const ids = useId();
  const [v, setV] = useState<V>({ ...blank, codes: initialCode, orderRef: initialOrder });
  const [files, setFiles] = useState<PortalFile[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof V, string>>>({});
  const [state, setState] = useState<{ s: "idle" | "sending" } | { s: "sent"; reference: string; track: string | null } | { s: "error"; message: string }>({ s: "idle" });
  const started = useRef(0);
  const form = useRef<HTMLFormElement>(null);
  const done = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    started.current = Date.now();
  }, []);
  const id = (k: keyof V) => `${ids}-${k}`;
  const bind = (k: keyof V) => ({
    id: id(k),
    name: k,
    value: v[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV((s) => ({ ...s, [k]: e.target.value })),
    "aria-invalid": !!errors[k] || undefined,
    "aria-describedby": errors[k] ? `${id(k)}-error` : undefined,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ s: "sending" });
    try {
      const res = await fetch("/api/complaint", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...v, files, startedAt: started.current }) });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reference?: string; track?: string | null; error?: string; errors?: Partial<Record<keyof V, string>> };
      if (res.ok && data.ok) {
        setState({ s: "sent", reference: data.reference ?? "", track: data.track ?? null });
        requestAnimationFrame(() => done.current?.focus());
      } else if (data.errors) {
        setErrors(data.errors);
        setState({ s: "error", message: "Some fields need attention." });
        const first = ORDER.find((k) => data.errors?.[k]);
        if (first) form.current?.querySelector<HTMLElement>(`#${CSS.escape(id(first))}`)?.focus();
      } else setState({ s: "error", message: data.error ?? "Something went wrong. Please try again." });
    } catch {
      setState({ s: "error", message: "Could not reach the server. Check your connection and try again." });
    }
  };

  if (state.s === "sent") {
    return (
      <div className="rounded-xl border border-line p-6 sm:p-8">
        <h2 ref={done} tabIndex={-1} className="flex items-center gap-2 text-xl font-semibold outline-none">
          <Icon name="check" className="text-accent" /> Complaint received
        </h2>
        <p className="mt-3 text-fg-muted">
          Your complaint number is <span className="code-text font-semibold text-fg">{state.reference}</span>. Quote it in every message. We reply within one working day, and
          within four working hours when you marked a safety risk or a stopped line.
        </p>
        {state.track ? (
          <p className="mt-4">
            <Link href={state.track} className="font-medium text-accent hover:underline">
              Follow this complaint
            </Link>
            <span className="text-sm text-fg-subtle"> · keep this link: it is private to you.</span>
          </p>
        ) : null}
        <p className="mt-4 text-sm text-fg-muted">Please keep the affected units, their packaging and labels. Do not open or modify them until we reply: we may ask for them back.</p>
      </div>
    );
  }

  const sel = cn(inputClass, "h-12 border-line");
  return (
    <form ref={form} onSubmit={submit} noValidate className="relative space-y-6">
      <Honeypot value={v.website} onChange={(x) => setV((s) => ({ ...s, website: x }))} />
      <fieldset className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold">The part</legend>
        <Field id={id("codes")} label="TM code of the affected part" hint="One or more. It is on the label, the delivery note and the invoice." error={errors.codes} className="sm:col-span-2">
          <input {...bind("codes")} placeholder="TM-MOT-2807-1300" className={cn(inputClass, "code-text h-12 border-line")} />
        </Field>
        <Field id={id("orderRef")} label="Invoice, order or request number" optional error={errors.orderRef}>
          <input {...bind("orderRef")} placeholder="TMI-261128-Q7NB" className={cn(inputClass, "code-text h-12 border-line")} />
        </Field>
        <Field id={id("batch")} label="Batch number on the label" optional error={errors.batch}>
          <input {...bind("batch")} placeholder="TMB-261128-4HZ8" className={cn(inputClass, "code-text h-12 border-line")} />
        </Field>
        <Field id={id("affected")} label="Units affected" optional error={errors.affected}>
          <input {...bind("affected")} inputMode="numeric" placeholder="12" className={cn(inputClass, "h-12 border-line")} />
        </Field>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold">What went wrong</legend>
        <Field id={id("issue")} label="Problem" error={errors.issue}>
          <select {...bind("issue")} className={sel}>
            <option value="">Choose one</option>
            {COMPLAINT_ISSUES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field id={id("severity")} label="How serious" error={errors.severity}>
          <select {...bind("severity")} className={sel}>
            <option value="">Choose one</option>
            {COMPLAINT_SEVERITY.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field
          id={id("description")}
          label="What happened"
          hint="When you found it, how many units, what you measured against what you expected, and the conditions: voltage, load, temperature."
          error={errors.description}
          className="sm:col-span-2"
        >
          <textarea {...bind("description")} rows={6} className={cn(inputClass, "border-line py-3")} />
        </Field>
        <div className="sm:col-span-2">
          <p className="text-sm font-medium">
            Photos, videos or test readings <span className="font-normal text-fg-subtle">(optional, they help a lot)</span>
          </p>
          <Uploader folder="complaints" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.mp4,.mov" types={FILE_TYPES} maxBytes={25 * 1024 * 1024} maxFiles={12} files={files} onChange={setFiles} />
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold">You</legend>
        <Field id={id("company")} label="Company" error={errors.company}>
          <input {...bind("company")} autoComplete="organization" className={cn(inputClass, "h-12 border-line")} />
        </Field>
        <Field id={id("name")} label="Your name" error={errors.name}>
          <input {...bind("name")} autoComplete="name" className={cn(inputClass, "h-12 border-line")} />
        </Field>
        <Field id={id("email")} label="Work email" error={errors.email}>
          <input {...bind("email")} type="email" autoComplete="email" className={cn(inputClass, "h-12 border-line")} />
        </Field>
        <Field id={id("phone")} label="Phone" optional error={errors.phone}>
          <input {...bind("phone")} type="tel" autoComplete="tel" className={cn(inputClass, "h-12 border-line")} />
        </Field>
      </fieldset>

      <p className="text-sm text-fg-subtle">
        We use these details only to handle this complaint, as set out in our{" "}
        <Link href="/legal/privacy" className="text-accent hover:underline">
          privacy notice
        </Link>
        . The maker sees the complaint by its TMC number, never your name or company.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" loading={state.s === "sending"} loadingLabel="Sending">
          Send complaint
        </Button>
        {state.s === "error" ? (
          <p role="alert" className="text-sm text-danger">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
