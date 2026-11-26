import "./blueprint.css";

/** Printable Timule documents: no site header or footer, just the sheet and its toolbar. */
export default function DocumentLayout({ children }: { children: React.ReactNode }) {
  return <main id="main">{children}</main>;
}
