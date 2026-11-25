"use client";

/**
 * Procedural, illustrative drone outrunner motor. Every dimension is derived from
 * the manifest params (stator size, slots, poles, shaft). Units are millimetres,
 * Y is the shaft axis, the stator is centred on the origin. This is a simplified
 * illustration and is always labelled as one.
 */
import * as THREE from "three";
import { extrudeY, polar, ringGeometry, roundedRectShape, useGeometry, circlePath } from "./geometry";
import type { Generator, ProceduralPartProps } from "./types";

function dims(p: Record<string, number>) {
  const Rs = (p.statorDiameter ?? 28) / 2;
  const Hs = p.statorHeight ?? 7;
  const slots = Math.round(p.slots ?? 12);
  const poles = Math.round(p.poles ?? 14);
  const shaftR = (p.shaftDiameter ?? 5) / 2;
  const bore = Rs * 0.39;
  const yoke = Rs * 0.53;
  const tipIn = Rs * 0.9;
  const stemW = ((2 * Math.PI * yoke) / slots) * 0.5;
  const magIn = Rs + 0.6;
  const magOut = magIn + 1.6;
  const bellIn = magOut;
  const bellOut = magOut + 1.2;
  const bellBottom = -Hs / 2 - 0.6;
  const bellWallTop = Hs / 2 + 1.6;
  const capTop = bellWallTop + 1.2;
  const baseTop = -Hs / 2 - 0.9;
  const baseBottom = baseTop - 1.4;
  const bearingOut = bore - 1;
  const shaftTop = capTop + Rs * 0.55;
  const shaftBottom = baseBottom - 2;
  return { Rs, Hs, slots, poles, shaftR, bore, yoke, tipIn, stemW, magIn, magOut, bellIn, bellOut, bellBottom, bellWallTop, capTop, baseTop, baseBottom, bearingOut, shaftTop, shaftBottom };
}

function statorShape(d: ReturnType<typeof dims>) {
  const s = new THREE.Shape();
  const step = (Math.PI * 2) / d.slots;
  const aStem = d.stemW / 2 / d.yoke;
  const aStemTop = d.stemW / 2 / d.tipIn;
  const aTip = step * 0.41;
  const pts: THREE.Vector2[] = [];
  for (let k = 0; k < d.slots; k++) {
    const t = k * step;
    pts.push(polar(d.yoke, t - aStem), polar(d.tipIn, t - aStemTop), polar(d.tipIn, t - aTip));
    for (let i = 0; i <= 6; i++) pts.push(polar(d.Rs, t - aTip + (2 * aTip * i) / 6));
    pts.push(polar(d.tipIn, t + aTip), polar(d.tipIn, t + aStemTop), polar(d.yoke, t + aStem));
    const gapStart = t + aStem;
    const gapEnd = t + step - aStem;
    for (let i = 1; i < 6; i++) pts.push(polar(d.yoke, gapStart + ((gapEnd - gapStart) * i) / 6));
  }
  s.setFromPoints(pts);
  s.holes.push(circlePath(0, 0, d.bore));
  return s;
}

/** Shape-space angle t maps to world direction (cos t, 0, -sin t) after extrudeY. */
const radialYaw = (t: number) => Math.atan2(Math.cos(t), -Math.sin(t));

function Stator({ mat, detail, params }: ProceduralPartProps) {
  const d = dims(params);
  const slices = detail === "high" ? 14 : 1;
  const core = useGeometry(() => {
    const shape = statorShape(d);
    if (slices === 1) return [extrudeY(shape, d.Hs, { curveSegments: 32 })];
    // High detail: show the lamination stack as separate thin sheets.
    const pitch = d.Hs / slices;
    return Array.from({ length: slices }, (_, i) => {
      const g = extrudeY(shape, pitch * 0.82, { curveSegments: 32 });
      g.translate(0, -d.Hs / 2 + pitch * (i + 0.5), 0);
      return g;
    });
  }, [d.Rs, d.Hs, d.slots, slices]);

  const coilT = 1.05;
  const coilLen = d.tipIn - d.yoke - 0.7;
  const turns = detail === "high" ? 6 : 1;
  const coil = useGeometry(() => {
    const shape = roundedRectShape(d.stemW + coilT * 2, d.Hs + coilT * 2, coilT, { w: d.stemW + 0.1, h: d.Hs + 0.1, r: 0.2 });
    if (turns === 1) {
      const g = new THREE.ExtrudeGeometry(shape, { depth: coilLen, bevelEnabled: false, curveSegments: 6 });
      return [g];
    }
    const pitch = coilLen / turns;
    return Array.from({ length: turns }, (_, i) => {
      const g = new THREE.ExtrudeGeometry(shape, { depth: pitch * 0.78, bevelEnabled: false, curveSegments: 6 });
      g.translate(0, 0, pitch * i);
      return g;
    });
  }, [d.stemW, d.Hs, coilLen, turns]);

  const steps = Array.from({ length: d.slots }, (_, k) => (k * Math.PI * 2) / d.slots);
  return (
    <group>
      {core.map((g, i) => (
        <mesh key={i} geometry={g} material={mat("silicon-steel")} castShadow receiveShadow />
      ))}
      {steps.map((t) => {
        const dir = new THREE.Vector3(Math.cos(t), 0, -Math.sin(t));
        const start = dir.multiplyScalar(d.yoke + 0.35);
        return (
          <group key={t} position={start} rotation={[0, radialYaw(t), 0]}>
            {coil.map((g, i) => (
              <mesh key={i} geometry={g} material={mat("copper")} castShadow />
            ))}
          </group>
        );
      })}
    </group>
  );
}

