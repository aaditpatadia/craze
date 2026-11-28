/**
 * Team accounts. Server only.
 *
 * Accounts live in the TIMULE_TEAM environment variable on Vercel, never in the code:
 *   username:Full Name:INITIALS:salt:hash;username2:...
 * The hash is scrypt (N=2^15, r=8, p=1, 32 bytes) of the password with a random 16-byte salt.
 * Create or rotate an account with:  npm run team:account -- <username> "<Full Name>" <INITIALS>
 *
 * Until TIMULE_TEAM is set, the single account "admin" signs in with TIMULE_ADMIN_KEY.
 */
import { scrypt, timingSafeEqual } from "node:crypto";
import { adminSecret, authConfigured, safeEqual } from "./auth";

export type TeamAccount = { user: string; name: string; initials: string; salt: string; hash: string };

const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;

export function hashPassword(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password.normalize("NFKC"), salt, 32, SCRYPT, (err, key) => (err ? reject(err) : resolve(key))));
}

export function teamAccounts(): TeamAccount[] {
  return (process.env.TIMULE_TEAM ?? "")
    .split(";")
    .map((e) => e.trim().split(":"))
    .filter((p) => p.length === 5 && /^[a-z][a-z0-9._-]{1,31}$/.test(p[0]!))
    .map(([user, name, initials, salt, hash]) => ({ user: user!, name: name!, initials: initials!.toUpperCase().slice(0, 4), salt: salt!, hash: hash! }));
}

/** The account for these credentials, or null. Takes about the same time whether or not the user exists. */
export async function checkTeamLogin(username: string, password: string): Promise<Omit<TeamAccount, "salt" | "hash"> | null> {
  const user = username.trim().toLowerCase();
  const accounts = teamAccounts();
  if (!accounts.length) {
    // Bootstrap account until TIMULE_TEAM is set.
    if (authConfigured() && user === "admin" && safeEqual(password, adminSecret())) return { user: "admin", name: "Admin", initials: "TM" };
    return null;
  }
  const a = accounts.find((x) => x.user === user);
  const salt = Buffer.from(a?.salt ?? "AAAAAAAAAAAAAAAAAAAAAA", "base64url");
  const got = await hashPassword(password, salt);
  if (!a) return null;
  const want = Buffer.from(a.hash, "base64url");
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  return { user: a.user, name: a.name, initials: a.initials };
}
