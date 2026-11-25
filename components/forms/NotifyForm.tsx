"use client";

import { useEffect, useId, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { validateNotify } from "@/lib/forms";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Honeypot, inputClass } from "./Field";

/** "Notify me" email capture for an upcoming category. */
export function NotifyForm({ category, categoryName }: { category: string; categoryName: string }) {
  const ids = useId();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const startedAt = useRef(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  if (state === "done") {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-fg">
        <Icon name="check" size={18} /> We will email you when {categoryName.toLowerCase()} open for requests.
      </p>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateNotify({ email, category, website, startedAt: startedAt.current });
    if (errs.email) {
      setError(errs.email);
      input.current?.focus();
      return;
    }
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, category, website, startedAt: startedAt.current }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setState("done");
        track("Notify submitted", { category });
      } else {
        setState("idle");
        setError(data.error ?? "That did not work. Please try again.");
      }
    } catch {
      setState("idle");
      setError("We could not reach the server. Please try again.");
    }
  };

  return (
    <form noValidate onSubmit={submit} className="relative">
      <Honeypot value={website} onChange={setWebsite} />
      <label htmlFor={`${ids}-email`} className="sr-only">
        Email for {categoryName} updates
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={input}
          id={`${ids}-email`}
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${ids}-err` : undefined}
          className={cn(inputClass, "mt-0 h-11 border-line sm:max-w-xs")}
        />
        <Button type="submit" variant="secondary" loading={state === "sending"} loadingLabel="Saving">
          Notify me
        </Button>
      </div>
      {error ? (
        <p id={`${ids}-err`} className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}
