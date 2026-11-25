"use client";

import { useEffect } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Layout";

/** Route-level error boundary. Renders inside the root layout. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div data-surface="reading" className="flex min-h-dvh items-center">
      <Container className="py-24">
        <p className="text-sm text-fg-subtle">Error</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Something went wrong on our side.</h1>
        <p className="mt-4 max-w-xl text-lg text-fg-muted">
          The page could not load. Nothing you entered was sent. Try again, and if it keeps happening, come back in a few
          minutes.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button onClick={reset}>Try again</Button>
          <LinkButton href="/" variant="secondary">
            Home
          </LinkButton>
        </div>
        {error.digest ? <p className="mt-10 text-xs text-fg-subtle">Reference: {error.digest}</p> : null}
      </Container>
    </div>
  );
}
