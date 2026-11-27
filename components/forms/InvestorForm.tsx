"use client";

import { useEffect, useRef, useState } from "react";
import { validateInvestor, type FieldErrors, type InvestorInput } from "@/lib/forms";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Honeypot, inputClass } from "./Field";

const INTERESTS = ["Send me the deck", "Book a 30-minute call", "Both"];

export function InvestorForm() {
  const [v, setV] = useState({ name: "", email: "", firm: "", interest: INTERESTS[2]!, message: "", website: "" });
  const [errors, setErrors] = useState<FieldErrors<InvestorInput>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [fail, setFail] = useState<string | null>(null);
  const started = useRef(0);
  useEffect(() => {
    started.current = Date.now();
  }, []);

  if (state === "done")
    return (
      <p role="status" className="flex items-center gap-2 rounded-xl border border-line p-5">
        <Icon name="check" size={18} className="text-accent" /> Thank you. One of the founders will reply within a day.
      </p>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = { ...v, startedAt: started.current };
    const errs = validateInvestor(input);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setState("sending");
    setFail(null);
    try {
      const res = await fetch("/api/investor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
      const j = (await res.json()) as { ok?: boolean; error?: string; errors?: FieldErrors<InvestorInput> };
      if (j.ok) setState("done");
      else {
        setErrors(j.errors ?? {});
        setFail(j.error ?? null);
        setState("idle");
      }
    } catch {
      setFail("Could not send. Please email us instead.");
      setState("idle");
    }
  };
  const field = (k: "name" | "email" | "firm", label: string, type = "text", auto = "") => (
    <label className="block text-sm font-medium">
      {label}
      <input
        type={type}
        autoComplete={auto}
        value={v[k]}
        aria-invalid={!!errors[k]}
        onChange={(e) => setV({ ...v, [k]: e.target.value })}
        className={cn(inputClass, "h-11 border-line font-normal")}
      />
      {errors[k] ? <span className="mt-1 block text-sm font-normal text-danger">{errors[k]}</span> : null}
    </label>
  );
  return (
    <form onSubmit={submit} noValidate className="relative space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {field("name", "Name", "text", "name")}
        {field("email", "Email", "email", "email")}
        {field("firm", "Firm", "text", "organization")}
      </div>
      <fieldset>
        <legend className="text-sm font-medium">What would help</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {INTERESTS.map((x) => (
            <button
              key={x}
              type="button"
              aria-pressed={v.interest === x}
              onClick={() => setV({ ...v, interest: x })}
              className={cn("min-h-10 rounded-full border px-4 text-sm", v.interest === x ? "border-fg bg-fg text-bg" : "border-line text-fg-muted hover:text-fg")}
            >
              {x}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-medium">
        Anything you want us to cover <span className="font-normal text-fg-subtle">(optional)</span>
        <textarea value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} rows={4} className={cn(inputClass, "border-line py-2.5 font-normal")} />
        {errors.message ? <span className="mt-1 block text-sm font-normal text-danger">{errors.message}</span> : null}
      </label>
      <Honeypot value={v.website} onChange={(w) => setV({ ...v, website: w })} />
      {fail ? (
        <p role="alert" className="text-sm text-danger">
          {fail}
        </p>
      ) : null}
      <Button type="submit" loading={state === "sending"} loadingLabel="Sending">
        Send
      </Button>
    </form>
  );
}
