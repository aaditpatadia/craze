"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState } from "react";
import type { CatalogItem } from "@/lib/content";
import { cn } from "@/lib/cn";
import {
  CRITICAL,
  DEFAULT_SHARE,
  GROUP_LABEL,
  IC_REPORT_KEY,
  ORIGIN_LABEL,
  SAMPLE_IC,
  TARGETS,
  TIMULE_SHARE,
  computeIc,
  inr,
  parseIcRows,
  suggestReplacement,
  type Group,
  type IcRow,
  type Origin,
} from "@/lib/indigenous";
import { useQuote } from "@/lib/quote";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const cell = "h-9 w-full rounded-md border border-line bg-bg-elev px-2 text-sm text-fg";

export function ContentCalculator({ catalog }: { catalog: CatalogItem[] }) {
  const ids = useId();
  const router = useRouter();
  const quote = useQuote();
  const file = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [rows, setRows] = useState<IcRow[]>([]);
  const [target, setTarget] = useState("60");
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const load = (src: string) => {
    const r = parseIcRows(src);
    if (!r.length) {
      setError("No rows found. Put one part per line: part, qty, unit cost, origin, Indian %.");
      return;
    }
    if (r.length > 500) {
      setError("The calculator takes up to 500 rows.");
      return;
    }
    setError(null);
    setRows(r);
    setAdded(false);
  };

  const reps = useMemo(() => new Map(rows.map((r) => [r.id, suggestReplacement(r, catalog)])), [rows, catalog]);
  const res = useMemo(() => computeIc(rows), [rows]);
  const t = TARGETS.find((x) => x.id === target)!;
  const gap = Math.max(0, (t.pct / 100) * res.total - res.indian);
  const pass = t.pct === 100 ? res.foreignCritical.length === 0 && res.score >= 99.5 : res.score >= t.pct;
  const replaceable = rows.filter((r) => r.share < 100 && reps.get(r.id));

  const set = (id: number, patch: Partial<IcRow>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setAdded(false);
  };

  const report = () => {
    try {
      sessionStorage.setItem(IC_REPORT_KEY, JSON.stringify({ rows, target, reps: [...reps.entries()] }));
    } catch {
      return;
    }
    router.push("/tools/content/report");
  };

  const addAll = () => {
    for (const r of rows.filter((x) => x.replace)) {
      const rep = reps.get(r.id);
      if (rep) quote.add({ code: rep.code, id: rep.code.toLowerCase(), name: rep.name, href: rep.href }, r.qty);
    }
    setAdded(true);
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <label htmlFor={`${ids}-in`} className="text-sm font-medium">
            Paste your parts list
          </label>
          <p className="mt-1 text-sm text-fg-subtle">
            Columns: part, qty, unit cost, origin, Indian % (optional). Origin can be India, imported, a country, unknown, or a percentage. A header row is optional.
          </p>
          <textarea
            id={`${ids}-in`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={9}
            spellCheck={false}
            placeholder={"6215 170KV motor, 4, 9800, imported\nCarbon airframe, 1, 42000, India"}
            className="mt-3 w-full rounded-lg border border-line bg-bg-elev p-3 font-mono text-sm text-fg placeholder:text-fg-subtle"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <Button onClick={() => load(text)} disabled={!text.trim()}>
              Calculate
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setText(SAMPLE_IC);
                load(SAMPLE_IC);
              }}
            >
              Try a sample farm drone
            </Button>
            <Button variant="ghost" onClick={() => file.current?.click()}>
              <Icon name="upload" size={16} /> Upload CSV
            </Button>
            <input
              ref={file}
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/plain"
              className="sr-only"
              aria-label="Upload a CSV parts list"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                if (f.size > 512 * 1024) return setError("That file is over 512 KB.");
                const s = await f.text();
                setText(s);
                load(s);
              }}
            />
          </div>
          {error ? (
            <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-danger">
              <Icon name="alert" size={16} className="mt-0.5 shrink-0" /> {error}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-line p-5 text-sm text-fg-muted">
          <p className="font-medium text-fg">How the score is worked out</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Cost-based, as in the Defence Acquisition Procedure: the Indian share of each row&apos;s cost, added up, over the total cost.</li>
            <li>An assembly can be part Indian. A motor wound in India with imported magnets might be 40%. Use the Indian % column for that.</li>
            <li>Unknown origin counts as imported, because an auditor will count it that way.</li>
            <li>Motors, ESCs, flight controllers, GNSS, radios, cameras and batteries are flagged as critical when foreign, whatever the total.</li>
            <li>Your list stays in this browser. Nothing is sent unless you request a quote.</li>
          </ul>
          <p className="mt-3 text-xs text-fg-subtle">A planning estimate, not a certificate. The tender or scheme document sets the exact rule.</p>
        </div>
      </div>

      {rows.length ? (
        <>
          <section aria-label="Score" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="rounded-xl border border-line p-6 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-fg-subtle">Indigenous content by cost</p>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Target">
                  {TARGETS.map((x) => (
                    <button
                      key={x.id}
                      type="button"
                      role="radio"
                      aria-checked={target === x.id}
                      title={x.note}
                      onClick={() => setTarget(x.id)}
                      className={cn("rounded-full border px-3 py-1 text-xs", target === x.id ? "border-fg bg-fg text-bg" : "border-line text-fg-muted hover:text-fg")}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-3 flex items-baseline gap-3">
                <span className="text-5xl font-semibold tabular-nums tracking-tight">{res.score}%</span>
                <span className={cn("text-sm font-medium", pass ? "text-accent" : "text-danger")}>{pass ? `Meets ${t.label}` : `Short of ${t.label}`}</span>
              </p>
              <Gauge score={res.score} whatIf={res.whatIf} target={t.pct} />
              <p className="mt-3 text-xs text-fg-subtle">{t.note}.</p>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <Stat k="Total cost" v={inr(res.total)} />
                <Stat k="Indian" v={inr(res.indian)} />
                <Stat k={`Gap to ${t.label}`} v={gap > 0 ? inr(gap) : "None"} />
                <Stat k="With Timule parts" v={`${res.whatIf}%`} accent />
              </dl>
            </div>
            <div className="rounded-xl border border-line p-6 lg:col-span-5">
              <p className="text-sm text-fg-subtle">Where the foreign cost sits</p>
              <ul className="mt-4 space-y-3">
                {res.byGroup.map((g) => (
                  <li key={g.group} className="text-sm">
                    <div className="flex justify-between gap-3">
                      <span>
                        {GROUP_LABEL[g.group]}
                        {CRITICAL.includes(g.group) ? <span className="ml-1.5 text-xs text-fg-subtle">critical</span> : null}
                      </span>
                      <span className="tabular-nums text-fg-muted">{g.total ? Math.round((g.indian / g.total) * 100) : 0}% Indian</span>
                    </div>
                    <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-bg-subtle" aria-hidden="true">
                      <span className="bg-accent" style={{ width: `${res.total ? (g.indian / res.total) * 100 : 0}%` }} />
                      <span className="bg-danger/60" style={{ width: `${res.total ? ((g.total - g.indian) / res.total) * 100 : 0}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {res.foreignCritical.length || res.unknown.length || res.missingCost.length ? (
            <section aria-label="Flags" className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Flag title="Foreign critical parts" rows={res.foreignCritical} note="A defence buyer will ask about each of these, whatever the total." />
              <Flag title="Origin not known" rows={res.unknown} note="Counted as imported. Ask the vendor for a written origin declaration." />
              <Flag title="No cost given" rows={res.missingCost} note="Counted as zero, so the score ignores them. Add a unit cost." />
            </section>
          ) : null}

          <section aria-labelledby={`${ids}-tbl`}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id={`${ids}-tbl`} className="text-xl font-semibold tracking-tight">
                  Your parts
                </h2>
                <p className="mt-1 text-sm text-fg-subtle">
                  Edit any cell and the score updates. Tick &ldquo;Replace&rdquo; to see the score with a Timule part, counted at {TIMULE_SHARE}% Indian, the level our origin
                  declarations cover.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {replaceable.length ? (
                  <Button variant="ghost" onClick={() => setRows((rs) => rs.map((r) => (reps.get(r.id) && r.share < 100 ? { ...r, replace: true } : r)))}>
                    Replace all {replaceable.length}
                  </Button>
                ) : null}
                <Button variant="secondary" onClick={report}>
                  <Icon name="printer" size={16} /> Tender origin dossier (PDF)
                </Button>
                <Button onClick={addAll} disabled={!rows.some((r) => r.replace)}>
                  <Icon name={added ? "check" : "plus"} size={16} /> {added ? "Added to quote list" : "Add replacements to quote"}
                </Button>
              </div>
            </div>
            <div className="mt-5 overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[1020px] text-left text-sm">
                <thead className="bg-bg-subtle text-xs text-fg-subtle">
                  <tr>
                    <th className="px-3 py-3 font-medium">Part</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 font-medium">Qty</th>
                    <th className="px-3 py-3 font-medium">Unit cost ₹</th>
                    <th className="px-3 py-3 font-medium">Origin</th>
                    <th className="px-3 py-3 font-medium">Indian %</th>
                    <th className="px-3 py-3 font-medium">Timule replacement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => {
                    const rep = reps.get(r.id);
                    return (
                      <tr key={r.id} className={cn("align-middle", CRITICAL.includes(r.group) && r.share < 50 && "bg-danger/5")}>
                        <td className="px-3 py-2">
                          <input aria-label="Part" className={cell} value={r.part} onChange={(e) => set(r.id, { part: e.target.value })} />
                        </td>
                        <td className="px-3 py-2">
                          <select aria-label="Type" className={cell} value={r.group} onChange={(e) => set(r.id, { group: e.target.value as Group })}>
                            {(Object.keys(GROUP_LABEL) as Group[]).map((g) => (
                              <option key={g} value={g}>
                                {GROUP_LABEL[g]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="w-20 px-3 py-2">
                          <input aria-label="Quantity" type="number" min={1} className={cell} value={r.qty} onChange={(e) => set(r.id, { qty: Math.max(1, Number(e.target.value) || 1) })} />
                        </td>
                        <td className="w-32 px-3 py-2">
                          <input aria-label="Unit cost" type="number" min={0} className={cell} value={r.unitCost} onChange={(e) => set(r.id, { unitCost: Math.max(0, Number(e.target.value) || 0) })} />
                        </td>
                        <td className="w-40 px-3 py-2">
                          <select
                            aria-label="Origin"
                            className={cell}
                            value={r.origin}
                            onChange={(e) => {
                              const o = e.target.value as Origin;
                              set(r.id, { origin: o, share: o === "PART" ? (r.share > 0 && r.share < 100 ? r.share : 50) : DEFAULT_SHARE[o] });
                            }}
                          >
                            {(Object.keys(ORIGIN_LABEL) as Origin[]).map((o) => (
                              <option key={o} value={o}>
                                {ORIGIN_LABEL[o]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="w-24 px-3 py-2">
                          <input
                            aria-label="Indian percent"
                            type="number"
                            min={0}
                            max={100}
                            className={cell}
                            value={r.share}
                            onChange={(e) => {
                              const s = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                              set(r.id, { share: s, origin: s >= 100 ? "IN" : s <= 0 ? (r.origin === "UNK" ? "UNK" : "IMP") : "PART" });
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          {rep && r.share < 100 ? (
                            <label className="flex items-center gap-2">
                              <input type="checkbox" checked={r.replace} onChange={(e) => set(r.id, { replace: e.target.checked })} className="size-4 accent-[var(--accent)]" />
                              <span className="min-w-0">
                                <span className="text-xs text-fg-subtle">Replace with </span>
                                <Link href={rep.href} className="code-text text-xs text-accent hover:underline">
                                  {rep.code}
                                </Link>
                              </span>
                            </label>
                          ) : r.share >= 100 ? (
                            <span className="text-xs text-fg-subtle">Already Indian</span>
                          ) : (
                            <Link href={`/request?part=${encodeURIComponent(r.part)}&qty=${r.qty}`} className="text-xs text-fg-muted hover:text-fg hover:underline">
                              Ask us to source it
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Stat({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-fg-subtle">{k}</dt>
      <dd className={cn("mt-0.5 font-semibold tabular-nums", accent && "text-accent")}>{v}</dd>
    </div>
  );
}

/** Score bar with the target line and the what-if score. */
export function Gauge({ score, whatIf, target, color = "var(--accent)" }: { score: number; whatIf: number; target: number; color?: string }) {
  return (
    <svg viewBox="0 0 400 46" className="mt-4 h-auto w-full" role="img" aria-label={`Score ${score} percent, ${whatIf} percent with Timule parts, target ${target} percent`}>
      <rect x={0} y={10} width={400} height={16} rx={8} fill="currentColor" opacity={0.08} />
      {whatIf > score ? <rect x={0} y={10} width={(whatIf / 100) * 400} height={16} rx={8} fill={color} opacity={0.35} /> : null}
      <rect x={0} y={10} width={Math.max(2, (score / 100) * 400)} height={16} rx={8} fill={color} />
      <line x1={(target / 100) * 400} y1={4} x2={(target / 100) * 400} y2={32} stroke="currentColor" strokeWidth={2} />
      <text x={Math.min(392, Math.max(8, (target / 100) * 400))} y={44} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.7}>
        target {target}%
      </text>
    </svg>
  );
}

function Flag({ title, rows, note }: { title: string; rows: IcRow[]; note: string }) {
  if (!rows.length) return null;
  return (
    <div className="rounded-xl border border-danger/40 p-5">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Icon name="alert" size={16} className="text-danger" /> {title}: {rows.length}
      </p>
      <ul className="mt-2 space-y-1 text-sm text-fg-muted">
        {rows.slice(0, 6).map((r) => (
          <li key={r.id}>{r.part}</li>
        ))}
        {rows.length > 6 ? <li>and {rows.length - 6} more</li> : null}
      </ul>
      <p className="mt-2 text-xs text-fg-subtle">{note}</p>
    </div>
  );
}
