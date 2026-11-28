"use client";

import { upload } from "@vercel/blob/client";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { bytes, fileKind, type PortalFile } from "@/lib/portal";
import { Icon } from "@/components/ui/Icon";

type Pending = { key: string; name: string; progress: number; error?: string };

const ACCESS = (process.env.NEXT_PUBLIC_BLOB_ACCESS === "private" ? "private" : "public") as "public";

/**
 * Drag-and-drop or pick files; each goes straight to storage and appears as a tile.
 * `folder` is the storage folder the upload route accepts, such as "vault/<id>" or "complaints".
 */
export function Uploader({
  folder,
  accept,
  types,
  maxBytes,
  maxFiles,
  files,
  onChange,
  label = "Add photos, videos or PDFs",
  hint,
  preview,
}: {
  folder: string;
  accept: string;
  types: readonly string[];
  maxBytes: number;
  maxFiles: number;
  files: PortalFile[];
  /** Receives an updater, like a React state setter. */
  onChange: (update: (prev: PortalFile[]) => PortalFile[]) => void;
  label?: string;
  hint?: string;
  /** Turns a stored URL into one the browser may show (through /api/files). */
  preview?: (url: string) => string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [over, setOver] = useState(false);

  const add = async (list: FileList | File[]) => {
    const chosen = Array.from(list);
    const room = maxFiles - files.length - pending.filter((p) => !p.error).length;
    for (const file of chosen.slice(0, Math.max(0, room))) {
      const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`;
      const type = file.type || (/\.heic$/i.test(file.name) ? "image/heic" : /\.mov$/i.test(file.name) ? "video/quicktime" : "");
      if (!types.includes(type)) {
        setPending((p) => [...p, { key, name: file.name, progress: 0, error: "This kind of file is not accepted. Use PDF, JPG, PNG, WEBP, HEIC, MP4 or MOV." }]);
        continue;
      }
      if (file.size > maxBytes) {
        setPending((p) => [...p, { key, name: file.name, progress: 0, error: `Too large: up to ${bytes(maxBytes)} per file.` }]);
        continue;
      }
      setPending((p) => [...p, { key, name: file.name, progress: 0 }]);
      try {
        const safe = file.name.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").slice(-120) || "file";
        const blob = await upload(`${folder}/${safe}`, file, {
          access: ACCESS,
          handleUploadUrl: "/api/upload",
          contentType: type,
          multipart: file.size > 8 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setPending((p) => p.map((x) => (x.key === key ? { ...x, progress: percentage } : x))),
        });
        setPending((p) => p.filter((x) => x.key !== key));
        onChange((prev) => [...prev, { name: file.name, url: blob.url, size: file.size, type }]);
      } catch (e) {
        setPending((p) => p.map((x) => (x.key === key ? { ...x, error: e instanceof Error ? e.message : "Upload failed. Try again." } : x)));
      }
    }
    if (chosen.length > room) setPending((p) => [...p, { key: `limit-${Date.now()}`, name: "", progress: 0, error: `Up to ${maxFiles} files at a time.` }]);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void add(e.dataTransfer.files);
        }}
        className={cn(
          "mt-2 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
          over ? "border-accent bg-accent/5" : "border-line-strong/60 bg-bg-subtle",
        )}
      >
        <Icon name="upload" size={22} className="text-fg-subtle" />
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-accent hover:underline">
          {label}
        </label>
        <p className="text-xs text-fg-subtle">{hint ?? `Drop files here, or choose them. Up to ${maxFiles} files, ${bytes(maxBytes)} each.`}</p>
        <input
          ref={input}
          id={id}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) void add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length || pending.length ? (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((f) => (
            <li key={f.url} className="group relative overflow-hidden rounded-lg border border-line bg-bg-elev">
              <FileThumb file={f} src={preview ? preview(f.url) : f.url} />
              <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                <span className="min-w-0 truncate text-xs" title={f.name}>
                  {f.name}
                </span>
                <button
                  type="button"
                  onClick={() => onChange((prev) => prev.filter((x) => x.url !== f.url))}
                  className="shrink-0 rounded p-1 text-fg-subtle hover:bg-bg-subtle hover:text-danger"
                  aria-label={`Remove ${f.name}`}
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            </li>
          ))}
          {pending.map((p) => (
            <li key={p.key} className={cn("rounded-lg border p-3 text-xs", p.error ? "border-danger/40 text-danger" : "border-line text-fg-muted")}>
              {p.name ? <p className="truncate font-medium">{p.name}</p> : null}
              {p.error ? (
                <p className="mt-1 flex items-start justify-between gap-2">
                  <span>{p.error}</span>
                  <button type="button" className="shrink-0 underline" onClick={() => setPending((x) => x.filter((y) => y.key !== p.key))}>
                    Dismiss
                  </button>
                </p>
              ) : (
                <>
                  <p className="mt-1">Uploading… {Math.round(p.progress)} %</p>
                  <span className="mt-2 block h-1 overflow-hidden rounded bg-bg-subtle">
                    <span className="block h-full bg-accent transition-[width]" style={{ width: `${p.progress}%` }} />
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** A small preview: the image itself, a video still, or a labelled tile for PDFs. */
export function FileThumb({ file, src, className }: { file: { name: string; type: string; size?: number }; src: string; className?: string }) {
  const k = fileKind(file);
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className={cn("block aspect-[4/3] bg-bg-subtle", className)} title={`Open ${file.name}`}>
      {k === "image" && !/heic|heif/.test(file.type) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={file.name} loading="lazy" className="size-full object-cover" />
      ) : k === "video" ? (
        <video src={src} preload="metadata" muted playsInline className="size-full object-cover" />
      ) : (
        <span className="flex size-full flex-col items-center justify-center gap-1 text-fg-subtle">
          <Icon name="document" size={26} />
          <span className="text-[11px] font-medium uppercase">{k === "pdf" ? "PDF" : (file.name.split(".").pop() ?? "File")}</span>
        </span>
      )}
    </a>
  );
}
