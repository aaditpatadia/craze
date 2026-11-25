"use client";

import { CameraControls, Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type CameraControlsImpl from "camera-controls";
import type { Manifest } from "@/lib/schema";
import { Model, TARGET_RADIUS, type SharedModel } from "./Model";
import { ViewerStoreContext, useViewer, useViewerStoreApi, type ViewerStore } from "./store";

const STEP_SECONDS = 1.1;
const REDUCED_STEP_SECONDS = 1.8;

export type ViewerCanvasProps = {
  manifest: Manifest;
  store: ViewerStore;
  active: boolean;
  reducedMotion: boolean;
  mobile: boolean;
  /** Hero mode: no controls, no picking, slow turntable rotation. */
  hero?: boolean;
};

export default function ViewerCanvas({ manifest, store, active, reducedMotion, mobile, hero = false }: ViewerCanvasProps) {
  const [dpr, setDpr] = useState<number>(mobile ? 1.25 : 1.75);
  const shared = useRef<SharedModel>({
    radius: 1,
    scale: 1,
    anchors: new Map(),
    parts: new Map(),
    clipPlane: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
    reducedMotion,
  });
  useEffect(() => {
    shared.current.reducedMotion = reducedMotion;
  }, [reducedMotion]);

  return (
    <Canvas
      dpr={dpr}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 32, near: 0.05, far: 100, position: hero ? (manifest.camera.position.map((v) => v * 0.72) as [number, number, number]) : manifest.camera.position }}
      gl={{ antialias: true, alpha: true, powerPreference: hero ? "default" : "high-performance", localClippingEnabled: true }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
      }}
      style={{ touchAction: hero ? "auto" : "none" }}
      aria-hidden="true"
    >
      <ViewerStoreContext.Provider value={store}>
        <PerformanceMonitor
          onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
          onIncline={() => setDpr((d) => Math.min(mobile ? 1.5 : 2, d + 0.25))}
        />
        <Lights />
        {hero ? (
          <Turntable reducedMotion={reducedMotion}>
            <Model manifest={manifest} shared={shared} interactive={false} palette={store.getState().palette} />
          </Turntable>
        ) : (
          <Interactive manifest={manifest} shared={shared} reducedMotion={reducedMotion} mobile={mobile} />
        )}
      </ViewerStoreContext.Provider>
    </Canvas>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 3]} intensity={1.4} />
      <directionalLight position={[-5, 2, -4]} intensity={0.5} />
      <Environment frames={1} resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[6, 1, -2]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="ring" intensity={0.8} position={[0, -4, 4]} scale={4} />
      </Environment>
    </>
  );
}

function Turntable({ children, reducedMotion }: { children: React.ReactNode; reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!reducedMotion && ref.current) ref.current.rotation.y += dt * 0.18;
  });
  return (
    <group ref={ref} rotation={[0, -0.6, 0]}>
      {children}
    </group>
  );
}

