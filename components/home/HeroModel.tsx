"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Manifest } from "@/lib/schema";
import { CategoryArt } from "@/components/catalog/CategoryArt";
import { ModelSourceBadge } from "@/components/ui/Chips";
import { useDeferredLoad, useGlCapability, useIsMobile, useReducedMotionPref } from "@/components/viewer/capabilities";
import { ViewerStoreContext, createViewerStore, useViewer, useViewerStoreApi } from "@/components/viewer/store";

const ViewerCanvas = dynamic(() => import("@/components/viewer/ViewerCanvas"), { ssr: false, loading: () => null });

/** The home page hero: one part, assembled, turning slowly. Loads after first paint. */
export function HeroModel({ manifest }: { manifest: Manifest | null }) {
  const [store] = useState(() => createViewerStore());
  return (
    <ViewerStoreContext.Provider value={store}>
      <HeroInner manifest={manifest} />
    </ViewerStoreContext.Provider>
  );
}

function HeroInner({ manifest }: { manifest: Manifest | null }) {
  const capability = useGlCapability();
  const reduced = useReducedMotionPref();
  const mobile = useIsMobile();
  const store = useViewerStoreApi();
  const ready = useViewer((s) => s.ready);
  // The hero is decoration around the real content, so it waits for interaction or a few idle seconds.
  const load = useDeferredLoad(capability === "ok" && !!manifest, 5000);
  const [active, setActive] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let onScreen = true;
    let pageVisible = document.visibilityState === "visible";
    const update = () => setActive(onScreen && pageVisible);
    const io = new IntersectionObserver(([e]) => {
      onScreen = !!e?.isIntersecting;
      update();
    });
    io.observe(el);
    const onVis = () => {
      pageVisible = document.visibilityState === "visible";
      update();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={ref} className="relative aspect-[4/3] w-full">
      <div className={`absolute inset-0 p-10 transition-opacity duration-400 ${ready ? "opacity-0" : "opacity-70"}`} aria-hidden="true">
        <CategoryArt category="bldc-motors" label="BLDC motor" />
      </div>
      {load && manifest ? (
        <div className="absolute inset-0" role="img" aria-label="Illustrative 3D model of a drone outrunner motor, turning slowly">
          <ViewerCanvas manifest={manifest} store={store} active={active} reducedMotion={reduced} mobile={mobile} hero />
        </div>
      ) : null}
      {manifest ? (
        <div className="absolute bottom-0 left-0">
          <ModelSourceBadge source={manifest.modelSource} />
        </div>
      ) : null}
    </div>
  );
}