function Magnets({ mat, params }: ProceduralPartProps) {
  const d = dims(params);
  const h = d.Hs + 1;
  const geos = useGeometry(() => {
    const step = (Math.PI * 2) / d.poles;
    const gap = 0.05;
    return Array.from({ length: d.poles }, (_, k) => {
      const a0 = k * step + gap;
      const a1 = (k + 1) * step - gap;
      const s = new THREE.Shape();
      const p0 = polar(d.magIn, a0);
      s.moveTo(p0.x, p0.y);
      s.absarc(0, 0, d.magOut, a0, a1, false);
      s.absarc(0, 0, d.magIn, a1, a0, true);
      return extrudeY(s, h, { curveSegments: 8 });
    });
  }, [d.poles, d.magIn, d.magOut, h]);
  return (
    <group position={[0, 0.1, 0]}>
      {geos.map((g, k) => (
        <mesh key={k} geometry={g} material={mat(k % 2 ? "magnet-alt" : "magnet")} castShadow />
      ))}
    </group>
  );
}

function Bell({ mat, params }: ProceduralPartProps) {
  const d = dims(params);
  const [wall, cap] = useGeometry(() => {
    const w = ringGeometry(d.bellIn, d.bellOut, d.bellBottom, d.bellWallTop, 96);
    const s = new THREE.Shape();
    s.absarc(0, 0, d.bellOut, 0, Math.PI * 2, false);
    s.holes.push(circlePath(0, 0, d.shaftR + 0.05));
    const vents = 5;
    const r1 = d.shaftR + 2.6;
    const r2 = d.bellIn - 1.6;
    for (let i = 0; i < vents; i++) {
      const a0 = (i / vents) * Math.PI * 2 + 0.22;
      const a1 = ((i + 1) / vents) * Math.PI * 2 - 0.22;
      const p = new THREE.Path();
      const start = polar(r1, a0);
      p.moveTo(start.x, start.y);
      p.absarc(0, 0, r2, a0, a1, false);
      p.absarc(0, 0, r1, a1, a0, true);
      s.holes.push(p);
    }
    const c = extrudeY(s, d.capTop - d.bellWallTop, { curveSegments: 48 });
    c.translate(0, (d.capTop + d.bellWallTop) / 2, 0);
    return [w, c] as const satisfies readonly THREE.BufferGeometry[];
  }, [d.bellIn, d.bellOut, d.bellBottom, d.bellWallTop, d.capTop, d.shaftR]);
  return (
    <group>
      <mesh geometry={wall} material={mat("aluminium")} castShadow receiveShadow />
      <mesh geometry={cap} material={mat("aluminium")} castShadow receiveShadow />
    </group>
  );
}

function Shaft({ mat, detail, params }: ProceduralPartProps) {
  const d = dims(params);
  const len = d.shaftTop - d.shaftBottom;
  const geo = useGeometry(() => {
    const g = new THREE.CylinderGeometry(d.shaftR, d.shaftR, len, 32);
    g.translate(0, (d.shaftTop + d.shaftBottom) / 2, 0);
    return g;
  }, [d.shaftR, len]);
  const threadCount = detail === "high" ? 10 : 0;
  return (
    <group>
      <mesh geometry={geo} material={mat("steel-polished")} castShadow />
      {Array.from({ length: threadCount }, (_, i) => (
        <mesh key={i} position={[0, d.shaftTop - 0.8 - i * 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat("steel")}>
          <torusGeometry args={[d.shaftR, 0.09, 6, 32]} />
        </mesh>
      ))}
      <mesh position={[0, d.shaftBottom + 1, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat("steel-dark")}>
        <torusGeometry args={[d.shaftR - 0.05, 0.12, 6, 32]} />
      </mesh>
    </group>
  );
}

function Bearing({ mat, detail, params, y }: ProceduralPartProps & { y: number }) {
  const d = dims(params);
  const w = 3;
  const geos = useGeometry(() => {
    const outer = ringGeometry(d.bearingOut - 0.55, d.bearingOut, y - w / 2, y + w / 2, 48);
    const inner = ringGeometry(d.shaftR, d.shaftR + 0.55, y - w / 2, y + w / 2, 48);
    const seal = ringGeometry(d.shaftR + 0.55, d.bearingOut - 0.55, y + w / 2 - 0.35, y + w / 2 - 0.15, 48);
    const sealB = ringGeometry(d.shaftR + 0.55, d.bearingOut - 0.55, y - w / 2 + 0.15, y - w / 2 + 0.35, 48);
    return [outer, inner, seal, sealB];
  }, [d.bearingOut, d.shaftR, y]);
  const showBalls = detail === "high";
  const ballR = (d.bearingOut - 0.55 - (d.shaftR + 0.55)) / 2;
  const ballOrbit = d.shaftR + 0.55 + ballR;
  return (
    <group>
      <mesh geometry={geos[0]} material={mat("steel")} castShadow />
      <mesh geometry={geos[1]} material={mat("steel")} />
      {!showBalls ? <mesh geometry={geos[2]} material={mat("seal-rubber")} /> : null}
      <mesh geometry={geos[3]} material={mat("seal-rubber")} />
      {showBalls
        ? Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * ballOrbit, y, Math.sin(a) * ballOrbit]} material={mat("steel-polished")}>
                <sphereGeometry args={[ballR * 0.92, 16, 12]} />
              </mesh>
            );
          })
        : null}
    </group>
  );
}

