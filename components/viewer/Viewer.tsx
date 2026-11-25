"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { LAYER_LABEL } from "@/lib/format";
import type { Manifest } from "@/lib/schema";
import type { ResolvedPart } from "@/lib/viewer-data";
import { CategoryArt } from "@/components/catalog/CategoryArt";
import { Button, IconButton } from "@/components/ui/Button";
import { ModelSourceBadge } from "@/components/ui/Chips";
import { Icon } from "@/components/ui/Icon";
import { useDeferredLoad, useGlCapability, useIsMobile, useReducedMotionPref } from "./capabilities";
import { PartPanel } from "./PartPanel";
import { StaticDiagram } from "./StaticDiagram";
import { ViewerStoreContext, createViewerStore, useViewer, type LayerFilter, type ViewerStore } from "./store";

const ViewerCanvas = dynamic(() => import("./ViewerCanvas"), { ssr: false, loading: () => null });

export type ViewerProps = {
  manifest: Manifest;
  parts: ResolvedPart[];
  productId: string;
  productName: string;
  category: string;
  categorySingular: string;
};

export function Viewer(props: ViewerProps) {
  const [store] = useState(() => createViewerStore());
  return (
    <ViewerStoreContext.Provider value={store}>
      <ViewerShell {...props} store={store} />
    </ViewerStoreContext.Provider>
  );
}

class CanvasBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const LAYERS: LayerFilter[] = ["all", "moving", "electrical", "magnetic", "structural"];

