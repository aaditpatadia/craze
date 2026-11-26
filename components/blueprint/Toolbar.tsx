"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { track } from "@/lib/analytics";

const KEY = "timule.blueprint.variant";
type Variant = "blueprint" | "paper";

/**
 * Screen-only bar above every blueprint: back link, blueprint or paper variant,
 * and Download PDF. The PDF uses the browser's print dialog; the page title
 * becomes the default file name.
 */
export function BpToolbar({ back, fileName, children }: { back: { href: string; label: string }; fileName: string; children?: React.ReactNode }) {
  const [variant, setVariant] = useState<Variant>("blueprint");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from storage after mount
    if (stored === "paper") setVariant("paper");
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".bp-root");
    if (root) root.dataset.variant = variant;
  }, [variant]);

  const choose = (v: Variant) => {
    setVariant(v);
    try {
      localStorage.setItem(KEY, v);
    } catch {}
  };

  const download = () => {
    const before = document.title;
    document.title = fileName;
    track("Document downloaded", { file: fileName.split(" ")[0] ?? fileName });
    window.print();
    setTimeout(() => {
      document.title = before;
    }, 500);
  };

  return (
    <div className="bp-toolbar">
      <Link href={back.href} className="bp-btn" style={{ border: 0, paddingLeft: 4 }}>
        <Icon name="arrowLeft" size={16} /> {back.label}
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <div role="group" aria-label="Sheet style" className="flex gap-1">
          {(["blueprint", "paper"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={variant === v} onClick={() => choose(v)} className={variant === v ? "bp-btn bp-btn-primary" : "bp-btn"}>
              {v === "blueprint" ? "Blueprint" : "Paper"}
            </button>
          ))}
        </div>
        <button type="button" onClick={download} className="bp-btn bp-btn-primary">
          <Icon name="download" size={16} /> Download PDF
        </button>
      </div>
    </div>
  );
}
