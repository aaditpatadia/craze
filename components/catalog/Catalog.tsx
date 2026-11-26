"use client";

import { useRouter } from "next/navigation";
import { useUrlSearch } from "@/lib/useUrlSearch";
import { useId, useMemo, useState, useSyncExternalStore } from "react";
import type { CatalogItem } from "@/lib/content";
import { SECTOR_LABEL, TIER_LABEL, originLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ProductCard } from "./ProductCard";

export type CatalogCategory = {
  id: string;
  sector: string;
  name: string;
  singular: string;
  filters: { specKey: string; label: string; unit: string | null }[];
};

type Props = {
  items: CatalogItem[];
  categories: CatalogCategory[];
  /** When set, the page is a category page and the category filter navigates between them. */
  fixedCategory?: string;
};

const ORIGIN_ORDER = (a: string, b: string) => {
  const rank = (o: string) => (o === "unknown" ? 2 : o === "not-yet-verified" ? 1 : 0);
  return rank(a) - rank(b) || a.localeCompare(b);
};

const noopSubscribe = () => () => {};
const num = (v: number | string) => (typeof v === "number" ? v : Number.NaN);

export function Catalog({ items, categories, fixedCategory }: Props) {
  const [params, replaceParams] = useUrlSearch();
  // False during hydration, true after: remounts the range inputs once so they show URL values.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const router = useRouter();
  const ids = useId();
  // Bumped when filters are cleared, to reset the uncontrolled range inputs.
  const [resetKey, setResetKey] = useState(0);

  const category = fixedCategory ?? params.get("category") ?? "";
  const origins = params.getAll("origin");
  const minTier = Number(params.get("tier") ?? 0);
  const query = (params.get("q") ?? "").trim().toLowerCase();
  const queryCode = query.replace(/[^a-z0-9]/g, "");
  const activeCategory = categories.find((c) => c.id === category);

  const setParams = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    replaceParams(next);
  };

  const inCategory = useMemo(() => (category ? items.filter((i) => i.category === category) : items), [items, category]);

  const originOptions = useMemo(() => [...new Set(inCategory.map((i) => i.originCountry))].sort(ORIGIN_ORDER), [inCategory]);

  const ranges = useMemo(
    () =>
      (activeCategory?.filters ?? []).map((f) => {
        const values = inCategory.map((i) => num(i.specs.find((s) => s.key === f.specKey)?.value ?? Number.NaN)).filter(Number.isFinite);
        return { ...f, min: values.length ? Math.min(...values) : 0, max: values.length ? Math.max(...values) : 0, count: values.length };
      }),
    [activeCategory, inCategory],
  );

  const results = useMemo(
    () =>
      inCategory.filter((i) => {
        if (query) {
          const hay = [i.name, i.code, ...i.keywords, i.categoryName].join(" ").toLowerCase();
          const codes = [i.code].map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ""));
          const words = query.split(/\s+/).filter(Boolean);
          const byCode = queryCode.length >= 3 && codes.some((c) => c.includes(queryCode));
          if (!byCode && !words.every((w) => hay.includes(w))) return false;
        }
        if (origins.length && !origins.includes(i.originCountry)) return false;
        if (minTier && i.highestTier < minTier) return false;
        for (const r of ranges) {
          const lo = params.get(`${r.specKey}_min`);
          const hi = params.get(`${r.specKey}_max`);
          if (!lo && !hi) continue;
          const v = num(i.specs.find((s) => s.key === r.specKey)?.value ?? Number.NaN);
          if (!Number.isFinite(v)) return false;
          if (lo && v < Number(lo)) return false;
          if (hi && v > Number(hi)) return false;
        }
        return true;
      }),
    [inCategory, origins, minTier, ranges, params, query, queryCode],
  );

  const activeFilterCount = (query ? 1 : 0) + origins.length + (minTier ? 1 : 0) + ranges.filter((r) => params.get(`${r.specKey}_min`) || params.get(`${r.specKey}_max`)).length;

  const clearAll = () => {
    setResetKey((k) => k + 1);
    setParams((p) => {
      for (const k of [...p.keys()]) if (k !== "category") p.delete(k);
    });
  };

  const singularFor = (id: string) => categories.find((c) => c.id === id)?.singular ?? "part";

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
      <aside className="lg:col-span-3" aria-label="Filters">
        <div className="lg:sticky lg:top-24">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Filters</h2>
            {activeFilterCount > 0 ? (
              <button type="button" onClick={clearAll} className="min-h-11 rounded-md px-2 text-sm text-accent hover:underline">
                Clear {activeFilterCount}
              </button>
            ) : null}
          </div>

          <div className="mt-4 space-y-8">
            <div key={`q-${resetKey}-${hydrated}`}>
              <label htmlFor={`${ids}-q`} className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                Search
              </label>
              <input
                id={`${ids}-q`}
                type="search"
                placeholder="Name or TM code"
                defaultValue={params.get("q") ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setParams((p) => (v.trim() ? p.set("q", v) : p.delete("q")));
                }}
                className="mt-2 h-11 w-full rounded-md border border-line bg-bg-elev px-3 text-sm text-fg placeholder:text-fg-subtle"
              />
            </div>
            <div>
              <label htmlFor={`${ids}-cat`} className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                Category
              </label>
              <select
                id={`${ids}-cat`}
                value={category}
                onChange={(e) => {
                  const v = e.target.value;
                  if (fixedCategory !== undefined) router.push(v ? `/categories/${v}` : "/parts");
                  else
                    setParams((p) => {
                      for (const k of [...p.keys()]) p.delete(k);
                      if (v) p.set("category", v);
                    });
                }}
                className="mt-2 h-11 w-full rounded-md border border-line bg-bg-elev px-3 text-sm text-fg"
              >
                <option value="">All live categories</option>
                {[...new Set(categories.map((c) => c.sector))].map((sector) => (
                  <optgroup key={sector} label={SECTOR_LABEL[sector] ?? sector}>
                    {categories
                      .filter((c) => c.sector === sector)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <fieldset>
              <legend className="text-xs font-medium uppercase tracking-wide text-fg-subtle">Origin</legend>
              <ul className="mt-2 space-y-0.5">
                {originOptions.map((o) => {
                  const checked = origins.includes(o);
                  return (
                    <li key={o}>
                      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          className="size-4 accent-[var(--accent)]"
                          checked={checked}
                          onChange={() =>
                            setParams((p) => {
                              const cur = p.getAll("origin");
                              p.delete("origin");
                              (checked ? cur.filter((x) => x !== o) : [...cur, o]).forEach((x) => p.append("origin", x));
                            })
                          }
                        />
                        <span className={cn(o === "unknown" || o === "not-yet-verified" ? "text-fg-muted" : "text-fg")}>{originLabel(o)}</span>
                        <span className="tabular ml-auto text-xs text-fg-subtle">{inCategory.filter((i) => i.originCountry === o).length}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>

            <fieldset>
              <legend className="text-xs font-medium uppercase tracking-wide text-fg-subtle">Evidence, at least</legend>
              <ul className="mt-2 space-y-0.5">
                {[0, 1, 2, 3].map((t) => (
                  <li key={t}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="radio"
                        name={`${ids}-tier`}
                        className="size-4 accent-[var(--accent)]"
                        checked={minTier === t}
                        onChange={() => setParams((p) => (t ? p.set("tier", String(t)) : p.delete("tier")))}
                      />
                      {t === 0 ? "Any tier" : `Tier ${t}: ${TIER_LABEL[t as 1 | 2 | 3]}`}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

            {ranges.length > 0 ? (
              <div className="space-y-6" key={`${category}-${resetKey}-${hydrated}`}>
                {ranges.map((r) => (
                  <fieldset key={r.specKey}>
                    <legend className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                      {r.label}
                      {r.unit ? <span className="normal-case"> ({r.unit})</span> : null}
                    </legend>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {(["min", "max"] as const).map((side) => (
                        <label key={side} className="text-xs text-fg-subtle">
                          {side === "min" ? "From" : "To"}
                          <input
                            type="number"
                            inputMode="decimal"
                            placeholder={String(side === "min" ? r.min : r.max)}
                            defaultValue={params.get(`${r.specKey}_${side}`) ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setParams((p) => (v ? p.set(`${r.specKey}_${side}`, v) : p.delete(`${r.specKey}_${side}`)));
                            }}
                            className="tabular mt-1 h-11 w-full rounded-md border border-line bg-bg-elev px-3 text-sm text-fg"
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            ) : (
              <p className="text-xs text-fg-subtle">Choose a category to filter by specs.</p>
            )}
          </div>
        </div>
      </aside>

      <section className="lg:col-span-9" aria-labelledby={`${ids}-results`}>
        <h2 id={`${ids}-results`} className="sr-only">
          Results
        </h2>
        <p className="text-sm text-fg-subtle" aria-live="polite">
          {results.length === 1 ? "1 part" : `${results.length} parts`}
          {activeCategory ? ` in ${activeCategory.name}` : ""}
        </p>
        {results.length > 0 ? (
          <ul className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((i) => (
              <li key={i.id} className="flex">
                <div className="flex w-full">
                  <ProductCard item={i} singular={singularFor(i.category)} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-line-strong px-6 py-16 text-center">
            <Icon name="search" size={24} className="mx-auto text-fg-subtle" />
            <p className="mt-4 font-medium">No parts match these filters</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-fg-subtle">
              Widen a range or clear a filter. If you need something we do not list, we can look for it.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {activeFilterCount > 0 ? (
                <button type="button" onClick={clearAll} className="min-h-11 rounded-full border border-line-strong/60 px-5 text-sm hover:bg-bg-subtle">
                  Clear filters
                </button>
              ) : null}
              <LinkButton href="/request" variant="primary">
                Request sourcing
              </LinkButton>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
