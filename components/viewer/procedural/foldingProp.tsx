"use client";

/**
 * Procedural, illustrative folding propeller. Blades are lofted from elliptical
 * sections with a twist that follows the stated pitch. Units are millimetres,
 * Y is the rotation axis. Simplified illustration, always labelled as one.
 */
import * as THREE from "three";
import { circlePath, extrudeY, ringGeometry, useGeometry } from "./geometry";
import type { Generator, ProceduralPartProps } from "./types";

function dims(p: Record<string, number>) {
  const R = (p.diameter ?? 381) / 2;
  const hubR = (p.hubDiameter ?? 40) / 2;
  const pitch = (p.pitch ?? 5) * 25.4;
  const boltX = hubR * 0.65;
  return { R, hubR, pitch, boltX, plateT: 3, rootH: 6 };
}

function bladeGeometry(R: number, pitch: number, rStart: number) {
  const stations = 32;
  const M = 18;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < stations; i++) {
    const s = i / (stations - 1);
    const r = rStart + s * (R - rStart);
    const taper = s > 0.92 ? 1 - ((s - 0.92) / 0.08) * 0.65 : 1;
    const c = (14 + 26 * Math.sin(Math.PI * (0.1 + 0.9 * s)) * (1 - 0.5 * s)) * taper;
    const t = c * 0.1 * (1 - 0.45 * s);
    const beta = Math.atan(pitch / (2 * Math.PI * r));
    const sweep = -s * s * 10;
    for (let j = 0; j < M; j++) {
      const th = (j / M) * Math.PI * 2;
      const u = (c / 2) * Math.cos(th) + sweep;
      const v = (t / 2) * Math.sin(th) * (Math.cos(th) > 0 ? 1 : 0.55);
      const y = v * Math.cos(beta) + u * Math.sin(beta);
      const z = -v * Math.sin(beta) + u * Math.cos(beta);
      pos.push(r, y, z);
    }
  }
  for (let i = 0; i < stations - 1; i++) {
    for (let j = 0; j < M; j++) {
      const a = i * M + j;
      const b = i * M + ((j + 1) % M);
      const c = (i + 1) * M + j;
      const d = (i + 1) * M + ((j + 1) % M);
      idx.push(a, c, b, b, c, d);
    }
  }
  // Tip cap.
  const tipCenter = pos.length / 3;
  pos.push(R + 0.8, 0, -10);
  const last = (stations - 1) * M;
  for (let j = 0; j < M; j++) idx.push(last + j, tipCenter, last + ((j + 1) % M));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function Blades({ mat, params }: ProceduralPartProps) {
  const d = dims(params);
  const [blade, root] = useGeometry(() => {
    const b = bladeGeometry(d.R, d.pitch, d.hubR * 1.1);
    const r = new THREE.BoxGeometry(d.hubR * 1.15, d.rootH, d.hubR * 0.7);
    r.translate(d.hubR * 0.4 + (d.hubR * 1.15) / 2, 0, 0);
    return [b, r] as const satisfies readonly THREE.BufferGeometry[];
  }, [d.R, d.pitch, d.hubR, d.rootH]);
  return (
    <group>
      {[0, Math.PI].map((rot) => (
        <group key={rot} rotation={[0, rot, 0]}>
          <mesh geometry={blade} material={mat("carbon")} castShadow receiveShadow />
          <mesh geometry={root} material={mat("carbon")} castShadow />
        </group>
      ))}
    </group>
  );
}

function plate(d: ReturnType<typeof dims>, y: number) {
  const s = new THREE.Shape();
  s.absarc(0, 0, d.hubR, 0, Math.PI * 2, false);
  s.holes.push(circlePath(0, 0, 4.2));
  s.holes.push(circlePath(d.boltX, 0, 1.6));
  s.holes.push(circlePath(-d.boltX, 0, 1.6));
  const g = extrudeY(s, d.plateT, { bevel: 0.4, curveSegments: 48 });
  g.translate(0, y, 0);
  return g;
}

function HubTop({ mat, params }: ProceduralPartProps) {
  const d = dims(params);
  const g = useGeometry(() => plate(d, d.rootH / 2 + d.plateT / 2), [d.hubR, d.rootH]);
  return <mesh geometry={g} material={mat("aluminium-dark")} castShadow receiveShadow />;
}

function HubBottom({ mat, params }: ProceduralPartProps) {
  const d = dims(params);
  const g = useGeometry(() => plate(d, -d.rootH / 2 - d.plateT / 2), [d.hubR, d.rootH]);
  return <mesh geometry={g} material={mat("aluminium-dark")} castShadow receiveShadow />;
}

function Bolts({ mat, params }: ProceduralPartProps) {
  const d = dims(params);
  const top = d.rootH / 2 + d.plateT;
  return (
    <group>
      {[d.boltX, -d.boltX].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh material={mat("steel")}>
            <cylinderGeometry args={[1.5, 1.5, top * 2 + 1.5, 16]} />
          </mesh>
          <mesh position={[0, top + 0.8, 0]} material={mat("steel-dark")} castShadow>
            <cylinderGeometry args={[2.8, 2.8, 1.6, 24]} />
          </mesh>
          <mesh position={[0, -top - 0.9, 0]} material={mat("steel-dark")} castShadow>
            <cylinderGeometry args={[2.9, 2.9, 1.8, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Adapter({ mat, params }: ProceduralPartProps) {
  const d = dims(params);
  const g = useGeometry(() => ringGeometry(2.5, 4.1, -d.rootH / 2 - d.plateT - 1.5, -d.rootH / 2 + 0.5, 32), [d.rootH]);
  return <mesh geometry={g} material={mat("aluminium")} castShadow />;
}

export const foldingProp: Generator = {
  blades: Blades,
  "hub-top": HubTop,
  "hub-bottom": HubBottom,
  bolts: Bolts,
  adapter: Adapter,
};
