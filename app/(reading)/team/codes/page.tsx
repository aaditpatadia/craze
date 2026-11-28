import type { Metadata } from "next";
import Link from "next/link";
import { inputClass } from "@/components/forms/Field";
import { TeamNav } from "@/components/team/TeamNav";
import { Icon } from "@/components/ui/Icon";
import { Container, SectionHeading } from "@/components/ui/Layout";
import { requireTeam } from "@/lib/auth-server";
import { cn } from "@/lib/cn";
import { CODE_DIRECTORY, identifyCode } from "@/lib/codes";
import { getCategories, getProducts } from "@/lib/content";
import { getCases, getChecks } from "@/lib/metrics";
import { statusOf } from "@/lib/pipeline";
import { kindOf, reviewLabel, supplierStatusOf } from "@/lib/portal";
import { getAccounts, getSubmissions } from "@/lib/portal-server";

export const metadata: Metadata = { title: "Code directory", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Hit = { code: string; what: string; detail: string; href?: string };

async function lookup(q: string): Promise<Hit[]> {
  const Q = q.trim().toUpperCase();
  if (Q.length < 3) return [];
  const [cases, checks, accounts, subs] = await Promise.all([getCases(), getChecks(), getAccounts(), getSubmissions()]);
  const hits: Hit[] = [];
  for (const p of getProducts()) if (p.code.includes(Q)) hits.push({ code: p.code, what: "Part code", detail: p.name, href: `/parts/${p.id}` });
  for (const c of cases)
    if (c.ref.includes(Q) || c.items.some((i) => i.code.includes(Q)) || c.complaint?.batch?.toUpperCase().includes(Q) || c.complaint?.orderRef?.includes(Q))
      hits.push({
        code: c.ref,
        what: c.kind === "complaint" ? "Customer complaint" : c.kind === "loi" ? "Reservation (LOI)" : "Request",
        detail: `${c.contact.company} · ${statusOf(c.status).label}`,
        href: `/track/${c.id}`,
      });
  for (const a of accounts)
    if (a.code.includes(Q) || a.company.toUpperCase().includes(Q)) hits.push({ code: a.code, what: "Supplier", detail: `${a.company} · ${supplierStatusOf(a.status).label}`, href: `/team/suppliers/${a.id}` });
  for (const s of subs)
    if (s.ref.includes(Q) || s.partCode?.includes(Q) || s.fields.batch?.toUpperCase().includes(Q))
      hits.push({ code: s.ref, what: kindOf(s.kind)?.label ?? "Submission", detail: `${s.supplierCode} · ${s.title} · ${reviewLabel(s.status)}`, href: `/team/suppliers/${s.supplierId}#${s.ref}` });
  for (const c of checks)
    if (c.ref?.includes(Q) || c.code.includes(Q) || c.batch?.toUpperCase().includes(Q))
      hits.push({ code: c.ref ?? c.id, what: "Verification check", detail: `${c.code} · ${c.kind} · ${c.result}${c.batch ? ` · batch ${c.batch}` : ""}`, href: "/evidence#log" });
  return hits.slice(0, 60);
}

export default async function CodeDirectoryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = await requireTeam("/team/codes");
  const { q = "" } = await searchParams;
  const query = typeof q === "string" ? q.slice(0, 60) : "";
  const kind = query ? identifyCode(query) : null;
  const hits = query ? await lookup(query) : [];
  const groups = [...new Set(CODE_DIRECTORY.map((e) => e.group))];

  return (
    <>
      <TeamNav me={me} active="/team/codes" />
      <Container className="space-y-14 py-12 sm:py-16">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Code directory</h1>
          <p className="mt-2 max-w-2xl text-fg-muted">
            Every kind of record has its own prefix, so a code alone tells you what it is. In references the middle part is the date (YYMMDD), and the last four characters never use 0, O, 1,
            I or L.
          </p>
        </div>

        <section aria-labelledby="find-title" className="rounded-2xl border border-line p-6">
          <h2 id="find-title" className="font-semibold">
            Look up a code
          </h2>
          <form className="mt-4 flex flex-wrap gap-3" action="/team/codes">
            <input
              name="q"
              defaultValue={query}
              placeholder="TMC-261128-9RTD, TMS-008, TM-MOT-2807, a batch number"
              aria-label="Code to look up"
              className={cn(inputClass, "code-text mt-0 h-11 min-w-0 flex-1 border-line")}
            />
            <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-inverse px-5 text-sm font-medium text-inverse-fg hover:opacity-85">
              <Icon name="search" size={16} /> Look up
            </button>
          </form>
          {query ? (
            <div className="mt-5 text-sm">
              <p className="text-fg-muted">
                {kind ? (
                  <>
                    <span className="font-medium text-fg">{kind.name}.</span> {kind.issued}
                  </>
                ) : (
                  "Not a code format we issue, so every record was searched for it."
                )}
              </p>
              {hits.length ? (
                <ul className="mt-4 divide-y divide-line border-y border-line">
                  {hits.map((h, i) => (
                    <li key={`${h.code}-${i}`} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2.5">
                      {h.href ? (
                        <Link href={h.href} className="code-text font-semibold hover:text-accent">
                          {h.code}
                        </Link>
                      ) : (
                        <span className="code-text font-semibold">{h.code}</span>
                      )}
                      <span className="text-fg-muted">{h.what}</span>
                      <span className="min-w-0 break-words text-fg-subtle">{h.detail}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-fg-subtle">No records match.</p>
              )}
            </div>
          ) : null}
        </section>

        {groups.map((g) => (
          <section key={g} aria-labelledby={`g-${g}`}>
            <SectionHeading id={`g-${g}`} title={g} />
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs text-fg-subtle">
                  <tr className="border-b border-line">
                    <th className="w-24 py-2 pr-4 font-medium">Prefix</th>
                    <th className="w-56 py-2 pr-4 font-medium">Example</th>
                    <th className="py-2 pr-4 font-medium">What it is and when it is issued</th>
                    <th className="w-64 py-2 font-medium">Who sees it</th>
                  </tr>
                </thead>
                <tbody>
                  {CODE_DIRECTORY.filter((e) => e.group === g).map((e) => (
                    <tr key={e.example} className="border-b border-line/70 align-top">
                      <td className="code-text py-3 pr-4 font-semibold text-accent">{e.prefix}</td>
                      <td className="code-text py-3 pr-4">{e.example}</td>
                      <td className="py-3 pr-4">
                        <span className="font-medium">{e.name}.</span> <span className="text-fg-muted">{e.issued}</span>
                      </td>
                      <td className="py-3 text-fg-muted">
                        {e.seen}
                        {e.public ? null : <span className="mt-1 block text-xs text-fg-subtle">Internal: not on the public codes page</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <section aria-labelledby="cats-title">
          <SectionHeading id="cats-title" title="Category codes" lead="The three letters after TM- in a part code." />
          <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {getCategories().map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm">
                <span className="code-text font-semibold">{c.code}</span>
                <span className="min-w-0 truncate text-fg-muted">{c.name}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm">
            <Link href="/codes" className="text-accent hover:underline">
              Public codes page
            </Link>{" "}
            ·{" "}
            <Link href="/codes/register" className="text-accent hover:underline">
              Code register (PDF)
            </Link>
          </p>
        </section>
      </Container>
    </>
  );
}
