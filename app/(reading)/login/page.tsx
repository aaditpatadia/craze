import type { Metadata } from "next";
import { Suspense } from "react";
import { SignIn } from "@/components/auth/SignIn";
import { Container, PageHeader } from "@/components/ui/Layout";

export const metadata: Metadata = { title: "Founder sign-in", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <>
      <PageHeader title="Founder sign-in" lead="For the Timule team: quotations, purchase orders, invoices and firmware seals." />
      <Container className="pb-24">
        <Suspense>
          <SignIn />
        </Suspense>
      </Container>
    </>
  );
}
