# Component catalogue

A catalogue of drone parts where every claim shows its evidence tier, date, checker and
stated limits, with an interactive exploded 3D view of each part.

Next.js (App Router) and TypeScript, Tailwind CSS 4, React Three Fiber and drei,
Framer Motion, Zod. Static pages plus two API routes. Deploys to Vercel as is.

## Run it

```bash
npm install          # also copies the Draco decoder into public/draco
npm run dev          # http://localhost:3000
npm run check        # type check, lint, content validation and production build
```

`npm run build` always runs `npm run validate` first, so broken content cannot ship.

## Where things live

| Path | What it holds |
| --- | --- |
| `lib/config.ts` | Brand name, `USE_PLACEHOLDER_DATA`, stale threshold, navigation |
| `lib/schema.ts` | Zod schemas. The honesty rules are encoded here |
| `content/categories.json` | Every category, live or upcoming, with its filters |
| `content/suppliers.json` | Supplier profiles |
| `content/products/*.json` | One file per product, including its internal parts and evidence |
| `public/assets/models/{productId}/manifest.json` | The 3D model description for a product |
| `scripts/validate-content.ts` | Cross-file checks run before every build |
| `scripts/convert-step-to-glb.md` | Supplier CAD to optimised GLB |
| `components/viewer/` | The 3D viewer, parts panel, static fallback |

## Sample data

Every supplier, lab, figure and evidence record in this repository is fictional. Each is
marked `"placeholder": true` and shown with a visible "Sample data" tag, plus a site-wide
banner. Set `USE_PLACEHOLDER_DATA = false` in `lib/config.ts` to remove every placeholder
record from the site. Pages then show their empty states.

The brand name "Verkod" is set in `lib/config.ts`. The legal pages are
placeholders and must be replaced before launch.

## How to add a category

Add an entry to `content/categories.json`. No code changes.

- `status: "upcoming"` lists it on the upcoming page with a notify form.
- `status: "live"` gives it a catalogue page. Add `filters` for numeric specs you want as
  range filters; each `specKey` must match a spec `key` used by its products.
- The card drawing comes from `components/catalog/CategoryArt.tsx`; a new category without
  a drawing gets a neutral placeholder shape.

## How to add a product

1. Add the supplier to `content/suppliers.json` if it is new, and add the product id to the
   supplier's `parts` list.
2. Create `content/products/{id}.json`. Copy an existing product as a template.
3. Fill in `specs`. Each spec points at an `evidenceId`; that evidence must exist on the
   product or one of its parts.
4. Fill in `origin`. Use a country only when an evidence record backs it. Otherwise use
   `"unknown"` (nobody has told us) or `"not-yet-verified"` (we have a lead, not checked).
5. Add `parts` in assembly order (`explode.order` 0, 1, 2 and so on). For each part, `grade`
   stays `null` unless the supplier documents it, in which case set `gradeEvidenceId`.
6. Set `modelSource` to `null` if there is no 3D model or photo set yet.
7. Run `npm run validate`.

## How to add an evidence record

Add an object to a product's or a part's `evidence` array:

```json
{
  "id": "ev-hm2807-sample",
  "tier": 2,
  "summary": "One production sample measured on our bench.",
  "checked": ["KV, mass and phase resistance on one sample"],
  "notChecked": ["More than one sample", "Performance under heat"],
  "date": "2026-07-18",
  "checkedBy": "Inspection team",
  "documentUrl": null,
  "documents": [],
  "measurements": [
    { "label": "KV", "value": "1288", "unit": "rpm/V", "method": "Unloaded at 16.8 V, optical tachometer" }
  ],
  "lab": null
}
```

Rules enforced at build time:

- `notChecked` must have at least one entry. No claim without a stated limit.
- `date` is required and cannot be in the future. Records older than 12 months are marked stale.
- Tier 1 needs at least one received document. Tier 2 needs at least one measurement with
  its method. Tier 3 needs a lab name and an attached report in `public/`.
- Every spec, known origin and stated grade must reference an evidence record that exists.
- Copy cannot contain em dashes or phrases such as "guaranteed compliant", "certified by us"
  or "best in class".

## How to add real CAD

Follow `scripts/convert-step-to-glb.md`. In short: export one GLB per part in assembled
position, Draco-compress them, put them in `public/assets/models/{productId}/`, then edit only
that product's `manifest.json`: set each part's `glb`, set `procedural` to `null`, set
`modelSource` to `"supplier-cad"` and `disclaimer` to `null`.

### Manifest fields

| Field | Meaning |
| --- | --- |
| `modelSource` | `supplier-cad`, `scanned-sample` or `illustrative`. Shown as a badge on the viewer |
| `disclaimer` | Required text for illustrative models |
| `parts[].glb` / `glbDetail` | Part model, and an optional close-up model loaded on zoom |
| `parts[].procedural` | Key into the procedural generator, used only while `glb` is null |
| `parts[].axis` / `distance` | Explode direction, and distance in multiples of the model's bounding radius |
| `parts[].order` | Assembly order. Must match the part's `explode.order` in content |
| `parts[].layers` | Any of `moving`, `electrical`, `magnetic`, `structural`. Must match content |
| `parts[].assemblyCaption` | One line shown during "Play assembly" |
| `parts[].hotspots` | Labelled points shown when zoomed in; also listed in the part panel as text |

## Forms

`/api/request` and `/api/notify` validate with the same rules as the browser, drop spam
silently (hidden honeypot field plus a minimum fill time), and rate-limit by IP.

- With `RESEND_API_KEY` and `SUBMISSIONS_EMAIL_TO` set (and optionally
  `SUBMISSIONS_EMAIL_FROM`), submissions are emailed through Resend.
- Otherwise they are appended to `.data/submissions.jsonl`. On Vercel that falls back to
  `/tmp`, which is temporary: set the Resend variables for production.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap and JSON-LD |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Enables Plausible analytics (cookie-free) |
| `RESEND_API_KEY`, `SUBMISSIONS_EMAIL_TO`, `SUBMISSIONS_EMAIL_FROM` | Email delivery for forms |

Analytics events: `Part opened`, `Explode used`, `BOM uploaded`, `Request submitted`,
`Notify submitted`. No personal data is sent with them.

## 3D viewer behaviour

- Loads after first paint, when the browser is idle, behind a skeleton and progress bar.
- Pauses rendering when off screen or when the tab is hidden; lowers pixel ratio when the
  frame rate drops.
- Falls back to a static diagram generated from the manifest when WebGL is unavailable, and
  offers it (with a "Load 3D view anyway" button) on low-power devices or Save-Data.
- The parts list beside the viewer mirrors its state and is the keyboard and screen reader
  path: Tab moves through parts in assembly order, Enter opens a part, Escape closes.
- Viewer keys: arrows rotate, Shift and arrows pan, plus and minus zoom, R resets. Double
  click or double tap resets.
- With reduced motion, the turntable stops, camera moves are instant and "Play assembly"
  steps through parts without tweening.
