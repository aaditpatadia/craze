"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { safeNext } from "@/lib/auth";
import { cn } from "@/lib/cn";

const field = "mt-2 h-12 w-full rounded-lg border border-line bg-bg px-3.5 text-base text-fg transition-colors hover:border-line-strong focus-visible:border-accent";

/** Team sign-in: username and password. */
export function SignIn() {
  const router = useRouter();
  const sp = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }) });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (j.ok) {
        setPassword("");
        router.replace(safeNext(sp.get("next")));
        router.refresh();
        return;
      }
      setErr(j.error ?? "Could not sign in.");
    } catch {
      setErr("Could not reach the server.");
    }
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block text-sm">
        <span className="font-medium">Username</span>
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={field}
        />
      </label>
      <label className="block text-sm">
        <span className="flex items-center justify-between font-medium">
          Password
          <button type="button" onClick={() => setShow((s) => !s)} className="text-xs font-normal text-fg-subtle hover:text-fg">
            {show ? "Hide" : "Show"}
          </button>
        </span>
        <input
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={cn(field, "font-mono")}
        />
      </label>
      {err ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-danger">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          {err}
        </p>
      ) : null}
      <Button type="submit" size="lg" loading={busy} loadingLabel="Signing in" className="w-full">
        Sign in to the team area
      </Button>
    </form>
  );
}

export function SignOut({ who = "team", label = "Sign out" }: { who?: "team" | "supplier"; label?: string }) {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await fetch(`/api/auth/logout${who === "supplier" ? "?who=supplier" : ""}`, { method: "POST" });
        router.replace(who === "supplier" ? "/supplier/login" : "/team/login");
        router.refresh();
      }}
    >
      {label}
    </Button>
  );
}
