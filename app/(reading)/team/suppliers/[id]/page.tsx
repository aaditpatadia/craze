import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmissionCard } from "@/components/portal/SubmissionCard";
import { AskForm, DeleteSupplier, InvitePanel, OpenAsButton, RequestToggle, ReviewControls, SupplierSettings } from "@/components/team/SupplierAdmin";
import { TeamNav } from "@/components/team/TeamNav";
import { Icon } from "@/components/ui/Icon";
import { Container } from "@/components/ui/Layout";
import { requireTeam } from "@/lib/auth-server";
import { getCategories } from "@/lib/content";
import { AGREEMENT_VERSION, SUBMISSION_KINDS, checklist, supplierStatusOf } from "@/lib/portal";
import { getAccount, submissionsFor } from "@/lib/portal-server";
import { autoEmailConfigured, gmailDraft, invitation, inviteLink } from "@/lib/invite";

export const metadata: Metadata = { title: "Supplier", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

const STATE = {
  done: { label: "Done", cls: "border-accent bg-accent text-bg" },
  waiting: { label: "To review", cls: "border-accent text-accent" },
  changes: { label: "Changes asked", cls: "border-amber-500 text-amber-600" },
  missing: { label: "Missing", cls: "border-line text-fg-subtle" },
} as const;

export default async function TeamSupplierPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params;
  const fresh = (await searchParams).new === "1";
  const me = await requireTeam(`/team/suppliers/${id}`);
  const a = await getAccount(id);
  if (!a) notFound();
  const subs = await submissionsFor(a.id);
  const c = checklist(a, subs);
  const categories = getCategories().map((x) => ({ id: x.id, name: x.name }));
  const waiting = subs.filter((s) => s.status === "submitted");
  const p = a.profile;

  return (
    <>
      <TeamNav me={me} active="/team/suppliers" />
      <Container className="py-10 sm:py-14">
        <Link href="/team/suppliers" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
          <Icon name="arrowLeft" size={16} /> All suppliers
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="code-text text-sm text-fg-subtle">
              {a.code} · {supplierStatusOf(a.status).label}
            </p>
            <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight sm:text-3xl">{a.company}</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Signs in with {a.emails.join(", ")} · last seen {a.lastSeenAt ? when(a.lastSeenAt) : "never"}
            </p>
          </div>
          <OpenAsButton id={a.id} />
        </div>

        <div className="mt-8">
          <InvitePanel
            id={a.id}
            gmail={gmailDraft(a, me.name)}
            text={invitation(a, me.name).text}
            link={inviteLink(a.emails[0] ?? "")}
            auto={autoEmailConfigured()}
            emails={a.emails}
            fresh={fresh}
          />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-8">
            <section aria-labelledby="check-title" className="rounded-xl border border-line p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="check-title" className="font-semibold">
                  Onboarding checklist
                </h2>
                <p className="tabular text-sm text-fg-muted">
                  {c.done} of {c.total} done{waiting.length ? ` · ${waiting.length} to review` : ""}
                </p>
              </div>
              <span className="mt-3 block h-1.5 overflow-hidden rounded bg-bg-subtle">
                <span className="block h-full bg-accent" style={{ width: `${(c.done / c.total) * 100}%` }} />
              </span>
              <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {c.items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm">
                    <span>{i.label}</span>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${STATE[i.state].cls}`}>{STATE[i.state].label}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="subs-title">
              <h2 id="subs-title" className="text-lg font-semibold">
                Submissions <span className="tabular text-sm font-normal text-fg-subtle">({subs.length})</span>
              </h2>
              {subs.length ? (
                <div className="mt-4 space-y-8">
                  {SUBMISSION_KINDS.filter((k) => subs.some((s) => s.kind === k.id)).map((k) => (
                    <div key={k.id}>
                      <h3 className="text-sm font-semibold text-fg-muted">{k.label}</h3>
                      <div className="mt-3 space-y-4">
                        {subs
                          .filter((s) => s.kind === k.id)
                          .map((s) => (
                            <SubmissionCard key={s.id} s={s} showBy actions={<ReviewControls subId={s.id} status={s.status} />} />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-line p-6 text-sm text-fg-muted">Nothing submitted yet.</p>
              )}
            </section>
          </div>

          <aside className="space-y-8 lg:col-span-4">
            <section className="rounded-xl border border-line p-5">
              <h2 className="font-semibold">Ask for something</h2>
              <p className="mt-1 text-sm text-fg-muted">It appears at the top of their dashboard until you mark it done.</p>
              <div className="mt-4">
                <AskForm id={a.id} />
              </div>
              {a.requests.length ? (
                <ul className="mt-5 divide-y divide-line border-t border-line">
                  {[...a.requests].reverse().map((r) => (
                    <li key={r.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                      <span className={r.status === "done" ? "text-fg-subtle line-through" : ""}>
                        {r.title}
                        {r.due ? <span className="block text-xs text-fg-subtle no-underline">Due {r.due}</span> : null}
                      </span>
                      <RequestToggle id={a.id} r={r} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="rounded-xl border border-line p-5">
              <h2 className="font-semibold">Company profile</h2>
              {p ? (
                <dl className="mt-3 space-y-2 text-sm">
                  {[
                    ["Legal name", p.legalName],
                    ["Trade name", p.tradeName],
                    ["Address", [p.address, p.city, p.state].filter(Boolean).join(", ")],
                    ["GSTIN", p.gstin],
                    ["Udyam", p.udyam],
                    ["Founded", p.founded],
                    ["People", p.employees],
                    ["Website", p.website],
                    ["Contact", [p.contactName, p.contactRole, p.phone].filter(Boolean).join(" · ")],
                    ["Makes", p.makes],
                    ["Capacity", p.capacity],
                    ["Customers", p.customers],
                  ]
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-fg-subtle">{k}</dt>
                        <dd className="whitespace-pre-wrap break-words">{v}</dd>
                      </div>
                    ))}
                </dl>
              ) : (
                <p className="mt-2 text-sm text-fg-muted">Not filled in yet.</p>
              )}
              <p className="mt-4 border-t border-line pt-3 text-sm">
                {a.agreement ? (
                  <>
                    Terms {a.agreement.version} accepted by {a.agreement.name}, {a.agreement.title}, on {when(a.agreement.acceptedAt)} ({a.agreement.email})
                    {a.agreement.version !== AGREEMENT_VERSION ? <span className="block text-danger">Older version: they need to accept {AGREEMENT_VERSION}.</span> : null}
                  </>
                ) : (
                  <span className="text-fg-muted">Supplier terms not accepted yet.</span>
                )}
              </p>
            </section>

            <section className="rounded-xl border border-line p-5">
              <h2 className="font-semibold">Settings</h2>
              <div className="mt-4">
                <SupplierSettings a={a} categories={categories} />
              </div>
            </section>

            <section className="rounded-xl border border-line p-5">
              <h2 className="font-semibold">History</h2>
              <ol className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
                {[...a.history].reverse().map((h, i) => (
                  <li key={`${h.at}-${i}`}>
                    <p className="text-xs text-fg-subtle">
                      {when(h.at)} · {h.by}
                    </p>
                    <p className="break-words">{h.what}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-5 border-t border-line pt-4">
                <DeleteSupplier a={a} />
              </div>
            </section>
          </aside>
        </div>
      </Container>
    </>
  );
}