function Base({ mat, params }: ProceduralPartProps) {
  const d = dims(params);
  const [plate, tube] = useGeometry(() => {
    const rDisc = d.Rs * 0.75;
    const rEar = d.Rs * 1.2;
    const rHole = d.Rs * 0.92;
    const s = new THREE.Shape();
    const N = 240;
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      // Four mounting ears at 45 degrees, blended smoothly into the disc.
      const ear = Math.max(0, Math.cos(4 * (a - Math.PI / 4)));
      const r = rDisc + (rEar - rDisc) * Math.pow(ear, 3);
      pts.push(polar(r, a));
    }
    s.setFromPoints(pts);
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      s.holes.push(circlePath(Math.cos(a) * rHole, Math.sin(a) * rHole, 1.6));
    }
    s.holes.push(circlePath(0, 0, d.shaftR + 0.6));
    const thickness = d.baseTop - d.baseBottom;
    const p = extrudeY(s, thickness, { curveSegments: 24 });
    p.translate(0, (d.baseTop + d.baseBottom) / 2, 0);
    const t = ringGeometry(d.bearingOut, d.bore, d.baseTop, d.Hs / 2 + 0.1, 64);
    return [p, t] as const satisfies readonly THREE.BufferGeometry[];
  }, [d.Rs, d.Hs, d.baseTop, d.baseBottom, d.shaftR, d.bearingOut, d.bore]);
  return (
    <group>
      <mesh geometry={plate} material={mat("aluminium-dark")} castShadow receiveShadow />
      <mesh geometry={tube} material={mat("aluminium-dark")} castShadow />
    </group>
  );
}

function Clip({ mat, params }: ProceduralPartProps) {
  const d = dims(params);
  return (
    <mesh position={[0, d.shaftBottom + 1, 0]} rotation={[Math.PI / 2, 0, 0.6]} material={mat("steel-dark")} castShadow>
      <torusGeometry args={[d.shaftR + 0.35, 0.38, 8, 32, Math.PI * 1.7]} />
    </mesh>
  );
}

function Leads({ mat, params }: ProceduralPartProps) {
  const d = dims(params);
  const wireR = 0.85;
  const geos = useGeometry(
    () =>
      [-1, 0, 1].map((k) => {
        const z = k * 2.1;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(d.Rs * 0.58, -d.Hs / 2 + 0.2, z * 0.6),
          new THREE.Vector3(d.Rs * 0.72, d.baseTop - 0.2, z * 0.8),
          new THREE.Vector3(d.Rs * 1.05, d.baseBottom - 0.6, z),
          new THREE.Vector3(d.Rs * 1.7, d.baseBottom - 1.4, z * 1.15),
          new THREE.Vector3(d.Rs * 2.25, d.baseBottom - 1.6, z * 1.3),
        ]);
        return new THREE.TubeGeometry(curve, 48, wireR, 10, false);
      }),
    [d.Rs, d.Hs, d.baseTop, d.baseBottom],
  );
  return (
    <group>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} material={mat("silicone")} castShadow />
      ))}
      {[-1, 0, 1].map((k) => (
        <mesh
          key={k}
          position={[d.Rs * 2.25 + 0.9, d.baseBottom - 1.6, k * 2.1 * 1.3]}
          rotation={[0, 0, Math.PI / 2]}
          material={mat("copper")}
        >
          <cylinderGeometry args={[wireR * 0.6, wireR * 0.6, 2, 10]} />
        </mesh>
      ))}
    </group>
  );
}

export const bldcOutrunner: Generator = {
  base: Base,
  stator: Stator,
  leads: Leads,
  "bearing-lower": (props) => <Bearing {...props} y={-dims(props.params).Hs / 2 + 1.5} />,
  "bearing-upper": (props) => <Bearing {...props} y={dims(props.params).Hs / 2 - 1.5} />,
  magnets: Magnets,
  bell: Bell,
  shaft: Shaft,
  clip: Clip,
};
