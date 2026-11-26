"use client";

import {
  BEC,
  CELLS,
  CELL_MAX_V,
  CONTROL,
  CONT_AMPS,
  COOLING,
  ESC_DEFAULT,
  FIRMWARE,
  LAYOUT,
  MOUNT,
  POWER_AWG,
  POWER_CONN,
  PROTECTION,
  PROTOCOL,
  SIGNAL_CONN,
  TELEMETRY,
  escBuild,
  escCode,
  escFit,
  escFromParams,
  escLines,
  escToParams,
  peakRating,
  type EscConfig,
} from "@/lib/esc-config";
import { EVIDENCE, ORIGIN, labelOf } from "@/lib/config-options";
import { Ladder } from "./MotorDiagrams";
import { BoardDiagram, LoadBars, PowerFlow, SignalDiagram } from "./EscDiagrams";
import { Area, ConfigBar, Label, Note, NumberChoices, NumberField, Options, Summary, useLinkedConfig, type ConfigOut } from "./ui";

export function escOut(c: EscConfig): ConfigOut {
  const code = escCode(c);
  return {
    code,
    build: escBuild(c),
    name: `${c.layout === "4" ? "4-in-1 " : ""}${c.amps} A ${labelOf(CELLS, c.cells)} ESC, configured`,
    id: code.toLowerCase().replace(/-a$/, ""),
    qty: c.qty,
    path: "/configure/esc",
    params: escToParams(c),
  };
}

const VERDICT = {
  good: "Good fit: the motor uses no more than 80 percent of the continuous rating at hover and 90 percent of the peak.",
  tight: "Tight: it works on paper but runs hot. Choose the next current up or add cooling.",
  over: "Over the rating: this ESC will overheat or fail. Choose a higher current.",
} as const;

