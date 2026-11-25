import { cn } from "@/lib/cn";

/** 12-column container with the site's horizontal rhythm. */
export function Container({ className, children, as: Tag = "div" }: { className?: string; children: React.ReactNode; as?: "div" | "section" | "header" }) {
  return <Tag className={cn("mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10", className)}>{children}</Tag>;
}

export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  lead?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Container as="header" className={cn("pb-10 pt-14 sm:pt-20", className)}>
      {eyebrow ? <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-fg-subtle">{eyebrow}</div> : null}
      <h1 className="max-w-4xl text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {lead ? <div className="mt-4 max-w-2xl text-lg text-fg-muted">{lead}</div> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </Container>
  );
}

export function SectionHeading({ id, title, lead, className }: { id?: string; title: string; lead?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <h2 id={id} className="text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>
      {lead ? <p className="mt-3 text-base text-fg-muted">{lead}</p> : null}
    </div>
  );
}

/** Prose wrapper for reading pages. No typography plugin: explicit, predictable rules. */
export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-[68ch] text-base text-fg-muted",
        "[&_h2]:mt-14 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-fg",
        "[&_h3]:mt-8 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-fg",
        "[&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5",
        "[&_a]:text-accent [&_a]:underline [&_strong]:font-medium [&_strong]:text-fg",
        className,
      )}
    >
      {children}
    </div>
  );
}
