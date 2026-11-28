import type { Metadata } from "next";
import Link from "next/link";
import { TeamNav } from "@/components/team/TeamNav";
import { Icon } from "@/components/ui/Icon";
import { Container, SectionHeading } from "@/components/ui/Layout";
import { requireTeam } from "@/lib/auth-server";
import { getCases, getChecks } from "@/lib/metrics";
import { statusOf } from "@/lib/pipeline";
import { isUpcoming, kindOf, supplierStatusOf } from "@/lib/portal";
import { getAccounts, getSubmissions } from "@/lib/portal-server";

export const metadata: Metadata = { title: "Team area", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

const LINKS = [
  { href: "/desk/pipeline", title: "Pipeline", body: "Requests (TMQ), letters of intent (TMR) and complaints (TMC). Move each along; the buyer sees it." },
  { href: "/team/suppliers", title: "Suppliers", body: "Invite makers, run onboarding, review every document, photo, test proof and sample." },
  { href: "/desk/pipeline#log", title: "Log a check", body: "Document reviews, sample measurements, lab reports and batch tests (TMV, TMB). Public on /evidence." },
  { href: "/desk", title: "Documents", body: "Quotations (TMO), purchase orders (TMP) and invoices (TMI) on Timule blueprints." },
  { href: "/team/codes", title: "Code directory", body: "Every code Timule issues, what it means and who sees it. Look any code up." },
  { href: "/tools/firmware?make", title: "Seal a firmware record", body: "Check a maker's firmware record, then seal it." },
  { href: "/codes/register", title: "Code register (PDF)", body: "Every TM part code on one printable sheet." },
  { href: "/supplier/login", title: "Supplier sign-in page", body: "The page to send suppliers. They sign in with the Google account you invited." },
];

const EXTERNAL = [
  { href: "https://formspree.io/forms", title: "Form emails", body: "Every submission, emailed." },
  { href: "https://vercel.com/aaditpatadia/craze", title: "Hosting", body: "Deployments, storage, environment variables." },
  { href: "https://search.google.com/search-console", title: "Search Console", body: "How timule.com appears in Google." },
  { href: "https://console.cloud.google.com/apis/credentials", title: "Google sign-in", body: "The OAuth client behind supplier sign-in." },
];

export default async function TeamPage() {
  const me = await requireTeam("/team");
  const [cases, checks, accounts, subs] = await Promise.all([getCases(), getChecks(), getAccounts(), getSubmissions()]);
  const open = (s: string) => !["closed", "delivered", "resolved"].includes(s);
  const complaints = cases.filter((c) => c.kind === "complaint" && open(c.status));
  const newCases = cases.filter((c) => c.kind !== "complaint" && c.status === "received");
  const waiting = subs.filter((s) => s.status === "submitted").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const meetings = accounts.filter((a) => isUpcoming(a.meeting, 86_400_000)).sort((a, b) => (a.meeting ?? "").localeCompare(b.meeting ?? ""));
  const byCode = new Map(accounts.map((a) => [a.id, a]));

  const tiles = [
    { k: "Open requests", v: cases.filter((c) => c.kind === "request" && open(c.status)).length, href: "/desk/pipeline" },
    { k: "Letters of intent", v: cases.filter((c) => c.kind === "loi").length, href: "/desk/pipeline" },
    { k: "Open complaints", v: complaints.length, href: "/desk/pipeline#complaints", alert: complaints.length > 0 },
    { k: "Suppliers onboarding", v: accounts.filter((a) => ["invited", "onboarding", "review"].includes(a.status)).length, href: "/team/suppliers" },
    { k: "Approved suppliers", v: accounts.filter((a) => a.status === "approved").length, href: "/team/suppliers" },
    { k: "Waiting for review", v: waiting.length, href: "#attention", alert: waiting.length > 0 },
    { k: "Checks logged", v: checks.length, href: "/evidence" },
  ];

  return (
    <>
      <TeamNav me={me} active="/team" />
      <Container className="space-y-16 py-12 sm:py-16">
        <div>
          <p className="code-text text-xs uppercase tracking-[0.2em] text-fg-subtle">Timule team area</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Good to see you, {me.name.split(" ")[0]}.</h1>
          <p className="mt-2 max-w-2xl text-fg-muted">Everything that needs the team, in one place. Only signed-in team members see this area.</p>
        </div>

        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
          {tiles.map((t) => (
            <li key={t.k}>
              <Link href={t.href} className={`block h-full rounded-xl border p-5 transition-colors hover:border-line-strong ${t.alert ? "border-accent/60" : "border-line"}`}>
                <p className="text-xs text-fg-subtle">{t.k}</p>
                <p className={`tabular mt-2 text-3xl font-semibold ${t.alert ? "text-accent" : ""}`}>{t.v.toLocaleString("en-IN")}</p>
              </Link>
            </li>
          ))}
        </ul>

        <section id="attention" aria-labelledby="attention-title" className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <SectionHeading id="attention-title" title="Needs attention" />
          </div>
          <div className="rounded-xl border border-line p-5">
            <h3 className="text-sm font-semibold">Supplier submissions to review</h3>
            {waiting.length ? (
              <ul className="mt-3 divide-y divide-line">
                {waiting.slice(0, 8).map((s) => (
                  <li key={s.id} className="py-2.5 text-sm">
                    <Link href={`/team/suppliers/${s.supplierId}#${s.ref}`} className="hover:text-accent">
                      <span className="code-text text-xs text-fg-subtle">{s.ref}</span> {kindOf(s.kind)?.label}: {s.title}
                    </Link>
                    <p className="text-xs text-fg-subtle">
                      {s.supplierCode} {byCode.get(s.supplierId)?.company} · {day(s.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-fg-muted">Nothing waiting.</p>
            )}
          </div>
          <div className="rounded-xl border border-line p-5">
            <h3 className="text-sm font-semibold">Open complaints and new requests</h3>
            {complaints.length || newCases.length ? (
              <ul className="mt-3 divide-y divide-line">
                {[...complaints, ...newCases].slice(0, 8).map((c) => (
                  <li key={c.id} className="py-2.5 text-sm">
                    <Link href="/desk/pipeline" className="hover:text-accent">
                      <span className={`code-text text-xs ${c.kind === "complaint" ? "text-danger" : "text-fg-subtle"}`}>{c.ref}</span> {c.contact.company}
                    </Link>
                    <p className="text-xs text-fg-subtle">
                      {c.kind === "complaint" ? (c.complaint?.issue ?? "Complaint") : c.kind === "loi" ? "Letter of intent" : "Request"} · {statusOf(c.status).label} · {day(c.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-fg-muted">Nothing new.</p>
            )}
          </div>
          <div className="rounded-xl border border-line p-5">
            <h3 className="text-sm font-semibold">Onboarding meetings</h3>
            {meetings.length ? (
              <ul className="mt-3 divide-y divide-line">
                {meetings.slice(0, 8).map((a) => (
                  <li key={a.id} className="py-2.5 text-sm">
                    <Link href={`/team/suppliers/${a.id}`} className="hover:text-accent">
                      <span className="code-text text-xs text-fg-subtle">{a.code}</span> {a.company}
                    </Link>
                    <p className="text-xs text-fg-subtle">
                      {when(a.meeting!)} · {supplierStatusOf(a.status).label}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-fg-muted">
                None scheduled. Add the meeting time when you{" "}
                <Link href="/team/suppliers" className="text-accent hover:underline">
                  invite a supplier
                </Link>
                .
              </p>
            )}
          </div>
        </section>

        <section aria-labelledby="areas-title">
          <SectionHeading id="areas-title" title="Everything in the team area" />
          <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex h-full flex-col rounded-xl border border-line p-5 transition-colors hover:border-line-strong">
                  <span className="flex items-center justify-between font-semibold">
                    {l.title} <Icon name="arrowRight" size={16} className="text-fg-subtle" />
                  </span>
                  <span className="mt-2 text-sm text-fg-muted">{l.body}</span>
                </Link>
              </li>
            ))}
          </ul>
          <h3 className="mt-10 text-sm font-semibold">Outside services</h3>
          <ul className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {EXTERNAL.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="flex h-full flex-col rounded-xl border border-line p-5 transition-colors hover:border-line-strong">
                  <span className="flex items-center justify-between font-semibold">
                    {l.title} <Icon name="external" size={16} className="text-fg-subtle" />
                  </span>
                  <span className="mt-2 text-sm text-fg-muted">{l.body}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </>
  );
}
