"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { SPEC_HINTS, decodeCode, type CodeCategory } from "@/lib/codes";
import { inputClass } from "@/components/forms/Field";
import { cn } from "@/lib/cn";

type KnownPart = { code: string; id: string; name: string };

export function CodeDecoder({ categories, parts }: { categories: CodeCategory[]; parts: KnownPart[] }) {
  const ids = useId();
  const [value, setValue] = useState(parts[0]?.code ?? "VK-MOT-2807-1300-A");
  const d = decodeCode(value, categories);
  const match = d.ok ? parts.find((p) => p.code === d.code || p.code.replace(/-[A-Z]$/, "") === d.code.replace(/-[A-Z]$/, "")) : undefined;

  return (
    <div className="rounded-xl border border-line p-6 sm:p-8">
      <label htmlFor={`${ids}-in`} className="text-sm font-medium">
        Decode a VK code
      </label>
      <input
        id={`${ids}-in`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        spellCheck={false}
        autoCapitalize="characters"
        autoComplete="off"
        className={cn(inputClass, "code-text mt-2 h-12 border-line text-base")}
        aria-describedby={`${ids}-out`}
      />
      <div id={`${ids}-out`} aria-live="polite" className="mt-6">
        {!d.ok ? (
          <p className="text-sm text-fg-muted">{d.reason}</p>
        ) : (
          <>
            <ol className="flex flex-wrap items-stretch gap-2">
              <Segment label="Prefix" value={d.prefix} note="Verkod" />
              <Segment label="Category" value={d.categoryCode} note={d.category?.name ?? "Not a category yet"} warn={!d.category} />
              {d.specs.map((s, i) => (
                <Segment key={`${s}-${i}`} label={`Spec ${i + 1}`} value={s} />
              ))}
              <Segment label="Revision" value={d.revision} note={d.revision === "A" ? "First release" : "Revised"} />
            </ol>
            {d.category && SPEC_HINTS[d.categoryCode] ? (
              <p className="mt-4 text-sm text-fg-muted">
                <span className="text-fg-subtle">Spec segments for {d.categoryCode}: </span>
                {SPEC_HINTS[d.categoryCode]}.
              </p>
            ) : null}
            <p className="mt-4 text-sm">
              {match ? (
                <Link href={`/parts/${match.id}`} className="text-accent hover:underline">
                  Listed part: {match.name}
                </Link>
              ) : (
                <span className="text-fg-muted">
                  No listed part has this code yet.{" "}
                  <Link href={`/request?part=${encodeURIComponent(d.code)}`} className="text-accent hover:underline">
                    Request it
                  </Link>{" "}
                  and we will issue the code to a sheet.
                </span>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Segment({ label, value, note, warn }: { label: string; value: string; note?: string; warn?: boolean }) {
  return (
    <li className={cn("min-w-20 rounded-lg border px-3 py-2", warn ? "border-dashed border-line-strong" : "border-line bg-bg-subtle")}>
      <span className="block text-[11px] uppercase tracking-wide text-fg-subtle">{label}</span>
      <span className="code-text block text-lg font-semibold">{value}</span>
      {note ? <span className="block text-xs text-fg-muted">{note}</span> : null}
    </li>
  );
}
