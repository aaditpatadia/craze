"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BlueprintDocument, BlueprintSheet, BpSection } from "@/components/blueprint/Sheet";
import { BpToolbar } from "@/components/blueprint/Toolbar";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/config";
import type { Option } from "@/lib/config-options";
import { useQuote } from "@/lib/quote";
import { Icon } from "@/components/ui/Icon";

/** Shared building blocks for the motor, ESC and propeller configurators. */

export const pill =
  "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";
export const on = "border-fg bg-fg text-bg";
export const off = "border-line text-fg-muted hover:border-line-strong hover:text-fg";

export function Choice<T extends string | number>({ value, current, onPick, children, title }: { value: T; current: T; onPick: (v: T) => void; children: React.ReactNode; title?: string }) {
  const active = value === current;
  return (
    <button type="button" aria-pressed={active} title={title} onClick={() => onPick(value)} className={cn(pill, active ? on : off)}>
      {active ? <Icon name="check" size={14} /> : null}
      {children}
    </button>
  );
}

export function Options({ list, current, onPick }: { list: Option[]; current: string; onPick: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((x) => (
        <Choice key={x.id} value={x.id} current={current} onPick={onPick} title={x.note}>
          {x.label}
        </Choice>
      ))}
    </div>
  );
}

export function NumberChoices({ values, current, unit, onPick }: { values: number[]; current: number; unit: string; onPick: (v: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <Choice key={v} value={v} current={current} onPick={onPick}>
          {v}
          {unit}
        </Choice>
      ))}
    </div>
  );
}

export function Note({ list, current }: { list: Option[]; current: string }) {
  const n = list.find((x) => x.id === current)?.note;
  return n ? <p className="mt-3 text-sm text-fg-muted">{n}</p> : null;
}

/** One configurator area: options on the left, what they mean on the right. */
export function Area({ n, title, lead, children, drawing, meaning }: { n: string; title: string; lead: string; children: React.ReactNode; drawing: React.ReactNode; meaning: React.ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-6 border-t border-line py-10 lg:grid-cols-12" aria-labelledby={`area-${n}`}>
      <div className="lg:col-span-7">
        <p className="code-text text-xs text-accent">{n}</p>
        <h2 id={`area-${n}`} className="mt-1 text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-1 max-w-xl text-sm text-fg-subtle">{lead}</p>
        <div className="mt-5 space-y-5">{children}</div>
      </div>
      <aside className="lg:col-span-5" aria-label={`What ${title.toLowerCase()} means`}>
        <div className="rounded-xl border border-line bg-bg-subtle p-4 text-fg">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">What this means</p>
          <div className="mt-3 text-fg">{drawing}</div>
          <div className="mt-3 text-sm text-fg-muted">{meaning}</div>
        </div>
      </aside>
    </section>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-sm font-medium">{children}</p>;
}

export function NumberField({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-fg-muted">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
        className="h-10 w-24 rounded-lg border border-line bg-bg-elev px-3 text-fg"
      />
      {unit}
    </label>
  );
}

/** Reads a configuration from the page link once, and keeps the link in step after. */
export function useLinkedConfig<C>(fromParams: (sp: URLSearchParams) => C, toParams: (c: C) => string) {
  const [c, setC] = useState<C | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the link once after mount
    setC(fromParams(new URLSearchParams(window.location.search)));
  }, [fromParams]);
  useEffect(() => {
    if (c) window.history.replaceState(null, "", `?${toParams(c)}`);
  }, [c, toParams]);
  return [c, setC] as const;
}

export type ConfigOut = {
  code: string;
  build: string;
  name: string;
  /** Lower-case id for the quote line, e.g. tm-esc-45-6s. */
  id: string;
  qty: number;
  /** The configurator path, e.g. /configure/esc. */
  path: string;
  params: string;
};

/** Sticky bar: the live code and build string, and what to do with them. */
export function ConfigBar({ out }: { out: ConfigOut }) {
  const router = useRouter();
  const quote = useQuote();
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const line = `${out.code} / ${out.build}`;
  const isAdded = added === `${line}#${out.qty}`;
  const add = () => {
    quote.add({ code: line, id: out.id, name: out.name, href: `${out.path}?${out.params}` }, out.qty);
    setAdded(`${line}#${out.qty}`);
    track("Quote add", { code: out.code });
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${line}\n${window.location.href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div className="sticky top-14 z-30 -mx-4 border-y border-line bg-bg/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="code-text text-base font-semibold">{out.code}</p>
          <p className="code-text truncate text-xs text-fg-subtle" title={out.build}>
            {out.build}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copy} className={cn(pill, off)}>
            <Icon name="copy" size={14} /> {copied ? "Copied" : "Copy"}
          </button>
          <Link href={`${out.path}/sheet?${out.params}`} className={cn(pill, off)}>
            <Icon name="printer" size={14} /> Spec sheet (PDF)
          </Link>
          <button type="button" onClick={add} className={cn(pill, off)}>
            <Icon name={isAdded ? "check" : "plus"} size={14} /> {isAdded ? "In quote list" : "Add to quote list"}
          </button>
          <button
            type="button"
            onClick={() => {
              add();
              router.push("/request?from=quote");
            }}
            className={cn(pill, on)}
          >
            Request this spec
          </button>
        </div>
      </div>
    </div>
  );
}

