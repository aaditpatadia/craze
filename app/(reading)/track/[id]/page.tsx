import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, PageHeader } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";
import { SITE } from "@/lib/config";
import { STATUSES, statusOf, type Case } from "@/lib/pipeline";
import { getRecord } from "@/lib/store";

export const metadata: Metadata = { title: "Track your request", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** The path every order follows. "Letter of intent" appears for letters of intent; "Closed" only as a note. */
const pathFor = (c: Case) => STATUSES.filter((s) => s.id !== "closed" && (s.id !== "loi" || c.kind === "loi" || c.history.some((h) => h.status === "loi")));

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{32}$/.test(id)) notFound();
  const c = await getRecord<Case>(`cases/${id}.json`);
  if (!c) notFound();
  const PATH = pathFor(c);
  const reached = new Set(c.history.map((h) => h.status));
  const current = statusOf(c.status);
  const at = PATH.findIndex((s) => s.id === c.status);

  return (
    <>
      <PageHeader
        eyebrow={<span className="code-text">{c.ref}</span>}
        title={c.kind === "loi" ? "Your letter of intent" : "Your sourcing request"}
        lead={current.body}
      />
      <Container className="grid grid-cols-1 gap-12 pb-24 lg:grid-cols-12">
        <section className="lg:col-span-7" aria-labelledby="progress">
          <h2 id="progress" className="text-sm font-semibold">
            Progress
          </h2>
          <ol className="mt-5 space-y-0">
            {PATH.map((s, i) => {
              const done = reached.has(s.id) || (at >= 0 && i <= at);
              const now = s.id === c.status;
              return (
                <li key={s.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < PATH.length - 1 ? <span aria-hidden="true" className={`absolute left-[11px] top-6 h-full w-px ${done ? "bg-accent" : "bg-line"}`} /> : null}
                  <span
                    aria-hidden="true"
                    className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border ${done ? "border-accent bg-accent text-bg" : "border-line bg-bg"}`}
                  >
                    {done ? <Icon name="check" size={14} /> : null}
                  </span>
                  <div>
                    <p className={now ? "font-semibold" : done ? "" : "text-fg-subtle"}>
                      {s.label}
                      {now ? <span className="sr-only"> (current)</span> : null}
                    </p>
                    {now ? <p className="mt-1 text-sm text-fg-muted">{s.body}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
          {c.status === "closed" ? <p className="mt-6 rounded-lg border border-line bg-bg-subtle p-4 text-sm text-fg-muted">This request is closed.</p> : null}
        </section>

        <aside className="space-y-8 lg:col-span-5">
          <div>
            <h2 className="text-sm font-semibold">What you asked for</h2>
            {c.items.length ? (
              <ul className="mt-3 space-y-2">
                {c.items.map((i) => (
                  <li key={i.code} className="flex items-baseline justify-between gap-4 border-b border-line pb-2 text-sm">
                    <span className="code-text break-all">{i.code}</span>
                    {i.qty ? <span className="tabular text-fg-muted">{i.qty.toLocaleString("en-IN")} units</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-fg-muted">{c.summary.slice(0, 600)}</p>
            )}
            <p className="mt-3 text-sm text-fg-subtle">Needed: {c.timeline}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Updates</h2>
            <ol className="mt-3 space-y-3">
              {[...c.history].reverse().map((h, i) => (
                <li key={`${h.at}-${i}`} className="text-sm">
                  <p className="text-fg-subtle">{when(h.at)}</p>
                  <p>
                    {statusOf(h.status).label}
                    {h.note ? <span className="text-fg-muted">: {h.note}</span> : null}
                  </p>
                </li>
              ))}
            </ol>
          </div>
          <p className="text-sm text-fg-subtle">
            Questions? Write to{" "}
            <a href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent(c.ref)}`} className="text-accent hover:underline">
              {SITE.contactEmail}
            </a>{" "}
            and quote {c.ref}. Keep this link private: anyone with it can see this page.{" "}
            <Link href="/methodology#batch" className="text-accent hover:underline">
              How we test every batch
            </Link>
            .
          </p>
        </aside>
      </Container>
    </>
  );
}
