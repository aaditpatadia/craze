import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export const inputClass =
  "mt-2 block w-full rounded-lg border bg-bg-elev px-3.5 text-base text-fg placeholder:text-fg-subtle transition-colors duration-200 " +
  "hover:border-line-strong focus-visible:border-accent disabled:opacity-50 aria-[invalid=true]:border-danger";

/** Label, control, hint and error, wired together for assistive technology. */
export function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional ? <span className="font-normal text-fg-subtle"> (optional)</span> : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-fg-subtle">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-2 flex items-start gap-1.5 text-sm text-danger">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, hint?: string, error?: string) {
  return cn(hint && `${id}-hint`, error && `${id}-error`) || undefined;
}

/** Off-screen honeypot. Hidden from people and assistive tech; bots tend to fill it. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}
