import { bldcOutrunner } from "./bldcOutrunner";
import { foldingProp } from "./foldingProp";
import type { Generator } from "./types";

/** Procedural generators referenced by manifest.procedural.generator. */
export const GENERATORS: Record<string, Generator> = {
  "bldc-outrunner": bldcOutrunner,
  "folding-prop": foldingProp,
};
