"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { ardupilotParams, escDxf, escEnvelope, escStl, motorDxf, motorEnvelope, motorStl, propDxf, px4Params } from "@/lib/downloads";
import { CELLS as ESC_CELLS, CONT_AMPS, COOLING, ESC_DEFAULT, LAYOUT, MOUNT, PROTOCOL, TELEMETRY, escCode, escToParams, type EscConfig } from "@/lib/esc-config";
import { FRAMES, defaultsFor, motorCode, toParams } from "@/lib/motor-config";
import { DIAMETERS, HUB, BORES, propCode, propDefaults, propToParams, type PropConfig } from "@/lib/prop-config";
import { CELL_CHOICES, CHEM, ROTOR_CHOICES, SIZING_DEFAULT, batteryKg, propFor, size, type Chem } from "@/lib/sizing";
import { Icon } from "@/components/ui/Icon";
import { Choice, Label, NumberField, Options, off, on, pill } from "@/components/configure/ui";
import { PatternDiagram } from "@/components/configure/MotorDiagrams";
import { BoardDiagram } from "@/components/configure/EscDiagrams";
import { PropTopView } from "@/components/configure/PropDiagrams";
import { Downloads } from "./Downloads";

type Kind = "motor" | "esc" | "prop";
const select = "h-10 rounded-lg border border-line bg-bg-elev px-3 text-sm text-fg";

/** Reads a TM code a buyer already has and opens that part. */
function parseCode(raw: string): { kind: Kind; motor?: { size: string; kv: number }; esc?: Partial<EscConfig>; dia?: number } | null {
  const s = raw.trim().toUpperCase();
  let m = s.match(/^TM-MOT-(\d{4,5})-(\d{2,4})/);
  if (m) return { kind: "motor", motor: { size: m[1]!, kv: Number(m[2]) } };
  m = s.match(/^TM-ESC-(\d{2,3})(X4)?-(\d{1,2})S/);
  if (m) return { kind: "esc", esc: { amps: Number(m[1]), layout: m[2] ? "4" : "1", cells: ["6", "12", "14", "24"].includes(m[3]!) ? m[3]! : "6", mount: m[2] ? "30" : "ARM" } };
  m = s.match(/^TM-PRP-(\d+)-/);
  if (m) {
    const dia = [...DIAMETERS].sort((a, b) => String(b).length - String(a).length).find((d) => m![1]!.startsWith(String(d)));
    if (dia) return { kind: "prop", dia };
  }
  return null;
}

