import type { Metadata } from "next";
import { TierGlyph } from "@/components/ui/Icon";
import { Container, PageHeader, Prose } from "@/components/ui/Layout";
import { STALE_AFTER_MONTHS } from "@/lib/config";
import { ILLUSTRATIVE_DISCLAIMER } from "@/lib/constants";
import { TIER_LABEL } from "@/lib/format";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How we record evidence: three tiers, what each one checks and does not check, how origin is shown, and how 3D models are labelled.",
  alternates: { canonical: "/methodology" },
};

const tiers = [
  {
    tier: 1 as const,
    means: "We received documents from the supplier and read them against the part number we were sent.",
    includes: ["Datasheets and drawings", "Material certificates and supplier declarations", "Bills of materials for major components"],
    excludes: ["Whether the documents are true", "Whether the part matches them", "Any measurement of our own"],
  },
  {
    tier: 2 as const,
    means: "We held a physical sample and measured it. The record lists each measurement, its result and the method.",
    includes: ["Mass, dimensions and electrical values we can measure on a bench", "Component markings read under magnification", "Production steps seen on a factory visit"],
    excludes: ["Batch-to-batch spread, unless we measured several samples", "Behaviour under load, heat or time", "Chip authenticity beyond visible markings"],
  },
  {
    tier: 3 as const,
    means: "An outside lab tested the part. We name the lab, attach the report and repeat its stated conditions.",
    includes: ["Tests run by a named third-party lab", "The full report, attached"],
    excludes: ["Conditions the lab did not test", "Other samples or batches", "Use in your aircraft"],
  },
];

export default function MethodologyPage() {
  return (
    <>
      <PageHeader
        title="Methodology"
        lead="Every claim on this site carries an evidence tier, a date, who checked it, and a list of what was not checked. This page explains each part of that."
      />
      <Container className="pb-24">
        <ol className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {tiers.map((t) => (
            <li key={t.tier} className="rounded-xl border border-line p-6">
              <p className="flex items-center gap-2 text-sm text-fg-subtle">
                <TierGlyph tier={t.tier} size={16} /> Tier {t.tier}
              </p>
              <h2 className="mt-3 text-lg font-semibold">{TIER_LABEL[t.tier]}</h2>
              <p className="mt-2 text-sm text-fg-muted">{t.means}</p>
              <h3 className="mt-5 text-xs font-medium uppercase tracking-wide text-fg-subtle">Can cover</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg-muted">
                {t.includes.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <h3 className="mt-5 text-xs font-medium uppercase tracking-wide text-fg-subtle">Does not cover</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg-muted">
                {t.excludes.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <Prose className="mt-16">
          <h2>What every evidence record contains</h2>
          <ul>
            <li>
              <strong>The tier.</strong> One of the three above. Never a general badge.
            </li>
            <li>
              <strong>What was checked.</strong> Specific items, not a summary.
            </li>
            <li>
              <strong>What was not checked.</strong> Required. A record without stated limits fails our build and cannot be
              published.
            </li>
            <li>
              <strong>The date and who checked.</strong> Records older than {STALE_AFTER_MONTHS} months are marked as possibly
              out of date.
            </li>
            <li>
              <strong>Measurements and documents.</strong> Tier 2 records list each measurement and method. Tier 3 records attach
              the lab report.
            </li>
          </ul>

          <h2 id="batch" className="scroll-mt-24">Batch-to-batch testing</h2>
          <p>
            Evidence records describe a part. Batch testing is what happens to every order before it ships, so that each delivery is as good as the part we
            described:
          </p>
          <ul>
            <li>
              <strong>Every unit.</strong> The checks on the build sheet that apply to every unit, such as KV and phase resistance for a motor or a power-on and
              function test for an ESC, logged by serial number.
            </li>
            <li>
              <strong>Every batch.</strong> Samples from each batch are measured and compared with the previous batch, so drift between batches is caught
              before dispatch.
            </li>
            <li>
              <strong>Graded against the code.</strong> A part ships only if it falls inside every acceptance band on its TM code. Anything outside is rejected
              and returned to the maker, never sold as a lower grade.
            </li>
            <li>
              <strong>Recorded.</strong> The batch number, test results and origin declarations go with the delivery and are filed under the code.
            </li>
          </ul>

          <h2>Specs</h2>
          <p>
            Each spec value points at the evidence behind it. A value from a datasheet shows tier 1, even if we later measured
            something else on the same part. Where our measurement differs from the datasheet, we show both.
          </p>

          <h2>Origin</h2>
          <p>
            We show origin per part or material where we know it, with the tier of the evidence behind it. Two other values are
            shown just as plainly:
          </p>
          <ul>
            <li>
              <strong>Unknown</strong> means the supplier did not tell us and we have not traced it.
            </li>
            <li>
              <strong>Not yet verified</strong> means we have a lead or a statement but have not checked it.
            </li>
          </ul>
          <p>We never fill a gap with a likely or a flattering answer.</p>

          <h2>Material grades</h2>
          <p>
            We show a grade, such as a magnet grade or an alloy temper, only when the supplier documents it. Otherwise the page
            says &ldquo;Grade not stated&rdquo;.
          </p>

          <h2>3D models and photos</h2>
          <p>Every model carries a badge saying where it came from:</p>
          <ul>
            <li>
              <strong>Supplier CAD</strong>: converted from the supplier&rsquo;s own CAD files.
            </li>
            <li>
              <strong>Scanned sample</strong>: a turntable photo set or scan of the actual sample we inspected.
            </li>
            <li>
              <strong>Illustrative model</strong>: built by us to explain how the part works. It always carries the label
              &ldquo;{ILLUSTRATIVE_DISCLAIMER}&rdquo;.
            </li>
          </ul>
          <p>
            Photos on part pages are only of the sample we inspected, each with the date it was taken. We do not use supplier
            marketing images or stock photography.
          </p>

          <h2>Words we do not use</h2>
          <p>
            We do not describe parts as certified or compliant on our own authority, and we do not rank parts with superlatives.
            We describe what was checked, and stop there.
          </p>
        </Prose>
      </Container>
    </>
  );
}
