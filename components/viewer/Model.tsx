"use client";

import { Html, useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Manifest, ManifestPart } from "@/lib/schema";
import { createMaterialCache, type MaterialCache } from "./materials";
import { addOutlines, createOutlineMaterial } from "./outline";
import { GENERATORS } from "./procedural";
import { KitPart } from "./procedural/kit";
import { useViewer, useViewerStoreApi, type ViewerState } from "./store";

/** Assembled models are scaled so their bounding sphere has this radius in world units. */
export const TARGET_RADIUS = 1.6;
const STAGGER = 0.4;

export type PartHandle = { content: THREE.Group; offset: THREE.Group };

export type SharedModel = {
  /** Bounding radius of the assembled model in model units. */
  radius: number;
  scale: number;
  anchors: Map<string, THREE.Vector3>;
  parts: Map<string, PartHandle>;
  clipPlane: THREE.Plane;
  reducedMotion: boolean;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Explode progress for one part: staggered so outer parts lift off first. */
export function partProgress(s: Pick<ViewerState, "playing" | "playT" | "explode">, order: number, maxOrder: number) {
  if (s.playing) return easeInOutCubic(1 - clamp01(s.playT - order));
  const rank = maxOrder > 0 ? (maxOrder - order) / maxOrder : 0;
  return easeOutCubic(clamp01((s.explode - rank * STAGGER) / (1 - STAGGER)));
}

export function isPickable(s: ViewerState, part: ManifestPart) {
  return s.layer === "all" || part.layers.includes(s.layer);
}

type ModelProps = {
  manifest: Manifest;
  shared: React.RefObject<SharedModel>;
  interactive: boolean;
  palette: { accent: string; line: string };
};

export function Model({ manifest, shared, interactive, palette }: ModelProps) {
  const root = useRef<THREE.Group>(null);
  const [norm, setNorm] = useState<{ scale: number; center: THREE.Vector3 } | null>(null);
  const maxOrder = Math.max(...manifest.parts.map((p) => p.order));
  const generator = manifest.procedural ? GENERATORS[manifest.procedural.generator] : undefined;

  const position = useMemo(() => (norm ? norm.center.clone().multiplyScalar(-norm.scale) : new THREE.Vector3()), [norm]);

  return (
    <group scale={norm?.scale ?? 1} position={position} visible={!!norm}>
      <group ref={root}>
        <Suspense fallback={null}>
          {manifest.parts.map((p) => (
            <Part
              key={p.id}
              part={p}
              maxOrder={maxOrder}
              generator={generator}
              params={manifest.procedural?.params ?? {}}
              shared={shared}
              interactive={interactive}
              palette={palette}
            />
          ))}
          <Measure root={root} shared={shared} parts={manifest.parts} onMeasured={setNorm} />
        </Suspense>
      </group>
    </group>
  );
}

/** Runs once every part has mounted: measures the assembled model and each part's centre. */
function Measure({
  root,
  shared,
  parts,
  onMeasured,
}: {
  root: React.RefObject<THREE.Group | null>;
  shared: React.RefObject<SharedModel>;
  parts: ManifestPart[];
  onMeasured: (n: { scale: number; center: THREE.Vector3 }) => void;
}) {
  const store = useViewerStoreApi();
  // A passive effect, not a layout effect: the root group's ref is attached after
  // its descendants' layout effects run, so it is only available from here.
  useEffect(() => {
    const g = root.current;
    if (!g) return;
    g.updateWorldMatrix(true, true);
    const inv = g.matrixWorld.clone().invert();
    const box = new THREE.Box3().setFromObject(g).applyMatrix4(inv);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, 1e-3);
    shared.current.radius = radius;
    shared.current.scale = TARGET_RADIUS / radius;
    const anchors: Record<string, [number, number, number]> = {};
    for (const p of parts) {
      const handle = shared.current.parts.get(p.id);
      if (!handle) continue;
      const b = new THREE.Box3().setFromObject(handle.content).applyMatrix4(inv);
      const c = b.isEmpty() ? new THREE.Vector3() : b.getCenter(new THREE.Vector3());
      shared.current.anchors.set(p.id, c);
      anchors[p.id] = [c.x, c.y, c.z];
    }
    onMeasured({ scale: TARGET_RADIUS / radius, center: sphere.center.clone() });
    store.setState({ ready: true, anchors });
  }, [root, shared, parts, onMeasured, store]);
  return null;
}

