import type { Metadata } from "next";
import Link from "next/link";
import { InviteForm } from "@/components/team/SupplierAdmin";
import { TeamNav } from "@/components/team/TeamNav";
import { Container, SectionHeading } from "@/components/ui/Layout";
import { requireTeam } from "@/lib/auth-server";
import { getCategories } from "@/lib/content";
import { checklist, supplierStatusOf, SUPPLIER_STATUSES } from "@/lib/portal";
import { getAccounts, getSubmissions } from "@/lib/portal-server";

export const metadata: Metadata = { title: "Suppliers", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "Never");

export default async function TeamSuppliersPage() {
  const me = await requireTeam("/team/suppliers");
  const [accounts, subs] = await Promise.all([getAccounts(), getSubmissions()]);
  const categories = getCategories().map((c) => ({ id: c.id, name: c.name }));
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const rows = [...accounts].sort((a, b) => a.code.localeCompare(b.code));

  return (
    <>
      <TeamNav me={me} active="/team/suppliers" />
      <Container className="space-y-14 py-12 sm:py-16">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Suppliers</h1>
          <p className="mt-2 max-w-2xl text-fg-muted">
            Invite a maker with the Google account they will sign in with. They get a TMS code at once, sign in at{" "}
            <span className="code-text text-fg">timule.com/supplier/login</span> and work through the onboarding checklist. You review each item here.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {SUPPLIER_STATUSES.map((s) => (
            <li key={s.id} className="rounded-xl border border-line p-4">
              <p className="text-xs text-fg-subtle">{s.label}</p>
              <p className="tabular mt-1 text-2xl font-semibold">{accounts.filter((a) => a.status === s.id).length}</p>
            </li>
          ))}
        </ul>

        <section aria-labelledby="list-title">
          <SectionHeading id="list-title" title="All suppliers" />
          {rows.length ? (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs text-fg-subtle">
                  <tr className="border-b border-line">
                    <th className="py-2 pr-4 font-medium">Code</th>
                    <th className="py-2 pr-4 font-medium">Company</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Checklist</th>
                    <th className="py-2 pr-4 font-medium">To review</th>
                    <th className="py-2 pr-4 font-medium">Makes</th>
                    <th className="py-2 font-medium">Last signed in</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => {
                    const mine = subs.filter((s) => s.supplierId === a.id);
                    const c = checklist(a, mine);
                    const waiting = mine.filter((s) => s.status === "submitted").length;
                    return (
                      <tr key={a.id} className="border-b border-line/70 align-top">
                        <td className="code-text py-3 pr-4 font-semibold">
                          <Link href={`/team/suppliers/${a.id}`} className="hover:text-accent">
                            {a.code}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <Link href={`/team/suppliers/${a.id}`} className="font-medium hover:text-accent">
                            {a.company}
                          </Link>
                          <p className="text-xs text-fg-subtle">{a.emails.join(", ")}</p>
                        </td>
                        <td className="py-3 pr-4">{supplierStatusOf(a.status).label}</td>
                        <td className="py-3 pr-4">
                          <span className="tabular">
                            {c.done}/{c.total}
                          </span>
                          <span className="mt-1.5 block h-1 w-24 overflow-hidden rounded bg-bg-subtle">
                            <span className="block h-full bg-accent" style={{ width: `${(c.done / c.total) * 100}%` }} />
                          </span>
                        </td>
                        <td className={`tabular py-3 pr-4 ${waiting ? "font-semibold text-accent" : "text-fg-subtle"}`}>{waiting || "–"}</td>
                        <td className="py-3 pr-4 text-fg-muted">{a.categories.map((id) => catName.get(id) ?? id).join(", ") || "–"}</td>
                        <td className="py-3 text-fg-muted">{day(a.lastSeenAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-sm text-fg-muted">No suppliers yet. Invite the first one below.</p>
          )}
        </section>

        <section aria-labelledby="invite-title">
          <SectionHeading
            id="invite-title"
            title="Invite a supplier"
            lead="Do this before the onboarding meeting. In the meeting, open their portal from their page and walk through it together on screen."
          />
          <div className="mt-6">
            <InviteForm categories={categories} />
          </div>
        </section>
      </Container>
    </>
  );
}