/** Last area: quantity, then a plain summary of every choice. */
export function Summary({ n, unit, qty, onQty, code, rows, sheetHref }: { n: string; unit: string; qty: number; onQty: (q: number) => void; code: string; rows: [string, string][]; sheetHref: string }) {
  return (
    <section className="grid grid-cols-1 gap-6 border-t border-line py-10 lg:grid-cols-12" aria-labelledby={`area-${n}`}>
      <div className="lg:col-span-7">
        <p className="code-text text-xs text-accent">{n}</p>
        <h2 id={`area-${n}`} className="mt-1 text-lg font-semibold tracking-tight">
          Quantity and summary
        </h2>
        <label className="mt-5 inline-flex items-center gap-3 text-sm">
          {unit}
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => onQty(Math.max(1, Math.round(Number(e.target.value)) || 1))}
            className="h-11 w-32 rounded-lg border border-line bg-bg-elev px-3 text-fg"
          />
        </label>
        <p className="mt-4 max-w-xl text-sm text-fg-muted">
          The code and build string at the top are what we quote, what your purchase order says and what the maker reads. Every unit is labelled with{" "}
          <span className="code-text text-fg">{code}</span>.
        </p>
        <div className="mt-6">
          <Link href={sheetHref} className={cn(pill, off, "min-h-11 px-5")}>
            <Icon name="printer" size={14} /> Download spec sheet
          </Link>
        </div>
      </div>
      <aside className="lg:col-span-5">
        <dl className="divide-y divide-line rounded-xl border border-line text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[8rem_1fr] gap-3 px-4 py-2.5">
              <dt className="text-fg-subtle">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </section>
  );
}

/** A configured part on a Timule blueprint. Drawings are grouped into rows of up to three. */
export function ConfigSheet({
  kind,
  title,
  out,
  back,
  status,
  fields,
  drawings,
  lines,
}: {
  kind: string;
  title: string;
  out: ConfigOut;
  back: string;
  status?: string | null;
  fields: { label: string; value: string }[];
  drawings: { title: string; items: React.ReactNode[] }[];
  lines: [string, string][];
}) {
  const host = SITE.url.replace(/^https?:\/\//, "");
  const today = new Date().toISOString().slice(0, 10);
  return (
    <BlueprintDocument toolbar={<BpToolbar back={{ href: back, label: "Back to configurator" }} fileName={`${out.code} Timule ${kind.toLowerCase()}`} />}>
      <BlueprintSheet
        kind={kind}
        title={title}
        number={out.code}
        status={status}
        fields={[
          { label: "Document", value: kind },
          { label: "TM code", value: out.code, mono: true },
          { label: "Revision", value: "A", mono: true },
          ...fields.map((f) => ({ label: f.label, value: f.value })),
          { label: "Prepared", value: today },
          { label: "Quantity", value: String(out.qty) },
          { label: "Issued by", value: "Timule" },
        ].slice(0, 9)}
      >
        <div className="bp-box mt-4">
          <span className="bp-label">Build string, printed on the purchase order</span>
          <p className="bp-mono bp-accent mt-1 break-words text-[8.5pt]">
            {out.code} / {out.build}
          </p>
        </div>
        {drawings.map((g, i) => (
          <BpSection key={g.title} n={String(i + 1).padStart(2, "0")} title={g.title}>
            <div className={`mt-2 grid gap-2 ${g.items.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {g.items.map((d, k) => (
                <figure key={k} className="bp-box bp-drawing">
                  {d}
                </figure>
              ))}
            </div>
          </BpSection>
        ))}
        <BpSection n={String(drawings.length + 1).padStart(2, "0")} title="Specification">
          <table className="bp-table">
            <tbody>
              {lines.map(([k, v]) => (
                <tr key={k}>
                  <td className="bp-dim w-[45mm]">{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </BpSection>
        <p className="bp-faint mt-6 text-[7pt]">
          Configured at {host}
          {out.path}. The maker builds to this specification and labels every unit with {out.code}. Measured performance is not part of this specification: it is tested on a
          sample and recorded as evidence.
        </p>
      </BlueprintSheet>
    </BlueprintDocument>
  );
}
