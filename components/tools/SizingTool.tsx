"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SITE } from "@/lib/config";
import { cn } from "@/lib/cn";
import { ardupilotParams, escDxf, escStl, motorDxf, motorStl, propDxf, px4Params, sizingCsv } from "@/lib/downloads";
import { defaultsFor } from "@/lib/motor-config";
import { CELL_CHOICES, CHEM, ROTOR_CHOICES, size, sizingFromParams, sizingToParams, timeCurve, type Chem, type SizingInput, type SizingResult } from "@/lib/sizing";
import { useQuote } from "@/lib/quote";
import { Icon } from "@/components/ui/Icon";
import { Choice, Label, NumberField, off, on, pill, useLinkedConfig } from "@/components/configure/ui";
import { Downloads } from "./Downloads";

const n1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString("en-IN");
const n0 = (n: number) => Math.round(n).toLocaleString("en-IN");

export function SizingTool() {
  const [c, setC] = useLinkedConfig(sizingFromParams, sizingToParams);
  const r = useMemo(() => (c ? size(c) : null), [c]);
  if (!c || !r) return <div className="min-h-[60vh]" />;
  const set = (p: Partial<SizingInput>) => setC({ ...c, ...p });

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
      <form className="space-y-7 lg:col-span-4" onSubmit={(e) => e.preventDefault()} aria-label="Aircraft">
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Weight</legend>
          <div className="flex flex-wrap gap-4">
            <NumberField label="Aircraft, no battery" value={c.dry} min={0.1} max={500} step={0.1} unit="kg" onChange={(v) => set({ dry: v })} />
            <NumberField label="Payload" value={c.payload} min={0} max={500} step={0.1} unit="kg" onChange={(v) => set({ payload: v })} />
          </div>
        </fieldset>
        <div>
          <Label>Rotors</Label>
          <div className="flex flex-wrap gap-2">
            {ROTOR_CHOICES.map((n) => (
              <Choice key={n} value={n} current={c.rotors} onPick={(v) => set({ rotors: v, coax: v === 8 ? c.coax : false })}>
                {n}
              </Choice>
            ))}
            {c.rotors === 8 ? (
              <button type="button" aria-pressed={c.coax} onClick={() => set({ coax: !c.coax })} className={cn(pill, c.coax ? on : off)}>
                Coaxial X8
              </button>
            ) : null}
          </div>
        </div>
        <NumberField label="Largest propeller the frame takes" value={c.maxProp} min={3} max={60} step={1} unit="in" onChange={(v) => set({ maxProp: v })} />
        <div>
          <Label>Battery</Label>
          <div className="flex flex-wrap gap-2">
            {CELL_CHOICES.map((n) => (
              <Choice key={n} value={n} current={c.cells} onPick={(v) => set({ cells: v })}>
                {n}S
              </Choice>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(CHEM) as Chem[]).map((k) => (
              <Choice key={k} value={k} current={c.chem} onPick={(v) => set({ chem: v })}>
                {CHEM[k].label}
              </Choice>
            ))}
          </div>
          <div className="mt-3">
            <NumberField label="Capacity" value={c.capacity} min={300} max={200000} step={500} unit="mAh" onChange={(v) => set({ capacity: v })} />
          </div>
        </div>
        <div>
          <Label>Thrust to weight at full power</Label>
          <div className="flex flex-wrap gap-2">
            {[1.6, 1.8, 2, 2.5, 3, 4].map((v) => (
              <Choice key={v} value={v} current={c.twr} onPick={(x) => set({ twr: x })} title={v <= 1.8 ? "Heavy lift and spraying" : v <= 2.5 ? "Survey, mapping, delivery" : "Agile and FPV"}>
                {v}
              </Choice>
            ))}
          </div>
          <p className="mt-2 text-xs text-fg-subtle">1.6 to 1.8 for spraying and heavy lift, 2 to 2.5 for survey and delivery, 3 and up for agile aircraft.</p>
        </div>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Where it flies</legend>
          <div className="flex flex-wrap gap-4">
            <NumberField label="Altitude" value={c.altitude} min={-100} max={6000} step={100} unit="m" onChange={(v) => set({ altitude: v })} />
            <NumberField label="Air temperature" value={c.temp} min={-30} max={55} unit="°C" onChange={(v) => set({ temp: v })} />
          </div>
          <p className="text-xs text-fg-subtle">Hot, high air is thin. Ladakh at 3,500 m, or a 45 °C afternoon in Rajasthan, takes much more power than a datasheet&apos;s sea level.</p>
        </fieldset>
        <NumberField label="Other loads (flight controller, radio, pump)" value={c.avionics} min={0} max={5000} step={5} unit="W" onChange={(v) => set({ avionics: v })} />
      </form>

      <div className="space-y-8 lg:col-span-8">
        <Results r={r} />
      </div>
    </div>
  );
}

