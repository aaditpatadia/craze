import type { Metadata } from "next";
import Link from "next/link";
import { SignOut } from "@/components/auth/SignIn";
import { Container, PageHeader } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";
import { requireFounder } from "@/lib/auth-server";

export const metadata: Metadata = { title: "Founder desk", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/desk", title: "Documents", body: "Quotations, purchase orders and invoices on Timule blueprints." },
  { href: "/tools/firmware?make", title: "Seal a firmware record", body: "Check a maker's record, then seal it. Signed in, no key needed." },
  { href: "/codes/register", title: "Code register", body: "Every TM code, as a PDF." },
  { href: "https://formspree.io/forms", title: "Form submissions", body: "Requests, supplier applications and investor enquiries.", external: true },
  { href: "https://vercel.com/aaditpatadia/craze", title: "Hosting", body: "Deployments, domains, usage and environment variables.", external: true },
  { href: "https://search.google.com/search-console", title: "Google Search Console", body: "How timule.com appears in Google.", external: true },
];

export default async function AdminPage() {
  await requireFounder("/admin");
  return (
    <>
      <PageHeader title="Founder desk" lead="Only visible to the Timule founders. Sessions last 7 days on this device.">
        <SignOut />
      </PageHeader>
      <Container className="pb-24">
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex h-full flex-col rounded-xl border border-line p-5 transition-colors hover:border-line-strong"
              >
                <span className="flex items-center justify-between font-semibold">
                  {l.title} <Icon name={l.external ? "external" : "arrowRight"} size={16} className="text-fg-subtle" />
                </span>
                <span className="mt-2 text-sm text-fg-muted">{l.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
