"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Manifest } from "@/lib/schema";
import { Model, type SharedModel } from "@/components/viewer/Model";
import { createOutlineMaterial } from "@/components/viewer/outline";
import { ViewerStoreContext, createViewerStore, type ViewerStore } from "@/components/viewer/store";

type Shot = { key: string; label: string; dir: [number, number, number]; up: [number, number, number]; explode: number };

const SHOTS: Shot[] = [
  { key: "exploded", label: "Exploded view", dir: [1, 0.85, 1.15], up: [0, 1, 0], explode: 1 },
  { key: "front", label: "Front", dir: [0, 0, 1], up: [0, 1, 0], explode: 0 },
  { key: "right", label: "Right", dir: [1, 0, 0], up: [0, 1, 0], explode: 0 },
  { key: "top", label: "Top", dir: [0, 1, 0], up: [0, 0, -1], explode: 0 },
  { key: "iso", label: "Isometric", dir: [1, 0.85, 1.15], up: [0, 1, 0], explode: 0 },
];

const SIZE = 900;

/** Turns a white-on-black render into white lines on transparent, so CSS can colour it. */
function toMask(canvas: HTMLCanvasElement): string {
  const c = document.createElement("canvas");
  c.width = canvas.width;
  c.height = canvas.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(canvas, 0, 0);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = Math.max(d[i]!, d[i + 1]!, d[i + 2]!);
    d[i] = d[i + 1] = d[i + 2] = 255;
    d[i + 3] = a;
  }
  ctx.putImageData(img, 0, 0);
  // Crop to the drawing plus a small margin, so it fills whatever box it is shown in.
  let x0 = c.width;
  let y0 = c.height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (d[(y * c.width + x) * 4 + 3]! > 24) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return c.toDataURL("image/png");
  const pad = 12;
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(c.width - 1, x1 + pad);
  y1 = Math.min(c.height - 1, y1 + pad);
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext("2d")!.drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}

/** Swaps every mesh for a black fill plus white silhouette and crease lines. */
function toLineArt(root: THREE.Object3D, scale: number) {
  const fill = new THREE.MeshBasicMaterial({ color: 0x000000, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, side: THREE.DoubleSide });
  const hull = createOutlineMaterial("#ffffff", 0.006 / scale);
  hull.transparent = false;
  const line = new THREE.LineBasicMaterial({ color: 0xffffff });
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || m.userData.bpDone) return;
    const mat = m.material as THREE.Material & { transparent?: boolean; depthWrite?: boolean };
    // Skip the explode leader dots, which are transparent overlay spheres.
    if (mat && mat.transparent && mat.depthWrite === false) return;
    meshes.push(m);
  });
  for (const m of meshes) {
    m.userData.bpDone = true;
    m.material = fill;
    const h = new THREE.Mesh(m.geometry, hull);
    h.renderOrder = -1;
    h.userData.bpDone = true;
    h.raycast = () => {};
    m.add(h);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 32), line);
    edges.raycast = () => {};
    m.add(edges);
  }
}

function Capture({ store, shared, onDone }: { store: ViewerStore; shared: React.RefObject<SharedModel>; onDone: (shots: Record<string, string>) => void }) {
  const step = useRef({ i: -1, wait: 0, converted: false, out: {} as Record<string, string>, done: false });
  const box = useMemo(() => new THREE.Box3(), []);
  const sphere = useMemo(() => new THREE.Sphere(), []);

  useFrame((state) => {
    const { gl, scene, camera } = state;
    const s = step.current;
    if (s.done || !store.getState().ready) return;
    if (!s.converted) {
      toLineArt(scene, shared.current.scale || 1);
      s.converted = true;
      s.i = 0;
      s.wait = 0;
    }
    const shot = SHOTS[s.i]!;
    if (s.wait === 0) store.setState({ explode: shot.explode });
    s.wait += 1;
    if (s.wait < 4) return; // let the explode offsets settle
    // Frame the whole model, exploded or not, in an orthographic view.
    box.makeEmpty();
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && o.visible && (o as THREE.Mesh).geometry) {
        const m = o as THREE.Mesh;
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        box.union(m.geometry.boundingBox!.clone().applyMatrix4(m.matrixWorld));
      }
    });
    box.getBoundingSphere(sphere);
    const cam = camera as THREE.OrthographicCamera;
    const dir = new THREE.Vector3(...shot.dir).normalize();
    cam.position.copy(sphere.center).addScaledVector(dir, sphere.radius * 4 + 1);
    cam.up.set(...shot.up);
    cam.lookAt(sphere.center);
    cam.near = 0.01;
    cam.far = sphere.radius * 10 + 10;
    // Fit the projected box, not the sphere, so flat parts fill the frame.
    const corners = [0, 1, 2, 3, 4, 5, 6, 7].map(
      (k) => new THREE.Vector3(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z),
    );
    cam.updateMatrixWorld();
    const inv = cam.matrixWorldInverse;
    let w = 0;
    let h = 0;
    for (const c of corners) {
      const p = c.clone().applyMatrix4(inv);
      w = Math.max(w, Math.abs(p.x));
      h = Math.max(h, Math.abs(p.y));
    }
    cam.zoom = (SIZE / 2) / (Math.max(w, h, 1e-3) * 1.12);
    cam.updateProjectionMatrix();
    gl.render(scene, cam);
    s.out[shot.key] = toMask(gl.domElement);
    s.i += 1;
    s.wait = 0;
    if (s.i >= SHOTS.length) {
      s.done = true;
      onDone(s.out);
    }
  });
  return null;
}

