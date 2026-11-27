import { TimuleMark } from "@/components/brand/Logo";
import { COMPANY, SITE } from "@/lib/config";

export type TitleField = { label: string; value: React.ReactNode; mono?: boolean };

const COLS = ["1", "2", "3", "4", "5", "6"];
const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const MICRO = "TIMULE  ·  ONE CODE FOR EVERY CRITICAL PART  ·  TM  ·  ".repeat(12);

/**
 * One Timule blueprint sheet: grid, double frame with zone marks, microtext,
 * page header and title block. Content flows across printed pages; the frame
 * and title block repeat on every page and the spacers keep content clear of them.
 */
export function BlueprintSheet({
  kind,
  title,
  number,
  status,
  fields,
  children,
}: {
  /** Document type, printed small above the title, e.g. "Purchase order". */
  kind: string;
  title: React.ReactNode;
  /** Document number or code, e.g. TMP-261126-4HZ8. */
  number: string;
  /** Short status stamp, e.g. "Proforma" or "Sample data". */
  status?: string | null;
  /** Title block cells after the company cell. Up to 9. */
  fields: TitleField[];
  children: React.ReactNode;
}) {
  return (
    <article className="bp-sheet bp-grid-bg" aria-label={`${kind} ${number}`}>
      <div className="bp-frame" aria-hidden="true">
        {COLS.map((c, i) => (
          <span key={`t${c}`} className="bp-zone" style={{ top: "-4.6mm", left: `${((i + 0.5) / COLS.length) * 100}%` }}>
            {c}
          </span>
        ))}
        {ROWS.map((r, i) => (
          <span key={`l${r}`} className="bp-zone" style={{ left: "-4.2mm", top: `${((i + 0.5) / ROWS.length) * 100}%` }}>
            {r}
          </span>
        ))}
        {ROWS.map((r, i) => (
          <span key={`r${r}`} className="bp-zone" style={{ right: "-4.2mm", top: `${((i + 0.5) / ROWS.length) * 100}%` }}>
            {r}
          </span>
        ))}
        <div className="bp-micro" style={{ top: "1.9mm", padding: "0 4mm" }}>
          {MICRO}
        </div>
      </div>

      <table className="bp-flow" role="presentation">
        <thead>
          <tr>
            <td>
              <div className="bp-space-top" />
            </td>
          </tr>
        </thead>
        <tfoot>
          <tr>
            <td>
              <div className="bp-space-bottom" />
            </td>
          </tr>
        </tfoot>
        <tbody>
          <tr>
            <td>
              <div className="bp-content">
                <header className="flex items-start justify-between gap-6 border-b pb-4" style={{ borderColor: "var(--bp-line)" }}>
                  <div className="flex items-center gap-3">
                    <TimuleMark size={40} />
                    <div>
                      <p className="text-[15pt] font-semibold leading-none tracking-[0.24em]">TIMULE</p>
                      <p className="bp-dim mt-1.5 text-[7pt] tracking-[0.12em]">ONE CODE FOR EVERY CRITICAL PART</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="bp-kind">{kind}</p>
                    <p className="bp-mono mt-1.5 text-[12pt] font-semibold">{number}</p>
                    {status ? (
                      <p className="mt-2">
                        <span className="bp-stamp">{status}</span>
                      </p>
                    ) : null}
                  </div>
                </header>
                <h1 className="bp-h1 mt-5">{title}</h1>
                {children}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="bp-titleblock">
        <div>
          <span className="flex items-center gap-2">
            <TimuleMark size={18} />
            <span className="font-semibold tracking-[0.22em]">TIMULE</span>
          </span>
          <span className="bp-dim mt-1 block text-[6.6pt] leading-snug">
            {COMPANY.legalName !== COMPANY.tradeName ? <>{COMPANY.legalName}<br /></> : null}
            {SITE.contactEmail}
            <br />
            {SITE.url.replace(/^https?:\/\//, "")}
          </span>
        </div>
        {fields.slice(0, 9).map((f) => (
          <div key={f.label}>
            <span className="bp-label">{f.label}</span>
            <span className={f.mono ? "bp-value bp-mono" : "bp-value"}>{f.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export function BpSection({ n, title, children, className }: { n?: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bp-section ${className ?? ""}`}>
      <h2 className="bp-section-title">
        {n ? <span className="bp-n">{n}</span> : null}
        {title}
      </h2>
      {children}
    </section>
  );
}

export function BpField({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <span className="bp-label">{label}</span>
      <span className={mono ? "bp-value bp-mono" : "bp-value"}>{children}</span>
    </div>
  );
}

/** Wraps a sheet with the screen toolbar. Variant is switched by the toolbar. */
export function BlueprintDocument({ toolbar, children }: { toolbar: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bp-root" data-variant="blueprint">
      {toolbar}
      {children}
    </div>
  );
}

/** A TM code cell. A configured part's build string goes on its own wrapping line under the code. */
export function BpCode({ code, empty = "None" }: { code: string; empty?: string }) {
  if (!code) return <span className="bp-faint">{empty}</span>;
  const [head, ...rest] = code.split(" / ");
  const build = rest.join(" / ");
  return (
    <>
      <span className="bp-mono block whitespace-nowrap font-semibold">{head}</span>
      {build ? <span className="bp-mono bp-dim mt-0.5 block max-w-[78mm] break-words text-[6.6pt] leading-snug">{build}</span> : null}
    </>
  );
}
