"use client";

import { useEffect, useState } from "react";
import { BlueprintDocument, BlueprintSheet, BpSection } from "@/components/blueprint/Sheet";
import { BpToolbar } from "@/components/blueprint/Toolbar";
import { SITE } from "@/lib/config";
import { CELL_VOLTS, FRAMES, INSULATION, INSULATION_TEMP, MAGNETS, MAGNET_TEMP, buildString, fromParams, motorCode, specLines, toParams, type MotorConfig } from "@/lib/motor-config";
import { KvDiagram, LeadsDiagram, PatternDiagram, ShaftDiagram, StatorDiagram, TempScale } from "./MotorDiagrams";

/** A configured motor on a Timule blueprint: the spec a buyer orders and a maker builds. */
export function MotorSpecSheet() {
  const [c, setC] = useState<MotorConfig | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the configuration from the link once
    setC(fromParams(new URLSearchParams(window.location.search)));
  }, []);
  if (!c) return <div className="bp-root min-h-dvh" data-variant="blueprint" />;

  const code = motorCode(c);
  const build = buildString(c);
  const frame = FRAMES.find((f) => f.size === c.size);
  const today = new Date().toISOString().slice(0, 10);
  const host = SITE.url.replace(/^https?:\/\//, "");
  const box = "bp-box bp-drawing";

  return (
    <BlueprintDocument toolbar={<BpToolbar back={{ href: `/configure/motor?${toParams(c)}`, label: "Back to configurator" }} fileName={`${code} Timule motor specification`} />}>
      <BlueprintSheet
        kind="Motor specification"
        title={`${c.size} ${c.kv} KV brushless motor`}
        number={code}
        status={frame?.kvs.some((k) => k.kv === c.kv) ? null : "Custom winding"}
        fields={[
          { label: "Document", value: "Motor specification" },
          { label: "TM code", value: code, mono: true },
          { label: "Revision", value: "A", mono: true },
          { label: "Battery", value: `${c.cells}, ${CELL_VOLTS[c.cells]} V` },
          { label: "Prepared", value: today },
          { label: "Quantity", value: String(c.qty) },
          { label: "Status", value: "For quotation" },
          { label: "Drawings", value: "Schematic, not to scale" },
          { label: "Issued by", value: "Timule" },
        ]}
      >
        <div className="bp-box mt-4">
          <span className="bp-label">Build string, printed on the purchase order</span>
          <p className="bp-mono bp-accent mt-1 break-words text-[8.5pt]">
            {code} / {build}
          </p>
        </div>

        <BpSection n="01" title="Frame, speed and shaft">
          <div className="mt-2 grid grid-cols-3 gap-2">
            <figure className={box}>
              <StatorDiagram size={c.size} />
            </figure>
            <figure className={box}>
              <KvDiagram kv={c.kv} volts={CELL_VOLTS[c.cells] ?? 22.2} />
            </figure>
            <figure className={box}>
              <ShaftDiagram dia={c.shaftDia} style={c.shaftStyle} />
            </figure>
          </div>
        </BpSection>

        <BpSection n="02" title="Mounting and wiring">
          <div className="mt-2 grid grid-cols-3 gap-2">
            <figure className={box}>
              <PatternDiagram p={c.prop} title="PROPELLER MOUNT" />
            </figure>
            <figure className={box}>
              <PatternDiagram p={c.base} title="BASE MOUNT" />
            </figure>
            <figure className={box}>
              <LeadsDiagram length={c.leadLength} awg={c.leadAwg} connector={c.connector} />
            </figure>
          </div>
        </BpSection>

        <BpSection n="03" title="Heat limits">
          <div className="mt-2 grid grid-cols-2 gap-2">
            <figure className={box}>
              <TempScale title="Magnet limit" value={MAGNET_TEMP[c.magnet]!} marks={MAGNETS.map((m) => ({ label: m.label, t: MAGNET_TEMP[m.id]! }))} />
            </figure>
            <figure className={box}>
              <TempScale title="Winding limit" value={INSULATION_TEMP[c.insulation]!} marks={INSULATION.map((m) => ({ label: m.label, t: INSULATION_TEMP[m.id]! }))} />
            </figure>
          </div>
        </BpSection>

        <BpSection n="04" title="Specification">
          <table className="bp-table">
            <tbody>
              {specLines(c).map(([k, v]) => (
                <tr key={k}>
                  <td className="bp-dim w-[45mm]">{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </BpSection>

        <p className="bp-faint mt-6 text-[7pt]">
          Configured at {host}/configure/motor. The maker builds to this specification and labels every unit with {code}. Performance figures such as thrust and efficiency are
          not part of this specification: they are measured on a sample and recorded as evidence.
        </p>
      </BlueprintSheet>
    </BlueprintDocument>
  );
}
