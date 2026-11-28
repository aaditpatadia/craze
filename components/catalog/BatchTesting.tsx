import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Container, SectionHeading } from "@/components/ui/Layout";

/** How every order batch is tested before it ships. One source for the wording used across the site. */
export const BATCH_TITLE = "Tested batch to batch. Only parts that pass every grade ship.";
export const BATCH_LINE =
  "Every batch is tested against the acceptance bands on the part's build sheet before it leaves us. Anything outside the bands is rejected, so you receive only top-grade parts.";

const STEPS = [
  {
    title: "Every unit",
    body: "Electrical and functional checks on each unit, logged by serial number: KV and resistance for motors, power-on and function tests for electronics.",
  },
  {
    title: "Every batch",
    body: "Samples from each batch are measured and compared with the batch before, so drift between batches is caught before it reaches you.",
  },
  {
    title: "Graded, not averaged",
    body: "Each part is graded against the bands on its TM code. Only parts inside every band ship. The rest go back to the maker.",
  },
  {
    title: "On paper",
    body: "Each delivery carries its batch number, test results and origin declarations, filed under the same TM code.",
  },
];

/** Full section with the four steps. */
export function BatchTesting({ className = "border-t border-line py-20 sm:py-28" }: { className?: string }) {
  return (
    <section aria-labelledby="batch-title" className={className}>
      <Container>
        <SectionHeading id="batch-title" title={BATCH_TITLE} lead={BATCH_LINE} />
        <ol className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-line p-6">
              <p className="code-text text-xs text-accent">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-fg-muted">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm">
          <Link href="/evidence#log" className="text-accent hover:underline">
            See every check in the live verification log
          </Link>
        </p>
      </Container>
    </section>
  );
}

/** One-line strip for listing pages. */
export function BatchTestingStrip() {
  return (
    <p className="flex items-start gap-3 rounded-xl border border-line bg-bg-subtle px-4 py-3 text-sm text-fg-muted">
      <Icon name="check" size={18} className="mt-0.5 shrink-0 text-accent" />
      <span>
        <span className="font-medium text-fg">Batch-to-batch tested.</span> Every batch is checked against the part&apos;s build sheet before it ships, and only
        top-grade parts that pass every band reach you.{" "}
        <Link href="/methodology#batch" className="text-accent hover:underline">
          How we test
        </Link>
      </span>
    </p>
  );
}
