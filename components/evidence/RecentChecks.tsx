"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { checkLabel, type Check } from "@/lib/pipeline";

/** The latest logged checks for one TM code, read live so a static part page shows today's log. */
export function RecentChecks({ code }: { code: string }) {
  const [checks, setChecks] = useState<Check[] | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/checks?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((d: { checks?: Check[] }) => live && setChecks(d.checks ?? []))
      .catch(() => live && setChecks([]));
    return () => {
      live = false;
    };
  }, [code]);

  return (
    <div className="rounded-xl border border-line p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">Verification log</h3>
        <Link href="/evidence#log" className="text-sm text-accent hover:underline">
          All checks
        </Link>
      </div>
      {checks === null ? (
        <p className="mt-3 text-sm text-fg-subtle">Loading the latest checks…</p>
      ) : checks.length ? (
        <ol className="mt-3 space-y-3">
          {checks.slice(0, 5).map((c) => (
            <li key={c.id} className="text-sm">
              <p>
                <span className="font-medium">{checkLabel(c.kind)}</span>
                <span className="text-fg-subtle">
                  {" "}
                  · {c.date}
                  {c.batch ? ` · batch ${c.batch}` : ""} · {c.result === "pass" ? "pass" : c.result === "fail" ? "failed, rejected" : "recorded"}
                </span>
              </p>
              <p className="mt-0.5 break-words text-fg-muted">{c.lines.slice(0, 3).join(" · ")}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-fg-muted">No checks logged for this code yet. Each check is posted here the day it is done, including any that fail.</p>
      )}
    </div>
  );
}
