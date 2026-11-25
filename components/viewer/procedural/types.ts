import type * as THREE from "three";
import type { ReactElement } from "react";

export type ProceduralPartProps = {
  /** Returns this part's own instance of a library material. */
  mat: (key: string) => THREE.Material;
  detail: "low" | "high";
  params: Record<string, number>;
};

export type ProceduralPart = (props: ProceduralPartProps) => ReactElement;

/** A generator maps the manifest's `procedural` keys to part components. */
export type Generator = Record<string, ProceduralPart>;