function ViewerShell({ manifest, parts, productId, productName, category, categorySingular, store }: ViewerProps & { store: ViewerStore }) {
  const ids = useId();
  const capability = useGlCapability();
  const reduced = useReducedMotionPref();
  const mobile = useIsMobile();
  const [forceLoad, setForceLoad] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [view, setView] = useState<"3d" | "diagram">("3d");
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  const container = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const trackEl = useRef<HTMLDivElement>(null);
  const listButtons = useRef(new Map<string, HTMLButtonElement>());
  const lastTap = useRef({ t: 0, x: 0, y: 0 });

  const selectedId = useViewer((s) => s.selectedId);
  const hoveredId = useViewer((s) => s.hoveredId);
  const layer = useViewer((s) => s.layer);
  const ready = useViewer((s) => s.ready);
  const scrollLinked = useViewer((s) => s.scrollLinked);
  const detail = useViewer((s) => s.detail);

  const glOk = capability === "ok" || (capability === "low-power" && forceLoad);
  const mode: "pending" | "3d" | "fallback" =
    capability === "unknown" ? "pending" : crashed || !glOk || view === "diagram" ? "fallback" : "3d";

  // Load the 3D chunk after first paint: on first interaction, or once the page has been idle a moment.
  const load = useDeferredLoad(mode === "3d", 2500);

  // Pause rendering when the canvas is off screen or the tab is hidden.
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    const onVis = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Feed theme colours into the scene, and follow theme changes.
  useEffect(() => {
    const read = () => {
      const el = container.current;
      if (!el) return;
      const cs = getComputedStyle(el);
      store.setState({
        palette: {
          accent: cs.getPropertyValue("--accent").trim() || "#4aa3ff",
          line: cs.getPropertyValue("--line-strong").trim() || "#636366",
        },
      });
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
    return () => mo.disconnect();
  }, [store]);

  // Analytics: part opened, and explode used once per page view.
  useEffect(() => {
    let explodeTracked = false;
    return store.subscribe((s, prev) => {
      if (s.selectedId && s.selectedId !== prev.selectedId) track("Part opened", { product: productId, part: s.selectedId });
      if (!explodeTracked && s.explode > 0.05 && prev.explode <= 0.05 && !s.playing) {
        explodeTracked = true;
        track("Explode used", { product: productId, mode: s.scrollLinked ? "scroll" : "slider" });
      }
    });
  }, [store, productId]);

  // Scroll-linked mode: the viewer sticks while the page scrolls through a track.
  useEffect(() => {
    if (!scrollLinked) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const t = trackEl.current;
      const v = viewport.current;
      if (!t || !v) return;
      const travel = t.offsetHeight - v.offsetHeight;
      const top = t.getBoundingClientRect().top - 64;
      store.getState().setExplode(travel > 0 ? -top / travel : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [scrollLinked, store]);

  const select = useCallback((id: string | null) => store.getState().select(id), [store]);

  const closePanel = useCallback(() => {
    const id = store.getState().selectedId;
    store.getState().select(null);
    requestAnimationFrame(() => {
      const btn = id ? listButtons.current.get(id) : undefined;
      (btn ?? viewport.current)?.focus({ preventScroll: true });
    });
  }, [store]);

  const onViewportKey = (e: React.KeyboardEvent) => {
    const s = store.getState();
    const c = s.controls;
    const rot = 0.26;
    const pan = 0.15;
    switch (e.key) {
      case "ArrowLeft":
        if (e.shiftKey) void c?.truck(-pan, 0, true);
        else void c?.rotate(-rot, 0, true);
        break;
      case "ArrowRight":
        if (e.shiftKey) void c?.truck(pan, 0, true);
        else void c?.rotate(rot, 0, true);
        break;
      case "ArrowUp":
        if (e.shiftKey) void c?.truck(0, -pan, true);
        else void c?.rotate(0, -rot * 0.7, true);
        break;
      case "ArrowDown":
        if (e.shiftKey) void c?.truck(0, pan, true);
        else void c?.rotate(0, rot * 0.7, true);
        break;
      case "+":
      case "=":
        void c?.dolly(0.6, true);
        break;
      case "-":
      case "_":
        void c?.dolly(-0.6, true);
        break;
      case "r":
      case "R":
      case "0":
        if (s.selectedId) s.select(null);
        else s.frame?.("reset");
        break;
      case "Escape":
        if (s.selectedId) closePanel();
        else return;
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    const now = performance.now();
    const l = lastTap.current;
    if (now - l.t < 300 && Math.hypot(e.clientX - l.x, e.clientY - l.y) < 24) {
      store.getState().select(null);
      store.getState().frame?.("reset");
      l.t = 0;
    } else lastTap.current = { t: now, x: e.clientX, y: e.clientY };
  };

  const selectedPart = parts.find((p) => p.id === selectedId) ?? null;
  const modelParts = new Map(manifest.parts.map((p) => [p.id, p]));
  const inLayer = (id: string) => layer === "all" || !!modelParts.get(id)?.layers.includes(layer);
  const progress = !load ? 20 : ready ? 100 : 65;

  return (
    <section ref={container} aria-labelledby={`${ids}-title`} className="relative">
      <h2 id={`${ids}-title`} className="sr-only">
        Interactive exploded view of the {productName}
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        {/* Text alternative: the parts list mirrors the 3D state and is the keyboard path. */}
        <nav aria-label="Parts in assembly order" className="order-2 lg:order-1 lg:col-span-3">
          <div className="lg:sticky lg:top-20">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">
                Parts <span className="font-normal text-fg-subtle">({parts.length})</span>
              </h3>
              <ExplodeStatus />
            </div>
            <p className="mt-1 text-xs text-fg-subtle">In assembly order. Tab through, Enter opens details, Escape closes.</p>
            <ol className="mt-3 space-y-1">
              {parts.map((p, i) => {
                const active = p.id === selectedId;
                const hidden = !inLayer(p.id);
                return (
                  <li key={p.id}>
                    <button
                      ref={(el) => {
                        if (el) listButtons.current.set(p.id, el);
                        else listButtons.current.delete(p.id);
                      }}
                      type="button"
                      aria-pressed={active}
                      onClick={() => select(active ? null : p.id)}
                      onFocus={() => store.getState().hover(p.id)}
                      onBlur={() => store.getState().hover(null)}
                      onMouseEnter={() => store.getState().hover(p.id)}
                      onMouseLeave={() => store.getState().hover(null)}
                      className={cn(
                        "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-200",
                        active ? "bg-accent-soft text-fg" : "hover:bg-bg-subtle",
                        hoveredId === p.id && !active && "bg-bg-subtle",
                        hidden && "opacity-50",
                      )}
                    >
                      <span
                        className={cn(
                          "tabular flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                          active ? "border-accent text-accent" : "border-line text-fg-subtle",
                        )}
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{p.name}</span>
                        {hidden ? <span className="block text-xs text-fg-subtle">Not in the {LAYER_LABEL[layer].toLowerCase()} layer</span> : null}
                        {!p.inModel ? <span className="block text-xs text-fg-subtle">Not shown in the 3D model</span> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </nav>

        <div className="order-1 lg:order-2 lg:col-span-9">
          <div ref={trackEl} style={{ paddingBottom: scrollLinked ? "120vh" : 0 }}>
            <div className={cn(scrollLinked && "sticky top-16")}>
              <div
                ref={viewport}
                tabIndex={0}
                role="group"
                aria-roledescription="3D viewer"
                aria-label={`3D model of the ${productName}`}
                aria-describedby={`${ids}-help`}
                onKeyDown={onViewportKey}
                onDoubleClick={() => {
                  store.getState().select(null);
                  store.getState().frame?.("reset");
                }}
                onPointerUp={onPointerUp}
                className="relative h-[68vh] min-h-[460px] max-h-[860px] overflow-hidden rounded-xl border border-line bg-[var(--scene-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <p id={`${ids}-help`} className="sr-only">
                  Drag to rotate, scroll or pinch to zoom, right-drag or two-finger drag to pan. With the keyboard: arrow keys
                  rotate, Shift and arrow keys pan, plus and minus zoom, R resets the view. Double click or double tap resets.
                  Use the parts list to select a part.
                </p>

                {mode === "3d" && load ? (
                  <CanvasBoundary onError={() => setCrashed(true)}>
                    <ViewerCanvas manifest={manifest} store={store} active={visible && pageVisible} reducedMotion={reduced} mobile={mobile} />
                  </CanvasBoundary>
                ) : null}

                {mode === "fallback" ? (
                  <div className="absolute inset-0 flex flex-col pt-16">
                    {view !== "diagram" ? <FallbackNotice capability={crashed ? "crashed" : capability} onLoad={() => setForceLoad(true)} /> : null}
                    <div className="min-h-0 flex-1 p-6">
                      <StaticDiagram manifest={manifest} selectedId={selectedId} onSelect={(id) => select(id)} />
                    </div>
                  </div>
                ) : null}

                {(mode === "pending" || (mode === "3d" && !ready)) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-10" aria-hidden={mode === "pending"}>
                    <div className="skeleton aspect-[12/7] w-full max-w-md opacity-60">
                      <CategoryArt category={category} label={categorySingular} />
                    </div>
                    <div className="w-48">
                      <div
                        role="progressbar"
                        aria-label="Loading 3D model"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                        className="h-1 overflow-hidden rounded-full bg-line"
                      >
                        <div className="h-full rounded-full bg-fg-subtle transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-2 text-center text-xs text-fg-subtle">{!load ? "Preparing 3D view" : "Building model"}</p>
                    </div>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-3">
                  <div className="pointer-events-auto max-w-[70%]">
                    <ModelSourceBadge source={manifest.modelSource} />
                    {detail === "high" && mode === "3d" ? (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-bg-elev/80 px-2.5 py-1 text-xs text-fg-muted backdrop-blur">
                        <Icon name="search" size={12} /> Close-up detail
                      </p>
                    ) : null}
                  </div>
                  <div className="pointer-events-auto flex gap-1 rounded-full bg-bg-elev/80 backdrop-blur">
                    {glOk && !crashed ? (
                      <IconButton
                        label={view === "3d" ? "Show static diagram" : "Show 3D view"}
                        onClick={() => setView((v) => (v === "3d" ? "diagram" : "3d"))}
                      >
                        <Icon name={view === "3d" ? "list" : "cube"} />
                      </IconButton>
                    ) : null}
                    <IconButton label="Viewer help" pressed={helpOpen} onClick={() => setHelpOpen((v) => !v)}>
                      <Icon name="info" />
                    </IconButton>
                  </div>
                </div>

                {helpOpen ? (
                  <div className="absolute right-3 top-16 z-10 w-72 rounded-xl border border-line bg-bg-elev p-4 text-xs text-fg-muted shadow-[var(--shadow-elev)]">
                    <p className="font-medium text-fg">Controls</p>
                    <ul className="mt-2 space-y-1">
                      <li>Drag to rotate. Scroll or pinch to zoom.</li>
                      <li>Right-drag or two fingers to pan.</li>
                      <li>Click a part to inspect it. Double click to reset.</li>
                      <li>Keyboard: arrows rotate, Shift pans, plus and minus zoom, R resets.</li>
                      <li>Zoom in close to see labelled details.</li>
                    </ul>
                  </div>
                ) : null}


                <AssemblyCaption manifest={manifest} />

                {mode === "3d" ? <ControlBar manifest={manifest} mode={mode} /> : null}

                <PartPanel part={selectedPart} parts={parts} onClose={closePanel} onSelect={(id) => select(id)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExplodeStatus() {
  const explode = useViewer((s) => s.explode);
  const pct = Math.round(explode * 100);
  return <span className="tabular text-xs text-fg-subtle">{pct === 0 ? "Assembled" : `Exploded ${pct}%`}</span>;
}

function FallbackNotice({ capability, onLoad }: { capability: string; onLoad: () => void }) {
  const lowPower = capability === "low-power";
  return (
    <div className="mx-3 rounded-xl border border-line bg-bg-elev/90 p-4 text-sm sm:max-w-md">
      <p className="font-medium">{lowPower ? "3D view paused to save power and data" : "The 3D view could not start"}</p>
      <p className="mt-1 text-fg-muted">
        {lowPower
          ? "This is a static diagram of the same parts. Every detail is in the parts list."
          : "Your browser or device could not run WebGL. This static diagram and the parts list show the same information."}
      </p>
      {lowPower ? (
        <Button variant="secondary" className="mt-3" onClick={onLoad}>
          Load 3D view anyway
        </Button>
      ) : null}
    </div>
  );
}

function AssemblyCaption({ manifest }: { manifest: Manifest }) {
  const playing = useViewer((s) => s.playing);
  const step = useViewer((s) => Math.floor(s.playT));
  const stop = useViewer((s) => s.stop);
  const ordered = [...manifest.parts].sort((a, b) => a.order - b.order);
  const current = ordered[Math.min(step, ordered.length - 1)];
  return (
    <div aria-live="polite" className="pointer-events-none absolute inset-x-3 top-16 flex justify-center">
      {playing && current ? (
        <div className="pointer-events-auto flex max-w-xl items-center gap-3 rounded-full border border-line bg-bg-elev/90 py-1.5 pl-4 pr-1.5 text-sm shadow-[var(--shadow-elev)] backdrop-blur">
          <span className="tabular shrink-0 text-xs text-fg-subtle">
            {Math.min(step + 1, ordered.length)} / {ordered.length}
          </span>
          <span className="text-fg">{current.assemblyCaption}</span>
          <IconButton label="Stop assembly" onClick={stop} className="size-9">
            <Icon name="pause" size={16} />
          </IconButton>
        </div>
      ) : null}
    </div>
  );
}

function ControlBar({ manifest, mode }: { manifest: Manifest; mode: "3d" | "fallback" }) {
  const ids = useId();
  const explode = useViewer((s) => s.explode);
  const setExplode = useViewer((s) => s.setExplode);
  const scrollLinked = useViewer((s) => s.scrollLinked);
  const setScrollLinked = useViewer((s) => s.setScrollLinked);
  const layer = useViewer((s) => s.layer);
  const setLayer = useViewer((s) => s.setLayer);
  const section = useViewer((s) => s.sectionEnabled);
  const setSection = useViewer((s) => s.setSection);
  const sectionOffset = useViewer((s) => s.sectionOffset);
  const setSectionOffset = useViewer((s) => s.setSectionOffset);
  const playing = useViewer((s) => s.playing);
  const play = useViewer((s) => s.play);
  const stop = useViewer((s) => s.stop);
  const frame = useViewer((s) => s.frame);
  const select = useViewer((s) => s.select);
  const panelOpen = useViewer((s) => s.selectedId !== null);
  const is3d = mode === "3d";
  const usedLayers = new Set(manifest.parts.flatMap((p) => p.layers));
  const pct = Math.round(explode * 100);

  return (
    <div className={cn("absolute inset-x-3 bottom-3 z-10 rounded-xl border border-line bg-bg-elev/85 p-2 backdrop-blur-xl", panelOpen && "lg:right-[424px]")}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="flex min-w-[220px] flex-1 items-center gap-3 px-2">
          <label htmlFor={`${ids}-explode`} className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
            <Icon name="explode" size={16} /> Explode
          </label>
          <input
            id={`${ids}-explode`}
            type="range"
            min={0}
            max={100}
            step={1}
            value={pct}
            disabled={scrollLinked || playing || !is3d}
            onChange={(e) => setExplode(Number(e.target.value) / 100)}
            aria-valuetext={pct === 0 ? "Assembled" : `${pct} percent exploded`}
            className="range min-w-0 flex-1"
            style={{ ["--fill" as string]: `${pct}%` }}
          />
          <span className="tabular w-9 text-right text-xs text-fg-subtle" aria-hidden="true">
            {pct}%
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <IconButton
            label={scrollLinked ? "Stop linking explode to page scroll" : "Link explode to page scroll"}
            pressed={scrollLinked}
            disabled={!is3d || playing}
            onClick={() => setScrollLinked(!scrollLinked)}
          >
            <Icon name="scroll" />
          </IconButton>
          <label className="sr-only" htmlFor={`${ids}-layer`}>
            Layer
          </label>
          <div className="relative">
            <Icon name="layers" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
            <select
              id={`${ids}-layer`}
              value={layer}
              disabled={!is3d}
              onChange={(e) => {
                setLayer(e.target.value as LayerFilter);
                select(null);
              }}
              className="h-11 appearance-none rounded-full bg-transparent pl-9 pr-4 text-sm text-fg hover:bg-bg-subtle disabled:opacity-40"
            >
              {LAYERS.filter((l) => l === "all" || usedLayers.has(l)).map((l) => (
                <option key={l} value={l}>
                  {LAYER_LABEL[l]}
                </option>
              ))}
            </select>
          </div>
          <IconButton label={section ? "Turn off section view" : "Turn on section view"} pressed={section} disabled={!is3d} onClick={() => setSection(!section)}>
            <Icon name="section" />
          </IconButton>
          <Button
            variant="ghost"
            disabled={!is3d}
            onClick={() => (playing ? stop() : play())}
            aria-label={playing ? "Stop assembly animation" : "Play assembly animation"}
            className="px-3"
          >
            <Icon name={playing ? "pause" : "play"} size={16} />
            <span className="hidden sm:inline">{playing ? "Stop" : "Play assembly"}</span>
          </Button>
          <IconButton
            label="Reset view"
            disabled={!is3d}
            onClick={() => {
              select(null);
              frame?.("reset");
            }}
          >
            <Icon name="reset" />
          </IconButton>
        </div>
      </div>
      {section && is3d ? (
        <div className="flex items-center gap-3 border-t border-line px-2 pt-1">
          <label htmlFor={`${ids}-cut`} className="text-xs font-medium text-fg-muted">
            Cut position
          </label>
          <input
            id={`${ids}-cut`}
            type="range"
            min={-100}
            max={100}
            value={Math.round(sectionOffset * 100)}
            onChange={(e) => setSectionOffset(Number(e.target.value) / 100)}
            aria-valuetext={`${Math.round(((sectionOffset + 1) / 2) * 100)} percent across the model`}
            className="range min-w-0 flex-1"
            style={{ ["--fill" as string]: `${Math.round(((sectionOffset + 1) / 2) * 100)}%` }}
          />
          <span className="hidden text-xs text-fg-subtle sm:inline">or drag the plane</span>
        </div>
      ) : null}
    </div>
  );
}
