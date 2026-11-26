import Link from "next/link";
import type { CatalogItem } from "@/lib/content";
import { formatSpecValue } from "@/lib/format";
import { Chip, OriginChip, SampleDataTag, TierChip } from "@/components/ui/Chips";
import { Icon } from "@/components/ui/Icon";
import { CategoryArt } from "./CategoryArt";

export function ProductCard({ item, singular }: { item: CatalogItem; singular: string }) {
  const keySpecs = item.specs.slice(0, 3);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-bg-elev transition-[border-color,transform] duration-300 ease-out hover:border-line-strong focus-within:border-line-strong">
      <div className="relative aspect-[12/7] bg-bg-subtle p-6">
        <CategoryArt category={item.category} label={singular} />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <SampleDataTag show={item.placeholder} className="bg-bg-elev" />
        </div>
        {item.modelSource ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-bg-elev px-2 py-0.5 text-xs text-fg-muted">
            <Icon name="cube" size={12} /> Interactive 3D
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center justify-between gap-3 text-xs text-fg-subtle">
          <span className="code-text font-medium text-fg-muted">{item.code}</span>
          <span className="code-text truncate">{item.supplierCode}</span>
        </p>
        <h3 className="mt-1 text-base font-semibold leading-snug">
          <Link href={`/parts/${item.id}`} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-accent">
            {item.name}
          </Link>
        </h3>
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
          {keySpecs.map((s) => (
            <div key={s.key} className="min-w-0">
              <dt className="truncate text-xs text-fg-subtle">{s.label}</dt>
              <dd className="tabular mt-0.5 truncate text-sm font-medium">{formatSpecValue(s.value, s.unit)}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
          <TierChip tier={item.highestTier} prefix="Highest:" compact />
          <OriginChip country={item.originCountry} tier={item.originTier} />
          {item.partCount > 0 ? <Chip>{item.partCount} parts explained</Chip> : null}
        </div>
      </div>
    </article>
  );
}
