"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { SECTORS, TIMELINES, parseReserveItems, validateReserve, type FieldErrors, type ReserveInput } from "@/lib/forms";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Field, Honeypot, describedBy, inputClass } from "./Field";

type Status = { state: "idle" } | { state: "sending" } | { state: "sent"; reference?: string; track?: string | null } | { state: "error"; message: string };
const ORDER: (keyof ReserveInput)[] = ["items", "timeline", "sector", "company", "name", "email", "agree"];

export function ReserveForm({ initialCode = "" }: { initialCode?: string }) {
  const ids = useId();
  const [v, setV] = useState<ReserveInput>({
    items: initialCode ? `${initialCode} x ` : "",
    timeline: "",
    targetPrice: "",
    company: "",
    name: "",
    email: "",
    phone: "",
    sector: "",
    notes: "",
    agree: false,
    website: "",
    startedAt: 0,
  });
  const [errors, setErrors] = useState<FieldErrors<ReserveInput>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ReserveInput, boolean>>>({});
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const started = useRef(0);
  const form = useRef<HTMLFormElement>(null);
  const done = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    started.current = Date.now();
  }, []);

  const update = (k: keyof ReserveInput, val: string | boolean) => {
    const next = { ...v, [k]: val };
    setV(next);
    if (touched[k]) setErrors(validateReserve(next));
  };
  const err = (k: keyof ReserveInput) => (touched[k] ? errors[k] : undefined);
  const id = (k: keyof ReserveInput) => `${ids}-${k}`;
  const ctl = (k: keyof ReserveInput, hint?: string) => ({
    id: id(k),
    name: k,
    value: v[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => update(k, e.target.value),
    onBlur: () => {
      setTouched((t) => ({ ...t, [k]: true }));
      setErrors(validateReserve(v));
    },
    "aria-invalid": !!err(k) || undefined,
    "aria-describedby": describedBy(id(k), hint, err(k)),
  });
  const items = parseReserveItems(v.items);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateReserve(v);
    setErrors(found);
    setTouched(Object.fromEntries(ORDER.map((k) => [k, true])));
    const first = ORDER.find((k) => found[k]);
    if (first) {
      form.current?.querySelector<HTMLElement>(`#${CSS.escape(id(first))}`)?.focus();
      return;
    }
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/reserve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...v, startedAt: started.current }) });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reference?: string; track?: string | null; error?: string; errors?: FieldErrors<ReserveInput> };
      if (res.ok && data.ok) {
        setStatus({ state: "sent", reference: data.reference, track: data.track });
        requestAnimationFrame(() => done.current?.focus());
      } else if (data.errors) {
        setErrors(data.errors);
        setStatus({ state: "error", message: "Some fields need attention." });
      } else setStatus({ state: "error", message: data.error ?? "Something went wrong. Nothing was sent." });
    } catch {
      setStatus({ state: "error", message: "We could not reach the server. Nothing was sent." });
    }
  };

  if (status.state === "sent") {
    return (
      <div className="rounded-xl border border-line bg-bg-subtle p-8">
        <Icon name="check" size={28} />
        <h2 ref={done} tabIndex={-1} className="mt-4 text-xl font-semibold outline-none">
          Letter of intent received
        </h2>
        <p className="mt-2 max-w-lg text-fg-muted">
          We will confirm by email to {v.email} within one working day, with lead times and the evidence we hold for each code. Nothing is binding until you send a purchase
          order.
        </p>
        {status.reference ? (
          <p className="mt-4 text-sm text-fg-muted">
            Reference: <span className="code-text font-medium text-fg">{status.reference}</span>
          </p>
        ) : null}
        {status.track ? (
          <p className="mt-3 text-sm text-fg-muted">
            <Link href={status.track} className="text-accent hover:underline">
              Track this letter
            </Link>{" "}
            from received to delivered. Bookmark the page: anyone with the link can see its status.
          </p>
        ) : null}
      </div>
    );
  }

  const hint = { items: "One line per code: TM code, then quantity. For example TM-MOT-2807-1300 x 400.", targetPrice: "Per unit, if you have one. It helps us match the right maker." };
  return (
    <form ref={form} noValidate onSubmit={submit} className="relative space-y-6">
      <Honeypot value={v.website} onChange={(x) => setV((s) => ({ ...s, website: x }))} />
      <Field id={id("items")} label="Codes and quantities" hint={hint.items} error={err("items")}>
        <textarea {...ctl("items", hint.items)} rows={4} className={cn(inputClass, "code-text whitespace-pre-wrap border-line py-3")} />
      </Field>
      {items.length ? (
        <ul className="flex flex-wrap gap-2 text-sm" aria-label="Codes read from your list">
          {items.map((i) => (
            <li key={i.code} className="code-text rounded-full border border-line px-3 py-1">
              {i.code} <span className="text-fg-subtle">× {i.qty || "?"}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Field id={id("timeline")} label="Needed" error={err("timeline")}>
          <select {...ctl("timeline")} className={cn(inputClass, "h-12 border-line")}>
            <option value="">Choose</option>
            {TIMELINES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field id={id("sector")} label="Sector" error={err("sector")}>
          <select {...ctl("sector")} className={cn(inputClass, "h-12 border-line")}>
            <option value="">Choose</option>
            {SECTORS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field id={id("targetPrice")} label="Target price" optional hint={hint.targetPrice}>
          <input {...ctl("targetPrice", hint.targetPrice)} inputMode="decimal" placeholder="₹" className={cn(inputClass, "h-12 border-line")} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id={id("company")} label="Company" error={err("company")}>
          <input {...ctl("company")} autoComplete="organization" className={cn(inputClass, "h-12 border-line")} />
        </Field>
        <Field id={id("name")} label="Your name" error={err("name")}>
          <input {...ctl("name")} autoComplete="name" className={cn(inputClass, "h-12 border-line")} />
        </Field>
        <Field id={id("email")} label="Email" error={err("email")}>
          <input {...ctl("email")} type="email" autoComplete="email" className={cn(inputClass, "h-12 border-line")} />
        </Field>
        <Field id={id("phone")} label="Phone" optional>
          <input {...ctl("phone")} type="tel" autoComplete="tel" className={cn(inputClass, "h-12 border-line")} />
        </Field>
      </div>
      <Field id={id("notes")} label="Anything else" optional error={err("notes")}>
        <textarea {...ctl("notes")} rows={3} className={cn(inputClass, "border-line py-3")} />
      </Field>
      <div>
        <label className="flex items-start gap-3 text-sm">
          <input
            id={id("agree")}
            type="checkbox"
            checked={v.agree}
            onChange={(e) => {
              update("agree", e.target.checked);
              setTouched((t) => ({ ...t, agree: true }));
            }}
            aria-invalid={!!err("agree") || undefined}
            className="mt-1 size-4 shrink-0 accent-[var(--color-accent)]"
          />
          <span className="text-fg-muted">
            This is a non-binding letter of intent. It tells Timule we plan to buy these codes in these quantities if price, lead time and evidence meet our needs. No payment
            or commitment until we issue a purchase order.
          </span>
        </label>
        {err("agree") ? <p className="mt-2 text-sm text-danger">{err("agree")}</p> : null}
      </div>
      {status.state === "error" ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-danger">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" /> {status.message}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={status.state === "sending"}>
        {status.state === "sending" ? "Sending…" : "Send letter of intent"}
      </Button>
    </form>
  );
}
