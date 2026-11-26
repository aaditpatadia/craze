"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BALANCE,
  BASE_MOUNTS,
  BEARINGS,
  CELLS,
  CELL_VOLTS,
  CONNECTORS,
  EVIDENCE,
  FRAMES,
  INSULATION,
  INSULATION_TEMP,
  LEAD_AWG,
  LEAD_LENGTH,
  MAGNETS,
  MAGNET_TEMP,
  ORIGIN,
  PROP_MOUNTS,
  PROTECTION,
  SHAFT_DIA,
  SHAFT_STYLE,
  USE_LABEL,
  buildString,
  defaultsFor,
  frameDims,
  fromParams,
  motorCode,
  patternCode,
  patternLabel,
  toParams,
  type MotorConfig,
  type Option,
  type Pattern,
  type Use,
} from "@/lib/motor-config";
import { useQuote } from "@/lib/quote";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { KvDiagram, Ladder, LeadsDiagram, PatternDiagram, ShaftDiagram, StatorDiagram, TempScale } from "./MotorDiagrams";

const pill =
  "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";
const on = "border-fg bg-fg text-bg";
const off = "border-line text-fg-muted hover:border-line-strong hover:text-fg";

function Choice<T extends string | number>({ value, current, onPick, children, title }: { value: T; current: T; onPick: (v: T) => void; children: React.ReactNode; title?: string }) {
  const active = value === current;
  return (
    <button type="button" aria-pressed={active} title={title} onClick={() => onPick(value)} className={cn(pill, active ? on : off)}>
      {active ? <Icon name="check" size={14} /> : null}
      {children}
    </button>
  );
}

