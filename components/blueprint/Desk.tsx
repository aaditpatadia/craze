"use client";

import { useEffect, useState } from "react";
import { DocSheet } from "./DocSheet";
import { BpToolbar } from "./Toolbar";
import { makeReference } from "@/lib/codes";
import { DOC_KIND, DEFAULT_TERMS, HSN_SUGGEST, decodeDraft, emptyDraft, encodeDraft, type DocDraft, type DocKind, type DocLine } from "@/lib/documents";

export type DeskPart = { code: string; name: string; cat: string };

const STORE = "timule.desk.v1";
const KINDS = Object.keys(DOC_KIND) as DocKind[];

function readQuoteList(): { code: string; name: string; quantity: number }[] {
  try {
    const raw = localStorage.getItem("timule.quote.v1");
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/**
 * The Timule desk: make a quotation, a purchase order to a supplier or an invoice,
 * see it on the blueprint as you type, and download it. The whole document is kept
 * in the page link, so the link is the file: copy it to reopen or share it.
 */
export function Desk({ parts, suppliers }: { parts: DeskPart[]; suppliers: string[] }) {
  const [draft, setDraft] = useState<DocDraft | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fromHash = window.location.hash.startsWith("#d=") ? decodeDraft(window.location.hash.slice(3)) : null;
    let stored: DocDraft | null = null;
    try {
      const raw = localStorage.getItem(STORE);
      stored = raw ? decodeDraft(raw) : null;
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore once after mount
    setDraft(fromHash ?? stored ?? emptyDraft("quotation", makeReference("TMO")));
  }, []);

  useEffect(() => {
    if (!draft) return;
    const enc = encodeDraft(draft);
    window.history.replaceState(null, "", `#d=${enc}`);
    try {
      localStorage.setItem(STORE, enc);
    } catch {}
  }, [draft]);

  if (!draft) return <div className="bp-root min-h-dvh" data-variant="blueprint" />;

  const set = (patch: Partial<DocDraft>) => setDraft({ ...draft, ...patch });
  const setParty = (patch: Partial<DocDraft["party"]>) => set({ party: { ...draft.party, ...patch } });
  const setLine = (i: number, patch: Partial<DocLine>) => set({ lines: draft.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
  const lineFor = (code: string, qty = 1): DocLine => {
    const p = parts.find((x) => x.code === code);
    return { code, description: p?.name ?? "", hsn: p ? (HSN_SUGGEST[p.cat] ?? "") : "", qty, unit: "nos", rate: 0, gst: 18 };
  };

  const switchKind = (kind: DocKind) => {
    const keepTerms = draft.terms === DEFAULT_TERMS[draft.kind];
    set({ kind, number: makeReference(DOC_KIND[kind].prefix), terms: keepTerms ? DEFAULT_TERMS[kind] : draft.terms });
  };
  const fresh = () => setDraft(emptyDraft(draft.kind, makeReference(DOC_KIND[draft.kind].prefix)));
  const fromQuote = () => {
    const q = readQuoteList();
    if (q.length) set({ lines: [...draft.lines, ...q.map((l) => lineFor(l.code, l.quantity))] });
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const label = "bp-label mb-1";
  const fileName = `${draft.number} Timule ${DOC_KIND[draft.kind].label.toLowerCase()}`;

  return (
    <div className="bp-root" data-variant="blueprint">
      <BpToolbar back={{ href: "/", label: "Timule desk" }} fileName={fileName}>
        <button type="button" className="bp-btn" onClick={copyLink}>
          {copied ? "Link copied" : "Copy link"}
        </button>
      </BpToolbar>
      <div className="mx-auto flex max-w-[1500px] flex-col gap-2 xl:flex-row xl:items-start">
        <form className="bp-screen-only w-full shrink-0 space-y-5 px-4 py-6 text-sm xl:sticky xl:top-[60px] xl:max-h-[calc(100dvh-60px)] xl:w-[440px] xl:overflow-y-auto" onSubmit={(e) => e.preventDefault()}>
          <p className="bp-dim text-xs">
            Internal. Not linked from the site. The document lives in this page&apos;s link: copy it to keep or share the document.
          </p>
          <div className="grid grid-cols-3 gap-1" role="group" aria-label="Document type">
            {KINDS.map((k) => (
              <button key={k} type="button" aria-pressed={draft.kind === k} onClick={() => switchKind(k)} className={draft.kind === k ? "bp-btn bp-btn-primary justify-center" : "bp-btn justify-center"}>
                {DOC_KIND[k].label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 block">
              <span className={label}>Number</span>
              <span className="flex gap-2">
                <input className="bp-input bp-mono" value={draft.number} onChange={(e) => set({ number: e.target.value })} />
                <button type="button" className="bp-btn" onClick={() => set({ number: makeReference(DOC_KIND[draft.kind].prefix) })}>
                  New
                </button>
              </span>
            </label>
            <label className="block">
              <span className={label}>Date</span>
              <input type="date" className="bp-input" value={draft.date} onChange={(e) => set({ date: e.target.value })} />
            </label>
            <label className="block">
              <span className={label}>{DOC_KIND[draft.kind].due}</span>
              <input type="date" className="bp-input" value={draft.due} onChange={(e) => set({ due: e.target.value })} />
            </label>
            <label className="col-span-2 block">
              <span className={label}>{draft.kind === "purchase-order" ? "Buyer order this serves (TMQ or their PO)" : "Reference (their PO or our TMQ)"}</span>
              <input className="bp-input bp-mono" value={draft.reference} onChange={(e) => set({ reference: e.target.value })} />
            </label>
          </div>

          <fieldset className="space-y-3">
            <legend className="bp-label mb-2">{DOC_KIND[draft.kind].party}</legend>
            {draft.kind === "purchase-order" ? (
              <label className="block">
                <span className={label}>Supplier code</span>
                <select className="bp-input bp-mono" value={draft.supplierCode} onChange={(e) => set({ supplierCode: e.target.value })}>
                  <option value="">Choose</option>
                  {suppliers.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <input className="bp-input" placeholder="Company name" value={draft.party.name} onChange={(e) => setParty({ name: e.target.value })} />
            <textarea className="bp-input" rows={2} placeholder="Address" value={draft.party.address} onChange={(e) => setParty({ address: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="bp-input bp-mono" placeholder="GSTIN" value={draft.party.gstin} onChange={(e) => setParty({ gstin: e.target.value.toUpperCase() })} />
              <input className="bp-input" placeholder="State" value={draft.party.state} onChange={(e) => setParty({ state: e.target.value })} />
            </div>
            <input className="bp-input" placeholder="Contact: name, email, phone" value={draft.party.contact} onChange={(e) => setParty({ contact: e.target.value })} />
            <textarea className="bp-input" rows={2} placeholder={draft.kind === "purchase-order" ? "Deliver to (optional)" : "Ship to, if different (optional)"} value={draft.shipTo} onChange={(e) => set({ shipTo: e.target.value })} />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="bp-label mb-2">Lines</legend>
            {draft.lines.map((l, i) => (
              <div key={i} className="space-y-2 rounded-lg p-3" style={{ border: "1px solid var(--bp-rule)" }}>
                <div className="flex gap-2">
                  <select
                    aria-label={`Line ${i + 1} TM code`}
                    className="bp-input bp-mono"
                    value={l.code}
                    onChange={(e) => setLine(i, { ...lineFor(e.target.value, l.qty), rate: l.rate, gst: l.gst, unit: l.unit })}
                  >
                    <option value="">Custom line</option>
                    {parts.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.code}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="bp-btn" aria-label={`Remove line ${i + 1}`} onClick={() => set({ lines: draft.lines.filter((_, j) => j !== i) })}>
                    Remove
                  </button>
                </div>
                <input aria-label="Description" className="bp-input" value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} placeholder="Description" />
                <div className="grid grid-cols-5 gap-2">
                  <input aria-label="Quantity" className="bp-input" type="number" min={0} value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} />
                  <input aria-label="Unit" className="bp-input" value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value })} />
                  <input aria-label="Rate in rupees" className="bp-input" type="number" min={0} step="0.01" value={l.rate} onChange={(e) => setLine(i, { rate: Number(e.target.value) })} />
                  <input aria-label="HSN" className="bp-input bp-mono" value={l.hsn} onChange={(e) => setLine(i, { hsn: e.target.value })} />
                  <select aria-label="GST rate" className="bp-input" value={l.gst} onChange={(e) => setLine(i, { gst: Number(e.target.value) })}>
                    {[0, 5, 12, 18, 28].map((g) => (
                      <option key={g} value={g}>
                        {g}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="bp-btn" onClick={() => set({ lines: [...draft.lines, lineFor(parts[0]?.code ?? "")] })}>
                Add line
              </button>
              <button type="button" className="bp-btn" onClick={fromQuote}>
                Add from quote list
              </button>
            </div>
            <p className="bp-faint text-xs">Quantity, unit, rate in rupees, HSN, GST. HSN codes are suggestions: confirm them with your accountant.</p>
          </fieldset>

          <label className="block">
            <span className={label}>Terms, one per line</span>
            <textarea className="bp-input" rows={6} value={draft.terms} onChange={(e) => set({ terms: e.target.value })} />
          </label>
          <label className="block">
            <span className={label}>Notes</span>
            <textarea className="bp-input" rows={2} value={draft.notes} onChange={(e) => set({ notes: e.target.value })} />
          </label>
          <button type="button" className="bp-btn" onClick={fresh}>
            Start a new {DOC_KIND[draft.kind].label.toLowerCase()}
          </button>
        </form>
        <div className="min-w-0 flex-1">
          <DocSheet draft={draft} />
        </div>
      </div>
    </div>
  );
}
