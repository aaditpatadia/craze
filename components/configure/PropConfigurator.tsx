"use client";

import { EVIDENCE, ORIGIN, labelOf } from "@/lib/config-options";
import { PROP_MOUNTS, patternCode } from "@/lib/motor-config";
import {
  BALANCE,
  BLADES,
  BORES,
  DIAMETERS,
  FINISH,
  HUB,
  MATERIAL,
  MATERIAL_PROPS,
  ROTATION,
  STYLE,
  pitchChoices,
  propBuild,
  propCode,
  propDefaults,
  propFromParams,
  propLines,
  propToParams,
  tipSpeed,
  type PropConfig,
} from "@/lib/prop-config";
import { cn } from "@/lib/cn";
import { Ladder, PatternDiagram } from "./MotorDiagrams";
import { BoreDiagram, MaterialBars, PitchDiagram, PropTopView, TipSpeed } from "./PropDiagrams";
import { Area, Choice, ConfigBar, Label, Note, NumberChoices, NumberField, Options, Summary, off, on, pill, useLinkedConfig, type ConfigOut } from "./ui";

export function propOut(c: PropConfig): ConfigOut {
  const code = propCode(c);
  return {
    code,
    build: propBuild(c),
    name: `${c.dia} × ${c.pitch} in ${c.style === "FOLD" ? "folding " : ""}${c.blades}-blade propeller, configured`,
    id: code.toLowerCase().replace(/-a$/, ""),
    qty: c.qty,
    path: "/configure/propeller",
    params: propToParams(c),
  };
}

