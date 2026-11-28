"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { TIMELINES, validateRequest, type FieldErrors, type RequestInput } from "@/lib/forms";
import { cn } from "@/lib/cn";
import { Button, LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { BOM_HANDOFF_KEY } from "@/components/bom/BomChecker";
import { readQuoteText, readQuoteUnits, useQuote } from "@/lib/quote";
import { Field, Honeypot, describedBy, inputClass } from "./Field";

type Status = { state: "idle" } | { state: "sending" } | { state: "sent"; reference?: string; track?: string | null } | { state: "error"; message: string };

const FIELDS: (keyof RequestInput)[] = ["company", "email", "role", "parts", "quantity", "timeline", "message"];

/** Prefills from the URL (?part=, ?qty=, ?from=bom). Wrap in Suspense with RequestFormStatic as fallback. */
export function RequestForm() {
  const params = useSearchParams();
  // Rows handed over from the BOM checker. This branch renders only in the browser.
  const from = params.get("from");
  const parts = (from === "bom" ? takeBomHandoff() : from === "quote" ? readQuoteText() : null) ?? params.get("part") ?? "";
  return <RequestFormInner initialParts={parts} initialQty={from === "quote" ? readQuoteUnits() : (params.get("qty") ?? "")} fromQuote={from === "quote"} />;
}

/** The same form with no prefill. Server-rendered as the Suspense fallback, so nothing shifts. */
export function RequestFormStatic() {
  return <RequestFormInner initialParts="" initialQty="" />;
}

function RequestFormInner({ initialParts, initialQty, fromQuote = false }: { initialParts: string; initialQty: string; fromQuote?: boolean }) {
  const { clear: clearQuote } = useQuote();
  const ids = useId();
  const [values, setValues] = useState<RequestInput>(() => ({
    company: "",
    email: "",
    role: "",
    parts: initialParts,
    quantity: initialQty,
    timeline: "",
    message: "",
    website: "",
    startedAt: 0,
  }));
  const [errors, setErrors] = useState<FieldErrors<RequestInput>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof RequestInput, boolean>>>({});
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  // When the form was first shown, for the spam timing check.
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const set = (k: keyof RequestInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...values, [k]: e.target.value };
    setValues(next);
    if (touched[k]) setErrors(validateRequest(next));
  };
  const blur = (k: keyof RequestInput) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validateRequest(values));
  };
  const err = (k: keyof RequestInput) => (touched[k] ? errors[k] : undefined);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateRequest(values);
    setErrors(found);
    setTouched(Object.fromEntries(FIELDS.map((f) => [f, true])));
    const first = FIELDS.find((f) => found[f]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(`${ids}-${first}`)}`)?.focus();
      return;
    }
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, startedAt: startedAt.current }) });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reference?: string; track?: string | null; error?: string; errors?: FieldErrors<RequestInput> };
      if (res.ok && data.ok) {
        setStatus({ state: "sent", reference: data.reference, track: data.track });
        if (fromQuote) clearQuote();
        track("Request submitted", { timeline: values.timeline });
        requestAnimationFrame(() => successRef.current?.focus());
      } else if (data.errors) {
        setErrors(data.errors);
        setStatus({ state: "error", message: "Some fields need attention." });
      } else {
        setStatus({ state: "error", message: data.error ?? "Something went wrong. Nothing was sent. Please try again." });
      }
    } catch {
      setStatus({ state: "error", message: "We could not reach the server. Check your connection and try again. Nothing was sent." });
    }
  };

  if (status.state === "sent") {
    return (
      <div className="rounded-xl border border-line bg-bg-subtle p-8">
        <Icon name="check" size={28} />
        <h2 ref={successRef} tabIndex={-1} className="mt-4 text-xl font-semibold outline-none">
          Request received
        </h2>
        <p className="mt-2 max-w-lg text-fg-muted">
          We will reply to {values.email} with what we can source, the evidence tier we hold for each part, and what we would
          still need to check.
        </p>
        {status.reference ? (
          <p className="mt-4 text-sm text-fg-muted">
            Your reference: <span className="code-text font-medium text-fg">{status.reference}</span>. Quote it in any reply. We use the same TM codes with the supplier.
          </p>
        ) : null}
        {status.track ? (
          <p className="mt-3 text-sm text-fg-muted">
            Follow it from received to delivered on your private tracking page:{" "}
            <Link href={status.track} className="text-accent hover:underline">
              track this request
            </Link>
            . Bookmark it: anyone with the link can see its status.
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton href="/parts" variant="secondary">
            Back to parts
          </LinkButton>
        </div>
      </div>
    );
  }

  const f = (k: keyof RequestInput) => `${ids}-${k}`;
  const ctl = (k: keyof RequestInput, hint?: string) => ({
    id: f(k),
    name: k,
    value: values[k] as string,
    onChange: set(k),
    onBlur: blur(k),
    "aria-invalid": !!err(k) || undefined,
    "aria-describedby": describedBy(f(k), hint, err(k)),
  });

  const hints = {
    email: "Work or personal, for example Gmail. We reply here with the quote.",
    parts: "TM codes, part names, supplier numbers or specs. One per line is easiest.",
  };

  return (
    <form ref={formRef} noValidate onSubmit={submit} className="relative space-y-6" aria-describedby={`${ids}-privacy`}>
      <Honeypot value={values.website} onChange={(v) => setValues((s) => ({ ...s, website: v }))} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id={f("company")} label="Company" error={err("company")}>
          <input {...ctl("company")} autoComplete="organization" className={cn(inputClass, "h-12 border-line")} />
        </Field>
        <Field id={f("role")} label="Your role" error={err("role")}>
          <input {...ctl("role")} autoComplete="organization-title" className={cn(inputClass, "h-12 border-line")} />
        </Field>
      </div>
      <Field id={f("email")} label="Email" hint={hints.email} error={err("email")}>
        <input {...ctl("email", hints.email)} type="email" autoComplete="email" inputMode="email" className={cn(inputClass, "h-12 border-line")} />
      </Field>
      <Field id={f("parts")} label="Parts needed" hint={hints.parts} error={err("parts")}>
        <textarea {...ctl("parts", hints.parts)} rows={5} className={cn(inputClass, "border-line py-3")} />
      </Field>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id={f("quantity")} label="Quantity" error={err("quantity")}>
          <input {...ctl("quantity")} inputMode="numeric" className={cn(inputClass, "tabular h-12 border-line")} />
        </Field>
        <Field id={f("timeline")} label="Timeline" error={err("timeline")}>
          <select {...ctl("timeline")} className={cn(inputClass, "h-12 border-line")}>
            <option value="" disabled>
              Choose one
            </option>
            {TIMELINES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field id={f("message")} label="Anything else" optional error={err("message")}>
        <textarea {...ctl("message")} rows={4} className={cn(inputClass, "border-line py-3")} />
      </Field>

      {status.state === "error" ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/40 p-4 text-sm">
          <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-danger" />
          {status.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p id={`${ids}-privacy`} className="max-w-sm text-xs text-fg-subtle">
          We use these details only to reply to this request. See the{" "}
          <Link href="/legal/privacy" className="underline">
            privacy notice
          </Link>
          .
        </p>
        <Button type="submit" size="lg" loading={status.state === "sending"} loadingLabel="Sending">
          Send request
        </Button>
      </div>
    </form>
  );
}

function takeBomHandoff(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(BOM_HANDOFF_KEY);
    return v;
  } catch {
    return null;
  }
}