export function EngineerFiles() {
  const [kind, setKind] = useState<Kind>("motor");
  const [codeIn, setCodeIn] = useState("");
  const [codeErr, setCodeErr] = useState(false);
  const [mSize, setMSize] = useState("6215");
  const [mKv, setMKv] = useState(170);
  const [esc, setEsc] = useState<EscConfig>({ ...ESC_DEFAULT });
  const [prop, setProp] = useState<PropConfig>(propDefaults(24));

  const motor = useMemo(() => defaultsFor(mSize, mKv), [mSize, mKv]);
  const mc = motorCode(motor);
  const ec = escCode(esc);
  const pc = propCode(prop);

  const openCode = () => {
    const p = parseCode(codeIn);
    setCodeErr(!p);
    if (!p) return;
    setKind(p.kind);
    if (p.motor) {
      setMSize(FRAMES.some((f) => f.size === p.motor!.size) ? p.motor.size : mSize);
      setMKv(p.motor.kv);
    }
    if (p.esc) setEsc((e) => ({ ...e, ...p.esc }));
    if (p.dia) setProp(propDefaults(p.dia));
  };

  return (
    <div className="space-y-14">
      <section aria-labelledby="cad" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="code-text text-xs text-accent">01</p>
            <h2 id="cad" className="mt-1 text-xl font-semibold tracking-tight">
              CAD files for a part
            </h2>
            <p className="mt-1 max-w-xl text-sm text-fg-subtle">Pick a part, or paste a TM code you already have. Files are generated in your browser at 1:1 in millimetres.</p>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              openCode();
            }}
          >
            <input
              aria-label="TM code"
              value={codeIn}
              onChange={(e) => setCodeIn(e.target.value)}
              placeholder="TM-MOT-6215-170-A"
              className={cn(select, "code-text w-56", codeErr && "border-danger")}
            />
            <button type="submit" className={cn(pill, off)}>
              Open code
            </button>
          </form>
        </div>
        {codeErr ? <p className="text-sm text-danger">That code was not recognised. Use a motor, ESC or propeller code such as TM-ESC-45-6S-A.</p> : null}

        <div className="flex flex-wrap gap-2" role="tablist">
          {(
            [
              ["motor", "BLDC motor"],
              ["esc", "ESC"],
              ["prop", "Propeller"],
            ] as [Kind, string][]
          ).map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className={cn(pill, kind === k ? on : off)}>
              {l}
            </button>
          ))}
        </div>

        {kind === "motor" ? (
          <PartPanel
            code={mc}
            configure={`/configure/motor?${toParams(motor)}`}
            facts={[`Envelope ø${motorEnvelope(motor).od} × ${motorEnvelope(motor).body} mm`, `Shaft ø${motor.shaftDia} mm`, `Base ${motor.base.n} × ${motor.base.screw} on ø${motor.base.pcd}`, `Propeller ${motor.prop.n} × ${motor.prop.screw} on ø${motor.prop.pcd}`]}
            controls={
              <div className="flex flex-wrap gap-4">
                <label className="text-sm text-fg-muted">
                  Frame
                  <select
                    className={cn(select, "ml-2")}
                    value={mSize}
                    onChange={(e) => {
                      setMSize(e.target.value);
                      setMKv(FRAMES.find((f) => f.size === e.target.value)!.kvs[0]!.kv);
                    }}
                  >
                    {FRAMES.map((f) => (
                      <option key={f.size} value={f.size}>
                        {f.size} · {f.props}
                      </option>
                    ))}
                  </select>
                </label>
                <NumberField label="KV" value={mKv} min={20} max={5000} unit="" onChange={setMKv} />
              </div>
            }
            drawings={[<PatternDiagram key="b" p={motor.base} title="BASE MOUNT" />, <PatternDiagram key="p" p={motor.prop} title="PROPELLER MOUNT" />]}
            items={[
              { label: "3D envelope", note: "STL for space claims and clearance", file: `${mc} envelope.stl`, mime: "model/stl", make: () => motorStl(motor) },
              { label: "Drilling drawing", note: "DXF: base and propeller bolt patterns", file: `${mc} drilling.dxf`, mime: "application/dxf", make: () => motorDxf(motor, mc) },
            ]}
          />
        ) : null}

        {kind === "esc" ? (
          <PartPanel
            code={ec}
            configure={`/configure/esc?${escToParams(esc)}`}
            facts={[`Envelope ${escEnvelope(esc).x} × ${escEnvelope(esc).y} × ${escEnvelope(esc).z} mm`, MOUNT.find((x) => x.id === esc.mount)?.label ?? ""]}
            controls={
              <div className="space-y-4">
                <Options list={LAYOUT} current={esc.layout} onPick={(v) => setEsc({ ...esc, layout: v, mount: v === "4" ? "30" : "ARM" })} />
                <div className="flex flex-wrap gap-4">
                  <label className="text-sm text-fg-muted">
                    Current
                    <select className={cn(select, "ml-2")} value={esc.amps} onChange={(e) => setEsc({ ...esc, amps: Number(e.target.value) })}>
                      {CONT_AMPS.map((a) => (
                        <option key={a} value={a}>
                          {a} A
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm text-fg-muted">
                    Battery
                    <select className={cn(select, "ml-2")} value={esc.cells} onChange={(e) => setEsc({ ...esc, cells: e.target.value })}>
                      {ESC_CELLS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <Options list={MOUNT.filter((m) => (esc.layout === "4" ? ["20", "30", "45"] : ["ARM", "PLATE"]).includes(m.id))} current={esc.mount} onPick={(v) => setEsc({ ...esc, mount: v })} />
                <Options list={COOLING} current={esc.cooling} onPick={(v) => setEsc({ ...esc, cooling: v })} />
              </div>
            }
            drawings={[<BoardDiagram key="b" layout={esc.layout} mount={esc.mount} cooling={esc.cooling} amps={esc.amps} />]}
            items={[
              { label: "3D envelope", note: "STL box with the board's outside size", file: `${ec} envelope.stl`, mime: "model/stl", make: () => escStl(esc, ec) },
              { label: "Outline drawing", note: "DXF with stack holes for 4-in-1 boards", file: `${ec} outline.dxf`, mime: "application/dxf", make: () => escDxf(esc, ec) },
            ]}
          />
        ) : null}

        {kind === "prop" ? (
          <PartPanel
            code={pc}
            configure={`/configure/propeller?${propToParams(prop)}`}
            facts={[`Disc ø${Math.round(prop.dia * 25.4)} mm`, prop.hub === "BORE" ? `Centre bore ø${prop.bore} mm` : `Hub ${prop.pattern.n} × ${prop.pattern.screw} on ø${prop.pattern.pcd}`]}
            controls={
              <div className="space-y-4">
                <label className="text-sm text-fg-muted">
                  Diameter
                  <select className={cn(select, "ml-2")} value={prop.dia} onChange={(e) => setProp(propDefaults(Number(e.target.value)))}>
                    {DIAMETERS.map((d) => (
                      <option key={d} value={d}>
                        {d} in
                      </option>
                    ))}
                  </select>
                </label>
                <Options list={HUB} current={prop.hub} onPick={(v) => setProp({ ...prop, hub: v })} />
                {prop.hub === "BORE" ? (
                  <div className="flex flex-wrap gap-2">
                    {BORES.map((b) => (
                      <Choice key={b} value={b} current={prop.bore} onPick={(v) => setProp({ ...prop, bore: v })}>
                        ø{b} mm
                      </Choice>
                    ))}
                  </div>
                ) : null}
              </div>
            }
            drawings={[<PropTopView key="t" dia={prop.dia} blades={Number(prop.blades)} style={prop.style} rotation={prop.rotation} />]}
            items={[{ label: "Disc and hub drawing", note: "DXF: disc, 10% tip clearance, hub holes or bore", file: `${pc} disc.dxf`, mime: "application/dxf", make: () => propDxf(prop, pc) }]}
          />
        ) : null}
      </section>

      <FlightParams motor={{ size: mSize, kv: mKv }} />
    </div>
  );
}

function PartPanel({ code, configure, facts, controls, drawings, items }: { code: string; configure: string; facts: string[]; controls: React.ReactNode; drawings: React.ReactNode[]; items: Parameters<typeof Downloads>[0]["items"] }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-5 lg:col-span-6">
        {controls}
        <div className="rounded-xl border border-line p-4">
          <p className="code-text text-base font-semibold">{code}</p>
          <ul className="mt-2 space-y-1 text-sm text-fg-muted">
            {facts.filter(Boolean).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <Link href={configure} className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline">
            Configure every detail <Icon name="arrowRight" size={14} />
          </Link>
        </div>
      </div>
      <div className={cn("grid gap-3 rounded-xl border border-line bg-bg-subtle p-4 lg:col-span-6", drawings.length > 1 ? "grid-cols-2" : "grid-cols-1")}>{drawings}</div>
      <Downloads className="lg:col-span-12" title="Files for this part" items={items} />
    </div>
  );
}

/** Flight-controller parameters for an aircraft the engineer has already built or drawn. */
function FlightParams({ motor }: { motor: { size: string; kv: number } }) {
  const [mass, setMass] = useState(25);
  const [rotors, setRotors] = useState(6);
  const [coax, setCoax] = useState(false);
  const [prop, setProp] = useState(24);
  const [cells, setCells] = useState(12);
  const [chem, setChem] = useState<Chem>("LIPO");
  const [capacity, setCapacity] = useState(22000);
  const [protocol, setProtocol] = useState("DS600");
  const [telemetry, setTelemetry] = useState("BASIC");
  const [useMotor, setUseMotor] = useState(true);

  const r = useMemo(() => {
    const bat = batteryKg({ cells, capacity, chem });
    const input = { ...SIZING_DEFAULT, dry: Math.max(0.1, mass - bat), payload: 0, rotors, coax, maxProp: prop, cells, capacity, chem };
    return size(input, { motor: useMotor ? motor : undefined, esc: { protocol, telemetry } });
  }, [mass, rotors, coax, prop, cells, capacity, chem, protocol, telemetry, useMotor, motor]);
  const stem = `Timule ${rotors}x ${r.codes.motor}`;

  return (
    <section aria-labelledby="fc" className="space-y-6 border-t border-line pt-12">
      <div>
        <p className="code-text text-xs text-accent">02</p>
        <h2 id="fc" className="mt-1 text-xl font-semibold tracking-tight">
          Flight-controller parameters for your aircraft
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-fg-subtle">
          For an aircraft you have already built. Enter what it is, and get ArduPilot and PX4 starting files: frame, motor output, battery and failsafe voltages, hover throttle,
          thrust curve and the propeller-noise filter. To choose parts from scratch, use{" "}
          <Link href="/tools/sizing" className="text-accent hover:underline">
            propulsion sizing
          </Link>{" "}
          instead.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <form className="space-y-5 lg:col-span-6" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-wrap gap-4">
            <NumberField label="All-up mass with battery" value={mass} min={0.2} max={500} step={0.1} unit="kg" onChange={setMass} />
            <label className="text-sm text-fg-muted">
              Propeller
              <select className={cn(select, "ml-2")} value={prop} onChange={(e) => setProp(Number(e.target.value))}>
                {DIAMETERS.map((d) => (
                  <option key={d} value={d}>
                    {d} in
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <Label>Rotors</Label>
            <div className="flex flex-wrap gap-2">
              {ROTOR_CHOICES.map((n) => (
                <Choice key={n} value={n} current={rotors} onPick={(v) => (setRotors(v), v !== 8 && setCoax(false))}>
                  {n}
                </Choice>
              ))}
              {rotors === 8 ? (
                <button type="button" aria-pressed={coax} onClick={() => setCoax(!coax)} className={cn(pill, coax ? on : off)}>
                  Coaxial X8
                </button>
              ) : null}
            </div>
          </div>
          <div>
            <Label>Battery</Label>
            <div className="flex flex-wrap gap-2">
              {CELL_CHOICES.map((n) => (
                <Choice key={n} value={n} current={cells} onPick={setCells}>
                  {n}S
                </Choice>
              ))}
              {(Object.keys(CHEM) as Chem[]).map((k) => (
                <Choice key={k} value={k} current={chem} onPick={setChem}>
                  {CHEM[k].label}
                </Choice>
              ))}
            </div>
            <div className="mt-3">
              <NumberField label="Capacity" value={capacity} min={300} max={200000} step={500} unit="mAh" onChange={setCapacity} />
            </div>
          </div>
          <div>
            <Label>Motor</Label>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={useMotor} onClick={() => setUseMotor(true)} className={cn(pill, useMotor ? on : off)}>
                The motor picked above: {motor.size} {motor.kv} KV
              </button>
              <button type="button" aria-pressed={!useMotor} onClick={() => setUseMotor(false)} className={cn(pill, !useMotor ? on : off)}>
                Suggest one
              </button>
            </div>
          </div>
          <div>
            <Label>ESC throttle signal and telemetry</Label>
            <Options list={PROTOCOL} current={protocol} onPick={setProtocol} />
            <div className="mt-2">
              <Options list={TELEMETRY} current={telemetry} onPick={setTelemetry} />
            </div>
          </div>
        </form>
        <div className="space-y-4 lg:col-span-6">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line text-sm">
            {[
              ["Motor", r.codes.motor],
              ["Hover throttle", `${Math.round(r.hoverThrottle * 100)}%`],
              ["Hover rpm, notch", `${Math.round(r.rpmHover)} rpm, ${Math.round(r.rpmHover / 60)} Hz`],
              ["Thrust curve", `${r.expo} for ${propFor(prop)} in`],
              ["Battery failsafe", `${(cells * (CHEM[chem].empty + 0.1)).toFixed(1)} V low, ${(cells * CHEM[chem].empty).toFixed(1)} V critical`],
              ["Hover time", `about ${Math.round(r.minutes)} min`],
            ].map(([k, v]) => (
              <div key={k} className="bg-bg p-3">
                <dt className="text-xs text-fg-subtle">{k}</dt>
                <dd className="mt-0.5 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {r.warnings
            .filter((w) => w.level === "stop" || w.text.startsWith("Your motor"))
            .map((w) => (
              <p key={w.text} className="flex items-start gap-2 rounded-lg border border-line p-3 text-sm">
                <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-danger" /> {w.text}
              </p>
            ))}
        </div>
      </div>
      <Downloads
        title="Parameter files"
        lead="Starting values: review each line, bench-test with propellers off, then tune in flight. Lines marked CHECK depend on your hardware."
        items={[
          { label: "ArduPilot parameters", note: "Load in Mission Planner: Full Parameter List", file: `${stem} ArduPilot.param`, make: () => ardupilotParams(r) },
          { label: "PX4 parameters", note: "Load in QGroundControl: Parameters, Tools", file: `${stem} PX4.params`, make: () => px4Params(r) },
        ]}
      />
    </section>
  );
}
