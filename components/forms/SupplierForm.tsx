"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { track } from "@/lib/analytics";
import { CERTIFICATIONS, CERT_FILE, ORIGIN_KNOWLEDGE, validateSupplier, type FieldErrors, type SupplierInput } from "@/lib/forms";
import { SECTOR_LABEL } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Button, LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Field, Honeypot, describedBy, inputClass } from "./Field";

export type SupplierCategory = { id: string; name: string; sector: string; live: boolean };

const FIELDS: (keyof SupplierInput)[] = [
  "company",
  "email",
  "city",
  "role",
  "categories",
  "siteUrl",
  "capacity",
  "origin",
  "certifications",
  "certificationsOther",
  "certificateFiles",
  "certificateLink",
  "parts",
  "message",
];

type Status = { state: "idle" } | { state: "sending" } | { state: "sent"; reference?: string } | { state: "error"; message: string };
type Pending = { key: string; name: string; state: "uploading" | "failed"; message?: string };

type Props = { categories: SupplierCategory[]; uploads: boolean };

/** Prefills ?part= with a TM code. Wrap in Suspense with SupplierFormStatic as fallback. */
export function SupplierForm(props: Props) {
  const params = useSearchParams();
  return <SupplierFormInner {...props} initialParts={params.get("part") ?? ""} />;
}

export function SupplierFormStatic(props: Props) {
  return <SupplierFormInner {...props} initialParts="" />;
}

const chip =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line px-3.5 text-sm text-fg-muted transition-colors has-[:checked]:border-fg has-[:checked]:bg-bg-subtle has-[:checked]:text-fg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent";

