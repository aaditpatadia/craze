"use client";

import { useEffect, useState } from "react";
import { BlueprintDocument, BlueprintSheet, BpSection } from "./Sheet";
import { BpToolbar } from "./Toolbar";
import { BOM_REPORT_KEY, type BomMatch } from "@/lib/bom";
import { SITE } from "@/lib/config";
import { TIER_LABEL, originLabel } from "@/lib/format";
import { useQuote } from "@/lib/quote";

const today = () => new Date().toISOString().slice(0, 10);
const stamp = () => today().slice(2).replace(/-/g, "");
const host = SITE.url.replace(/^https?:\/\//, "");

function useMounted() {
  const [m, setM] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- render client-only content after mount
  useEffect(() => setM(true), []);
  return m;
}

/** The buyer's quote list as a Timule request-for-quotation sheet. */
export function QuotePrint() {
  const quote = useQuote();
  const mounted = useMounted();
  const number = `TM-RFQ-${stamp()}`;
  const units = quote.lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <BlueprintDocument toolbar={<BpToolbar back={{ href: "/quote", label: "Quote list" }} fileName={`${number} Timule parts list`} />}>
      <BlueprintSheet
        kind="Request for quotation"
        title="Parts list for quotation"
        number={number}
        fields={[
          { label: "Document", value: "Parts list" },
          { label: "Lines", value: mounted ? String(quote.lines.length) : "" },
          { label: "Units", value: mounted ? String(units) : "" },
          { label: "Prepared", value: today() },
          { label: "Prices", value: "On quotation" },
          { label: "Currency", value: "INR" },
          { label: "Send to", value: SITE.contactEmail },
          { label: "Status", value: "Draft" },
          { label: "Issued by", value: "Timule" },
        ]}
      >
        <p className="bp-dim mt-3 max-w-[160mm]">
          Parts selected on {host}. Send this list with your request, or forward it inside your company. Timule replies with a quotation under a TMQ reference, quoting
          each TM code below.
        </p>
        <BpSection n="01" title="Parts">
          <table className="bp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>TM code</th>
                <th>Part</th>
                <th className="num">Quantity</th>
                <th>Build sheet</th>
              </tr>
            </thead>
            <tbody>
              {mounted && quote.lines.length ? (
                quote.lines.map((l, i) => (
                  <tr key={l.code}>
                    <td className="bp-mono bp-faint">{String(i + 1).padStart(2, "0")}</td>
                    <td className="bp-mono whitespace-nowrap font-semibold">{l.code}</td>
                    <td>{l.name}</td>
                    <td className="num">{l.quantity}</td>
                    <td className="bp-dim">
                      {host}/sheets/{l.id}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="bp-faint">
                    {mounted ? "The quote list is empty. Add parts from any part page." : ""}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </BpSection>
        <BpSection n="02" title="For your purchase order">
          <ul className="bp-list bp-dim mt-1">
            <li>Order by the TM code, including the revision letter. It is the same code on our quotation, your purchase order, the label and the invoice.</li>
            <li>Each code is built to its Timule build sheet, which lists the values, acceptance bands and documents supplied.</li>
            <li>You buy from Timule. We answer for the part whichever qualified maker builds it.</li>
          </ul>
        </BpSection>
      </BlueprintSheet>
    </BlueprintDocument>
  );
}

/** BOM checker results as a Timule blueprint report. */
export function BomReport() {
  const mounted = useMounted();
  const [matches, setMatches] = useState<BomMatch[] | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BOM_REPORT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read the hand-off once after mount
      setMatches(raw ? (JSON.parse(raw) as BomMatch[]) : []);
    } catch {
      setMatches([]);
    }
  }, []);
  const rows = matches ?? [];
  const matched = rows.filter((m) => m.item).length;
  const number = `TM-BOM-${stamp()}`;

  return (
    <BlueprintDocument toolbar={<BpToolbar back={{ href: "/bom", label: "BOM checker" }} fileName={`${number} Timule BOM check`} />}>
      <BlueprintSheet
        kind="BOM check"
        title="Bill of materials check"
        number={number}
        fields={[
          { label: "Document", value: "BOM check" },
          { label: "Rows", value: mounted ? String(rows.length) : "" },
          { label: "Matched", value: mounted ? String(matched) : "" },
          { label: "Checked", value: today() },
          { label: "Open rows", value: mounted ? String(rows.length - matched) : "" },
          { label: "Status", value: "Suggestions" },
          { label: "Next step", value: "Request a quotation" },
          { label: "Contact", value: SITE.contactEmail },
          { label: "Issued by", value: "Timule" },
        ]}
      >
        <p className="bp-dim mt-3 max-w-[160mm]">
          Your rows matched against the Timule catalogue. A match is a suggestion until it is confirmed on a Timule quotation. Open rows can still be sourced to a build
          sheet: send them with your request.
        </p>
        <BpSection n="01" title="Results">
          <table className="bp-table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Your part</th>
                <th className="num">Qty</th>
                <th>TM code</th>
                <th>Match</th>
                <th>Supplier</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {mounted && rows.length ? (
                rows.map((m) => (
                  <tr key={m.row.line}>
                    <td className="bp-mono bp-faint">{m.row.line}</td>
                    <td>
                      {m.row.part}
                      {m.row.spec ? <span className="bp-faint"> · {m.row.spec}</span> : null}
                    </td>
                    <td className="num">{m.row.quantity ?? ""}</td>
                    <td className="bp-mono whitespace-nowrap font-semibold">{m.item?.code ?? <span className="bp-faint">Open</span>}</td>
                    <td className="bp-dim">{m.item ? `${m.confidence === "strong" ? "Strong" : "Possible"}: ${m.item.name}` : "No match yet"}</td>
                    <td className="bp-mono bp-dim">{m.item?.supplierCode ?? ""}</td>
                    <td className="bp-dim">{m.item ? `T${m.item.highestTier} ${TIER_LABEL[m.item.highestTier]}, ${originLabel(m.item.originCountry)}` : ""}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="bp-faint">
                    {mounted ? "No results to show. Run a check in the BOM checker first." : ""}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </BpSection>
      </BlueprintSheet>
    </BlueprintDocument>
  );
}