function Options({ list, current, onPick }: { list: Option[]; current: string; onPick: (v: string) => void }) {
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

function Note({ list, current }: { list: Option[]; current: string }) {
  const n = list.find((x) => x.id === current)?.note;
  return n ? <p className="mt-3 text-sm text-fg-muted">{n}</p> : null;
}

/** One configurator area: options on the left, what they mean on the right. */
function Area({ n, title, lead, children, drawing, meaning }: { n: string; title: string; lead: string; children: React.ReactNode; drawing: React.ReactNode; meaning: React.ReactNode }) {
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

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-sm font-medium">{children}</p>;
}

const sameP = (a: Pattern, b: Pattern) => patternCode(a) === patternCode(b);

export function MotorConfigurator() {
  const router = useRouter();
  const quote = useQuote();
  const [c, setC] = useState<MotorConfig | null>(null);
  const [useFilter, setUseFilter] = useState<Use | "all">("all");
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the link once after mount
    setC(fromParams(new URLSearchParams(window.location.search)));
  }, []);
  useEffect(() => {
    if (c) window.history.replaceState(null, "", `?${toParams(c)}`);
  }, [c]);

  const frames = useMemo(() => FRAMES.filter((f) => useFilter === "all" || f.uses.includes(useFilter)), [useFilter]);

  if (!c) return <div className="min-h-[60vh]" aria-hidden="true" />;

  const set = (patch: Partial<MotorConfig>) => {
    setAdded(false);
    setC({ ...c, ...patch });
  };
  const chooseFrame = (size: string, kv?: number) => {
    const d = defaultsFor(size, kv);
    setAdded(false);
    // Keep the buyer's own choices on durability, wiring, origin and quantity.
    setC({ ...d, use: c.use, bearing: c.bearing, origin: c.origin, evidence: c.evidence, balance: c.balance, qty: c.qty });
  };
  const frame = FRAMES.find((f) => f.size === c.size);
  const { d: dia, h } = frameDims(c.size);
  const code = motorCode(c);
  const build = buildString(c);
  const volts = CELL_VOLTS[c.cells] ?? 22.2;
  const standardKv = frame?.kvs.some((x) => x.kv === c.kv);
  const lineCode = `${code} / ${build}`;
  const name = `${c.size} ${c.kv}KV motor, configured`;

  const addToQuote = () => {
    quote.add({ code: lineCode, id: `tm-mot-${c.size}-${c.kv}`, name, href: `/configure/motor?${toParams(c)}` }, c.qty);
    setAdded(true);
    track("Quote add", { code });
  };
  const request = () => {
    addToQuote();
    router.push("/request?from=quote");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${lineCode}\n${window.location.href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div>
      {/* Live code bar */}
      <div className="sticky top-14 z-30 -mx-4 border-y border-line bg-bg/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="code-text text-base font-semibold">{code}</p>
            <p className="code-text truncate text-xs text-fg-subtle" title={build}>
              {build}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copy} className={cn(pill, off)}>
              <Icon name="copy" size={14} /> {copied ? "Copied" : "Copy"}
            </button>
            <Link href={`/configure/motor/sheet?${toParams(c)}`} className={cn(pill, off)}>
              <Icon name="printer" size={14} /> Spec sheet (PDF)
            </Link>
            <button type="button" onClick={addToQuote} className={cn(pill, off)}>
              <Icon name={added ? "check" : "plus"} size={14} /> {added ? "In quote list" : "Add to quote list"}
            </button>
            <button type="button" onClick={request} className={cn(pill, on)}>
              Request this spec
            </button>
          </div>
        </div>
      </div>

      <Area
        n="01"
        title="Frame"
        lead="The stator size sets how much torque the motor can make. The four or five digits are diameter then height in millimetres."
        drawing={<StatorDiagram size={c.size} />}
        meaning={
          <>
            <p>
              <span className="code-text text-fg">{c.size}</span> is a stator {dia} mm across and {h} mm tall. A wider stator gives more torque for big propellers; a taller one gives more power
              without growing the footprint.
            </p>
            <p className="mt-2">
              Usual propellers: <span className="text-fg">{frame?.props ?? "to be agreed"}</span>.
              {frame?.partId ? (
                <>
                  {" "}
                  <Link href={`/parts/${frame.partId}`} className="text-accent hover:underline">
                    See the listed part and its exploded view
                  </Link>
                </>
              ) : null}
            </p>
          </>
        }
      >
        <div>
          <Label>Aircraft type</Label>
          <div className="flex flex-wrap gap-2">
            <Choice value={"all" as Use | "all"} current={useFilter} onPick={setUseFilter}>
              All frames
            </Choice>
            {(Object.keys(USE_LABEL) as Use[]).map((u) => (
              <Choice key={u} value={u as Use | "all"} current={useFilter} onPick={(v) => { setUseFilter(v); if (v !== "all") set({ use: v as Use }); }}>
                {USE_LABEL[u]}
              </Choice>
            ))}
          </div>
        </div>
        <div>
          <Label>Stator size</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {frames.map((f) => {
              const active = f.size === c.size;
              return (
                <button
                  key={f.size}
                  type="button"
                  aria-pressed={active}
                  onClick={() => chooseFrame(f.size)}
                  className={cn("rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent", active ? "border-fg bg-bg-subtle" : "border-line hover:border-line-strong")}
                >
                  <span className="code-text block text-sm font-semibold">{f.size}</span>
                  <span className="block text-[11px] text-fg-subtle">{f.props} props</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-fg-subtle">{FRAMES.length} standard frames. Need another size? Say so in your request: makers wind most sizes to order.</p>
        </div>
      </Area>

      <Area
        n="02"
        title="Speed and voltage"
        lead="KV is how fast the motor spins per volt with no propeller. Pick it with the battery: together they set the propeller speed."
        drawing={<KvDiagram kv={c.kv} volts={volts} />}
        meaning={
          <p>
            At {c.cells} ({volts} V) a {c.kv} KV motor spins about <span className="text-fg">{Math.round(c.kv * volts).toLocaleString("en-IN")} rpm</span> with no load, and less under a
            propeller. Bigger propellers need lower KV; a higher voltage battery also needs lower KV for the same propeller.
            {standardKv ? "" : " This is a custom winding: makers can wind it, but it needs a sample before the first order."}
          </p>
        }
      >
        <div>
          <Label>KV options for {c.size}</Label>
          <div className="flex flex-wrap items-center gap-2">
            {(frame?.kvs ?? []).map((k) => (
              <Choice key={k.kv} value={k.kv} current={c.kv} onPick={(kv) => chooseFrame(c.size, kv)}>
                {k.kv} KV <span className="opacity-60">{k.cells}</span>
              </Choice>
            ))}
            <label className="inline-flex items-center gap-2 text-sm text-fg-muted">
              Custom
              <input
                type="number"
                min={20}
                max={5000}
                value={c.kv}
                onChange={(e) => set({ kv: Math.max(20, Math.min(5000, Math.round(Number(e.target.value)) || 20)) })}
                className="h-10 w-24 rounded-lg border border-line bg-bg-elev px-3 text-fg"
                aria-label="Custom KV"
              />
            </label>
          </div>
        </div>
        <div>
          <Label>Battery</Label>
          <Options list={CELLS} current={c.cells} onPick={(v) => set({ cells: v })} />
        </div>
      </Area>

      <Area
        n="03"
        title="Shaft"
        lead="The shaft carries the propeller. Its diameter and type must match your propeller hub."
        drawing={<ShaftDiagram dia={c.shaftDia} style={c.shaftStyle} />}
        meaning={<p>{SHAFT_STYLE.find((s) => s.id === c.shaftStyle)?.note} A thicker shaft resists bending from large propellers and hard landings.</p>}
      >
        <div>
          <Label>Diameter</Label>
          <div className="flex flex-wrap gap-2">
            {SHAFT_DIA.map((s) => (
              <Choice key={s} value={s} current={c.shaftDia} onPick={(v) => set({ shaftDia: v })}>
                {s} mm
              </Choice>
            ))}
          </div>
        </div>
        <div>
          <Label>Type</Label>
          <Options list={SHAFT_STYLE} current={c.shaftStyle} onPick={(v) => set({ shaftStyle: v })} />
        </div>
      </Area>

      <Area
        n="04"
        title="Mounting"
        lead="Two bolt patterns: one holds the propeller to the motor, the other holds the motor to your arm. Both must match your parts exactly."
        drawing={
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <PatternDiagram p={c.prop} title="PROPELLER MOUNT" />
            <PatternDiagram p={c.base} title="BASE MOUNT" />
          </div>
        }
        meaning={
          <p>
            A pattern is written as holes × screw size on a circle: <span className="text-fg">{patternLabel(c.base)}</span> means {c.base.n} holes for {c.base.screw} screws spaced around a{" "}
            {c.base.pcd} mm circle. Measure your arm and propeller hub, or send their drawings.
          </p>
        }
      >
        <div>
          <Label>Propeller mount</Label>
          <div className="flex flex-wrap gap-2">
            {PROP_MOUNTS.map((p) => (
              <button key={patternCode(p)} type="button" aria-pressed={sameP(p, c.prop)} onClick={() => set({ prop: p })} className={cn(pill, sameP(p, c.prop) ? on : off)}>
                {p.n} × {p.screw} / ø{p.pcd}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Base mount</Label>
          <div className="flex flex-wrap gap-2">
            {BASE_MOUNTS.map((p) => (
              <button key={patternCode(p)} type="button" aria-pressed={sameP(p, c.base)} onClick={() => set({ base: p })} className={cn(pill, sameP(p, c.base) ? on : off)}>
                {p.n} × {p.screw} / ø{p.pcd}
              </button>
            ))}
          </div>
        </div>
      </Area>

      <Area
        n="05"
        title="Heat and wear"
        lead="What the motor can survive: bearings for dirt and speed, magnets and winding insulation for heat, a coating for weather."
        drawing={
          <div className="space-y-2">
            <TempScale title="Magnet limit" value={MAGNET_TEMP[c.magnet]!} marks={MAGNETS.map((m) => ({ label: m.label, t: MAGNET_TEMP[m.id]! }))} />
            <TempScale title="Winding limit" value={INSULATION_TEMP[c.insulation]!} marks={INSULATION.map((m) => ({ label: m.label, t: INSULATION_TEMP[m.id]! }))} />
          </div>
        }
        meaning={
          <p>
            Past its limit a magnet loses strength for good and the motor gets weaker. Pick the limit above the hottest the motor will run: full power in a hot climate can pass 120 °C.{" "}
            {PROTECTION.find((p) => p.id === c.protection)?.note}
          </p>
        }
      >
        <div>
          <Label>Bearings</Label>
          <Options list={BEARINGS} current={c.bearing} onPick={(v) => set({ bearing: v })} />
          <Note list={BEARINGS} current={c.bearing} />
        </div>
        <div>
          <Label>Magnet grade</Label>
          <Options list={MAGNETS} current={c.magnet} onPick={(v) => set({ magnet: v })} />
        </div>
        <div>
          <Label>Winding insulation</Label>
          <Options list={INSULATION} current={c.insulation} onPick={(v) => set({ insulation: v })} />
        </div>
        <div>
          <Label>Weather protection</Label>
          <Options list={PROTECTION} current={c.protection} onPick={(v) => set({ protection: v })} />
        </div>
        <div>
          <Label>Balance</Label>
          <Options list={BALANCE} current={c.balance} onPick={(v) => set({ balance: v })} />
          <Note list={BALANCE} current={c.balance} />
        </div>
      </Area>

      <Area
        n="06"
        title="Wiring"
        lead="The three phase leads run from the motor to the ESC. Length, thickness and plug must suit your arm and current."
        drawing={<LeadsDiagram length={c.leadLength} awg={c.leadAwg} connector={c.connector} />}
        meaning={<p>Lower AWG numbers are thicker wire and carry more current without heating. Too long a lead adds weight and noise; too short and it will not reach the ESC.</p>}
      >
        <div>
          <Label>Lead length</Label>
          <div className="flex flex-wrap gap-2">
            {LEAD_LENGTH.map((l) => (
              <Choice key={l} value={l} current={c.leadLength} onPick={(v) => set({ leadLength: v })}>
                {l} mm
              </Choice>
            ))}
          </div>
        </div>
        <div>
          <Label>Wire gauge</Label>
          <div className="flex flex-wrap gap-2">
            {LEAD_AWG.map((a) => (
              <Choice key={a} value={a} current={c.leadAwg} onPick={(v) => set({ leadAwg: v })}>
                {a} AWG
              </Choice>
            ))}
          </div>
        </div>
        <div>
          <Label>Connector</Label>
          <Options list={CONNECTORS} current={c.connector} onPick={(v) => set({ connector: v })} />
        </div>
      </Area>

      <Area
        n="07"
        title="Origin and proof"
        lead="How Indian the motor must be, and how much checking you want before it ships. This is what defence and government buyers are asked to show."
        drawing={
          <div className="space-y-3">
            <Ladder steps={ORIGIN} value={c.origin} />
            <Ladder steps={EVIDENCE} value={c.evidence} />
          </div>
        }
        meaning={
          <p>
            {ORIGIN.find((x) => x.id === c.origin)?.note ?? "No origin rule: we source the best match."} {EVIDENCE.find((x) => x.id === c.evidence)?.note}
          </p>
        }
      >
        <div>
          <Label>Origin</Label>
          <Options list={ORIGIN} current={c.origin} onPick={(v) => set({ origin: v })} />
        </div>
        <div>
          <Label>Evidence before shipping</Label>
          <Options list={EVIDENCE} current={c.evidence} onPick={(v) => set({ evidence: v })} />
        </div>
      </Area>

      <section className="grid grid-cols-1 gap-6 border-t border-line py-10 lg:grid-cols-12" aria-labelledby="area-08">
        <div className="lg:col-span-7">
          <p className="code-text text-xs text-accent">08</p>
          <h2 id="area-08" className="mt-1 text-lg font-semibold tracking-tight">
            Quantity and summary
          </h2>
          <label className="mt-5 inline-flex items-center gap-3 text-sm">
            Motors
            <input
              type="number"
              min={1}
              value={c.qty}
              onChange={(e) => set({ qty: Math.max(1, Math.round(Number(e.target.value)) || 1) })}
              className="h-11 w-32 rounded-lg border border-line bg-bg-elev px-3 text-fg"
            />
          </label>
          <p className="mt-4 max-w-xl text-sm text-fg-muted">
            The code and build string above are what we quote, what your purchase order says and what the maker reads. Every unit is labelled with <span className="code-text text-fg">{code}</span>.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" onClick={request} className={cn(pill, on, "min-h-11 px-5")}>
              Request this spec
            </button>
            <Link href={`/configure/motor/sheet?${toParams(c)}`} className={cn(pill, off, "min-h-11 px-5")}>
              <Icon name="printer" size={14} /> Download spec sheet
            </Link>
          </div>
        </div>
        <aside className="lg:col-span-5">
          <dl className="divide-y divide-line rounded-xl border border-line text-sm">
            {[
              ["Code", code],
              ["Frame", `${c.size}, ${dia} × ${h} mm`],
              ["KV and battery", `${c.kv} KV on ${c.cells}`],
              ["Shaft", `${c.shaftDia} mm ${SHAFT_STYLE.find((s) => s.id === c.shaftStyle)?.label.toLowerCase()}`],
              ["Mounts", `prop ${c.prop.n}×${c.prop.screw}/ø${c.prop.pcd}, base ${c.base.n}×${c.base.screw}/ø${c.base.pcd}`],
              ["Durability", `${c.bearing}, ${c.magnet}, class ${c.insulation}, ${c.protection}`],
              ["Leads", `${c.leadLength} mm, ${c.leadAwg} AWG, ${CONNECTORS.find((x) => x.id === c.connector)?.label}`],
              ["Origin and proof", `${ORIGIN.find((x) => x.id === c.origin)?.label}; ${EVIDENCE.find((x) => x.id === c.evidence)?.label}`],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[8rem_1fr] gap-3 px-4 py-2.5">
                <dt className="text-fg-subtle">{k}</dt>
                <dd className={k === "Code" ? "code-text font-semibold" : ""}>{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>
    </div>
  );
}
