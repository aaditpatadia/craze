"use client";

import { useEffect, useState } from "react";
import { EVIDENCE, ORIGIN, labelOf } from "@/lib/config-options";
import { CELLS, PROTECTION, escFromParams, escLines, peakRating, type EscConfig } from "@/lib/esc-config";
import { Ladder } from "./MotorDiagrams";
import { BoardDiagram, LoadBars, PowerFlow, SignalDiagram } from "./EscDiagrams";
import { escOut } from "./EscConfigurator";
import { ConfigSheet } from "./ui";

export function EscSpecSheet() {
  const [c, setC] = useState<EscConfig | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the configuration from the link once
    setC(escFromParams(new URLSearchParams(window.location.search)));
  }, []);
  if (!c) return <div className="bp-root min-h-dvh" data-variant="blueprint" />;
  const out = escOut(c);
  return (
    <ConfigSheet
      kind="ESC specification"
      title={`${c.layout === "4" ? "4-in-1 " : ""}${c.amps} A ${labelOf(CELLS, c.cells)} speed controller`}
      out={out}
      back={`${out.path}?${out.params}`}
      fields={[
        { label: "Current", value: `${c.amps} A / ${peakRating(c.amps)} A peak` },
        { label: "Battery", value: labelOf(CELLS, c.cells) },
      ]}
      drawings={[
        { title: "Board, load and signal", items: [<BoardDiagram key="b" layout={c.layout} mount={c.mount} cooling={c.cooling} amps={c.amps} />, <LoadBars key="l" hover={c.hover} peak={c.peak} amps={c.amps} peakAmps={peakRating(c.amps)} />, <SignalDiagram key="s" protocol={c.protocol} />] },
        { title: "Power, protection and origin", items: [<PowerFlow key="p" bec={c.bec} cellsLabel={labelOf(CELLS, c.cells)} />, <Ladder key="pr" steps={PROTECTION} value={c.protection} />, <Ladder key="o" steps={ORIGIN} value={c.origin} />] },
        { title: "Evidence before shipping", items: [<Ladder key="e" steps={EVIDENCE} value={c.evidence} />] },
      ]}
      lines={escLines(c)}
    />
  );
}
