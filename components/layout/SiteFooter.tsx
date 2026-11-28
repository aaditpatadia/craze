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
      { href: "/reserve", label: "Reserve a part" },
      { href: "/complaint", label: "Report a problem" },
      { href: "/suppliers/join", label: "For suppliers" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/investors", label: "Investors" },
      { href: "/tools", label: "Engineering tools" },
      { href: "/supplier/login", label: "Supplier portal" },
      { href: "/team/login", label: "Team sign-in" },
    ],
  },
  {
    title: "How we work",
    links: [
      { href: "/evidence", label: "Evidence status" },
      { href: "/methodology", label: "Methodology" },
      { href: "/codes/register", label: "Code register (PDF)" },
      { href: "/brief/buyers", label: "Buyer brief (PDF)" },
      { href: "/brief/suppliers", label: "Supplier brief (PDF)" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms of sale" },
      { href: "/legal/returns", label: "Complaints and returns" },
      { href: "/legal/supplier-terms", label: "Supplier terms" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/cookies", label: "Cookies" },
      { href: "/legal/website-terms", label: "Website terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg-subtle text-sm">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-6 gap-y-10 px-4 py-14 sm:px-6 md:grid-cols-10 xl:grid-cols-12 lg:px-10">
        <div className="col-span-2 md:col-span-10 xl:col-span-2">
          {/* Same 20 px row as the column headings, so every column starts on one line. */}
          <div className="flex h-5 items-center">
            <TimuleLogo size={18} className="inline-flex items-center gap-2 text-[13px] leading-none" />
          </div>
          <p className="mt-3 max-w-xs py-1.5 leading-6 text-fg-subtle">
            Indian components for drones, robots and data centers. Our rule from the first order: every batch tested, only top-grade parts released, and every figure shows its evidence tier.
          </p>
          <p className="mt-3">
            <a href={`mailto:${SITE.contactEmail}`} className="inline-block py-1.5 leading-6 text-fg-muted underline-offset-4 hover:text-fg hover:underline">
              {SITE.contactEmail}
            </a>
          </p>
        </div>
        {groups.map((g) => (
          <nav key={g.title} aria-label={g.title} className="md:col-span-2 xl:col-span-2">
            <h2 className="flex h-5 items-center text-xs font-medium uppercase leading-none tracking-wide text-fg-subtle">{g.title}</h2>
            <ul className="mt-3">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-block py-1.5 leading-6 text-fg-muted hover:text-fg">
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
