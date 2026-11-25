import * as THREE from "three";

/**
 * Render material library for procedural parts. Keys are referenced from the
 * manifest's `material` field and from inside the procedural generators.
 * GLB parts keep their own materials.
 */
type Def = { color: string; metalness: number; roughness: number; clearcoat?: number };

const DEFS: Record<string, Def> = {
  aluminium: { color: "#b9bdc4", metalness: 0.85, roughness: 0.32 },
  "aluminium-dark": { color: "#3d4046", metalness: 0.75, roughness: 0.42 },
  "silicon-steel": { color: "#7a7e86", metalness: 0.8, roughness: 0.48 },
  copper: { color: "#c47b45", metalness: 0.95, roughness: 0.3 },
  magnet: { color: "#9a9da3", metalness: 0.9, roughness: 0.22 },
  "magnet-alt": { color: "#7f8288", metalness: 0.9, roughness: 0.26 },
  steel: { color: "#c9cdd3", metalness: 0.8, roughness: 0.28 },
  "steel-polished": { color: "#d4d8de", metalness: 0.75, roughness: 0.22 },
  "steel-dark": { color: "#34373c", metalness: 0.8, roughness: 0.38 },
  silicone: { color: "#1f2023", metalness: 0, roughness: 0.75 },
  "seal-rubber": { color: "#18191b", metalness: 0, roughness: 0.85 },
  insulation: { color: "#2d3036", metalness: 0.1, roughness: 0.6 },
  carbon: { color: "#1d1e21", metalness: 0.35, roughness: 0.3, clearcoat: 1 },
};

export function makeMaterial(key: string): THREE.MeshPhysicalMaterial {
  const d = DEFS[key] ?? DEFS.aluminium!;
  const m = new THREE.MeshPhysicalMaterial({
    color: d.color,
    metalness: d.metalness,
    roughness: d.roughness,
    clearcoat: d.clearcoat ?? 0,
    clearcoatRoughness: 0.25,
    side: THREE.DoubleSide,
  });
  m.userData.baseEmissive = new THREE.Color("#000000");
  return m;
}

/** One material cache per part, so each part fades and highlights on its own. */
export type MaterialCache = {
  get: (key: string) => THREE.MeshPhysicalMaterial;
  all: () => THREE.Material[];
  register: (m: THREE.Material) => void;
  dispose: () => void;
};

export function createMaterialCache(): MaterialCache {
  const map = new Map<string, THREE.MeshPhysicalMaterial>();
  const extra = new Set<THREE.Material>();
  return {
    get(key) {
      let m = map.get(key);
      if (!m) {
        m = makeMaterial(key);
        map.set(key, m);
      }
      return m;
    },
    all: () => [...map.values(), ...extra],
    register: (m) => {
      extra.add(m);
    },
    dispose() {
      map.forEach((m) => m.dispose());
      extra.forEach((m) => m.dispose());
      map.clear();
      extra.clear();
    },
  };
}
