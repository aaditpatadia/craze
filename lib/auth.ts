/**
 * Founder sign-in. One secret, TIMULE_ADMIN_KEY, set only in Vercel's environment variables.
 * Signing in with it gives a session cookie: an expiry time signed with HMAC-SHA256 under a key
 * derived from the secret. The cookie is HttpOnly (scripts cannot read it), Secure (HTTPS only)
 * and SameSite=Strict (never sent from another site), and lasts 7 days.
 * Uses Web Crypto so it runs in the proxy and in API routes alike.
 */

export const SESSION_COOKIE = "__Host-timule_session";
export const SESSION_DAYS = 7;

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf instanceof Uint8Array ? buf : new Uint8Array(buf))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export const adminSecret = () => process.env.TIMULE_ADMIN_KEY ?? "";
export const authConfigured = () => adminSecret().length >= 16;

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(`timule-session:${adminSecret()}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

/** Constant-time comparison of two strings. */
export function safeEqual(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export async function makeSession(): Promise<string> {
  const exp = String(Date.now() + SESSION_DAYS * 86_400_000);
  return `${exp}.${await hmac(exp)}`;
}

export async function validSession(token: string | undefined | null): Promise<boolean> {
  if (!token || !authConfigured()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d{13}$/.test(exp) || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmac(exp));
}

export function readCookie(req: Request, name = SESSION_COOKIE): string | null {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return null;
}

export const isSignedIn = (req: Request) => validSession(readCookie(req));

export const sessionCookie = (value: string, maxAge = SESSION_DAYS * 86_400) =>
  `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

/** Only same-site paths, so the sign-in page cannot be used to send people to another site. */
export const safeNext = (next: string | null | undefined) => (next && /^\/(?![/\\])/.test(next) ? next : "/admin");