/** Renders the part's model as blueprint line drawings: four views and an exploded view. */
export function BlueprintViews({ manifest, code }: { manifest: Manifest; code: string }) {
  const [shots, setShots] = useState<Record<string, string> | null>(null);
  const [failed, setFailed] = useState(false);
  const store = useMemo(() => createViewerStore({ palette: { accent: "#ffffff", line: "#ffffff" }, detail: "high" }), []);
  const shared = useRef<SharedModel>({
    radius: 1,
    scale: 1,
    anchors: new Map(),
    parts: new Map(),
    clipPlane: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
    reducedMotion: true,
  });

  useEffect(() => {
    const t = setTimeout(() => setFailed(true), 20000);
    return () => clearTimeout(t);
  }, []);

  const base = code.replace(/-[A-Z]$/, "");
  const view = (shot: Shot, letter: string, big = false) => (
    <figure key={shot.key} className={`bp-box flex flex-col ${big ? "row-span-2" : ""}`}>
      <div className="relative flex-1" style={{ minHeight: big ? "70mm" : "30mm" }}>
        {shots?.[shot.key] ? (
          <div
            role="img"
            aria-label={`${shot.label} of ${code}, line drawing`}
            className="bp-render absolute inset-0"
            style={{
              WebkitMaskImage: `url(${shots[shot.key]})`,
              maskImage: `url(${shots[shot.key]})`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
        ) : (
          <span className="bp-faint absolute inset-0 flex items-center justify-center text-[7pt] tracking-[0.14em]">
            {failed ? "DRAWING UNAVAILABLE" : "DRAWING"}
          </span>
        )}
      </div>
      <figcaption className="bp-faint mt-1 flex justify-between gap-2 text-[6.2pt] tracking-[0.12em]">
        <span>
          VIEW {letter} · {shot.label.toUpperCase()}
        </span>
        <span className="bp-mono">{big ? base : "NTS"}</span>
      </figcaption>
    </figure>
  );

  return (
    <div>
      <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-2" style={{ gridTemplateRows: "auto auto" }}>
        {view(SHOTS[0]!, "A", true)}
        {SHOTS.slice(1).map((s, i) => view(s, String.fromCharCode(66 + i)))}
      </div>
      {!shots && !failed ? (
        <div aria-hidden="true" style={{ position: "fixed", left: -10000, top: 0, width: SIZE, height: SIZE, pointerEvents: "none" }}>
          <Canvas
            orthographic
            frameloop="always"
            dpr={1}
            camera={{ position: [0, 0, 10], zoom: 100, near: 0.01, far: 100 }}
            gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
            onCreated={({ gl }) => gl.setClearColor(0x000000, 1)}
            style={{ width: SIZE, height: SIZE }}
          >
            <ViewerStoreContext.Provider value={store}>
              <Model manifest={manifest} shared={shared} interactive={false} palette={{ accent: "#ffffff", line: "#ffffff" }} />
              <Capture store={store} shared={shared} onDone={setShots} />
            </ViewerStoreContext.Provider>
          </Canvas>
        </div>
      ) : null}
    </div>
  );
}
