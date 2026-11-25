import * as THREE from "three";
import { useEffect, useMemo } from "react";

/** Memoised geometry that is disposed when its inputs change or the part unmounts. */
export function useGeometry<T extends THREE.BufferGeometry | readonly THREE.BufferGeometry[]>(factory: () => T, deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geo = useMemo(factory, deps);
  useEffect(
    () => () => {
      const list = (Array.isArray(geo) ? geo : [geo]) as THREE.BufferGeometry[];
      list.forEach((g) => g.dispose());
    },
    [geo],
  );
  return geo;
}

export const polar = (r: number, a: number) => new THREE.Vector2(r * Math.cos(a), r * Math.sin(a));

/** Extrudes a 2D shape so the extrusion runs along +Y, centred on y = 0. */
export function extrudeY(shape: THREE.Shape | THREE.Shape[], depth: number, opts: { bevel?: number; curveSegments?: number } = {}) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: !!opts.bevel,
    bevelThickness: opts.bevel ?? 0,
    bevelSize: opts.bevel ?? 0,
    bevelSegments: 2,
    curveSegments: opts.curveSegments ?? 24,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -depth / 2, 0);
  return g;
}

/** A ring (tube wall) between two radii, from y0 to y1, as a lathe. */
export function ringGeometry(rIn: number, rOut: number, y0: number, y1: number, segments = 64) {
  const pts = [
    new THREE.Vector2(rIn, y0),
    new THREE.Vector2(rOut, y0),
    new THREE.Vector2(rOut, y1),
    new THREE.Vector2(rIn, y1),
    new THREE.Vector2(rIn, y0),
  ];
  return new THREE.LatheGeometry(pts, segments);
}

export function circlePath(cx: number, cy: number, r: number) {
  const p = new THREE.Path();
  p.absarc(cx, cy, r, 0, Math.PI * 2, false);
  return p;
}

export function roundedRectShape(w: number, h: number, r: number, hole?: { w: number; h: number; r: number }) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  if (hole) {
    const hx = -hole.w / 2;
    const hy = -hole.h / 2;
    const hr = hole.r;
    const p = new THREE.Path();
    p.moveTo(hx + hr, hy);
    p.lineTo(hx + hole.w - hr, hy);
    p.quadraticCurveTo(hx + hole.w, hy, hx + hole.w, hy + hr);
    p.lineTo(hx + hole.w, hy + hole.h - hr);
    p.quadraticCurveTo(hx + hole.w, hy + hole.h, hx + hole.w - hr, hy + hole.h);
    p.lineTo(hx + hr, hy + hole.h);
    p.quadraticCurveTo(hx, hy + hole.h, hx, hy + hole.h - hr);
    p.lineTo(hx, hy + hr);
    p.quadraticCurveTo(hx, hy, hx + hr, hy);
    s.holes.push(p);
  }
  return s;
}
