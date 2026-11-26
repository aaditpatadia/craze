"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { SAMPLE_BOM, matchRows, matchesToCsv, parseDelimited, toBomRows, type BomMatch, BOM_REPORT_KEY } from "@/lib/bom";
import type { CatalogItem } from "@/lib/content";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { OriginChip, SampleDataTag, TierChip } from "@/components/ui/Chips";
import { Icon } from "@/components/ui/Icon";

const MAX_BYTES = 512 * 1024;
const MAX_ROWS = 500;
export const BOM_HANDOFF_KEY = "assay-bom-request";

export function BomChecker({ catalog, siteUrl }: { catalog: CatalogItem[]; siteUrl: string }) {
  const ids = useId();
  const router = useRouter();
  const [text, setText] = useState("");
  const [matches, setMatches] = useState<BomMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const results = useRef<HTMLHeadingElement>(null);

  const run = (source: string, via: "paste" | "file" | "sample") => {
    setError(null);
    const rows = toBomRows(parseDelimited(source));
    if (rows.length === 0) {
      setMatches(null);
      setError("We could not find any rows. Put one part per line: part, quantity, spec.");
      return;
    }
    if (rows.length > MAX_ROWS) {
      setMatches(null);
      setError(`That is ${rows.length} rows. The checker takes up to ${MAX_ROWS}; split the file or send it as a request.`);
      return;
    }
    const m = matchRows(rows, catalog);
    setMatches(m);
    track("BOM uploaded", { rows: rows.length, matched: m.filter((x) => x.item).length, via });
    requestAnimationFrame(() => results.current?.focus());
  };

  const readFile = async (file: File) => {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("That file is over 512 KB. Export only the part, quantity and spec columns as CSV.");
      return;
    }
    if (!/\.(csv|tsv|txt)$/i.test(file.name) && !/text|csv/.test(file.type)) {
      setError("Please upload a CSV, TSV or plain text file. Spreadsheets can be saved as CSV.");
      return;
    }
    const content = await file.text();
    setFileName(file.name);
    setText(content);
    run(content, "file");
  };

  const download = () => {
    if (!matches) return;
    const blob = new Blob([matchesToCsv(matches, siteUrl)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Timule BOM check ${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openReport = () => {
    if (!matches) return;
    try {
      sessionStorage.setItem(BOM_REPORT_KEY, JSON.stringify(matches));
    } catch {
      return;
    }
    router.push("/bom/report");
  };

  const sendAsRequest = () => {
    if (!matches) return;
    const lines = matches.map((m) => `${m.row.part}${m.row.quantity ? `, qty ${m.row.quantity}` : ""}${m.row.spec ? `, ${m.row.spec}` : ""}${m.item ? ` (catalogue: ${m.item.name})` : " (no match yet)"}`);
    try {
      sessionStorage.setItem(BOM_HANDOFF_KEY, lines.join("\n"));
    } catch {
      // If storage is blocked the request form simply starts empty.
    }
    router.push("/request?from=bom");
  };

  const matched = matches?.filter((m) => m.item).length ?? 0;

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <label htmlFor={`${ids}-paste`} className="text-sm font-medium">
            Paste rows
          </label>
          <p id={`${ids}-paste-help`} className="mt-1 text-sm text-fg-subtle">
            One part per line: part, quantity, spec. Comma, tab or semicolon separated. A header row is optional.
          </p>
          <textarea
            id={`${ids}-paste`}
            aria-describedby={`${ids}-paste-help`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={9}
            spellCheck={false}
            placeholder={"2807 1300KV motor, 8, 6S\n45A ESC, 8, DShot600"}
            className="mt-3 w-full rounded-lg border border-line bg-bg-elev p-3 font-mono text-sm text-fg placeholder:text-fg-subtle"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <Button onClick={() => run(text, "paste")} disabled={!text.trim()}>
              Check rows
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setText(SAMPLE_BOM);
                setFileName(null);
                run(SAMPLE_BOM, "sample");
              }}
            >
              Try a sample BOM
            </Button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium" id={`${ids}-upload-label`}>
            Or upload a CSV
          </p>
          <p className="mt-1 text-sm text-fg-subtle">Up to 512 KB and {MAX_ROWS} rows. Checked in your browser; nothing is uploaded to us.</p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) void readFile(f);
            }}
            className={cn(
              "mt-3 flex h-[calc(100%-4.25rem)] min-h-48 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center transition-colors duration-200",
              dragging ? "border-accent bg-accent-soft" : "border-line-strong",
            )}
          >
            <Icon name="upload" size={24} className="text-fg-subtle" />
            <p className="mt-3 text-sm text-fg-muted">{fileName ? `Loaded ${fileName}` : "Drop a CSV file here"}</p>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/plain"
              className="sr-only"
              aria-labelledby={`${ids}-upload-label`}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void readFile(f);
                e.target.value = "";
              }}
            />
            <Button variant="secondary" className="mt-4" onClick={() => fileInput.current?.click()}>
              Choose file
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/40 p-4 text-sm text-fg">
          <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-danger" />
          {error}
        </p>
      ) : null}

      {matches ? (
        <section aria-labelledby={`${ids}-results`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id={`${ids}-results`} ref={results} tabIndex={-1} className="text-xl font-semibold tracking-tight outline-none">
                {matched} of {matches.length} rows matched
              </h2>
              <p className="mt-1 text-sm text-fg-subtle">
                Matching uses part names, codes and specs. Check every match; a possible match is a suggestion, not a confirmation.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={openReport}>
                <Icon name="printer" size={16} /> Blueprint report (PDF)
              </Button>
              <Button variant="secondary" onClick={download}>
                <Icon name="download" size={16} /> Export CSV
              </Button>
              <Button onClick={sendAsRequest}>Send as a sourcing request</Button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[860px] text-left text-sm">
              <caption className="sr-only">BOM check results</caption>
              <thead className="bg-bg-subtle text-xs text-fg-subtle">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Your row
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Qty
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Matched part
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Origin
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Evidence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {matches.map((m) => (
                  <tr key={m.row.line} className="align-top">
                    <th scope="row" className="px-4 py-4 font-normal">
                      <span className="block font-medium text-fg">{m.row.part}</span>
                      {m.row.spec ? <span className="block text-fg-subtle">{m.row.spec}</span> : null}
                      <span className="block text-xs text-fg-subtle">Line {m.row.line}</span>
                    </th>
                    <td className="tabular px-4 py-4">{m.row.quantity ?? <span className="text-fg-subtle">Not given</span>}</td>
                    {m.item ? (
                      <>
                        <td className="px-4 py-4">
                          <Link href={`/parts/${m.item.id}`} className="font-medium text-accent hover:underline">
                            {m.item.name}
                          </Link>
                          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-subtle">
                            {m.confidence === "strong" ? "Strong match" : "Possible match, please confirm"}
                            <span className="code-text">{m.item.supplierCode}</span>
                            <SampleDataTag show={m.item.placeholder} />
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <OriginChip country={m.item.originCountry} tier={m.item.originTier} />
                        </td>
                        <td className="px-4 py-4">
                          <TierChip tier={m.item.highestTier} />
                        </td>
                      </>
                    ) : (
                      <td colSpan={3} className="px-4 py-4">
                        <span className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 text-fg-muted">
                            <Icon name="minus" size={16} /> No match yet
                          </span>
                          <Link
                            href={`/request?part=${encodeURIComponent(m.row.part)}${m.row.quantity ? `&qty=${m.row.quantity}` : ""}`}
                            className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm hover:bg-bg-subtle"
                          >
                            Request manual sourcing
                          </Link>
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
