"use client";

import { createContext, useContext } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import type CameraControlsImpl from "camera-controls";
import type { Layer } from "@/lib/schema";

export type LayerFilter = "all" | Layer;

export type ViewerState = {
  /** 0 assembled, 1 fully exploded. Read inside useFrame with getState() to avoid re-renders. */
  explode: number;
  scrollLinked: boolean;
  selectedId: string | null;
  hoveredId: string | null;
  layer: LayerFilter;
  sectionEnabled: boolean;
  /** Cut position from -1 to 1, in multiples of the model radius. */
  sectionOffset: number;
  playing: boolean;
  /** Assembly timeline in steps. Step k moves the part with order k into place. */
  playT: number;
  detail: "low" | "high";
  ready: boolean;
  /** Assembled centre of each part in model units, set once the model is measured. */
  anchors: Record<string, [number, number, number]>;
  palette: { accent: string; line: string };
  controls: CameraControlsImpl | null;
  /** Set by the scene: re-frames the camera on the current selection or resets it. */
  frame: ((target: "reset" | "selection") => void) | null;

  setExplode: (v: number) => void;
  setScrollLinked: (v: boolean) => void;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setLayer: (l: LayerFilter) => void;
  setSection: (enabled: boolean) => void;
  setSectionOffset: (v: number) => void;
  play: () => void;
  stop: () => void;
  set: StoreApi<ViewerState>["setState"];
};

export function createViewerStore(initial?: Partial<ViewerState>) {
  return createStore<ViewerState>()((set) => ({
    explode: 0,
    scrollLinked: false,
    selectedId: null,
    hoveredId: null,
    layer: "all",
    sectionEnabled: false,
    sectionOffset: 0.35,
    playing: false,
    playT: 0,
    detail: "low",
    ready: false,
    anchors: {},
    palette: { accent: "#4aa3ff", line: "#636366" },
    controls: null,
    frame: null,
    setExplode: (v) => set({ explode: Math.min(1, Math.max(0, v)) }),
    setScrollLinked: (v) => set({ scrollLinked: v }),
    select: (id) => set({ selectedId: id }),
    hover: (id) => set({ hoveredId: id }),
    setLayer: (layer) => set({ layer }),
    setSection: (sectionEnabled) => set({ sectionEnabled }),
    setSectionOffset: (v) => set({ sectionOffset: Math.min(1, Math.max(-1, v)) }),
    play: () => set({ playing: true, playT: 0, selectedId: null, scrollLinked: false }),
    stop: () => set({ playing: false }),
    set,
    ...initial,
  }));
}

export type ViewerStore = ReturnType<typeof createViewerStore>;

export const ViewerStoreContext = createContext<ViewerStore | null>(null);

export function useViewerStoreApi(): ViewerStore {
  const store = useContext(ViewerStoreContext);
  if (!store) throw new Error("useViewer must be used inside a ViewerStoreContext provider");
  return store;
}

export function useViewer<T>(selector: (s: ViewerState) => T): T {
  return useStore(useViewerStoreApi(), selector);
}
