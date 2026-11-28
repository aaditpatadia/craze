import type { Metadata } from "next";
import Link from "next/link";
import { CheckForm, CaseRow } from "@/components/desk/Pipeline";
import { Container, PageHeader, SectionHeading } from "@/components/ui/Layout";
import { requireTeam } from "@/lib/auth-server";
import { TeamNav } from "@/components/team/TeamNav";
import { getProducts } from "@/lib/content";
import { evidenceStats, getCases, getChecks, traction } from "@/lib/metrics";

export const metadata: Metadata = { title: "Pipeline", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const me = await requireTeam("/desk/pipeline");
  const [all, checks] = await Promise.all([getCases(), getChecks()]);
  const complaints = all.filter((c) => c.kind === "complaint");
  const cases = all.filter((c) => c.kind !== "complaint");
  const t = traction(cases);
  const e = evidenceStats(checks);
  const codes = getProducts().map((p) => p.code.replace(/-A$/, ""));
  const tiles = [
    ["Sourcing requests", t.requests],
    ["Letters of intent", t.lois],
    ["Buyers", t.buyers],
    ["Units reserved", t.unitsReserved],
    ["Orders", t.ordered],
    ["Open complaints", complaints.filter((c) => !["resolved", "closed"].includes(c.status)).length],
    ["Checks logged", e.checks],
  ] as const;

  return (
    <>
      <TeamNav me={me} active="/desk/pipeline" />
      <PageHeader title="Pipeline" lead="Requests (TMQ), letters of intent (TMR) and customer complaints (TMC), the demand for each code, and the verification log. Every status and note you save shows on the buyer's tracking page." />
      <Container className="space-y-16 pb-24">
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
          {tiles.map(([k, v]) => (
            <li key={k} className="rounded-xl border border-line p-5">
              <p className="text-xs text-fg-subtle">{k}</p>
              <p className="tabular mt-2 text-3xl font-semibold">{v.toLocaleString("en-IN")}</p>
            </li>
          ))}
        </ul>

        <section aria-labelledby="complaints-title" id="complaints" className="scroll-mt-24">
          <SectionHeading id="complaints-title" title="Customer complaints" lead="Reply within one working day, within four hours for a safety risk or a stopped line. Work the cause through with the maker by TMC code; never share the buyer's name with them." />
          {complaints.length ? (
            <ul className="mt-6 space-y-4">
              {complaints.map((c) => (
                <CaseRow key={c.id} c={c} />
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-sm text-fg-muted">No complaints. Buyers report problems at /complaint.</p>
          )}
        </section>

        <section aria-labelledby="cases">
          <SectionHeading id="cases" title="Requests and letters of intent" lead="Move each one along. The buyer sees every status and note on their tracking page." />
          {cases.length ? (
            <ul className="mt-6 space-y-4">
              {cases.map((c) => (
                <CaseRow key={c.id} c={c} />
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-sm text-fg-muted">
              None yet. Requests from /request and letters of intent from /reserve appear here.
            </p>
          )}
        </section>

        <section aria-labelledby="demand">
          <SectionHeading id="demand" title="Demand by code" lead="Every code named in a request or letter of intent, most asked for first." />
          {t.demand.length ? (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="text-fg-subtle">
                  <tr className="border-b border-line">
                    <th className="py-2 font-medium">TM code</th>
                    <th className="py-2 text-right font-medium">Requests and LOIs</th>
                    <th className="py-2 text-right font-medium">Units</th>
                  </tr>
                </thead>
                <tbody>
                  {t.demand.map((d) => (
                    <tr key={d.code} className="border-b border-line">
                      <td className="code-text py-2">{d.code}</td>
                      <td className="tabular py-2 text-right">{d.cases}</td>
                      <td className="tabular py-2 text-right">{d.units ? d.units.toLocaleString("en-IN") : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-6 text-sm text-fg-muted">No codes requested yet.</p>
          )}
        </section>

        <section aria-labelledby="log" className="scroll-mt-24">
          <SectionHeading
            id="log"
            title="Log a check"
            lead="Every check you log is posted on the public evidence page straight away, and a passing sample or lab check raises the part's tier there. Use TMS codes, never maker names."
          />
          <CheckForm codes={codes} />
          <p className="mt-4 text-sm">
            <Link href="/evidence#log" className="text-accent hover:underline">
              See the public verification log
            </Link>
          </p>
        </section>
      </Container>
    </>
  );
}
