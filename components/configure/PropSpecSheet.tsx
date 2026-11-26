"use client";

import { useEffect, useState } from "react";
import { EVIDENCE, ORIGIN } from "@/lib/config-options";
import { MATERIAL_PROPS, propFromParams, propLines, tipSpeed, type PropConfig } from "@/lib/prop-config";
import { Ladder, PatternDiagram } from "./MotorDiagrams";
import { BoreDiagram, MaterialBars, PitchDiagram, PropTopView, TipSpeed } from "./PropDiagrams";
import { propOut } from "./PropConfigurator";
import { ConfigSheet } from "./ui";

export function PropSpecSheet() {
  const [c, setC] = useState<PropConfig | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the configuration from the link once
    setC(propFromParams(new URLSearchParams(window.location.search)));
  }, []);
  if (!c) return <div className="bp-root min-h-dvh" data-variant="blueprint" />;
  const out = propOut(c);
  const t = tipSpeed(c);
  return (
    <ConfigSheet
      kind="Propeller specification"
      title={`${c.dia} × ${c.pitch} in ${c.style === "FOLD" ? "folding " : ""}${c.blades}-blade propeller`}
      out={out}
      back={`${out.path}?${out.params}`}
      fields={[
        { label: "Size", value: `${c.dia} × ${c.pitch} in` },
        { label: "Tip speed", value: `${t.ms} m/s, M${t.mach}` },
      ]}
      drawings={[
        {
          title: "Shape and pitch",
          items: [
            <PropTopView key="t" dia={c.dia} blades={Number(c.blades)} style={c.style} rotation={c.rotation} />,
            <PitchDiagram key="p" dia={c.dia} pitch={c.pitch} />,
            c.hub === "BORE" ? <BoreDiagram key="h" bore={c.bore} /> : <PatternDiagram key="h" p={c.pattern} title="HUB BOLT PATTERN" />,
          ],
        },
        {
          title: "Material, speed and proof",
          items: [<MaterialBars key="m" props={MATERIAL_PROPS} current={c.material} />, <TipSpeed key="s" ms={t.ms} mach={t.mach} />, <Ladder key="o" steps={ORIGIN} value={c.origin} />],
        },
        { title: "Evidence before shipping", items: [<Ladder key="e" steps={EVIDENCE} value={c.evidence} />] },
      ]}
      lines={propLines(c)}
    />
  );
}
