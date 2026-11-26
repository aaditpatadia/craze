import { BlueprintSheet, BpField, BpSection } from "./Sheet";
import { COMPANY, SITE } from "@/lib/config";
import { DOC_KIND, computeTotals, docTitle, lineAmount, money, rupeesInWords, type DocDraft } from "@/lib/documents";
import { formatDate } from "@/lib/format";

const d8 = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? formatDate(iso) : iso || "Not set");

/** A quotation, purchase order or invoice drawn on a Timule blueprint sheet. */
export function DocSheet({ draft }: { draft: DocDraft }) {
  const k = DOC_KIND[draft.kind];
  const t = computeTotals(draft);
  const title = docTitle(draft);
  const isPo = draft.kind === "purchase-order";
  const estimate = !COMPANY.gstin && !isPo;
  const partyName = draft.party.name || "Name not set";
  const heading = isPo ? `${title} to ${draft.supplierCode || partyName}` : `${title} for ${partyName}`;

  return (
    <BlueprintSheet
      kind={`${title} · ${k.prefix}`}
      title={heading}
      number={draft.number}
      status={draft.kind === "invoice" && !COMPANY.gstin ? "Proforma" : null}
      fields={[
        { label: "Document", value: title },
        { label: "Number", value: draft.number, mono: true },
        { label: "Revision", value: "A", mono: true },
        { label: "Date", value: d8(draft.date) },
        { label: k.due, value: d8(draft.due) },
        { label: "Reference", value: draft.reference || "None", mono: true },
        { label: isPo ? "Supplier code" : "Currency", value: isPo ? draft.supplierCode || "Not set" : "INR", mono: isPo },
        { label: "Lines", value: String(draft.lines.length) },
        { label: "Issued by", value: "Timule" },
      ]}
    >
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="bp-box">
          <span className="bp-label">From</span>
          <p className="mt-1 font-semibold">{COMPANY.legalName}</p>
          <p className="bp-dim mt-0.5 whitespace-pre-line">{COMPANY.address.length ? COMPANY.address.join("\n") : "Registered address shared on request"}</p>
          <p className="bp-dim mt-1">
            GSTIN: <span className="bp-mono">{COMPANY.gstin ?? "registration in progress"}</span>
            {COMPANY.state ? <> · State: {COMPANY.state}</> : null}
          </p>
          <p className="bp-dim">{SITE.contactEmail}{COMPANY.phone ? ` · ${COMPANY.phone}` : ""}</p>
        </div>
        <div className="bp-box">
          <span className="bp-label">{k.party}</span>
          <p className="mt-1 font-semibold">
            {partyName}
            {isPo && draft.supplierCode ? <span className="bp-mono bp-accent"> {draft.supplierCode}</span> : null}
          </p>
          {draft.party.address ? <p className="bp-dim mt-0.5 whitespace-pre-line">{draft.party.address}</p> : null}
          {draft.party.gstin || draft.party.state ? (
            <p className="bp-dim mt-1">
              {draft.party.gstin ? <>GSTIN: <span className="bp-mono">{draft.party.gstin}</span></> : null}
              {draft.party.gstin && draft.party.state ? " · " : null}
              {draft.party.state ? <>State: {draft.party.state}</> : null}
            </p>
          ) : null}
          {draft.party.contact ? <p className="bp-dim">{draft.party.contact}</p> : null}
        </div>
      </div>
      {draft.shipTo ? (
        <div className="bp-box mt-4">
          <span className="bp-label">{isPo ? "Deliver to" : "Ship to"}</span>
          <p className="bp-dim mt-1 whitespace-pre-line">{draft.shipTo}</p>
        </div>
      ) : null}

      <BpSection n="01" title={isPo ? "Parts ordered" : "Parts"}>
        <table className="bp-table">
          <thead>
            <tr>
              <th>#</th>
              <th>TM code</th>
              <th>Description</th>
              <th>HSN</th>
              <th className="num">Qty</th>
              <th className="num">Rate</th>
              <th className="num">GST</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {draft.lines.length ? (
              draft.lines.map((l, i) => (
                <tr key={`${l.code}-${i}`}>
                  <td className="bp-faint bp-mono">{String(i + 1).padStart(2, "0")}</td>
                  <td className="bp-mono whitespace-nowrap font-semibold">{l.code || "None"}</td>
                  <td>{l.description}</td>
                  <td className="bp-mono">{l.hsn}</td>
                  <td className="num">
                    {l.qty} <span className="bp-faint">{l.unit}</span>
                  </td>
                  <td className="num">{money(Number(l.rate) || 0)}</td>
                  <td className="num">{l.gst}%</td>
                  <td className="num">{money(lineAmount(l))}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="bp-faint">
                  No lines yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
          <p className="bp-dim self-end">
            <span className="bp-label">Amount in words</span>
            <span className="bp-value">{rupeesInWords(t.total)}</span>
          </p>
          <table className="bp-table" style={{ width: "auto", minWidth: "62mm", marginTop: 0 }}>
            <tbody>
              <tr>
                <td>Taxable value</td>
                <td className="num">{money(t.subtotal)}</td>
              </tr>
              {t.mode === "intra" ? (
                <>
                  <tr>
                    <td>CGST{estimate ? " (estimate)" : ""}</td>
                    <td className="num">{money(t.cgst)}</td>
                  </tr>
                  <tr>
                    <td>SGST{estimate ? " (estimate)" : ""}</td>
                    <td className="num">{money(t.sgst)}</td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td>{t.mode === "inter" ? "IGST" : "GST"}{estimate ? " (estimate)" : ""}</td>
                  <td className="num">{money(t.tax)}</td>
                </tr>
              )}
              {t.roundOff ? (
                <tr>
                  <td>Round off</td>
                  <td className="num">{money(t.roundOff)}</td>
                </tr>
              ) : null}
              <tr>
                <td className="font-semibold" style={{ borderBottom: 0, borderTop: "0.3mm solid var(--bp-line)" }}>
                  Total INR
                </td>
                <td className="num font-semibold" style={{ borderBottom: 0, borderTop: "0.3mm solid var(--bp-line)" }}>
                  {money(t.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {estimate ? (
          <p className="bp-faint mt-3 text-[7.5pt]">
            GST shown is an estimate. Timule&apos;s GST registration is in progress, so this is not a tax invoice and no GST is charged on it.
          </p>
        ) : null}
      </BpSection>

      <div className="mt-2 grid grid-cols-1 gap-x-8 sm:grid-cols-[1.4fr_1fr]">
        <BpSection n="02" title="Terms">
          <ul className="bp-list bp-dim mt-1">
            {draft.terms
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
              .map((s) => (
                <li key={s}>{s}</li>
              ))}
          </ul>
          {draft.notes ? <p className="bp-dim mt-3 whitespace-pre-line">{draft.notes}</p> : null}
        </BpSection>
        <BpSection n="03" title={isPo ? "Acceptance" : "Payment"}>
          {isPo ? (
            <p className="bp-dim mt-2">
              Each TM code has a build sheet at {SITE.url.replace(/^https?:\/\//, "")}/sheets. The sheet lists the values, acceptance bands, documents and marking this order refers to.
            </p>
          ) : COMPANY.bank ? (
            <div className="bp-fields mt-2">
              <BpField label="Account name">{COMPANY.bank.name}</BpField>
              <BpField label="Account number" mono>{COMPANY.bank.account}</BpField>
              <BpField label="IFSC" mono>{COMPANY.bank.ifsc}</BpField>
              <BpField label="Branch">{COMPANY.bank.branch}</BpField>
            </div>
          ) : (
            <p className="bp-dim mt-2">Bank details are sent separately by email from {SITE.contactEmail}. Check them by phone before paying.</p>
          )}
          <div className="mt-8 border-t pt-2" style={{ borderColor: "var(--bp-faint)" }}>
            <span className="bp-label">For Timule</span>
            <span className="bp-value bp-dim">Authorised signatory</span>
          </div>
        </BpSection>
      </div>
    </BlueprintSheet>
  );
}
