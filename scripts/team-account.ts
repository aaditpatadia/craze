/**
 * Creates (or rotates) a team account.
 *   npm run team:account -- aadit "Aadit Patadia" AP
 *
 * Generates a strong password, appends "username / password" to .secrets/team-logins.txt
 * (gitignored, never committed) and prints only the TIMULE_TEAM entry, which holds a salted
 * scrypt hash, not the password. Join several entries with ";" and paste the whole value into
 * TIMULE_TEAM in Vercel's environment variables, then redeploy.
 */
import { randomBytes } from "node:crypto";
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { hashPassword } from "../lib/team-accounts";

const [user, name, initials] = process.argv.slice(2);
if (!user || !name || !initials || !/^[a-z][a-z0-9._-]{1,31}$/.test(user) || /[:;]/.test(name)) {
  console.error('Usage: npm run team:account -- <username> "<Full Name>" <INITIALS>');
  process.exit(1);
}

// 4 groups of 5 from an alphabet with no look-alike characters: about 115 bits.
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
const raw = randomBytes(40);
const chars = Array.from(raw.subarray(0, 20), (b) => ALPHABET[b % ALPHABET.length]).join("");
const password = chars.match(/.{5}/g)!.join("-");

async function main() {
  const salt = randomBytes(16);
  const hash = await hashPassword(password, salt);
  const entry = `${user}:${name}:${initials!.toUpperCase()}:${salt.toString("base64url")}:${hash.toString("base64url")}`;

  const dir = join(process.cwd(), ".secrets");
  mkdirSync(dir, { recursive: true });
  appendFileSync(join(dir, "team-logins.txt"), `${new Date().toISOString().slice(0, 10)}  username: ${user}   password: ${password}\n`, "utf8");

  console.log(`Password saved to .secrets/team-logins.txt for ${user}.`);
  console.log("TIMULE_TEAM entry:");
  console.log(entry);
}

void main();