function SupplierFormInner({ categories, uploads, initialParts }: Props & { initialParts: string }) {
  const ids = useId();
  const [values, setValues] = useState<SupplierInput>(() => ({
    company: "",
    email: "",
    city: "",
    role: "",
    categories: [],
    siteUrl: "",
    parts: initialParts,
    capacity: "",
    origin: "",
    certifications: [],
    certificationsOther: "",
    certificateFiles: [],
    certificateLink: "",
    message: "",
    website: "",
    startedAt: 0,
  }));
  const [errors, setErrors] = useState<FieldErrors<SupplierInput>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SupplierInput, boolean>>>({});
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [pending, setPending] = useState<Pending[]>([]);
  const [showLink, setShowLink] = useState(!uploads);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const update = (patch: Partial<SupplierInput>, keys: (keyof SupplierInput)[] = []) => {
    setValues((prev) => {
      const next = { ...prev, ...patch };
      if (keys.some((k) => touched[k])) setErrors(validateSupplier(next));
      return next;
    });
  };
  const set = (k: keyof SupplierInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    update({ [k]: e.target.value } as Partial<SupplierInput>, [k]);
  const blur = (k: keyof SupplierInput) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validateSupplier(values));
  };
  const toggle = (k: "categories" | "certifications", v: string) => {
    const list = values[k];
    const next = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
    setTouched((t) => ({ ...t, [k]: true }));
    update({ [k]: next } as Partial<SupplierInput>, [k]);
    setErrors(validateSupplier({ ...values, [k]: next }));
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

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const room = CERT_FILE.maxFiles - values.certificateFiles.length;
    const files = [...list].slice(0, Math.max(0, room));
    for (const file of files) {
      const key = `${file.name}-${file.size}-${Math.random()}`;
      const bad = !(CERT_FILE.types as readonly string[]).includes(file.type)
        ? "Use a PDF, JPG, PNG or WebP file."
        : file.size > CERT_FILE.maxBytes
          ? "Files can be up to 10 MB."
          : null;
      if (bad) {
        setPending((p) => [...p, { key, name: file.name, state: "failed", message: bad }]);
        continue;
      }
      setPending((p) => [...p, { key, name: file.name, state: "uploading" }]);
      try {
        const safe = file.name.replace(/[^\w.-]+/g, "-").slice(-80);
        const blob = await upload(`certificates/${safe}`, file, { access: "public", handleUploadUrl: "/api/upload", contentType: file.type });
        setPending((p) => p.filter((x) => x.key !== key));
        setTouched((t) => ({ ...t, certificateFiles: true }));
        setValues((prev) => {
          const next = { ...prev, certificateFiles: [...prev.certificateFiles, { name: file.name, url: blob.url }] };
          setErrors(validateSupplier(next));
          return next;
        });
      } catch (e) {
        setPending((p) => p.map((x) => (x.key === key ? { ...x, state: "failed", message: e instanceof Error ? e.message : "Upload failed." } : x)));
        setShowLink(true);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeFile = (url: string) => update({ certificateFiles: values.certificateFiles.filter((x) => x.url !== url) }, ["certificateFiles"]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending.some((p) => p.state === "uploading")) {
      setStatus({ state: "error", message: "Wait for your certificates to finish uploading." });
      return;
    }
    const found = validateSupplier(values);
    setErrors(found);
    setTouched(Object.fromEntries(FIELDS.map((k) => [k, true])));
    const first = FIELDS.find((k) => found[k]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.scrollIntoView({ block: "center" });
      formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(f(first))}, [data-field="${first}"] input`)?.focus();
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
          We will check your certificates and reply to {values.email} with the build sheets for the parts you make and the documents we need first.
        </p>
        {status.reference ? (
          <p className="mt-4 text-sm text-fg-muted">
            Your reference: <span className="code-text font-medium text-fg">{status.reference}</span>
          </p>
        ) : null}
        <div className="mt-6">
          <LinkButton href="/codes" variant="secondary">
            See all TM codes
          </LinkButton>
        </div>
      </div>
    );
  }

  const hints = {
    email: "Company or personal email, for example Gmail.",
    siteUrl: "If your website or catalogue lists what you make, that is enough. We will read it.",
    parts: "TM codes from this site, or specific parts and sizes. One per line.",
    capacity: "Per month, for the parts above. A range is fine.",
  };
  const sectors = [...new Set(categories.map((c) => c.sector))];
  const groupError = (k: keyof SupplierInput) =>
    err(k) ? (
      <p id={`${f(k)}-error`} className="mt-2 flex items-start gap-1.5 text-sm text-danger">
        <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
        {err(k)}
      </p>
    ) : null;

  return (
    <form ref={formRef} noValidate onSubmit={submit} className="relative space-y-8" aria-describedby={`${ids}-privacy`}>
      <Honeypot value={values.website} onChange={(v) => setValues((s) => ({ ...s, website: v }))} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id={f("company")} label="Company" error={err("company")}>
          <input {...ctl("company")} autoComplete="organization" className={cn(inputClass, "h-12 border-line")} />
        </Field>
        <Field id={f("city")} label="City where parts are made" error={err("city")}>
          <input {...ctl("city")} autoComplete="address-level2" className={cn(inputClass, "h-12 border-line")} />
        </Field>
        <Field id={f("email")} label="Email" hint={hints.email} error={err("email")}>
          <input {...ctl("email", hints.email)} type="email" autoComplete="email" inputMode="email" className={cn(inputClass, "h-12 border-line")} />
        </Field>
        <Field id={f("role")} label="Your role" error={err("role")}>
          <input {...ctl("role")} autoComplete="organization-title" className={cn(inputClass, "h-12 border-line")} />
        </Field>
      </div>

      <fieldset data-field="categories" aria-describedby={err("categories") ? `${f("categories")}-error` : undefined}>
        <legend className="text-sm font-medium">What do you make?</legend>
        <p className="mt-1 text-sm text-fg-subtle">Tick every kind of part you build, or give your website below. One of the two is needed.</p>
        <div className="mt-3 space-y-4">
          {sectors.map((sector) => (
            <div key={sector}>
              <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{SECTOR_LABEL[sector] ?? sector}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories
                  .filter((c) => c.sector === sector)
                  .map((c) => (
                    <label key={c.id} className={chip}>
                      <input type="checkbox" className="sr-only" checked={values.categories.includes(c.id)} onChange={() => toggle("categories", c.id)} />
                      <Icon name={values.categories.includes(c.id) ? "check" : "plus"} size={14} />
                      {c.name}
                    </label>
                  ))}
              </div>
            </div>
          ))}
        </div>
        {groupError("categories")}
      </fieldset>

      <Field id={f("siteUrl")} label="Website or online catalogue" optional hint={hints.siteUrl} error={err("siteUrl")}>
        <input {...ctl("siteUrl", hints.siteUrl)} type="url" inputMode="url" placeholder="yourcompany.in/products" className={cn(inputClass, "h-12 border-line")} />
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

      <div className="rounded-xl border border-line p-5 sm:p-6">
        <fieldset data-field="certifications" aria-describedby={err("certifications") ? `${f("certifications")}-error` : undefined}>
          <legend className="text-sm font-medium">Certifications and registrations</legend>
          <p className="mt-1 text-sm text-fg-subtle">Required. Tick everything you hold. We only qualify suppliers who can show a current certificate.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CERTIFICATIONS.map((c) => (
              <label key={c} className={chip}>
                <input type="checkbox" className="sr-only" checked={values.certifications.includes(c)} onChange={() => toggle("certifications", c)} />
                <Icon name={values.certifications.includes(c) ? "check" : "plus"} size={14} />
                {c}
              </label>
            ))}
          </div>
          {groupError("certifications")}
        </fieldset>
        {values.certifications.includes("Other") ? (
          <Field id={f("certificationsOther")} label="Other certification" error={err("certificationsOther")} className="mt-5">
            <input {...ctl("certificationsOther")} className={cn(inputClass, "h-12 border-line")} />
          </Field>
        ) : null}

        <div data-field="certificateFiles" className="mt-6">
          <p className="text-sm font-medium" id={`${f("certificateFiles")}-label`}>
            Certificate copies
          </p>
          <p className="mt-1 text-sm text-fg-subtle">
            {uploads
              ? `Upload a copy of each certificate: PDF, JPG or PNG, up to 10 MB each, ${CERT_FILE.maxFiles} files at most.`
              : "Paste a link to your certificates: a Google Drive or Dropbox folder, or the page on your website."}
          </p>
          {uploads ? (
            <>
              <label
                htmlFor={f("certificateFiles")}
                className="mt-3 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line-strong px-4 py-5 text-center text-sm text-fg-muted hover:border-fg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
              >
                <Icon name="upload" size={20} />
                <span className="font-medium text-fg">Choose files</span>
                <span className="text-xs text-fg-subtle">ISO, AS9100, BIS, test reports</span>
                <input
                  ref={fileRef}
                  id={f("certificateFiles")}
                  type="file"
                  multiple
                  accept={CERT_FILE.accept}
                  className="sr-only"
                  aria-describedby={describedBy(f("certificateFiles"), undefined, err("certificateFiles"))}
                  onChange={(e) => onFiles(e.target.files)}
                />
              </label>
              {values.certificateFiles.length || pending.length ? (
                <ul className="mt-3 divide-y divide-line rounded-lg border border-line text-sm">
                  {values.certificateFiles.map((x) => (
                    <li key={x.url} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon name="check" size={16} className="shrink-0" />
                        <span className="truncate">{x.name}</span>
                      </span>
                      <button type="button" onClick={() => removeFile(x.url)} className="min-h-9 rounded-full px-3 text-fg-subtle hover:text-fg" aria-label={`Remove ${x.name}`}>
                        Remove
                      </button>
                    </li>
                  ))}
                  {pending.map((p) => (
                    <li key={p.key} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon name={p.state === "failed" ? "alert" : "upload"} size={16} className={cn("shrink-0", p.state === "failed" && "text-danger")} />
                        <span className="truncate">{p.name}</span>
                      </span>
                      <span className={cn("shrink-0 text-xs", p.state === "failed" ? "text-danger" : "text-fg-subtle")} role={p.state === "failed" ? "alert" : undefined}>
                        {p.state === "failed" ? p.message : "Uploading"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {!showLink ? (
                <button type="button" onClick={() => setShowLink(true)} className="mt-3 min-h-9 text-sm text-accent hover:underline">
                  Or paste a link instead
                </button>
              ) : null}
            </>
          ) : null}
          {groupError("certificateFiles")}
        </div>
        {showLink ? (
          <Field id={f("certificateLink")} label="Link to certificates" optional={uploads} error={err("certificateLink")} className="mt-5">
            <input {...ctl("certificateLink")} type="url" inputMode="url" placeholder="drive.google.com/..." className={cn(inputClass, "h-12 border-line")} />
          </Field>
        ) : null}
      </div>

      <Field id={f("parts")} label="Specific parts or TM codes" optional hint={hints.parts} error={err("parts")}>
        <textarea {...ctl("parts", hints.parts)} rows={3} className={cn(inputClass, "code-text border-line py-3 [white-space:pre-wrap]")} />
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
          We use these details and certificates only to qualify you. Buyers see suppliers by code, never by name. See the{" "}
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