export function PropConfigurator() {
  const [c, setC] = useLinkedConfig(propFromParams, propToParams);
  if (!c) return <div className="min-h-[60vh]" aria-hidden="true" />;
  const set = (patch: Partial<PropConfig>) => setC({ ...c, ...patch });
  const out = propOut(c);
  const t = tipSpeed(c);
  const tipNote =
    t.mach >= 0.8
      ? "Too fast: near the speed of sound the tips lose efficiency and get very loud. Lower the rpm or the diameter."
      : t.mach >= 0.6
        ? "High: noisy and less efficient. Fine for short bursts."
        : "Comfortable: quiet and efficient.";

  return (
    <div>
      <ConfigBar out={out} />

      <Area
        n="01"
        title="Size and blades"
        lead="Diameter sets how much air the propeller moves. Bigger turns slower and more efficiently, but needs more torque and space."
        drawing={<PropTopView dia={c.dia} blades={Number(c.blades)} style={c.style} rotation={c.rotation} />}
        meaning={
          <p>
            A {c.dia} inch propeller sweeps a disc {Math.round(c.dia * 25.4)} mm across. {BLADES.find((b) => b.id === c.blades)?.note} {STYLE.find((s) => s.id === c.style)?.note}
          </p>
        }
      >
        <div>
          <Label>Diameter</Label>
          <div className="flex flex-wrap items-center gap-2">
            {DIAMETERS.map((d) => (
              <Choice key={d} value={d} current={c.dia} onPick={(v) => setC({ ...propDefaults(v), rotation: c.rotation, origin: c.origin, evidence: c.evidence, balance: c.balance, finish: c.finish })}>
                {d}&quot;
              </Choice>
            ))}
            <NumberField label="Custom" value={c.dia} min={2} max={80} step={0.1} unit="in" onChange={(v) => set({ dia: Math.round(v * 10) / 10 })} />
          </div>
        </div>
        <div>
          <Label>Blades</Label>
          <Options list={BLADES} current={c.blades} onPick={(v) => set({ blades: v })} />
        </div>
        <div>
          <Label>Construction</Label>
          <Options list={STYLE} current={c.style} onPick={(v) => set({ style: v })} />
        </div>
      </Area>

      <Area
        n="02"
        title="Pitch"
        lead="Pitch is how far the propeller would move forward in one turn if it screwed through the air like a bolt through wood."
        drawing={<PitchDiagram dia={c.dia} pitch={c.pitch} />}
        meaning={
          <p>
            Low pitch gives more thrust at low speed and suits hovering. High pitch suits forward flight but loads the motor more. Multirotors usually run a pitch about a quarter to a
            half of the diameter.
          </p>
        }
      >
        <div>
          <Label>Pitch</Label>
          <div className="flex flex-wrap items-center gap-2">
            <NumberChoices values={pitchChoices(c.dia)} current={c.pitch} unit='"' onPick={(v) => set({ pitch: v })} />
            <NumberField label="Custom" value={c.pitch} min={1} max={40} step={0.1} unit="in" onChange={(v) => set({ pitch: Math.round(v * 10) / 10 })} />
          </div>
        </div>
      </Area>

      <Area
        n="03"
        title="Material and rotation"
        lead="What the blades are made of decides how much they flex and how much they weigh. Rotation must match each motor."
        drawing={<MaterialBars props={MATERIAL_PROPS} current={c.material} />}
        meaning={
          <p>
            {MATERIAL.find((m) => m.id === c.material)?.note} A blade that flexes loses thrust and vibrates. {ROTATION.find((r) => r.id === c.rotation)?.note}
          </p>
        }
      >
        <div>
          <Label>Material</Label>
          <Options list={MATERIAL} current={c.material} onPick={(v) => set({ material: v })} />
        </div>
        <div>
          <Label>Rotation</Label>
          <Options list={ROTATION} current={c.rotation} onPick={(v) => set({ rotation: v })} />
        </div>
      </Area>

      <Area
        n="04"
        title="Hub"
        lead="How the propeller fixes to the motor. It must match the motor's shaft or bolt pattern exactly."
        drawing={c.hub === "BORE" ? <BoreDiagram bore={c.bore} /> : <PatternDiagram p={c.pattern} title="HUB BOLT PATTERN" />}
        meaning={<p>{HUB.find((h) => h.id === c.hub)?.note} Pick the same pattern you chose for the motor&apos;s propeller mount.</p>}
      >
        <div>
          <Label>Hub type</Label>
          <Options list={HUB} current={c.hub} onPick={(v) => set({ hub: v })} />
        </div>
        {c.hub === "BORE" ? (
          <div>
            <Label>Bore</Label>
            <NumberChoices values={BORES} current={c.bore} unit=" mm" onPick={(v) => set({ bore: v })} />
          </div>
        ) : (
          <div>
            <Label>Bolt pattern</Label>
            <div className="flex flex-wrap gap-2">
              {PROP_MOUNTS.map((p) => {
                const active = patternCode(p) === patternCode(c.pattern);
                return (
                  <button key={patternCode(p)} type="button" aria-pressed={active} onClick={() => set({ pattern: p })} className={cn(pill, active ? on : off)}>
                    {p.n} × {p.screw} / ø{p.pcd}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Area>

      <Area
        n="05"
        title="Speed, balance and finish"
        lead="The highest rpm the propeller must survive, how finely it is balanced, and how it is marked."
        drawing={<TipSpeed ms={t.ms} mach={t.mach} />}
        meaning={
          <p>
            At {c.rpm.toLocaleString("en-IN")} rpm the tips move at {t.ms} m/s. {tipNote} Use the motor&apos;s top speed under load: KV times battery voltage, less about 20 percent.
          </p>
        }
      >
        <div>
          <NumberField label="Maximum rpm" value={c.rpm} min={500} max={60000} step={100} onChange={(v) => set({ rpm: Math.round(v / 100) * 100 })} />
        </div>
        <div>
          <Label>Balance</Label>
          <Options list={BALANCE} current={c.balance} onPick={(v) => set({ balance: v })} />
          <Note list={BALANCE} current={c.balance} />
        </div>
        <div>
          <Label>Finish</Label>
          <Options list={FINISH} current={c.finish} onPick={(v) => set({ finish: v })} />
        </div>
      </Area>

      <Area
        n="06"
        title="Origin and proof"
        lead="Where the carbon, resin and moulding come from, and how much checking you want before the propellers ship."
        drawing={
          <div className="space-y-3">
            <Ladder steps={ORIGIN} value={c.origin} />
            <Ladder steps={EVIDENCE} value={c.evidence} />
          </div>
        }
        meaning={
          <p>
            {ORIGIN.find((x) => x.id === c.origin)?.note ?? "No origin rule: we source the best match."} For a carbon propeller that means naming the maker of the carbon fibre and the
            resin. {EVIDENCE.find((x) => x.id === c.evidence)?.note}
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

      <Summary
        n="07"
        unit="Propellers"
        qty={c.qty}
        onQty={(q) => set({ qty: q })}
        code={out.code}
        sheetHref={`${out.path}/sheet?${out.params}`}
        rows={[
          ["Code", out.code],
          ["Size", `${c.dia} × ${c.pitch} in, ${labelOf(BLADES, c.blades).toLowerCase()}`],
          ["Construction", `${labelOf(STYLE, c.style)}, ${labelOf(MATERIAL, c.material).toLowerCase()}`],
          ...propLines(c)
            .filter(([k]) => ["Rotation", "Hub", "Design speed", "Origin", "Evidence"].includes(k))
            .map(([k, v]) => [k, v] as [string, string]),
        ]}
      />
    </div>
  );
}
