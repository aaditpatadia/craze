import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, validSession } from "./auth";

/** Call at the top of a founder-only page: sends anyone not signed in to the sign-in page. */
export async function requireFounder(next: string) {
  const jar = await cookies();
  if (!(await validSession(jar.get(SESSION_COOKIE)?.value))) redirect(`/login?next=${encodeURIComponent(next)}`);
}

export async function founderSignedIn() {
  const jar = await cookies();
  return validSession(jar.get(SESSION_COOKIE)?.value);
}
