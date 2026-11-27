import Link from "next/link";
import { TimuleLogo } from "@/components/brand/Logo";
import { SITE, USE_PLACEHOLDER_DATA } from "@/lib/config";

const groups = [
  {
    title: "Catalogue",
    links: [
      { href: "/parts", label: "All parts" },
      { href: "/categories/bldc-motors", label: "BLDC motors" },
      { href: "/upcoming", label: "Upcoming categories" },
    ],
  },
  {
    title: "Sourcing",
    links: [
      { href: "/bom", label: "BOM checker" },
      { href: "/request", label: "Send a request" },
      { href: "/suppliers/join", label: "For suppliers" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/investors", label: "Investors" },
      { href: "/tools", label: "Engineering tools" },
    ],
  },
  {
    title: "How we work",
    links: [
      { href: "/methodology", label: "Methodology" },
      { href: "/codes/register", label: "Code register (PDF)" },
      { href: "/brief/buyers", label: "Buyer brief (PDF)" },
      { href: "/brief/suppliers", label: "Supplier brief (PDF)" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Buyer terms" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/supplier-terms", label: "Supplier terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg-subtle text-sm">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-6 gap-y-10 px-4 py-14 sm:px-6 md:grid-cols-10 xl:grid-cols-12 lg:px-10">
        <div className="col-span-2 md:col-span-10 xl:col-span-2">
          <TimuleLogo size={20} className="inline-flex items-center gap-2 text-[13px]" />
          <p className="mt-2 max-w-xs text-fg-subtle">
            Every figure on this site shows its evidence tier, or says it is not yet verified.
          </p>
          <p className="mt-4">
            <a href={`mailto:${SITE.contactEmail}`} className="inline-flex min-h-9 items-center text-fg-muted underline-offset-4 hover:text-fg hover:underline">
              {SITE.contactEmail}
            </a>
          </p>
        </div>
        {groups.map((g) => (
          <nav key={g.title} aria-label={g.title} className="md:col-span-2 xl:col-span-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{g.title}</h2>
            <ul className="mt-3 space-y-1">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-9 items-center text-fg-muted hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-6 text-xs text-fg-subtle sm:flex-row sm:justify-between sm:px-6 lg:px-10">
          <p>
            {USE_PLACEHOLDER_DATA
              ? "This site shows sample data. Suppliers, labs and figures are fictional."
              : "Figures are Timule target specifications until an evidence record shows they were checked."}
          </p>
          <p>
            {SITE.name} {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
