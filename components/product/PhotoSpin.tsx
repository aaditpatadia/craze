"use client";

/* eslint-disable @next/next/no-img-element -- frames are swapped every drag step; next/image would re-request each one */
import { useEffect, useRef, useState } from "react";
import { formatDate } from "@/lib/format";
import { ModelSourceBadge } from "@/components/ui/Chips";

/**
 * 360 degree viewer for a turntable photo set of the actual sample (24 to 72 frames).
 * Drag, swipe or use arrow keys to rotate. Frames are preloaded after first paint.
 */
export function PhotoSpin({
  frames,
  capturedOn,
  width,
  height,
  label,
}: {
  frames: string[];
  capturedOn: string;
  width: number;
  height: number;
  label: string;
}) {
  const [index, setIndex] = useState(0);
  const drag = useRef<{ x: number; start: number } | null>(null);
  const n = frames.length;

  useEffect(() => {
    const imgs = frames.map((src) => {
      const i = new Image();
      i.decoding = "async";
      i.src = src;
      return i;
    });
    return () => imgs.forEach((i) => (i.src = ""));
  }, [frames]);

  const step = (d: number) => setIndex((i) => (((i + d) % n) + n) % n);

  return (
    <figure>
      <div
        role="slider"
        tabIndex={0}
        aria-label={`${label}, 360 degree photo view. Use left and right arrow keys to rotate.`}
        aria-valuemin={1}
        aria-valuemax={n}
        aria-valuenow={index + 1}
        aria-valuetext={`Frame ${index + 1} of ${n}, ${Math.round((index / n) * 360)} degrees`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          else if (e.key === "ArrowLeft") step(-1);
          else return;
          e.preventDefault();
        }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, start: index };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const w = e.currentTarget.clientWidth;
          const delta = Math.round(((e.clientX - drag.current.x) / w) * n);
          setIndex((((drag.current.start - delta) % n) + n) % n);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        className="relative cursor-grab touch-pan-y select-none overflow-hidden rounded-xl border border-line bg-bg-subtle active:cursor-grabbing"
      >
        <img src={frames[index]} alt="" width={width} height={height} draggable={false} className="h-auto w-full" />
        <div className="absolute left-3 top-3">
          <ModelSourceBadge source="scanned-sample" />
        </div>
      </div>
      <figcaption className="mt-2 text-xs text-fg-subtle">
        Photographed on a turntable, {formatDate(capturedOn)}. Drag to rotate. These are photos of the sample we inspected.
      </figcaption>
    </figure>
  );
}
