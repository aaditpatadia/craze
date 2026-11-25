import type { Evidence, Manifest, Part, Product, Tier } from "./schema";

/** A part with its evidence resolved, ready to hand to client components. */
export type ResolvedPart = Part & {
  relatedEvidence: Evidence[];
  originTier: Tier | null;
  gradeTier: Tier | null;
  specTiers: Record<string, Tier>;
  hotspots: { id: string; label: string; text: string }[];
  inModel: boolean;
};

export function resolveParts(product: Product, manifest: Manifest | undefined): ResolvedPart[] {
  const pool = [...product.evidence, ...product.parts.flatMap((p) => p.evidence)];
  const find = (id: string | null) => (id ? pool.find((e) => e.id === id) : undefined);
  return [...product.parts]
    .sort((a, b) => a.explode.order - b.explode.order)
    .map((part) => {
      const refs = [part.originEvidenceId, part.gradeEvidenceId, ...part.specs.map((s) => s.evidenceId)];
      const related = new Map<string, Evidence>();
      part.evidence.forEach((e) => related.set(e.id, e));
      refs.forEach((id) => {
        const e = find(id);
        if (e) related.set(e.id, e);
      });
      const mp = manifest?.parts.find((m) => m.id === part.id);
      return {
        ...part,
        relatedEvidence: [...related.values()],
        originTier: find(part.originEvidenceId)?.tier ?? null,
        gradeTier: find(part.gradeEvidenceId)?.tier ?? null,
        specTiers: Object.fromEntries(part.specs.map((s) => [s.key, find(s.evidenceId)?.tier ?? 1])),
        hotspots: mp?.hotspots.map(({ id, label, text }) => ({ id, label, text })) ?? [],
        inModel: !!mp,
      };
    });
}
