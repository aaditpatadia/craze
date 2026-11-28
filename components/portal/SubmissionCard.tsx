import { FileThumb } from "@/components/portal/Uploader";
import { cn } from "@/lib/cn";
import { bytes, fieldsOf, fileHref, kindOf, reviewLabel, type PortalSubmission } from "@/lib/portal";

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

const TONE: Record<string, string> = {
  submitted: "border-line text-fg-muted",
  accepted: "border-accent/50 bg-accent/10 text-fg",
  changes: "border-amber-500/50 bg-amber-500/10 text-fg",
  rejected: "border-danger/50 bg-danger/10 text-danger",
};

export function ReviewBadge({ status }: { status: string }) {
  return <span className={cn("inline-flex min-h-6 items-center rounded-full border px-2.5 text-xs font-medium", TONE[status] ?? TONE.submitted)}>{reviewLabel(status)}</span>;
}

/** One submission as both the supplier and the team see it: fields, files and the review. `actions` adds the team's controls. */
export function SubmissionCard({ s, actions, showBy = false }: { s: PortalSubmission; actions?: React.ReactNode; showBy?: boolean }) {
  const def = kindOf(s.kind);
  const fields = fieldsOf(s.kind).filter((f) => s.fields[f.id]);
  return (
    <article id={s.ref} className="scroll-mt-24 rounded-xl border border-line p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="code-text text-xs text-fg-subtle">
            {s.ref} · {def?.label}
            {s.partCode ? ` · ${s.partCode}` : ""}
          </p>
          <h3 className="mt-1 break-words font-semibold">{s.title}</h3>
          <p className="mt-0.5 text-xs text-fg-subtle">
            Submitted {when(s.createdAt)}
            {showBy ? ` by ${s.by}` : ""}
          </p>
        </div>
        <ReviewBadge status={s.status} />
      </header>
      {fields.length ? (
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.id} className={f.long ? "sm:col-span-2" : ""}>
              <dt className="text-xs text-fg-subtle">{f.label}</dt>
              <dd className="whitespace-pre-wrap break-words">{s.fields[f.id]}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {s.note ? <p className="mt-3 whitespace-pre-wrap break-words text-sm text-fg-muted">{s.note}</p> : null}
      {s.files.length ? (
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {s.files.map((f) => (
            <li key={f.url} className="overflow-hidden rounded-lg border border-line">
              <FileThumb file={f} src={fileHref(f.url)} />
              <p className="truncate px-1.5 py-1 text-[11px] text-fg-muted" title={`${f.name} · ${bytes(f.size)}`}>
                {f.name}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
      {s.review?.note || (s.status !== "submitted" && s.review) ? (
        <p className={cn("mt-4 rounded-lg border p-3 text-sm", TONE[s.status])}>
          <span className="font-medium">Timule review, {when(s.review!.at)}:</span> {s.review!.note ?? reviewLabel(s.status)}
        </p>
      ) : null}
      {actions ? <div className="mt-4 border-t border-line pt-4">{actions}</div> : null}
    </article>
  );
}
