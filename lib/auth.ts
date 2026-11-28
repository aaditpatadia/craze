/**
 * Sign-in for the two private areas of timule.com:
 *  - the team area (/team, /desk, /admin): username and password, one account per team member;
 *  - the supplier portal (/supplier): Google sign-in, for makers the team has invited.
 *
 * Each area has its own cookie. A cookie holds a small JSON payload (who, which role, expiry)
 * signed with HMAC-SHA256 under a key derived from TIMULE_ADMIN_KEY, so it cannot be forged or
 * moved from one role to the other. Cookies are HttpOnly (scripts cannot read them) and Secure.
 * The team cookie is SameSite=Strict. The supplier cookie is SameSite=Lax, because it is set at
 * the end of the redirect back from Google; every write is also checked for same-origin.
 * Uses Web Crypto so it runs in the proxy and in API routes alike.
 */

export const SESSION_COOKIE = "__Host-timule_session";
export const SUPPLIER_COOKIE = "__Host-timule_supplier";
export const SESSION_DAYS = 7;
export const SUPPLIER_DAYS = 14;

export type TeamSession = { role: "team"; user: string; name: string; initials: string; exp: number };
export type SupplierSession = { role: "supplier"; sid: string; email: string; name?: string; /** Team username when a team member opened the portal for the supplier. */ via?: string; exp: number };
export type Session = TeamSession | SupplierSession;

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf instanceof Uint8Array ? buf : new Uint8Array(buf))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const fromB64url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export const adminSecret = () => process.env.TIMULE_ADMIN_KEY ?? "";
export const authConfigured = () => adminSecret().length >= 16;

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(`timule-session-v2:${adminSecret()}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
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

type NewSession = Omit<TeamSession, "exp"> | Omit<SupplierSession, "exp">;

export async function makeSession(s: NewSession): Promise<string> {
  const days = s.role === "team" ? SESSION_DAYS : SUPPLIER_DAYS;
  const payload = b64url(enc.encode(JSON.stringify({ ...s, exp: Date.now() + days * 86_400_000 })));
  return `${payload}.${await hmac(`${s.role}.${payload}`)}`;
}

async function readSession<R extends Session["role"]>(token: string | undefined | null, role: R): Promise<Extract<Session, { role: R }> | null> {
  if (!token || !authConfigured()) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || payload.length > 2000) return null;
  if (!safeEqual(sig, await hmac(`${role}.${payload}`))) return null;
  try {
    const s = JSON.parse(fromB64url(payload)) as Session;
    if (s.role !== role || typeof s.exp !== "number" || s.exp < Date.now()) return null;
    return s as Extract<Session, { role: R }>;
  } catch {
    return null;
  }
}

export const teamSession = (token: string | undefined | null) => readSession(token, "team");
export const supplierSession = (token: string | undefined | null) => readSession(token, "supplier");
/** True for a valid team session. */
export const validSession = async (token: string | undefined | null) => !!(await teamSession(token));

export function readCookie(req: Request, name = SESSION_COOKIE): string | null {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return null;
}

export const teamFrom = (req: Request) => teamSession(readCookie(req, SESSION_COOKIE));
export const supplierFrom = (req: Request) => supplierSession(readCookie(req, SUPPLIER_COOKIE));
export const isSignedIn = async (req: Request) => !!(await teamFrom(req));

export const sessionCookie = (value: string, maxAge = SESSION_DAYS * 86_400) =>
  `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
export const supplierCookie = (value: string, maxAge = SUPPLIER_DAYS * 86_400) =>
  `${SUPPLIER_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

/** Only same-site paths, so a sign-in page cannot be used to send people to another site. */
export const safeNext = (next: string | null | undefined, fallback = "/team") => (next && /^\/(?![/\\])/.test(next) ? next : fallback);
