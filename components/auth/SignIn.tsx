"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { safeNext } from "@/lib/auth";

export function SignIn() {
  const router = useRouter();
  const sp = useSearchParams();
  const [key, setKey] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key }) });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (j.ok) {
        setKey("");
        router.replace(safeNext(sp.get("next")));
        router.refresh();
      } else setErr(j.error ?? "Could not sign in.");
    } catch {
      setErr("Could not reach the server.");
    }
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="max-w-sm space-y-4">
      <label className="block text-sm">
        <span className="font-medium">Founder key</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="mt-2 h-11 w-full rounded-lg border border-line bg-bg-elev px-3 text-fg"
        />
      </label>
      {err ? (
        <p role="alert" className="text-sm text-danger">
          {err}
        </p>
      ) : null}
      <Button type="submit" loading={busy} loadingLabel="Signing in">
        Sign in
      </Button>
    </form>
  );
}

export function SignOut() {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