type PartProps = {
  part: ManifestPart;
  maxOrder: number;
  generator: (typeof GENERATORS)[string] | undefined;
  params: Record<string, number>;
  shared: React.RefObject<SharedModel>;
  interactive: boolean;
  palette: { accent: string; line: string };
};

function Part({ part, maxOrder, generator, params, shared, interactive, palette }: PartProps) {
  const store = useViewerStoreApi();
  const detail = useViewer((s) => s.detail);
  const hovered = useViewer((s) => s.hoveredId === part.id);
  const selected = useViewer((s) => s.selectedId === part.id);
  const showHotspots = useViewer((s) => interactive && s.detail === "high" && (s.selectedId === null || s.selectedId === part.id));
  const offset = useRef<THREE.Group>(null);
  const content = useRef<THREE.Group>(null);
  const cache = useMemo(() => createMaterialCache(), []);
  const state = useRef({ opacity: 1, emissive: 0, clip: false });
  const axis = useMemo(() => new THREE.Vector3(...part.axis).normalize(), [part.axis]);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const emissiveColor = useMemo(() => new THREE.Color(palette.accent), [palette.accent]);

  const leader = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(6), 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ transparent: true, opacity: 0.6, depthWrite: false }));
    line.visible = false;
    line.raycast = () => {};
    return line;
  }, []);
  const dot = useMemo(() => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }));
    m.visible = false;
    m.raycast = () => {};
    return m;
  }, []);

  useEffect(() => {
    (leader.material as THREE.LineBasicMaterial).color.set(palette.line);
    (dot.material as THREE.MeshBasicMaterial).color.set(palette.line);
  }, [palette.line, leader, dot]);

  useEffect(
    () => () => {
      cache.dispose();
      leader.geometry.dispose();
      (leader.material as THREE.Material).dispose();
      dot.geometry.dispose();
      (dot.material as THREE.Material).dispose();
    },
    [cache, leader, dot],
  );

  // Register with the shared model so the scene can frame and measure this part.
  useLayoutEffect(() => {
    const map = shared.current.parts;
    if (offset.current && content.current) map.set(part.id, { offset: offset.current, content: content.current });
    return () => {
      map.delete(part.id);
    };
  }, [shared, part.id]);

  // Highlight outline while hovered or selected.
  const highlight = interactive && (hovered || selected);
  useEffect(() => {
    if (!highlight || !content.current) return;
    const scale = shared.current.scale || 1;
    const mat = createOutlineMaterial(palette.accent, 0.012 / scale);
    mat.uniforms.uOpacity!.value = hovered ? 1 : 0.7;
    mat.clippingPlanes = store.getState().sectionEnabled ? [shared.current.clipPlane] : [];
    const added = addOutlines(content.current, mat);
    return () => {
      added.forEach((o) => o.removeFromParent());
      mat.dispose();
    };
  }, [highlight, hovered, detail, palette.accent, shared, store]);

  useFrame((_, dt) => {
    const s = store.getState();
    const sh = shared.current;
    const t = partProgress(s, part.order, maxOrder);
    tmp.copy(axis).multiplyScalar(part.distance * sh.radius * t);
    offset.current?.position.copy(tmp);

    // Opacity: other parts fade to 15 percent around a selection; filtered layers fade further.
    const inLayer = isPickable(s, part);
    const target = !inLayer ? 0.08 : s.selectedId && s.selectedId !== part.id ? 0.15 : 1;
    const st = state.current;
    st.opacity = sh.reducedMotion ? target : THREE.MathUtils.damp(st.opacity, target, 10, dt);
    const emTarget = interactive ? (s.hoveredId === part.id && s.selectedId !== part.id ? 0.12 : 0) : 0;
    st.emissive = sh.reducedMotion ? emTarget : THREE.MathUtils.damp(st.emissive, emTarget, 12, dt);
    const clip = s.sectionEnabled;
    const clipChanged = clip !== st.clip;
    st.clip = clip;
    const transparent = st.opacity < 0.995;
    for (const m of cache.all()) {
      const mm = m as THREE.MeshPhysicalMaterial;
      mm.opacity = st.opacity;
      if (mm.transparent !== transparent) {
        mm.transparent = transparent;
        mm.depthWrite = !transparent;
        mm.needsUpdate = true;
      }
      if (mm.emissive) mm.emissive.copy(emissiveColor).multiplyScalar(st.emissive);
      if (clipChanged) {
        mm.clippingPlanes = clip ? [sh.clipPlane] : [];
        mm.needsUpdate = true;
      }
    }

    // Leader line from the assembled position to where the part is now.
    const anchor = sh.anchors.get(part.id);
    const show = !!anchor && t > 0.02 && part.distance > 0 && inLayer;
    leader.visible = show;
    dot.visible = show;
    if (show && anchor) {
      const pos = leader.geometry.attributes.position as THREE.BufferAttribute;
      pos.setXYZ(0, anchor.x, anchor.y, anchor.z);
      pos.setXYZ(1, anchor.x + tmp.x, anchor.y + tmp.y, anchor.z + tmp.z);
      pos.needsUpdate = true;
      leader.geometry.computeBoundingSphere();
      (leader.material as THREE.LineBasicMaterial).opacity = 0.55 * Math.min(1, st.opacity * 1.5);
      dot.position.copy(anchor);
      dot.scale.setScalar(0.018 * sh.radius);
      (dot.material as THREE.MeshBasicMaterial).opacity = 0.8 * Math.min(1, st.opacity * 1.5);
    }
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive || !isPickable(store.getState(), part)) return;
    e.stopPropagation();
    store.getState().hover(part.id);
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    if (!interactive) return;
    if (store.getState().hoveredId === part.id) store.getState().hover(null);
    document.body.style.cursor = "";
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive || !isPickable(store.getState(), part) || e.delta > 6) return;
    e.stopPropagation();
    store.getState().select(part.id);
  };

  const Proc = part.procedural && generator ? generator[part.procedural] : undefined;
  const glbUrl = part.glb ? (detail === "high" && part.glbDetail ? part.glbDetail : part.glb) : null;
  const anchor = useViewer((s) => s.anchors[part.id]);

  return (
    <>
      <primitive object={leader} />
      <primitive object={dot} />
      <group ref={offset} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
        <group ref={content}>
          {glbUrl ? (
            <GlbPart url={glbUrl} cache={cache} />
          ) : Proc ? (
            <Proc mat={cache.get} detail={interactive ? detail : "low"} params={params} />
          ) : part.shapes.length > 0 ? (
            <KitPart shapes={part.shapes} mat={cache.get} detail={interactive ? detail : "low"} />
          ) : null}
        </group>
        {interactive && hovered && anchor ? (
          <Html position={anchor} center zIndexRange={[30, 20]} style={{ pointerEvents: "none" }}>
            <div className="-translate-y-8 whitespace-nowrap rounded-full border border-line bg-bg-elev px-3 py-1 text-xs font-medium text-fg shadow-[var(--shadow-elev)]">
              {part.name}
            </div>
          </Html>
        ) : null}
        {showHotspots ? part.hotspots.map((h) => <Hotspot key={h.id} hotspot={h} />) : null}
      </group>
    </>
  );
}

