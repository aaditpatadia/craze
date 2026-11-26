import { z } from "zod";

/**
 * Content schemas. Every file under /content and every model manifest under
 * /public/assets/models is parsed with these at build time (scripts/validate-content.ts).
 * The honesty rules of the site live here as types, so breaking one breaks the build.
 */

import { ILLUSTRATIVE_DISCLAIMER } from "./constants";
export { ILLUSTRATIVE_DISCLAIMER, ORIGIN_UNKNOWN, ORIGIN_NOT_VERIFIED } from "./constants";

const isoDate = z.iso.date();
const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "ids are lowercase kebab-case");

export const ModelSourceSchema = z.enum(["supplier-cad", "scanned-sample", "illustrative"]);
export type ModelSource = z.infer<typeof ModelSourceSchema>;

export const LayerSchema = z.enum(["moving", "electrical", "magnetic", "structural", "thermal"]);
export type Layer = z.infer<typeof LayerSchema>;

/** "unknown" and "not-yet-verified" are first-class values, never hidden. */
export const OriginSchema = z.string().min(2);

export const TierSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type Tier = z.infer<typeof TierSchema>;
/** A tier as shown to people: 0 means nothing has been checked yet. */
export type ShownTier = Tier | 0;

export const DocumentSchema = z.object({
  title: z.string().min(1),
  received: isoDate,
  url: z.string().nullable(),
});

export const MeasurementSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  unit: z.string().nullable(),
  method: z.string().min(1),
});

export const EvidenceSchema = z
  .object({
    id,
    tier: TierSchema,
    summary: z.string().min(1),
    checked: z.array(z.string().min(1)).min(1),
    /** The stated limit. Required: no claim without saying what was not checked. */
    notChecked: z.array(z.string().min(1)).min(1),
    date: isoDate,
    checkedBy: z.string().min(1),
    documentUrl: z.string().nullable(),
    documents: z.array(DocumentSchema).default([]),
    measurements: z.array(MeasurementSchema).default([]),
    lab: z.string().nullable().default(null),
  })
  .superRefine((e, ctx) => {
    if (e.tier === 1 && e.documents.length === 0) {
      ctx.addIssue({ code: "custom", message: `evidence ${e.id}: tier 1 needs at least one received document` });
    }
    if (e.tier === 2 && e.measurements.length === 0) {
      ctx.addIssue({ code: "custom", message: `evidence ${e.id}: tier 2 must list what was measured` });
    }
    if (e.tier === 3 && (!e.documentUrl || !e.lab)) {
      ctx.addIssue({ code: "custom", message: `evidence ${e.id}: tier 3 needs a lab name and an attached report` });
    }
  });
export type Evidence = z.infer<typeof EvidenceSchema>;

export const SpecSchema = z.object({
  key: id,
  label: z.string().min(1),
  value: z.union([z.number(), z.string()]),
  unit: z.string().nullable(),
  /** Every spec is a claim and points at the evidence behind it. */
  evidenceId: id,
  /** Acceptance band printed on the build sheet, for example "plus or minus 5 percent". */
  tolerance: z.string().nullable().default(null),
});
export type Spec = z.infer<typeof SpecSchema>;

export const PartSchema = z.object({
  id,
  name: z.string().min(1),
  role: z.string().min(1),
  whatItDoes: z.string().min(1),
  whyItMatters: z.string().min(1),
  material: z.string().min(1),
  /** Only set when the supplier documents it. null renders "Grade not stated". */
  grade: z.string().nullable(),
  gradeEvidenceId: id.nullable().default(null),
  originCountry: OriginSchema,
  originEvidenceId: id.nullable(),
  layers: z.array(LayerSchema).min(1),
  explode: z.object({
    order: z.number().int().min(0),
    axis: z.tuple([z.number(), z.number(), z.number()]).optional(),
    distance: z.number().optional(),
  }),
  specs: z.array(SpecSchema).default([]),
  appliesTo: z.array(z.string().min(1)).min(1),
  buyingChecks: z.array(z.string().min(1)).min(3).max(5),
  evidence: z.array(EvidenceSchema).default([]),
  interactsWith: z.array(id).default([]),
});
export type Part = z.infer<typeof PartSchema>;

