"use client";

import { useEffect, useState } from "react";
import { BlueprintDocument, BlueprintSheet, BpSection } from "@/components/blueprint/Sheet";
import { BpToolbar } from "@/components/blueprint/Toolbar";
import { SITE } from "@/lib/config";
import { CRITICAL, GROUP_LABEL, IC_REPORT_KEY, ORIGIN_LABEL, TARGETS, TIMULE_SHARE, computeIc, inr, type IcRow, type Replacement } from "@/lib/indigenous";
import { Gauge } from "./ContentCalculator";

type Saved = { rows: IcRow[]; target: string; reps: [number, Replacement | null][] };

/** Indigenous content calculation on a Timule blueprint, to attach to a bid or an internal review. */
export function ContentReport() {
  const [data, setData] = useState<Saved | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(IC_REPORT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read the hand-off once after mount
      setData(raw ? (JSON.parse(raw) as Saved) : null);
    } catch {}
    setReady(true);
  }, []);
  const rows = data?.rows ?? [];
  const reps = new Map(data?.reps ?? []);
  const res = computeIc(rows);
  const t = TARGETS.find((x) => x.id === data?.target) ?? TARGETS[1]!;
  const today = new Date().toISOString().slice(0, 10);
  const number = `TM-IC-${today.slice(2).replace(/-/g, "")}`;
  const host = SITE.url.replace(/^https?:\/\//, "");
  const replaced = rows.filter((r) => r.replace && reps.get(r.id));

  return (
    <BlueprintDocument toolbar={<BpToolbar back={{ href: "/tools/content", label: "Content calculator" }} fileName={`${number} Timule indigenous content`} />}>
      <BlueprintSheet
        kind="Indigenous content"
        title="Indigenous content and origin dossier"
        number={number}
        status="Planning estimate"
        fields={[
          { label: "Document", value: "IC calculation" },
          { label: "Score", value: ready ? `${res.score}%` : "" },
          { label: "Target", value: t.label },
          { label: "Lines", value: ready ? String(rows.length) : "" },
          { label: "Total cost", value: ready ? inr(res.total) : "" },
          { label: "With Timule", value: ready ? `${res.whatIf}%` : "" },
          { label: "Method", value: "Cost-based (DAP 2020)" },
          { label: "Prepared", value: today },
          { label: "Issued by", value: "Timule" },
        ]}
      >
        {ready && !rows.length ? <p className="bp-faint mt-4">No calculation to show. Run one in the content calculator first.</p> : null}
        {rows.length ? (
          <>
            <BpSection n="01" title="Result">
              <div className="bp-box mt-2">
                <p className="bp-mono text-[14pt] font-semibold">
                  {res.score}% Indian by cost <span className="bp-dim text-[9pt]">· target {t.label} · {res.score >= t.pct ? "meets target" : `gap ${inr(Math.max(0, (t.pct / 100) * res.total - res.indian))}`}</span>
                </p>
                <div className="bp-accent">
                  <Gauge score={res.score} whatIf={res.whatIf} target={t.pct} color="currentColor" />
                </div>
                <p className="bp-dim mt-1 text-[8pt]">
                  Lighter band: {res.whatIf}% if the {replaced.length} ticked rows are replaced with Timule parts, each counted at {TIMULE_SHARE}% Indian.
                </p>
              </div>
            </BpSection>
            <BpSection n="02" title="By part type">
              <table className="bp-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th className="num">Cost</th>
                    <th className="num">Indian</th>
                    <th className="num">Share of total</th>
                    <th className="pl-4">Critical</th>
                  </tr>
                </thead>
                <tbody>
                  {res.byGroup.map((g) => (
                    <tr key={g.group}>
                      <td>{GROUP_LABEL[g.group]}</td>
                      <td className="num">{inr(g.total)}</td>
                      <td className="num">{g.total ? Math.round((g.indian / g.total) * 100) : 0}%</td>
                      <td className="num">{res.total ? Math.round((g.total / res.total) * 100) : 0}%</td>
                      <td className="bp-dim pl-4">{CRITICAL.includes(g.group) ? "Yes" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </BpSection>
            <BpSection n="03" title="Lines">
              <table className="bp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Part</th>
                    <th className="num">Qty</th>
                    <th className="num">Cost</th>
                    <th>Origin</th>
                    <th className="num">Indian</th>
                    <th>Timule replacement</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const rep = reps.get(r.id);
                    return (
                      <tr key={r.id}>
                        <td className="bp-mono bp-faint">{String(i + 1).padStart(2, "0")}</td>
                        <td>
                          {r.part}
                          <span className="bp-faint"> · {GROUP_LABEL[r.group]}</span>
                        </td>
                        <td className="num">{r.qty}</td>
                        <td className="num">{inr(r.qty * r.unitCost)}</td>
                        <td className="bp-dim">{ORIGIN_LABEL[r.origin]}</td>
                        <td className="num">{r.share}%</td>
                        <td className="bp-mono">{r.replace && rep ? rep.code : <span className="bp-faint">{rep && r.share < 100 ? `Option: ${rep.code}` : ""}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </BpSection>
            <BpSection n="04" title="Points an auditor will raise">
              <ul className="bp-list bp-dim mt-1">
                {res.foreignCritical.length ? <li>Foreign critical parts: {res.foreignCritical.map((r) => r.part).join("; ")}.</li> : <li>No critical part is below 50% Indian.</li>}
                {res.unknown.length ? <li>Origin not known, counted as imported: {res.unknown.map((r) => r.part).join("; ")}. Get written origin declarations.</li> : null}
                {res.missingCost.length ? <li>No cost given, left out of the score: {res.missingCost.map((r) => r.part).join("; ")}.</li> : null}
                <li>Indian shares are as entered. Each must be backed by the vendor&apos;s declaration; Timule parts carry one to the critical material.</li>
              </ul>
            </BpSection>
            <BpSection n="05" title="Origin dossier: what to attach">
              <p className="bp-dim mt-1 text-[8pt]">
                Attach one document per line to the tender or scheme claim. Tick each as it is held. Critical parts need the origin of the critical material, not only of the
                finished part.
              </p>
              <table className="bp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Part</th>
                    <th>Document needed</th>
                    <th className="pl-4">Held</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const rep = reps.get(r.id);
                    const critical = CRITICAL.includes(r.group);
                    const doc =
                      r.replace && rep
                        ? `Timule origin dossier for ${rep.code}: maker declaration, material origin, batch test record`
                        : r.origin === "IMP"
                          ? "Import invoice and bill of entry (counts as 0% Indian)"
                          : r.origin === "UNK"
                            ? "Written origin declaration from the vendor (missing: counted as imported)"
                            : `Vendor declaration of origin and Indian content at ${r.share}%${critical ? ", with origin of magnets, wire or chips" : ""}`;
                    return (
                      <tr key={r.id}>
                        <td className="bp-mono bp-faint">{String(i + 1).padStart(2, "0")}</td>
                        <td>
                          {r.part}
                          {critical ? <span className="bp-faint"> · critical</span> : null}
                        </td>
                        <td className="bp-dim">{doc}</td>
                        <td className="bp-mono pl-4">☐</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </BpSection>
            <BpSection n="06" title="Declaration by the bidder">
              <div className="bp-box mt-2 text-[8.5pt]">
                <p>
                  We declare that the indigenous content stated in this document, {res.score}% by cost, is calculated from the costs and vendor declarations listed in sections 03
                  and 05, and that each declaration will be produced on request.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-5">
                  {["Tender or scheme reference", "Company", "Name", "Designation", "Signature", "Date"].map((l) => (
                    <p key={l} className="border-b border-current pb-1">
                      <span className="bp-faint text-[7pt] uppercase tracking-wide">{l}</span>
                    </p>
                  ))}
                </div>
              </div>
            </BpSection>
            <p className="bp-faint mt-6 text-[7pt]">
              Timule supplies the origin dossier and batch test record for every Timule part on this sheet. Timule does not certify indigenous content: the bidder declares it,
              and the buying authority decides.
            </p>
            <p className="bp-faint mt-2 text-[7pt]">
              Calculated at {host}/tools/content. Method: the Indian share of each line&apos;s cost over the total cost, as in the cost-based approach of DAP 2020. A planning estimate,
              not a certificate: the tender or scheme document sets the exact rule, and the buyer&apos;s auditor decides.
            </p>
          </>
        ) : null}
      </BlueprintSheet>
    </BlueprintDocument>
  );
}
