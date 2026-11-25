import Image from "next/image";
import { formatDate } from "@/lib/format";
import type { Product } from "@/lib/schema";
import { Icon } from "@/components/ui/Icon";

/** Photos of the actual inspected sample, each with the date and what it shows. */
export function PhotoGallery({ photos, sampleReceived }: { photos: Product["photos"]; sampleReceived: boolean }) {
  if (photos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong px-6 py-12 text-center">
        <Icon name="info" size={24} className="mx-auto text-fg-subtle" />
        <p className="mt-3 font-medium">No photographs of the actual sample yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
          {sampleReceived
            ? "We have the sample. Photos will be added with the date they were taken and what each one shows."
            : "We have not received a sample. We do not use supplier marketing images or stock photos in their place."}
        </p>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((p) => (
        <li key={p.src}>
          <figure>
            <Image
              src={p.src}
              alt={p.alt}
              width={p.width}
              height={p.height}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="h-auto w-full rounded-lg border border-line bg-bg-subtle"
            />
            <figcaption className="mt-2 text-sm text-fg-muted">
              {p.caption} <span className="text-fg-subtle">Taken {formatDate(p.takenOn)}.</span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
