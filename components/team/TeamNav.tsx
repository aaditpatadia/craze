import Link from "next/link";
import { SignOut } from "@/components/auth/SignIn";
import { cn } from "@/lib/cn";
import type { TeamSession } from "@/lib/auth";

const TABS = [
  { href: "/team", label: "Overview" },
  { href: "/desk/pipeline", label: "Pipeline" },
  { href: "/team/suppliers", label: "Suppliers" },
  { href: "/team/codes", label: "Code directory" },
  { href: "/desk", label: "Documents" },
  { href: "/tools/firmware?make", label: "Firmware seal" },
] as const;

/** The bar across the top of every team page: who is signed in, and every team area one click away. */
export function TeamNav({ me, active }: { me: TeamSession; active: (typeof TABS)[number]["href"] }) {
  return (
    <div className="border-b border-line bg-bg-subtle">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <nav aria-label="Team area" className="-mx-1 flex min-w-0 flex-wrap gap-1">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={t.href === active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-9 items-center rounded-full px-3 text-sm transition-colors",
                t.href === active ? "bg-inverse text-inverse-fg" : "text-fg-muted hover:bg-bg hover:text-fg",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-fg-muted">
            <span className="code-text mr-1.5 rounded border border-line px-1.5 py-0.5 text-xs">{me.initials}</span>
            {me.name}
          </span>
          <SignOut />
        </div>
      </div>
    </div>
  );
}
