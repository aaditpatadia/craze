import { cn } from "@/lib/cn";
import { USE_PLACEHOLDER_DATA } from "@/lib/config";
import { MODEL_SOURCE_LABEL, TIER_LABEL, TIER_SHORT, formatDate, isOriginKnown, isStale, originLabel } from "@/lib/format";
import { ILLUSTRATIVE_DISCLAIMER } from "@/lib/constants";
import type { ModelSource, Tier } from "@/lib/schema";
import { Icon, TierGlyph } from "./Icon";

const chip =
  "inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-4 whitespace-nowrap";

export function Chip({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <span className={cn(chip, "border-line text-fg-muted", className)} title={title}>
      {children}
    </span>
  );
}

/** Evidence tier chip. Never a generic "verified" badge: always the tier name. */
export function TierChip({ tier, prefix, compact = false }: { tier: Tier; prefix?: string; compact?: boolean }) {
  return (
    <span className={cn(chip, "border-line text-fg")} title={`${TIER_SHORT[tier]}: ${TIER_LABEL[tier]}`}>
      <TierGlyph tier={tier} />
      <span>
        {prefix ? <span className="text-fg-subtle">{prefix} </span> : null}
        {compact ? TIER_SHORT[tier] : TIER_LABEL[tier]}
      </span>
    </span>
  );
}

/** Origin chip. Unknown and not-yet-verified are shown as plainly as a known country. */
export function OriginChip({ country, tier }: { country: string; tier?: Tier | null }) {
  const known = isOriginKnown(country);
  return (
    <span
      className={cn(chip, known ? "border-line text-fg" : "border-dashed border-line-strong text-fg-muted")}
      title={known && tier ? `Origin backed by ${TIER_LABEL[tier].toLowerCase()}` : undefined}
    >
      <Icon name="pin" size={12} />
      <span>
        <span className="text-fg-subtle">Origin: </span>
        {originLabel(country)}
      </span>
      {known && tier ? (
        <span className="flex items-center text-fg-subtle">
          <TierGlyph tier={tier} size={12} />
          <span className="sr-only">, backed by {TIER_LABEL[tier].toLowerCase()}</span>
        </span>
      ) : null}
    </span>
  );
}

export function SampleDataTag({ show = true, className }: { show?: boolean; className?: string }) {
  if (!show || !USE_PLACEHOLDER_DATA) return null;
  return (
    <span
      className={cn(chip, "border-dashed border-fg-subtle text-fg-muted uppercase tracking-wide", className)}
      title="Fictional placeholder data. Not a real supplier or a real claim."
    >
      Sample data
    </span>
  );
}

export function ModelSourceBadge({ source, withDisclaimer = true }: { source: ModelSource | null; withDisclaimer?: boolean }) {
  if (!source) {
    return (
      <span className={cn(chip, "border-dashed border-line-strong text-fg-muted")}>
        <Icon name="cube" size={12} />
        No 3D model yet
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className={cn(chip, "border-line bg-bg/70 text-fg backdrop-blur")}>
        <Icon name="cube" size={12} />
        {MODEL_SOURCE_LABEL[source]}
      </span>
      {source === "illustrative" && withDisclaimer ? (
        <span className="text-xs text-fg-muted">{ILLUSTRATIVE_DISCLAIMER}</span>
      ) : null}
    </span>
  );
}

/** "Last verified" with a visible stale state after STALE_AFTER_MONTHS. */
export function LastVerified({ date, label = "Last verified" }: { date: string; label?: string }) {
  const stale = isStale(date);
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", stale ? "text-fg" : "text-fg-subtle")}>
      <Icon name={stale ? "alert" : "clock"} size={14} />
      <span>
        {label} <time dateTime={date}>{formatDate(date)}</time>
        {stale ? <strong className="ml-1 font-semibold">Over 12 months old, may be out of date</strong> : null}
      </span>
    </span>
  );
}
