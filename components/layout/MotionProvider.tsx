"use client";

import { MotionConfig } from "framer-motion";

/** Framer Motion respects prefers-reduced-motion everywhere: animations become instant. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </MotionConfig>
  );
}