export function EscConfigurator() {
  const [c, setC] = useLinkedConfig(escFromParams, escToParams);
  if (!c) return <div className="min-h-[60vh]" aria-hidden="true" />;
  const set = (patch: Partial<EscConfig>) => setC({ ...c, ...patch });
  const out = escOut(c);
  const fit = escFit(c);
  const peakAmps = peakRating(c.amps);

  return (
    <div>
      <ConfigBar out={out} />

      <Area
        n="01"
        title="Layout and current"
        lead="How many motors one board drives, and how much current each channel carries without overheating."
        drawing={<BoardDiagram layout={c.layout} mount={c.mount} cooling={c.cooling} amps={c.amps} />}
        meaning={
          <p>
            {LAYOUT.find((x) => x.id === c.layout)?.note} Each channel carries {c.amps} A continuously and about {peakAmps} A for 10 seconds. Continuous ratings assume air moving over
            the board.
          </p>
        }
      >
        <div>
          <Label>Layout</Label>
          <Options list={LAYOUT} current={c.layout} onPick={(v) => set({ layout: v, mount: v === "4" ? "30" : "ARM" })} />
        </div>
        <div>
          <Label>Continuous current per channel</Label>
          <NumberChoices values={CONT_AMPS} current={c.amps} unit=" A" onPick={(v) => set({ amps: v })} />
        </div>
        <div>
          <Label>Battery range</Label>
          <Options list={CELLS} current={c.cells} onPick={(v) => set({ cells: v })} />
        </div>
      </Area>

      <Area
        n="02"
        title="Will it drive your motor?"
        lead="Enter what one motor draws. We check it against the ratings so you do not buy an ESC that cooks itself."
        drawing={<LoadBars hover={c.hover} peak={c.peak} amps={c.amps} peakAmps={peakAmps} />}
        meaning={
          <p>
            <span className="font-medium text-fg">{VERDICT[fit.verdict]}</span> Hover uses {fit.hoverPct} percent of continuous; peak uses {fit.peakPct} percent of the 10-second rating.
            Take both currents from the motor&apos;s test data at your propeller and voltage.
          </p>
        }
      >
        <div className="flex flex-wrap gap-4">
          <NumberField label="Hover current, one motor" value={c.hover} min={0} max={400} unit="A" onChange={(v) => set({ hover: v })} />
          <NumberField label="Peak current, one motor" value={c.peak} min={0} max={600} unit="A" onChange={(v) => set({ peak: v })} />
        </div>
      </Area>

      <Area
        n="03"
        title="Control and signal"
        lead="How the ESC drives the motor, and how the flight controller tells it what to do."
        drawing={<SignalDiagram protocol={c.protocol} />}
        meaning={
          <p>
            {PROTOCOL.find((x) => x.id === c.protocol)?.note} {CONTROL.find((x) => x.id === c.control)?.note}
          </p>
        }
      >
        <div>
          <Label>Motor control</Label>
          <Options list={CONTROL} current={c.control} onPick={(v) => set({ control: v })} />
        </div>
        <div>
          <Label>Throttle input</Label>
          <Options list={PROTOCOL} current={c.protocol} onPick={(v) => set({ protocol: v, signalConn: v === "CAN" ? "CANGH" : c.signalConn === "CANGH" ? "JSTGH" : c.signalConn })} />
        </div>
        <div>
          <Label>Firmware</Label>
          <Options list={FIRMWARE} current={c.firmware} onPick={(v) => set({ firmware: v })} />
          <Note list={FIRMWARE} current={c.firmware} />
        </div>
        <div>
          <Label>Telemetry back to the flight controller</Label>
          <Options list={TELEMETRY} current={c.telemetry} onPick={(v) => set({ telemetry: v })} />
        </div>
      </Area>

      <Area
        n="04"
        title="Power"
        lead="Whether the ESC also powers your flight controller, and how the battery connects."
        drawing={<PowerFlow bec={c.bec} cellsLabel={labelOf(CELLS, c.cells)} />}
        meaning={
          <p>
            A BEC is a small regulator that turns battery voltage into 5 or 12 V for the flight controller and camera. Without one you need a separate converter. Lower AWG means thicker
            power leads: {c.powerAwg} AWG suits about {c.powerAwg <= 8 ? 120 : c.powerAwg <= 10 ? 80 : c.powerAwg <= 12 ? 55 : c.powerAwg <= 14 ? 35 : 22} A.
          </p>
        }
      >
        <div>
          <Label>BEC</Label>
          <Options list={BEC} current={c.bec} onPick={(v) => set({ bec: v })} />
        </div>
        <div>
          <Label>Power lead gauge</Label>
          <NumberChoices values={POWER_AWG} current={c.powerAwg} unit=" AWG" onPick={(v) => set({ powerAwg: v })} />
        </div>
        <div>
          <Label>Battery connector</Label>
          <Options list={POWER_CONN} current={c.powerConn} onPick={(v) => set({ powerConn: v })} />
        </div>
        <div>
          <Label>Signal connector</Label>
          <Options list={SIGNAL_CONN} current={c.signalConn} onPick={(v) => set({ signalConn: v })} />
        </div>
      </Area>

      <Area
        n="05"
        title="Mounting, cooling and weather"
        lead="Where the board sits, how it sheds heat and what it is sealed against."
        drawing={
          <div className="space-y-3">
            <BoardDiagram layout={c.layout} mount={c.mount} cooling={c.cooling} amps={c.amps} />
            <Ladder steps={PROTECTION} value={c.protection} />
          </div>
        }
        meaning={
          <p>
            {MOUNT.find((x) => x.id === c.mount)?.note} {COOLING.find((x) => x.id === c.cooling)?.note} {PROTECTION.find((x) => x.id === c.protection)?.note}
          </p>
        }
      >
        <div>
          <Label>Mounting</Label>
          <Options list={c.layout === "4" ? MOUNT.slice(0, 3) : MOUNT.slice(3)} current={c.mount} onPick={(v) => set({ mount: v })} />
        </div>
        <div>
          <Label>Cooling</Label>
          <Options list={COOLING} current={c.cooling} onPick={(v) => set({ cooling: v })} />
        </div>
        <div>
          <Label>Protection</Label>
          <Options list={PROTECTION} current={c.protection} onPick={(v) => set({ protection: v })} />
        </div>
      </Area>

      <Area
        n="06"
        title="Origin and proof"
        lead="ESCs are where Chinese chips hide. Say how far the origin must be documented and how much checking you want."
        drawing={
          <div className="space-y-3">
            <Ladder steps={ORIGIN} value={c.origin} />
            <Ladder steps={EVIDENCE} value={c.evidence} />
          </div>
        }
        meaning={
          <p>
            {ORIGIN.find((x) => x.id === c.origin)?.note ?? "No origin rule: we source the best match."} For an ESC that means naming the maker of the microcontroller, gate drivers and
            MOSFETs. {EVIDENCE.find((x) => x.id === c.evidence)?.note}
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
        unit={c.layout === "4" ? "Boards" : "ESCs"}
        qty={c.qty}
        onQty={(q) => set({ qty: q })}
        code={out.code}
        sheetHref={`${out.path}/sheet?${out.params}`}
        rows={[
          ["Code", out.code],
          ...escLines(c)
            .filter(([k]) => ["Layout", "Current", "Battery", "Throttle input", "Firmware", "BEC", "Mounting", "Origin", "Evidence"].includes(k))
            .map(([k, v]) => [k, v] as [string, string]),
        ]}
      />
      <p className="sr-only">Battery limit {CELL_MAX_V[c.cells]} V. Default configuration {ESC_DEFAULT.amps} A.</p>
    </div>
  );
}
