/**
 * Timule mark: a T drawn as a part on a drawing, inside a frame with a code block
 * in the corner. Uses currentColor so it works on the site, on blueprints and on paper.
 */
export function TimuleMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
      <rect x="2.75" y="2.75" width="26.5" height="26.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 8h16v3.6h-6.2V24h-3.6V11.6H8z" fill="currentColor" />
      <path d="M21 21h4.25v4.25H21z" fill="currentColor" opacity=".55" />
      <path d="M2.75 16h2.5M26.75 16h2.5M16 2.75v2.5" stroke="currentColor" strokeWidth="1" opacity=".6" />
    </svg>
  );
}

export function TimuleLogo({ size = 22, className, wordClassName }: { size?: number; className?: string; wordClassName?: string }) {
  return (
    <span className={className ?? "inline-flex items-center gap-2"}>
      <TimuleMark size={size} />
      <span className={wordClassName ?? "font-semibold tracking-[0.18em]"}>TIMULE</span>
    </span>
  );
}