function Hotspot({ hotspot }: { hotspot: ManifestPart["hotspots"][number] }) {
  const [open, setOpen] = useState(false);
  return (
    <Html position={hotspot.position} zIndexRange={[25, 15]}>
      <div className="relative -translate-x-1/2 -translate-y-1/2">
        <button
          type="button"
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="group flex size-11 items-center justify-center rounded-full"
        >
          <span className="block size-3 rounded-full border-2 border-bg bg-accent shadow-[0_0_0_4px_var(--accent-soft)] transition-transform duration-200 group-hover:scale-125" />
          <span className="sr-only">{hotspot.label}</span>
        </button>
        <div className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-bg-elev/90 px-2.5 py-0.5 text-xs font-medium text-fg">
          {hotspot.label}
        </div>
        {open ? (
          <div role="note" className="absolute left-10 top-8 w-60 rounded-lg border border-line bg-bg-elev p-3 text-xs text-fg-muted shadow-[var(--shadow-elev)]">
            {hotspot.text}
          </div>
        ) : null}
      </div>
    </Html>
  );
}

function GlbPart({ url, cache }: { url: string; cache: MaterialCache }) {
  const { scene } = useGLTF(url, "/draco/");
  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const cloned = mats.map((m) => {
        const k = m.clone();
        k.side = THREE.DoubleSide;
        cache.register(k);
        return k;
      });
      mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0]!;
    });
    return c;
  }, [scene, cache]);
  return <primitive object={clone} />;
}