export const PhotoSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().min(1),
  takenOn: isoDate,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const PhotoSpinSchema = z.object({
  /** 24 to 72 photos of the actual sample on a turntable, in rotation order. */
  frames: z.array(z.string().min(1)).min(24).max(72),
  capturedOn: isoDate,
  modelSource: z.literal("scanned-sample"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

/**
 * Timule part number: TM, a three letter category code, one or more spec segments
 * and a revision letter. Buyers order by it and suppliers build to it.
 */
export const PART_CODE = /^TM-[A-Z]{3}(?:-[A-Z0-9]+)+-[A-Z]$/;

export const SourceSchema = z.object({ title: z.string().min(1), url: z.url() });

export const DemandSchema = z.object({
  /** Who buys this, in plain words. */
  buyers: z.array(z.string().min(1)).min(1),
  /** Why we list it. Only what the sources below support. */
  reason: z.string().min(1),
  sources: z.array(SourceSchema).min(1, "a demand claim needs a source"),
});
export type Demand = z.infer<typeof DemandSchema>;

export const ProductSchema = z.object({
  id,
  code: z.string().regex(PART_CODE, "part codes look like TM-MOT-2807-1300-A"),
  name: z.string().min(1),
  category: id,
  supplierId: id,
  placeholder: z.boolean(),
  status: z.enum(["live", "upcoming"]),
  summary: z.string().min(1),
  /** null means no 3D model or photo spin exists yet, which the UI states plainly. */
  modelSource: ModelSourceSchema.nullable(),
  /** Shown when a product has no internal parts to list, for example a one-piece moulding. */
  partsNote: z.string().nullable().default(null),
  specs: z.array(SpecSchema).min(1),
  parts: z.array(PartSchema).default([]),
  applications: z.array(z.string().min(1)).min(1),
  evidence: z.array(EvidenceSchema).min(1, "every product needs an evidence block"),
  origin: z.object({ country: OriginSchema, evidenceId: id.nullable() }),
  lastVerified: isoDate,
  keywords: z.array(z.string()).default([]),
  photos: z.array(PhotoSchema).default([]),
  photoSpin: PhotoSpinSchema.nullable().default(null),
  /** Copy the internal part descriptions from a sibling product. Part-level claims are not copied. */
  partsFrom: id.nullable().default(null),
  demand: DemandSchema,
  /** The current supplier's own part number. Cross-referenced on the build sheet; buyers order by `code`. */
  supplierPartNumber: z.string().nullable().default(null),
});
export type Product = z.infer<typeof ProductSchema>;

export const SectorSchema = z.enum(["aerial", "robotics", "compute", "energy"]);
export type Sector = z.infer<typeof SectorSchema>;

export const CategorySchema = z.object({
  id,
  /** The three letters after TM- in every part code of this category. */
  code: z.string().regex(/^[A-Z]{3}$/),
  sector: SectorSchema,
  name: z.string().min(1),
  singular: z.string().min(1),
  status: z.enum(["live", "upcoming"]),
  family: z.string().min(1),
  order: z.number().int(),
  summary: z.string().min(1),
  whyItMatters: z.string().min(1),
  filters: z
    .array(z.object({ specKey: id, label: z.string(), unit: z.string().nullable() }))
    .default([]),
  /** Printed on every build sheet in this category: how we accept a delivery. */
  acceptance: z.array(z.string().min(1)).default([]),
  /** Documents a supplier sends with a quote in this category. */
  documents: z.array(z.string().min(1)).default([]),
});
export type Category = z.infer<typeof CategorySchema>;

export const SupplierSchema = z.object({
  id,
  /** Timule supplier code, printed on purchase orders. */
  code: z.string().regex(/^TMS-\d{3}$/),
  name: z.string().min(1),
  placeholder: z.boolean(),
  city: z.string().min(1),
  country: z.string().min(1),
  summary: z.string().min(1),
  parts: z.array(id),
  documentsReceived: z.array(DocumentSchema),
  checked: z.array(z.string().min(1)).min(1),
  notChecked: z.array(z.string().min(1)).min(1),
  sampleReceived: z.object({ received: z.boolean(), date: isoDate.nullable() }),
  factoryChecked: z.object({
    status: z.enum(["on-site", "remote", "not-checked"]),
    date: isoDate.nullable(),
    by: z.string().nullable(),
  }),
  leadTimeDays: z.object({ min: z.number().int().positive(), max: z.number().int().positive() }),
  minOrder: z.object({ quantity: z.number().int().positive(), unit: z.string() }),
  contactRole: z.string().min(1),
  lastVerified: isoDate,
});
export type Supplier = z.infer<typeof SupplierSchema>;

const vec3 = z.tuple([z.number(), z.number(), z.number()]);

/**
 * Data-only geometry for illustrative models, in millimetres, Y up.
 * box d=[w,h,depth,cornerRadius?], cyl d=[rBottom,h,rTop?], tube d=[rIn,rOut,h],
 * torus d=[radius,tube], sphere d=[r]. Rotations are in degrees.
 * repeat copies the shape n times, moving by step and turning about the part origin by turn.
 */
export const ShapeSchema = z.object({
  type: z.enum(["box", "cyl", "tube", "torus", "sphere"]),
  d: z.array(z.number().nonnegative()).min(1).max(4),
  pos: vec3.default([0, 0, 0]),
  rot: vec3.default([0, 0, 0]),
  mat: z.string().min(1),
  repeat: z
    .object({ n: z.number().int().min(1).max(256), step: vec3.default([0, 0, 0]), turn: vec3.default([0, 0, 0]) })
    .nullable()
    .default(null),
});
export type Shape = z.infer<typeof ShapeSchema>;

export const ManifestPartSchema = z.object({
  id,
  name: z.string().min(1),
  /** Path to the part GLB (Draco compressed), in assembled coordinates. */
  glb: z.string().nullable(),
  /** Optional higher-detail GLB, loaded when the user zooms in close. */
  glbDetail: z.string().nullable().default(null),
  /** Key into the procedural generator. Used only while glb is null. */
  procedural: z.string().nullable().default(null),
  /** Data-only illustrative geometry. Used only while glb and procedural are null. */
  shapes: z.array(ShapeSchema).default([]),
  axis: vec3,
  /** In multiples of the assembled model's bounding radius. */
  distance: z.number().min(0),
  order: z.number().int().min(0),
  layers: z.array(LayerSchema).min(1),
  /** Render material key for procedural parts, or an override for GLB parts. */
  material: z.string().min(1),
  parent: id.nullable(),
  modelSource: ModelSourceSchema,
  assemblyCaption: z.string().min(1),
  hotspots: z
    .array(z.object({ id, label: z.string(), text: z.string(), position: vec3 }))
    .default([]),
});
export type ManifestPart = z.infer<typeof ManifestPartSchema>;

export const ManifestSchema = z
  .object({
    productId: id,
    modelSource: ModelSourceSchema,
    disclaimer: z.string().nullable(),
    assembledGlb: z.string().nullable(),
    procedural: z
      .object({ generator: z.string(), params: z.record(z.string(), z.number()) })
      .nullable()
      .default(null),
    camera: z.object({ position: vec3, target: vec3 }).default({ position: [3.2, 2.4, 4.2], target: [0, 0, 0] }),
    parts: z.array(ManifestPartSchema).min(1),
  })
  .superRefine((m, ctx) => {
    const sources = [m.modelSource, ...m.parts.map((p) => p.modelSource)];
    if (sources.includes("illustrative") && m.disclaimer !== ILLUSTRATIVE_DISCLAIMER) {
      ctx.addIssue({
        code: "custom",
        message: `manifest ${m.productId}: illustrative models must carry the disclaimer "${ILLUSTRATIVE_DISCLAIMER}"`,
      });
    }
    for (const p of m.parts) {
      if (!p.glb && !p.procedural && p.shapes.length === 0) {
        ctx.addIssue({ code: "custom", message: `manifest part ${p.id}: needs a glb path, a procedural key or shapes` });
      }
      if ((p.procedural || p.shapes.length > 0) && !p.glb && p.modelSource !== "illustrative") {
        ctx.addIssue({ code: "custom", message: `manifest part ${p.id}: procedural parts must be modelSource "illustrative"` });
      }
    }
  });
export type Manifest = z.infer<typeof ManifestSchema>;

/**
 * Where we are in finding a maker for each listed part. Real company names live here,
 * and are never shown to buyers: the site lists makers by TMS code only. consented records whether the maker agreed to work with us.
 */
export const SourcingStatusSchema = z.enum(["searching", "candidates", "contacted", "sample-requested", "qualified"]);
export type SourcingStatus = z.infer<typeof SourcingStatusSchema>;

export const SourcingSchema = z.object({
  productId: id,
  status: SourcingStatusSchema,
  updated: isoDate,
  candidates: z
    .array(
      z.object({
        name: z.string().min(1),
        city: z.string().nullable(),
        url: z.url(),
        /** What the company says publicly that makes it a candidate. Their claim, not ours. */
        basis: z.string().min(1),
        consented: z.boolean(),
      }),
    )
    .default([]),
});
export type Sourcing = z.infer<typeof SourcingSchema>;
