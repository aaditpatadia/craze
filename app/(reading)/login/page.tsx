import { redirect } from "next/navigation";

/** The old founder sign-in address. Team sign-in now lives at /team/login. */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  redirect(typeof next === "string" ? `/team/login?next=${encodeURIComponent(next)}` : "/team/login");
}
