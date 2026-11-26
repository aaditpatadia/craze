import { LAYER_LABEL, TIER_LABEL, formatSpecValue, isOriginKnown, originLabel } from "@/lib/format";
import type { ResolvedPart } from "@/lib/viewer-data";
import { EvidenceList } from "@/components/evidence/EvidenceRecord";
import { Chip, OriginChip } from "@/components/ui/Chips";
import { Icon, TierGlyph } from "@/components/ui/Icon";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-5">
      <h3 className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{title}</h3>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

/** Everything we know about one internal part. Used in the 3D panel and the list view. */
export function PartDetails({
  part,
  neighbours,
  onSelectNeighbour,
}: {
  part: ResolvedPart;
  neighbours: { id: string; name: string }[];
  onSelectNeighbour?: (id: string) => void;
}) {
  const originKnown = isOriginKnown(part.originCountry);
  return (
    <div className="space-y-5 text-sm">
      <div className="flex flex-wrap gap-1.5">
        {part.layers.map((l) => (
          <Chip key={l}>{LAYER_LABEL[l]}</Chip>
        ))}
        <OriginChip country={part.originCountry} tier={part.originTier} />
      </div>

      <Block title="What it does">
        <p className="text-fg-muted">{part.whatItDoes}</p>
      </Block>

      <Block title="Why it matters for this product">
        <p className="text-fg-muted">{part.whyItMatters}</p>
      </Block>

      <Block title="Material">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <dt className="text-fg-subtle">Material</dt>
          <dd className="text-fg">{part.material}</dd>
          <dt className="text-fg-subtle">Grade</dt>
          <dd className="text-fg">
            {part.grade ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                {part.grade}
                {part.gradeTier ? (
                  <span className="inline-flex items-center gap-1 text-xs text-fg-subtle">
                    <TierGlyph tier={part.gradeTier} size={12} />
                    {TIER_LABEL[part.gradeTier]}
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="text-fg-muted">Grade not stated</span>
            )}
          </dd>
          <dt className="text-fg-subtle">Origin</dt>
          <dd className="text-fg">
            {originLabel(part.originCountry)}
            {originKnown && part.originTier ? (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-fg-subtle">
                <TierGlyph tier={part.originTier} size={12} />
                {TIER_LABEL[part.originTier]}
              </span>
            ) : null}
            {!originKnown ? (
              <p className="mt-1 text-xs text-fg-subtle">
                {part.originCountry === "unknown"
                  ? "The supplier did not tell us, and we have not traced it."
                  : "We have a supplier statement or lead, but have not checked it yet."}
              </p>
            ) : null}
          </dd>
        </dl>
      </Block>

      {part.specs.length > 0 ? (
        <Block title="Key specs">
          <table className="tabular w-full text-left">
            <caption className="sr-only">Key specs for {part.name}</caption>
            <tbody>
              {part.specs.map((s) => {
                const tier = part.specTiers[s.key] ?? 0;
                return (
                  <tr key={s.key} className="border-b border-line/60 last:border-0">
                    <th scope="row" className="py-2 pr-3 font-normal text-fg-subtle">
                      {s.label}
                    </th>
                    <td className="py-2 pr-3 font-medium text-fg">{formatSpecValue(s.value, s.unit)}</td>
                    <td className="py-2 text-right text-fg-subtle" title={TIER_LABEL[tier]}>
                      <span className="inline-flex items-center gap-1 text-xs">
                        <TierGlyph tier={tier} size={12} />
                        <span className="sr-only">{TIER_LABEL[tier]}</span>
                        <span aria-hidden="true">T{tier}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Block>
      ) : null}

      {part.hotspots.length > 0 ? (
        <Block title="Up close">
          <dl className="space-y-2">
            {part.hotspots.map((h) => (
              <div key={h.id}>
                <dt className="font-medium text-fg">{h.label}</dt>
                <dd className="text-fg-muted">{h.text}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-fg-subtle">Zoom in on the model to see these points marked.</p>
        </Block>
      ) : null}

      <Block title="Where this part applies">
        <ul className="flex flex-wrap gap-1.5">
          {part.appliesTo.map((a) => (
            <li key={a}>
              <Chip>{a}</Chip>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="What to check when buying">
        <ul className="space-y-2">
          {part.buyingChecks.map((c) => (
            <li key={c} className="flex gap-2 text-fg-muted">
              <Icon name="check" size={16} className="mt-0.5 shrink-0 text-fg-subtle" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Evidence">
        <EvidenceList items={part.relatedEvidence} compact headingLevel={4} />
      </Block>

      {neighbours.length > 0 ? (
        <Block title="Works with">
          <ul className="flex flex-wrap gap-2">
            {neighbours.map((n) => (
              <li key={n.id}>
                {onSelectNeighbour ? (
                  <button
                    type="button"
                    onClick={() => onSelectNeighbour(n.id)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line px-4 text-sm text-fg transition-colors duration-200 hover:border-line-strong hover:bg-bg-subtle"
                  >
                    {n.name}
                    <Icon name="arrowRight" size={14} />
                  </button>
                ) : (
                  <a href={`#part-${n.id}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm hover:bg-bg-subtle">
                    {n.name}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}
    </div>
  );
}
