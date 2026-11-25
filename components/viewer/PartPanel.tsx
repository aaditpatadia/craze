"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { ResolvedPart } from "@/lib/viewer-data";
import { IconButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PartDetails } from "./PartDetails";

/**
 * Side panel on desktop, bottom sheet on mobile. Focus moves to the heading on open;
 * the caller returns focus on close.
 */
export function PartPanel({
  part,
  parts,
  onClose,
  onSelect,
}: {
  part: ResolvedPart | null;
  parts: ResolvedPart[];
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (part) heading.current?.focus({ preventScroll: true });
  }, [part]);

  const neighbours = part
    ? part.interactsWith.map((id) => parts.find((p) => p.id === id)).filter((p): p is ResolvedPart => !!p).map(({ id, name }) => ({ id, name }))
    : [];
  const index = part ? parts.findIndex((p) => p.id === part.id) : -1;

  return (
    <AnimatePresence>
      {part ? (
        <motion.aside
          key="panel"
          aria-labelledby="part-panel-title"
          initial={reduce ? false : { opacity: 0, x: 24, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
          transition={{ duration: 0.3 }}
          className={
            "fixed inset-x-0 bottom-0 z-40 flex max-h-[72dvh] flex-col rounded-t-2xl border-t border-line bg-bg-elev shadow-[var(--shadow-elev)] " +
            "lg:absolute lg:inset-x-auto lg:bottom-3 lg:right-3 lg:top-3 lg:z-20 lg:max-h-none lg:w-[400px] lg:rounded-xl lg:border"
          }
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              onClose();
            }
          }}
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line lg:hidden" aria-hidden="true" />
          <header className="flex items-start gap-3 border-b border-line px-5 pb-4 pt-3 lg:pt-5">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-fg-subtle">
                Part {index + 1} of {parts.length}
              </p>
              <h2 id="part-panel-title" ref={heading} tabIndex={-1} className="mt-1 text-lg font-semibold leading-snug outline-none">
                {part.name}
              </h2>
              <p className="mt-1 text-sm text-fg-muted">{part.role}</p>
            </div>
            <IconButton label="Close part details" onClick={onClose} className="-mr-2 -mt-1">
              <Icon name="close" />
            </IconButton>
          </header>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            <PartDetails part={part} neighbours={neighbours} onSelectNeighbour={onSelect} />
          </div>
          <footer className="flex items-center justify-between border-t border-line px-3 py-2">
            <button
              type="button"
              disabled={index <= 0}
              onClick={() => onSelect(parts[index - 1]!.id)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-fg-muted hover:bg-bg-subtle hover:text-fg disabled:opacity-40"
            >
              <Icon name="arrowLeft" size={16} /> Previous
            </button>
            <button
              type="button"
              disabled={index >= parts.length - 1}
              onClick={() => onSelect(parts[index + 1]!.id)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-fg-muted hover:bg-bg-subtle hover:text-fg disabled:opacity-40"
            >
              Next <Icon name="arrowRight" size={16} />
            </button>
          </footer>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