function Interactive({
  manifest,
  shared,
  reducedMotion,
  mobile,
}: {
  manifest: Manifest;
  shared: React.RefObject<SharedModel>;
  reducedMotion: boolean;
  mobile: boolean;
}) {
  const store = useViewerStoreApi();
  const controls = useRef<CameraControlsImpl>(null);
  const palette = useViewer((s) => s.palette);
  const selectedId = useViewer((s) => s.selectedId);
  const maxOrder = Math.max(...manifest.parts.map((p) => p.order));
  const stepTimer = useRef(0);

  // Expose controls and a framing function to the DOM shell.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const { position: p, target: t } = manifest.camera;
    const frame = (target: "reset" | "selection") => {
      const sel = store.getState().selectedId;
      const handle = sel ? shared.current.parts.get(sel) : undefined;
      if (target === "reset" || !handle) {
        void c.setLookAt(p[0], p[1], p[2], t[0], t[1], t[2], !reducedMotion);
        void c.setFocalOffset(0, 0, 0, !reducedMotion);
        return;
      }
      const sphere = new THREE.Box3().setFromObject(handle.content).getBoundingSphere(new THREE.Sphere());
      sphere.radius = Math.max(sphere.radius, 0.22) * 1.3;
      void c.fitToSphere(sphere, !reducedMotion);
      // Keep the framed part clear of the side panel (desktop) or bottom sheet (mobile).
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      void c.setFocalOffset(wide ? sphere.radius * 0.5 : 0, wide ? 0 : -sphere.radius * 0.6, 0, !reducedMotion);
    };
    store.setState({ controls: c, frame });
    return () => store.setState({ controls: null, frame: null });
  }, [manifest.camera, shared, store, reducedMotion]);

  // Glide to the selection, or back to the overview when it closes.
  useEffect(() => {
    store.getState().frame?.(selectedId ? "selection" : "reset");
  }, [selectedId, store]);

  useFrame((_, dt) => {
    const s = store.getState();
    shared.current.clipPlane.constant = s.sectionOffset * TARGET_RADIUS;

    // Detail level follows zoom, with hysteresis so it does not flicker.
    const c = controls.current;
    if (c) {
      const d = c.distance;
      if (s.detail === "low" && d < 3.4) store.setState({ detail: "high" });
      else if (s.detail === "high" && d > 3.9) store.setState({ detail: "low" });
    }

    if (s.playing) {
      const end = maxOrder + 1.6;
      let next: number;
      if (reducedMotion) {
        // Reduced motion: no tweening, parts snap into place one step at a time.
        stepTimer.current += dt;
        next = s.playT;
        if (stepTimer.current >= REDUCED_STEP_SECONDS) {
          stepTimer.current = 0;
          next = Math.floor(s.playT) + 1;
        }
      } else {
        next = s.playT + dt / STEP_SECONDS;
      }
      if (next >= end) store.setState({ playing: false, playT: 0, explode: 0 });
      else if (next !== s.playT) store.setState({ playT: next });
    } else {
      stepTimer.current = 0;
    }
  });

  return (
    <>
      <CameraControls
        ref={controls}
        makeDefault
        minDistance={0.45}
        maxDistance={14}
        smoothTime={reducedMotion ? 0 : 0.3}
        draggingSmoothTime={reducedMotion ? 0 : 0.12}
        dollyToCursor
        infinityDolly={false}
        azimuthRotateSpeed={mobile ? 0.9 : 1}
        polarRotateSpeed={mobile ? 0.9 : 1}
      />
      <Model manifest={manifest} shared={shared} interactive palette={palette} />
      <SectionPlane controls={controls} />
    </>
  );
}

function SectionPlane({ controls }: { controls: React.RefObject<CameraControlsImpl | null> }) {
  const store = useViewerStoreApi();
  const enabled = useViewer((s) => s.sectionEnabled);
  const accent = useViewer((s) => s.palette.accent);
  const camera = useThree((s) => s.camera);
  const group = useRef<THREE.Group>(null);
  const dragging = useRef(false);
  const size = TARGET_RADIUS * 2.6;
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(size, size)), [size]);
  const dragPlane = useMemo(() => new THREE.Plane(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => () => edges.dispose(), [edges]);

  useFrame(() => {
    if (group.current) group.current.position.x = store.getState().sectionOffset * TARGET_RADIUS;
  });

  if (!enabled) return null;

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    dragging.current = true;
    if (controls.current) controls.current.enabled = false;
    (e.target as unknown as Element).setPointerCapture?.(e.pointerId);
    camera.getWorldDirection(dragPlane.normal);
    dragPlane.constant = 0;
    document.body.style.cursor = "ew-resize";
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return;
    e.stopPropagation();
    if (e.ray.intersectPlane(dragPlane, hit)) store.getState().setSectionOffset(hit.x / TARGET_RADIUS);
  };
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    dragging.current = false;
    if (controls.current) controls.current.enabled = true;
    (e.target as unknown as Element).releasePointerCapture?.(e.pointerId);
    document.body.style.cursor = "";
  };

  return (
    <group ref={group}>
      <mesh rotation={[0, Math.PI / 2, 0]} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial color={accent} transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges} rotation={[0, Math.PI / 2, 0]}>
        <lineBasicMaterial color={accent} transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}
