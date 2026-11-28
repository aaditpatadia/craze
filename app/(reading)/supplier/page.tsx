import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOut } from "@/components/auth/SignIn";
import { AgreementForm, ProfileForm, SubmitForm, WithdrawButton } from "@/components/portal/Portal";
import { SubmissionCard } from "@/components/portal/SubmissionCard";
import { Icon } from "@/components/ui/Icon";
import { Container } from "@/components/ui/Layout";
import { requireSupplierSession } from "@/lib/auth-server";
import { SITE } from "@/lib/config";
import { getProducts } from "@/lib/content";
import { AGREEMENT_VERSION, SUBMISSION_KINDS, checklist, isUpcoming, supplierStatusOf } from "@/lib/portal";
import { getAccount, submissionsFor } from "@/lib/portal-server";

export const metadata: Metadata = { title: "Supplier portal", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const STATE = {
  done: { label: "Done", cls: "border-accent bg-accent text-bg", icon: true },
  waiting: { label: "Waiting for review", cls: "border-accent/60 text-accent", icon: false },
  changes: { label: "Changes needed", cls: "border-amber-500 text-amber-600", icon: false },
  missing: { label: "To do", cls: "border-line text-fg-subtle", icon: false },
} as const;

const CODES = [
  ["TMS", "Your supplier code. Buyers see it, never your company name."],
  ["TMD", "Each document, photo set, test proof or product you submit."],
  ["TMX", "Each sample shipment. Write it on the parcel."],
  ["TMP", "Our purchase orders. Put it on your invoice, labels and delivery note."],
  ["TM-…", "Part codes, like TM-MOT-6015-150-A. Mark every unit and carton with it."],
  ["TMC", "A customer complaint about a part you built. We work it through with you."],
];

const day = (iso: string) => new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default async function SupplierPortalPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const session = await requireSupplierSession();
  const a = await getAccount(session.sid);
  if (!a || (!a.emails.includes(session.email) && !session.via)) redirect("/supplier/login?error=not-invited");
  const { kind } = await searchParams;
  const subs = await submissionsFor(a.id);
  const c = checklist(a, subs);
  const status = supplierStatusOf(a.status);
  const requests = a.requests.filter((r) => r.status === "open");
  const partCodes = getProducts().map((p) => p.code.replace(/-A$/, ""));
  const next = c.items.find((i) => i.state === "missing" || i.state === "changes");
  const pct = Math.round((c.done / c.total) * 100);

  return (
    <>
      {session.via ? (
        <div className="border-b border-accent/40 bg-accent/10">
          <Container className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
            <span>
              <strong className="font-semibold">Team view.</strong> You opened {a.company}&apos;s portal as {session.name ?? session.via}. Anything you submit is recorded as submitted by the team.
            </span>
            <span className="flex items-center gap-4">
              <Link href={`/team/suppliers/${a.id}`} className="font-medium text-accent hover:underline">
                Back to the team page
              </Link>
              <SignOut who="supplier" label="Close portal" />
            </span>
          </Container>
        </div>
      ) : null}

      <div className="border-b border-line bg-bg-subtle">
        <Container className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="code-text text-xs uppercase tracking-[0.2em] text-fg-subtle">Timule supplier portal</p>
            <p className="mt-1 flex flex-wrap items-center gap-2">
              <span className="code-text rounded border border-line bg-bg px-2 py-0.5 text-sm font-semibold">{a.code}</span>
              <span className="break-words font-semibold">{a.company}</span>
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-fg-muted sm:inline">{session.email}</span>
            {session.via ? null : <SignOut who="supplier" />}
          </div>
        </Container>
      </div>

      <Container className="space-y-12 py-10 sm:py-14">
        <section aria-labelledby="status-title" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-line p-6 lg:col-span-2">
            <p className="text-sm text-fg-subtle">Status</p>
            <h1 id="status-title" className="mt-1 text-2xl font-semibold tracking-tight">
              {status.label}
            </h1>
            <p className="mt-2 max-w-2xl text-fg-muted">{status.body}</p>
            <div className="mt-6">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">Onboarding</span>
                <span className="tabular text-fg-muted">
                  {c.done} of {c.total} done · {pct} %
                </span>
              </div>
              <span className="mt-2 block h-2 overflow-hidden rounded-full bg-bg-subtle">
                <span className="block h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
              </span>
            </div>
            {next && a.status !== "approved" ? (
              <p className="mt-5 flex items-start gap-2 text-sm">
                <Icon name="arrowRight" size={16} className="mt-0.5 shrink-0 text-accent" />
                <span>
                  <span className="font-medium">Next: {next.label}.</span> <span className="text-fg-muted">{next.state === "changes" ? "We asked for changes: see the note on your submission below." : next.detail}</span>
                </span>
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-line p-6">
            {a.meeting && isUpcoming(a.meeting, 3 * 3600_000) ? (
              <>
                <p className="text-sm text-fg-subtle">Onboarding meeting</p>
                <p className="mt-1 text-lg font-semibold">{day(a.meeting)}</p>
                <p className="mt-2 text-sm text-fg-muted">Have your certificates, factory photos and a sample part ready. We will go through this portal together.</p>
              </>
            ) : (
              <>
                <p className="text-sm text-fg-subtle">Your Timule contact</p>
                <p className="mt-1 font-semibold">The Timule team</p>
                <a href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`${a.code} supplier portal`)}`} className="mt-1 block break-all text-sm text-accent hover:underline">
                  {SITE.contactEmail}
                </a>
                <p className="mt-2 text-sm text-fg-muted">Quote {a.code} in every message.</p>
              </>
            )}
          </div>
        </section>

        {requests.length ? (
          <section aria-labelledby="asks-title" className="rounded-2xl border border-accent/50 bg-accent/5 p-6">
            <h2 id="asks-title" className="flex items-center gap-2 font-semibold">
              <Icon name="info" size={18} className="text-accent" /> Requests from the Timule team
            </h2>
            <ul className="mt-4 space-y-3">
              {requests.map((r) => (
                <li key={r.id} className="text-sm">
                  <p className="font-medium">
                    {r.title}
                    {r.due ? <span className="font-normal text-fg-subtle"> · by {r.due}</span> : null}
                  </p>
                  {r.detail ? <p className="mt-0.5 whitespace-pre-wrap text-fg-muted">{r.detail}</p> : null}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-fg-muted">Answer them with the form below and pick the request it answers.</p>
          </section>
        ) : null}

        <section aria-labelledby="list-title">
          <h2 id="list-title" className="text-lg font-semibold">
            Onboarding checklist
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {c.items.map((i, n) => {
              const st = STATE[i.state];
              const href = i.id === "profile" ? "#profile" : i.id === "agreement" ? "#terms" : `?kind=${i.id}#submit`;
              return (
                <li key={i.id}>
                  <Link href={href} className="flex h-full items-start gap-3 rounded-xl border border-line p-4 transition-colors hover:border-line-strong">
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs ${st.cls}`}>{st.icon ? <Icon name="check" size={14} /> : n + 1}</span>
                    <span className="min-w-0">
                      <span className="block font-medium">{i.label}</span>
                      <span className="mt-0.5 block text-xs text-fg-subtle">{st.label}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section id="submit" aria-labelledby="submit-title" className="scroll-mt-24 rounded-2xl border border-line p-6 sm:p-8">
          <h2 id="submit-title" className="text-lg font-semibold">
            Submit documents, photos and proof
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-fg-muted">
            Send each item on its own so we can review it on its own. Photos should be recent, sharp and well lit. Test proof must show the readings. Every submission gets a TMD code (TMX for
            samples).
          </p>
          <div className="mt-6">
            <SubmitForm key={kind ?? "first"} sid={a.id} initialKind={kind} requests={a.requests} partCodes={partCodes} />
          </div>
        </section>

        <section aria-labelledby="subs-title">
          <h2 id="subs-title" className="text-lg font-semibold">
            Your submissions <span className="tabular text-sm font-normal text-fg-subtle">({subs.length})</span>
          </h2>
          {subs.length ? (
            <div className="mt-4 space-y-8">
              {SUBMISSION_KINDS.filter((k) => subs.some((s) => s.kind === k.id)).map((k) => (
                <div key={k.id}>
                  <h3 className="text-sm font-semibold text-fg-muted">{k.label}</h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {subs
                      .filter((s) => s.kind === k.id)
                      .map((s) => (
                        <SubmissionCard key={s.id} s={s} actions={s.status === "submitted" ? <WithdrawButton id={s.id} code={s.ref} /> : undefined} />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-line p-6 text-sm text-fg-muted">Nothing yet. Start with your company registration and certificates.</p>
          )}
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section id="profile" aria-labelledby="profile-title" className="scroll-mt-24 rounded-2xl border border-line p-6 sm:p-8 lg:col-span-7">
            <h2 id="profile-title" className="text-lg font-semibold">
              Company profile
            </h2>
            <p className="mt-1 text-sm text-fg-muted">Seen only by the Timule team. Keep it up to date.</p>
            <div className="mt-6">
              <ProfileForm initial={a.profile} />
            </div>
          </section>

          <div className="space-y-8 lg:col-span-5">
            <section id="terms" aria-labelledby="terms-title" className="scroll-mt-24 rounded-2xl border border-line p-6">
              <h2 id="terms-title" className="text-lg font-semibold">
                Supplier terms
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
                <li>Build exactly to the build sheet. Tell us before you change anything.</li>
                <li>Test every batch and keep the records for 5 years.</li>
                <li>Declare origin honestly. &quot;Unknown&quot; is fine; a wrong answer is not.</li>
                <li>Buyers we bring stay with Timule for 24 months.</li>
                <li>Everything we share is confidential.</li>
              </ul>
              <div className="mt-5">
                <AgreementForm accepted={a.agreement?.version === AGREEMENT_VERSION ? a.agreement : undefined} />
              </div>
            </section>

            <section aria-labelledby="codes-title" className="rounded-2xl border border-line p-6">
              <h2 id="codes-title" className="text-lg font-semibold">
                Codes you will see
              </h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                {CODES.map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <dt className="code-text w-14 shrink-0 font-semibold">{k}</dt>
                    <dd className="text-fg-muted">{v}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/codes" className="mt-4 inline-block text-sm text-accent hover:underline">
                How TM codes work
              </Link>
            </section>

            <section className="rounded-2xl border border-line p-6 text-sm text-fg-muted">
              <h2 className="text-lg font-semibold text-fg">Your data</h2>
              <p className="mt-2">
                Files you upload are stored privately and are visible only to you and the Timule team. We never show your company name, documents or prices to buyers. See the{" "}
                <Link href="/legal/privacy" className="text-accent hover:underline">
                  privacy notice
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </Container>
    </>
  );
}
