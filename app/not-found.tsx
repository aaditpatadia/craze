import Link from "next/link";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Layout";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <SiteChrome surface="reading">
      <Container className="py-24 sm:py-32">
        <p className="text-sm text-fg-subtle">404</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">We could not find that page.</h1>
        <p className="mt-4 max-w-xl text-lg text-fg-muted">
          The link may be old, or the part may have been removed from the catalogue. If you were looking for a specific part,
          we can try to source it.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <LinkButton href="/parts">Browse all parts</LinkButton>
          <LinkButton href="/request" variant="secondary">
            Request a part
          </LinkButton>
        </div>
        <p className="mt-10 text-sm text-fg-subtle">
          Or go to the <Link href="/" className="text-accent hover:underline">home page</Link>.
        </p>
      </Container>
    </SiteChrome>
  );
}
