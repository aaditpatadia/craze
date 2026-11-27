"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { saveFile } from "@/lib/downloads";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export type DownloadItem = { label: string; note: string; file: string; mime?: string; make: () => string };

/** A row of files an engineer drops straight into CAD or flight software. Generated in the browser. */
export function Downloads({ title = "Engineer downloads", lead, items, className }: { title?: string; lead?: string; items: DownloadItem[]; className?: string }) {
  const [done, setDone] = useState<string | null>(null);
  return (
    <section className={cn("rounded-xl border border-line p-5", className)} aria-label={title}>
      <p className="font-medium">{title}</p>
      {lead ? <p className="mt-1 text-sm text-fg-subtle">{lead}</p> : null}
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((d) => (
          <li key={d.file}>
            <button
              type="button"
              onClick={() => {
                saveFile(d.file, d.make(), d.mime);
                setDone(d.file);
                track("Document downloaded", { kind: d.file.split(".").pop() ?? "file" });
              }}
              className="flex h-full w-full flex-col items-start rounded-lg border border-line p-4 text-left transition-colors hover:border-line-strong hover:bg-bg-subtle"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Icon name={done === d.file ? "check" : "download"} size={16} className="text-accent" /> {d.label}
              </span>
              <span className="mt-1 text-xs text-fg-subtle">{d.note}</span>
              <span className="code-text mt-auto block w-full whitespace-normal break-words pt-2 text-[11px] text-fg-subtle">{d.file}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
