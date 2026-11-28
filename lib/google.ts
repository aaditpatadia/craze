/**
 * Google sign-in for the supplier portal (OpenID Connect, authorisation code flow with PKCE).
 * Server only. Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from a Google Cloud OAuth client
 * of type "Web application" with this redirect URI:  https://timule.com/api/auth/google/callback
 *
 * The ID token comes straight from Google's token endpoint over TLS, authenticated with our client
 * secret, so its signature need not be checked again (OpenID Connect Core 3.1.3.7). Its audience,
 * issuer, expiry, nonce and verified-email flag are all checked.
 */
import { createHash, randomBytes } from "node:crypto";
import { SITE } from "./config";

export const OAUTH_COOKIE = "__Host-timule_oauth";

export const googleConfigured = () => !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

/** Our own address in production, so a forged Host header cannot redirect the flow. */
export const redirectUri = (req: Request) => {
  const base = process.env.VERCEL_ENV === "production" ? SITE.url : new URL(req.url).origin;
  return `${base}/api/auth/google/callback`;
};

const b64url = (b: Buffer) => b.toString("base64url");

/** A plausible email address, for the optional login hint. */
export const isEmailHint = (s: unknown): s is string => typeof s === "string" && /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(s);

export function startFlow(req: Request, hint?: string) {
  const state = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(48));
  const nonce = b64url(randomBytes(24));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
    ...(hint ? { login_hint: hint } : {}),
  }).toString();
  return { url: url.toString(), cookie: `${state}.${verifier}.${nonce}` };
}

export type GoogleUser = { email: string; name?: string };

export async function finishFlow(req: Request, cookie: string | null): Promise<GoogleUser | { error: string }> {
  const params = new URL(req.url).searchParams;
  if (params.get("error")) return { error: "cancelled" };
  const code = params.get("code");
  const state = params.get("state");
  const [wantState, verifier, nonce] = (cookie ?? "").split(".");
  if (!code || !state || !wantState || !verifier || !nonce || state !== wantState) return { error: "expired" };

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri(req),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  if (!res.ok) return { error: "google" };
  const { id_token } = (await res.json()) as { id_token?: string };
  const part = id_token?.split(".")[1];
  if (!part) return { error: "google" };
  const claims = JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as {
    iss?: string;
    aud?: string;
    exp?: number;
    nonce?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };
  const okIssuer = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  if (!okIssuer || claims.aud !== process.env.GOOGLE_CLIENT_ID || !claims.exp || claims.exp * 1000 < Date.now() || claims.nonce !== nonce) return { error: "google" };
  if (!claims.email || claims.email_verified !== true) return { error: "unverified" };
  return { email: claims.email.toLowerCase(), ...(claims.name ? { name: claims.name.slice(0, 120) } : {}) };
}
