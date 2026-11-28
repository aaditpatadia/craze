import type { Metadata } from "next";
import Link from "next/link";
import { BatchTesting } from "@/components/catalog/BatchTesting";
import { LinkButton } from "@/components/ui/Button";
import { TierGlyph } from "@/components/ui/Icon";
import { Container, PageHeader, SectionHeading } from "@/components/ui/Layout";
import { TIER_LABEL } from "@/lib/format";
import { evidenceStats, getChecks } from "@/lib/metrics";
import { checkLabel } from "@/lib/pipeline";

export const metadata: Metadata = {
  title: "Evidence status and verification log",
  description:
    "Live evidence status for every Timule part: how many are documented, measured or lab tested, every check we log, and every batch test result. Counted from real records, never estimated.",
  alternates: { canonical: "/evidence" },
};
export const revalidate = 60;

/** The first parts we take to Tier 2. Shown while the log is short, so the plan is public too. */
const FIRST = ["TM-MOT-2807-1300-A", "TM-MOT-4114-400-A", "TM-MOT-6215-170-A"];

const fmtDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function EvidencePage() {
  const checks = await getChecks();
  const s = evidenceStats(checks);
  const pct = (n: number) => (s.parts ? Math.round((n / s.parts) * 100) : 0);
  const tiles = [
    { k: "Parts listed", v: String(s.parts), sub: `${s.partsChecked} with logged checks` },
    { k: "Checks logged", v: String(s.checks), sub: s.lastCheck ? `Latest ${fmtDate(s.lastCheck)}` : "Log starts with our first samples" },
    { k: "Samples measured, 30 days", v: String(s.samples30), sub: "Physical samples in our hands" },
    { k: "Batches tested", v: String(s.batches), sub: `${s.failures} checks failed and were rejected` },
    { k: "Lab reports filed", v: String(s.labReports), sub: "Outside, named labs" },
    { k: "Days to measured", v: s.medianDaysToSample === null ? "–" : String(s.medianDaysToSample), sub: "Median, documents to sample measured" },
  ];
  const firstParts = s.perPart.filter((p) => FIRST.includes(p.code));

  return (
    <>
      <PageHeader
        eyebrow={<span className="code-text text-accent">LIVE · UPDATED EVERY MINUTE</span>}
        title="Evidence status"
        lead="How much of the catalogue we have proved, and every check behind it. Each number is counted from the records below. When a part has not been checked, it says so."
      >
        <LinkButton href="/methodology" variant="secondary">
          How we check
        </LinkButton>
      </PageHeader>

      <Container className="pb-16">
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          {tiles.map((t) => (
            <li key={t.k} className="rounded-xl border border-line p-5">
              <p className="text-xs text-fg-subtle">{t.k}</p>
              <p className="tabular mt-2 text-3xl font-semibold tracking-tight">{t.v}</p>
              <p className="mt-1 text-xs text-fg-muted">{t.sub}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-xl border border-line p-6">
          <h2 className="font-semibold">Parts by highest evidence tier</h2>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-bg-subtle" role="img" aria-label={`Tier 3: ${s.byTier[3]}, Tier 2: ${s.byTier[2]}, Tier 1: ${s.byTier[1]}, not yet verified: ${s.byTier[0]}`}>
            {([3, 2, 1] as const).map((t) =>
              s.byTier[t] ? <span key={t} className="h-full bg-accent" style={{ width: `${pct(s.byTier[t])}%`, opacity: t === 3 ? 1 : t === 2 ? 0.7 : 0.4 }} /> : null,
            )}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {([3, 2, 1, 0] as const).map((t) => (
              <li key={t} className="flex items-center gap-2">
                <TierGlyph tier={t} size={14} />
                <span>
                  {t ? `Tier ${t}` : "Not yet verified"} <span className="tabular text-fg-subtle">{s.byTier[t]} ({pct(s.byTier[t])}%)</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <section className="border-t border-line py-16" aria-labelledby="first">
        <Container>
          <SectionHeading
            id="first"
            title="First to Tier 2: our three core motors"
            lead="Our three core drone motors are the first parts we take from documents to measured samples, with photos, measurement sheets and origin declarations."
          />
          <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {firstParts.map((p) => (
              <li key={p.code}>
                <Link href={`/parts/${p.id}`} className="flex h-full flex-col rounded-xl border border-line p-5 hover:border-line-strong">
                  <span className="code-text text-sm">{p.code}</span>
                  <span className="mt-1 text-sm text-fg-muted">{p.name}</span>
                  <span className="mt-4 flex items-center gap-2 text-sm">
                    <TierGlyph tier={p.tier as 0 | 1 | 2 | 3} size={14} /> {p.tier ? TIER_LABEL[p.tier as 1 | 2 | 3] : "Not yet measured"}
                  </span>
                  <span className="mt-1 text-xs text-fg-subtle">{p.checks ? `${p.checks} ${p.checks === 1 ? "check" : "checks"} logged` : "No checks logged yet"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section id="log" className="scroll-mt-20 border-t border-line py-16" aria-labelledby="log-title">
        <Container>
          <SectionHeading
            id="log-title"
            title="Verification log"
            lead="Every check we record, newest first: what was checked, the measurements, the result and who checked. Makers appear by TMS supplier code only."
          />
          {checks.length ? (
            <ol className="mt-8 divide-y divide-line border-y border-line">
              {checks.slice(0, 100).map((c) => (
                <li key={c.id} className="grid grid-cols-1 gap-3 py-5 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <p className="code-text break-all text-sm">{c.code}</p>
                    <p className="mt-1 text-xs text-fg-subtle">
                      {fmtDate(c.date)} · by {c.by}
                    </p>
                  </div>
                  <div className="md:col-span-7">
                    <p className="text-sm font-medium">
                      {checkLabel(c.kind)}
                      {c.batch ? <span className="font-normal text-fg-muted"> · batch {c.batch}</span> : null}
                      {c.units ? <span className="font-normal text-fg-muted"> · {c.units} units</span> : null}
                      {c.supplier ? <span className="code-text font-normal text-fg-subtle"> · {c.supplier}</span> : null}
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-fg-muted">
                      {c.lines.map((l, i) => (
                        <li key={i} className="break-words">
                          {l}
                        </li>
                      ))}
                    </ul>
                    {c.notes ? <p className="mt-2 text-sm text-fg-subtle">{c.notes}</p> : null}
                  </div>
                  <div className="md:col-span-2 md:text-right">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${c.result === "pass" ? "border-accent text-accent" : c.result === "fail" ? "border-danger text-danger" : "border-line text-fg-muted"}`}
                    >
                      {c.result === "pass" ? "Pass" : c.result === "fail" ? "Fail, rejected" : "Recorded"}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-line p-8 text-fg-muted">
              <p className="font-medium text-fg">No checks logged yet.</p>
              <p className="mt-2 max-w-2xl text-sm">
                The log opens with our first samples of the three core motors above. Every check is posted here the day it is done, including the ones that fail.
              </p>
            </div>
          )}
        </Container>
      </section>

      <BatchTesting />
    </>
  );
}
