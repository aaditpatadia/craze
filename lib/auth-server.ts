import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SUPPLIER_COOKIE, supplierSession, teamSession, type SupplierSession, type TeamSession } from "./auth";

/** Call at the top of a team-only page: sends anyone not signed in to the team sign-in page. */
export async function requireTeam(next: string): Promise<TeamSession> {
  const s = await teamSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) redirect(`/team/login?next=${encodeURIComponent(next)}`);
  return s;
}

/** Older name, kept for the founder pages. */
export const requireFounder = requireTeam;

export async function currentTeam(): Promise<TeamSession | null> {
  return teamSession((await cookies()).get(SESSION_COOKIE)?.value);
}

export const founderSignedIn = async () => !!(await currentTeam());

/** Call at the top of a supplier page: sends anyone not signed in to the supplier sign-in page. */
export async function requireSupplierSession(): Promise<SupplierSession> {
  const s = await supplierSession((await cookies()).get(SUPPLIER_COOKIE)?.value);
  if (!s) redirect("/supplier/login");
  return s;
}
