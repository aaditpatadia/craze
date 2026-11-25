"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { ORIGIN_KNOWLEDGE, validateSupplier, type FieldErrors, type SupplierInput } from "@/lib/forms";
import { cn } from "@/lib/cn";
import { Button, LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Field, Honeypot, describedBy, inputClass } from "./Field";

const FIELDS: (keyof SupplierInput)[] = ["company", "email", "city", "role", "parts", "capacity", "origin", "certifications", "message"];

type Status = { state: "idle" } | { state: "sending" } | { state: "sent"; reference?: string } | { state: "error"; message: string };

/** Prefills ?part= with a VK code. Wrap in Suspense with SupplierFormStatic as fallback. */
export function SupplierForm() {
  const params = useSearchParams();
  return <SupplierFormInner initialParts={params.get("part") ?? ""} />;
}

export function SupplierFormStatic() {
  return <SupplierFormInner initialParts="" />;
}

function SupplierFormInner({ initialParts }: { initialParts: string }) {
  const ids = useId();
  const [values, setValues] = useState<SupplierInput>(() => ({
    company: "",
    email: "",
    city: "",
    role: "",
    parts: initialParts,
    capacity: "",
    origin: "",
    certifications: "",
    message: "",
    website: "",
    startedAt: 0,
  }));
  const [errors, setErrors] = useState<FieldErrors<SupplierInput>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SupplierInput, boolean>>>({});
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const set = (k: keyof SupplierInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...values, [k]: e.target.value };
    setValues(next);
    if (touched[k]) setErrors(validateSupplier(next));
  };
  const blur = (k: keyof SupplierInput) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validateSupplier(values));
  };
  const err = (k: keyof SupplierInput) => (touched[k] ? errors[k] : undefined);
  const f = (k: keyof SupplierInput) => `${ids}-${k}`;
  const ctl = (k: keyof SupplierInput, hint?: string) => ({
    id: f(k),
    name: k,
    value: values[k] as string,
    onChange: set(k),
    onBlur: blur(k),
    "aria-invalid": !!err(k) || undefined,
    "aria-describedby": describedBy(f(k), hint, err(k)),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateSupplier(values);
    setErrors(found);
    setTouched(Object.fromEntries(FIELDS.map((k) => [k, true])));
    const first = FIELDS.find((k) => found[k]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(f(first))}`)?.focus();
      return;
    }
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, startedAt: startedAt.current }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reference?: string; error?: string; errors?: FieldErrors<SupplierInput> };
      if (res.ok && data.ok) {
        setStatus({ state: "sent", reference: data.reference });
        track("Supplier applied");
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
          Application received
        </h2>
        <p className="mt-2 max-w-lg text-fg-muted">
          We will reply to {values.email} with the build sheets for the codes you listed and the documents we need first.
        </p>
        {status.reference ? (
          <p className="mt-4 text-sm text-fg-muted">
            Your reference: <span className="code-text font-medium text-fg">{status.reference}</span>
          </p>
        ) : null}
        <div className="mt-6">
          <LinkButton href="/codes" variant="secondary">
            See all VK codes
          </LinkButton>
        </div>
      </div>
    );
  }

  const hints = {
    email: "A company address, so we know who we are talking to.",
    parts: "VK codes from this site, or the kinds of part you make. One per line.",
    capacity: "Per month, for the parts above. A range is fine.",
  };

  return (
    <form ref={formRef} noValidate onSubmit={submit} className="relative space-y-6" aria-describedby={`${ids}-privacy`}>
      <Honeypot value={values.website} onChange={(v) => setValues((s) => ({ ...s, website: v }))} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id={f("company")} label="Company" error={err("company")}>
          <input {...ctl("company")} autoComplete="organization" className={cn(inputClass, "h-12 border-line")} />
        </Field>
        <Field id={f("city")} label="City where parts are made" error={err("city")}>
          <input {...ctl("city")} autoComplete="address-level2" className={cn(inputClass, "h-12 border-line")} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id={f("email")} label="Company email" hint={hints.email} error={err("email")}>
          <input {...ctl("email", hints.email)} type="email" autoComplete="email" inputMode="email" className={cn(inputClass, "h-12 border-line")} />
        </Field>
        <Field id={f("role")} label="Your role" error={err("role")}>
          <input {...ctl("role")} autoComplete="organization-title" className={cn(inputClass, "h-12 border-line")} />
        </Field>
      </div>
      <Field id={f("parts")} label="Parts you can build" hint={hints.parts} error={err("parts")}>
        <textarea {...ctl("parts", hints.parts)} rows={4} className={cn(inputClass, "code-text border-line py-3 [white-space:pre-wrap]")} />
      </Field>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id={f("capacity")} label="Monthly capacity" hint={hints.capacity} error={err("capacity")}>
          <input {...ctl("capacity", hints.capacity)} className={cn(inputClass, "h-12 border-line")} />
        </Field>
        <Field id={f("origin")} label="Do you know where your materials come from?" error={err("origin")}>
          <select {...ctl("origin")} className={cn(inputClass, "h-12 border-line")}>
            <option value="" disabled>
              Choose one
            </option>
            {ORIGIN_KNOWLEDGE.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field id={f("certifications")} label="Certifications" optional error={err("certifications")}>
        <input {...ctl("certifications")} placeholder="For example ISO 9001, AS9100" className={cn(inputClass, "h-12 border-line")} />
      </Field>
      <Field id={f("message")} label="Anything else" optional error={err("message")}>
        <textarea {...ctl("message")} rows={3} className={cn(inputClass, "border-line py-3")} />
      </Field>

      {status.state === "error" ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/40 p-4 text-sm">
          <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-danger" />
          {status.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p id={`${ids}-privacy`} className="max-w-sm text-xs text-fg-subtle">
          We use these details only to reply. We never publish a supplier&apos;s name without their agreement. See the{" "}
          <Link href="/legal/privacy" className="underline">
            privacy notice
          </Link>
          .
        </p>
        <Button type="submit" size="lg" loading={status.state === "sending"} loadingLabel="Sending">
          Send application
        </Button>
      </div>
    </form>
  );
}