function Results({ r }: { r: SizingResult }) {
  const router = useRouter();
  const quote = useQuote();
  const [added, setAdded] = useState(false);
  const i = r.input;
  const mc = { ...defaultsFor(r.motor.size, r.motor.kv), qty: i.rotors };
  const params = sizingToParams(i);
  const parts = [
    { role: "Motor", code: r.codes.motor, href: r.links.motor, name: `${r.motor.size} ${r.motor.kv} KV motor${r.motor.standard ? "" : ", custom winding"}`, why: `Needs about ${n0(r.kvNeed)} KV to reach ${n0(r.rpmMax)} rpm at full power on ${i.cells}S.` },
    { role: "ESC", code: r.codes.esc, href: r.links.esc, name: `${r.esc.layout === "4" ? "4-in-1 " : ""}${r.esc.amps} A ESC`, why: `Peak ${n1(r.Ipeak)} A per motor, ${n1(r.Ihover)} A at hover.` },
    { role: "Propeller", code: r.codes.prop, href: r.links.prop, name: `${r.prop} × ${r.propCfg.pitch} in propeller`, why: `Largest standard size your frame takes. Tip at Mach ${r.tip.mach}.` },
  ];
  const addAll = () => {
    for (const p of parts) quote.add({ code: p.code, id: p.code.toLowerCase(), name: `${p.name}, sized`, href: p.href }, i.rotors);
    setAdded(true);
  };
  const stem = `Timule ${r.codes.motor} ${i.rotors}x`;

  return (
    <>
      <section aria-label="Summary" className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
        <Big k="Hover time" v={`${n1(r.minutes)} min`} sub={`${CHEM[i.chem].usable * 100}% of the pack used`} accent />
        <Big k="All-up mass" v={`${n1(r.mass)} kg`} sub={`battery ${n1(r.battery)} kg`} />
        <Big k="Hover, per motor" v={`${n1(r.thrustPerRotorKg)} kg`} sub={`${n0(r.hoverW)} W · ${n1(r.Ihover)} A`} />
        <Big k="Full power, per motor" v={`${n1(r.maxThrustPerRotorKg)} kg`} sub={`${n0(r.peakW)} W · ${n1(r.Ipeak)} A`} />
        <Big k="Hover rpm" v={n0(r.rpmHover)} sub={`max ${n0(r.rpmMax)}`} />
        <Big k="Hover throttle" v={`${Math.round(r.hoverThrottle * 100)}%`} sub={`${Math.round(r.hoverFrac * 100)}% of thrust`} />
        <Big k="Battery peak" v={`${n1(r.cRate)}C`} sub={`${n0(r.Ipeak * i.rotors)} A total`} />
        <Big k="Air density" v={`${r.rho.toFixed(3)}`} sub={`kg/m³, sea level 1.225`} />
      </section>

      {r.warnings.length ? (
        <ul className="space-y-2" aria-label="Warnings">
          {r.warnings.map((w) => (
            <li key={w.text} className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm", w.level === "stop" ? "border-danger/50" : "border-line")}>
              <Icon name={w.level === "stop" ? "alert" : "info"} size={16} className={cn("mt-0.5 shrink-0", w.level === "stop" ? "text-danger" : "text-fg-subtle")} />
              {w.text}
            </li>
          ))}
        </ul>
      ) : null}

      <section aria-labelledby="set">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="set" className="text-lg font-semibold tracking-tight">
            Matched set, {i.rotors} of each
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link href={`/tools/sizing/sheet?${params}`} className={cn(pill, off)}>
              <Icon name="printer" size={14} /> Sizing sheet (PDF)
            </Link>
            <button type="button" onClick={addAll} className={cn(pill, off)}>
              <Icon name={added ? "check" : "plus"} size={14} /> {added ? "In quote list" : "Add set to quote list"}
            </button>
            <button
              type="button"
              onClick={() => {
                addAll();
                router.push("/request?from=quote");
              }}
              className={cn(pill, on)}
            >
              Request this set
            </button>
          </div>
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {parts.map((p) => (
            <li key={p.role} className="flex flex-col rounded-xl border border-line p-5">
              <span className="text-xs text-fg-subtle">{p.role}</span>
              <span className="code-text mt-1 text-base font-semibold">{p.code}</span>
              <span className="mt-1 text-sm">{p.name}</span>
              <span className="mt-2 flex-1 text-sm text-fg-muted">{p.why}</span>
              <Link href={p.href} className="mt-4 inline-flex items-center gap-1 text-sm text-accent hover:underline">
                Configure every detail <Icon name="arrowRight" size={14} />
              </Link>
            </li>
          ))}
        </ul>
        {r.motors.length > 1 ? (
          <p className="mt-3 text-sm text-fg-subtle">
            Other motors that fit:{" "}
            {r.motors.slice(1).map((m, k) => (
              <span key={m.size + m.kv}>
                {k ? ", " : ""}
                <Link href={`/configure/motor?f=${m.size}&kv=${m.kv}&v=${m.cells}&q=${i.rotors}`} className="code-text text-fg-muted hover:text-fg hover:underline">
                  TM-MOT-{m.size}-{m.kv}-A
                </Link>{" "}
                ({m.kvOff > 0 ? "+" : ""}
                {Math.round(m.kvOff * 100)}% KV)
              </span>
            ))}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="curve" className="rounded-xl border border-line p-5">
        <h2 id="curve" className="font-medium">
          Flight time against battery size
        </h2>
        <p className="mt-1 text-sm text-fg-subtle">A bigger pack weighs more, so each extra mAh buys less time. The dot is your pack.</p>
        <TimeCurve i={i} />
      </section>

      <div id="downloads" className="scroll-mt-24" />
      <Downloads
        lead="Generated from this sizing, in your browser. Parameter files are starting values: review each line, bench-test with propellers off, then tune in flight."
        items={[
          { label: "ArduPilot parameters", note: "Frame, motor, battery, failsafe and harmonic notch", file: `${stem} ArduPilot.param`, make: () => ardupilotParams(r) },
          { label: "PX4 parameters", note: "Rotors, battery, hover thrust, thrust curve, rpm filter", file: `${stem} PX4.params`, make: () => px4Params(r) },
          { label: "Motor 3D envelope", note: "STL for space claims and clearance in CAD", file: `${r.codes.motor} envelope.stl`, mime: "model/stl", make: () => motorStl(mc) },
          { label: "Motor drilling drawing", note: "DXF, 1:1 mm: base and propeller bolt patterns", file: `${r.codes.motor} drilling.dxf`, mime: "application/dxf", make: () => motorDxf(mc, r.codes.motor) },
          { label: "ESC 3D envelope", note: "STL box with the board's outside size", file: `${r.codes.esc} envelope.stl`, mime: "model/stl", make: () => escStl(r.esc, r.codes.esc) },
          { label: "ESC outline", note: "DXF, 1:1 mm, with stack holes for 4-in-1 boards", file: `${r.codes.esc} outline.dxf`, mime: "application/dxf", make: () => escDxf(r.esc, r.codes.esc) },
          { label: "Propeller disc", note: "DXF, 1:1 mm, disc and 10% tip clearance for the frame layout", file: `${r.codes.prop} disc.dxf`, mime: "application/dxf", make: () => propDxf(r.propCfg, r.codes.prop) },
          { label: "Sizing data", note: "Every number on this page, as CSV", file: `${stem} sizing.csv`, mime: "text/csv", make: () => sizingCsv(r, SITE.url) },
        ]}
      />

      <p className="text-xs text-fg-subtle">
        Estimates from momentum theory with typical propeller, motor and ESC efficiencies, corrected for your air density. Expect real figures within about 15%. A thrust-stand
        test decides, and Timule&apos;s own test data replaces these estimates part by part as we record it.
      </p>
    </>
  );
}

function Big({ k, v, sub, accent }: { k: string; v: string; sub: string; accent?: boolean }) {
  return (
    <div className="bg-bg p-4">
      <p className="text-xs text-fg-subtle">{k}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums tracking-tight", accent && "text-accent")}>{v}</p>
      <p className="mt-0.5 text-xs text-fg-subtle">{sub}</p>
    </div>
  );
}

export function TimeCurve({ i }: { i: SizingInput }) {
  const pts = timeCurve(i);
  const maxC = Math.max(...pts.map((p) => p.capacity));
  const maxT = Math.max(...pts.map((p) => p.minutes)) * 1.1;
  const x = (c: number) => 40 + (c / maxC) * 340;
  const y = (t: number) => 150 - (t / maxT) * 130;
  const cur = pts.reduce((a, b) => (Math.abs(b.capacity - i.capacity) < Math.abs(a.capacity - i.capacity) ? b : a));
  const best = pts.reduce((a, b) => (b.minutes > a.minutes ? b : a));
  return (
    <svg viewBox="0 0 400 180" className="mt-3 h-auto w-full" role="img" aria-label={`About ${Math.round(cur.minutes)} minutes with ${i.capacity} mAh`}>
      <line x1={40} y1={150} x2={385} y2={150} stroke="currentColor" opacity={0.3} />
      <line x1={40} y1={15} x2={40} y2={150} stroke="currentColor" opacity={0.3} />
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <text key={f} x={34} y={y(maxT * f) + 3} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.6}>
          {Math.round(maxT * f)}
        </text>
      ))}
      <text x={6} y={12} fontSize={9} fill="currentColor" opacity={0.6}>
        min
      </text>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <text key={f} x={x(maxC * f)} y={164} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.6}>
          {Math.round((maxC * f) / 1000)}k
        </text>
      ))}
      <text x={385} y={176} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.6}>
        mAh
      </text>
      <polyline points={pts.map((p) => `${x(p.capacity)},${y(p.minutes)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
      {best.capacity !== cur.capacity ? <circle cx={x(best.capacity)} cy={y(best.minutes)} r={3} fill="currentColor" opacity={0.5} /> : null}
      <circle cx={x(cur.capacity)} cy={y(cur.minutes)} r={5} fill="var(--accent)" />
      <text x={x(cur.capacity) + 8} y={y(cur.minutes) - 8} fontSize={10} fill="currentColor">
        {i.capacity.toLocaleString("en-IN")} mAh · {Math.round(cur.minutes)} min
      </text>
    </svg>
  );
}
