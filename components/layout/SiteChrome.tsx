import { USE_PLACEHOLDER_DATA } from "@/lib/config";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export type Surface = "product" | "reading";

/**
 * Wraps a page in the header, footer and a theme surface.
 * "product" defaults to dark, "reading" to light; the user's theme choice wins.
 */
export function SiteChrome({ surface, children }: { surface: Surface; children: React.ReactNode }) {
  return (
    <div data-surface={surface} className="flex min-h-dvh flex-col">
      {USE_PLACEHOLDER_DATA ? (
        <div className="border-b border-line bg-bg-subtle text-center text-xs text-fg-muted">
          <p className="mx-auto max-w-[1440px] px-4 py-2">
            <span className="font-medium text-fg">Sample data.</span> Every supplier, lab and figure on this site is
            fictional and shown only to demonstrate the catalogue.
          </p>
        </div>
      ) : null}
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
