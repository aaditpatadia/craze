import { cn } from "@/lib/cn";
import { TIER_LABEL, formatDate, isStale } from "@/lib/format";
import type { Evidence } from "@/lib/schema";
import { Icon, TierGlyph } from "@/components/ui/Icon";

/**
 * One evidence record. Always shows: tier, what was checked, what was NOT checked,
 * the date and who checked. Tier 2 lists measurements, tier 3 links the lab report.
 */
export function EvidenceRecord({ ev, compact = false, headingLevel = 3 }: { ev: Evidence; compact?: boolean; headingLevel?: 3 | 4 }) {
  const stale = isStale(ev.date);
  const H = `h${headingLevel}` as "h3" | "h4";
  return (
    <article className={cn("rounded-lg border border-line bg-bg-elev", compact ? "p-4" : "p-5")}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <p className="flex items-center gap-2 text-xs font-medium text-fg-subtle">
            <TierGlyph tier={ev.tier} />
            Tier {ev.tier}: {TIER_LABEL[ev.tier]}
          </p>
          <H className="mt-1.5 text-sm font-semibold text-fg">{ev.summary}</H>
        </div>
        <p className={cn("text-xs", stale ? "font-medium text-fg" : "text-fg-subtle")}>
          {stale ? <Icon name="alert" size={12} className="mr-1 inline -translate-y-px" /> : null}
          <time dateTime={ev.date}>{formatDate(ev.date)}</time>
          {stale ? ", over 12 months old" : null}
        </p>
      </header>

      <div className={cn("mt-4 grid gap-4 text-sm", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">Checked</p>
          <ul className="mt-2 space-y-1.5">
            {ev.checked.map((c) => (
              <li key={c} className="flex gap-2 text-fg-muted">
                <Icon name="check" size={16} className="mt-0.5 shrink-0 text-fg" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">Not checked</p>
          <ul className="mt-2 space-y-1.5">
            {ev.notChecked.map((c) => (
              <li key={c} className="flex gap-2 text-fg-muted">
                <Icon name="minus" size={16} className="mt-0.5 shrink-0 text-fg-subtle" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {ev.measurements.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="tabular w-full min-w-[420px] text-left text-sm">
            <caption className="sr-only">What was measured</caption>
            <thead>
              <tr className="border-b border-line text-xs text-fg-subtle">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Measured
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Result
                </th>
                <th scope="col" className="py-2 font-medium">
                  How
                </th>
              </tr>
            </thead>
            <tbody>
              {ev.measurements.map((m) => (
                <tr key={m.label} className="border-b border-line/60 last:border-0">
                  <th scope="row" className="py-2 pr-3 font-normal text-fg-muted">
                    {m.label}
                  </th>
                  <td className="py-2 pr-3 font-medium text-fg">
                    {m.value}
                    {m.unit ? ` ${m.unit}` : ""}
                  </td>
                  <td className="py-2 text-fg-subtle">{m.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {ev.documents.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">Documents</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {ev.documents.map((d) => (
              <li key={d.title} className="flex flex-wrap items-baseline gap-x-2">
                <Icon name="document" size={14} className="translate-y-0.5 text-fg-subtle" />
                {d.url ? (
                  <a href={d.url} className="text-accent hover:underline">
                    {d.title}
                  </a>
                ) : (
                  <span className="text-fg-muted">{d.title}</span>
                )}
                <span className="text-xs text-fg-subtle">
                  received {formatDate(d.received)}
                  {d.url ? "" : ", not published"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <footer className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-fg-subtle">
        <span>
          Checked by <span className="text-fg-muted">{ev.checkedBy}</span>
        </span>
        {ev.lab ? (
          <span>
            Lab <span className="text-fg-muted">{ev.lab}</span>
          </span>
        ) : null}
        {ev.documentUrl ? (
          <a href={ev.documentUrl} className="inline-flex items-center gap-1 text-accent hover:underline">
            Open report <Icon name="external" size={12} />
          </a>
        ) : null}
      </footer>
    </article>
  );
}

export function EvidenceList({ items, compact, headingLevel }: { items: Evidence[]; compact?: boolean; headingLevel?: 3 | 4 }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line-strong p-4 text-sm text-fg-muted">
        No evidence recorded for this part yet. Treat every figure for it as unconfirmed.
      </p>
    );
  }
  const sorted = [...items].sort((a, b) => b.tier - a.tier || b.date.localeCompare(a.date));
  return (
    <ul className="space-y-3">
      {sorted.map((e) => (
        <li key={e.id}>
          <EvidenceRecord ev={e} compact={compact} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
