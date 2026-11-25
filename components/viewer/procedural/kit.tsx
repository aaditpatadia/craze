"use client";

/**
 * Data-only illustrative geometry. A manifest part lists simple shapes (boxes,
 * cylinders, tubes, tori, spheres) in millimetres, so any category can have an
 * exploded model without a hand-written generator. Always labelled illustrative.
 */
import * as THREE from "three";
import type { Shape } from "@/lib/schema";
import { extrudeY, ringGeometry, roundedRectShape, useGeometry } from "./geometry";

const DEG = Math.PI / 180;

function buildGeometry(s: Shape, detail: "low" | "high"): THREE.BufferGeometry {
  const seg = detail === "high" ? 48 : 24;
  const [a = 1, b = 1, c = 1, e = 0] = s.d;
  switch (s.type) {
    case "box": {
      if (e > 0) {
        const r = Math.min(e, a / 2 - 0.01, c / 2 - 0.01);
        return extrudeY(roundedRectShape(a, c, Math.max(r, 0.01)), b, { curveSegments: detail === "high" ? 6 : 3 });
      }
      return new THREE.BoxGeometry(a, b, c);
    }
    case "cyl":
      return new THREE.CylinderGeometry(s.d.length > 2 ? c : a, a, b, seg);
    case "tube":
      return ringGeometry(a, b, -c / 2, c / 2, seg);
    case "torus":
      return new THREE.TorusGeometry(a, b, detail === "high" ? 16 : 8, seg);
    case "sphere":
      return new THREE.SphereGeometry(a, seg, Math.max(8, seg / 2));
  }
}

function KitShape({ shape, mat, detail }: { shape: Shape; mat: (key: string) => THREE.Material; detail: "low" | "high" }) {
  const geo = useGeometry(() => buildGeometry(shape, detail), [JSON.stringify(shape.d), shape.type, detail]);
  const n = shape.repeat?.n ?? 1;
  const step = shape.repeat?.step ?? [0, 0, 0];
  const turn = shape.repeat?.turn ?? [0, 0, 0];
  const material = mat(shape.mat);
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} rotation={[turn[0] * i * DEG, turn[1] * i * DEG, turn[2] * i * DEG]} position={[step[0] * i, step[1] * i, step[2] * i]}>
          <mesh
            geometry={geo}
            material={material}
            position={shape.pos}
            rotation={[shape.rot[0] * DEG, shape.rot[1] * DEG, shape.rot[2] * DEG]}
            castShadow
            receiveShadow
          />
        </group>
      ))}
    </>
  );
}

export function KitPart({ shapes, mat, detail }: { shapes: Shape[]; mat: (key: string) => THREE.Material; detail: "low" | "high" }) {
  return (
    <>
      {shapes.map((s, i) => (
        <KitShape key={i} shape={s} mat={mat} detail={detail} />
      ))}
    </>
  );
}
