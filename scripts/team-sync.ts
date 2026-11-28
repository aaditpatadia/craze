/**
 * Rebuilds TIMULE_TEAM from .secrets/team-logins.txt after you edit passwords there.
 *   npm run team:sync
 *
 * Reads the last "username: x   password: y" line for each user, keeps each person's name and
 * initials from .secrets/timule-team-env.txt, hashes every password with a fresh salt and writes
 * the new value back to .secrets/timule-team-env.txt. Passwords are never printed.
 * Paste the new value into TIMULE_TEAM in Vercel and redeploy.
 */
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hashPassword } from "../lib/team-accounts";

const dir = join(process.cwd(), ".secrets");

async function main() {
  const people = new Map<string, { name: string; initials: string }>();
  for (const e of readFileSync(join(dir, "timule-team-env.txt"), "utf8").trim().split(";")) {
    const [user, name, initials] = e.split(":");
    if (user && name && initials) people.set(user, { name, initials });
  }
  const latest = new Map<string, string>();
  for (const line of readFileSync(join(dir, "team-logins.txt"), "utf8").split(/\r?\n/)) {
    const m = /username:\s*(\S+)\s+password:\s*(.+?)\s*$/.exec(line);
    if (m) latest.set(m[1]!.toLowerCase(), m[2]!);
  }
  const entries: string[] = [];
  for (const [user, password] of latest) {
    const who = people.get(user);
    if (!who) {
      console.error(`Skipped ${user}: not in timule-team-env.txt. Create it with npm run team:account first.`);
      continue;
    }
    if (password.length < 8) {
      console.error(`Skipped ${user}: the password is shorter than 8 characters.`);
      continue;
    }
    if (/[\s]/.test(password.trim()) || password !== password.trim()) console.warn(`Note for ${user}: the password contains spaces; type them exactly when signing in.`);
    const salt = randomBytes(16);
    const hash = await hashPassword(password, salt);
    entries.push(`${user}:${who.name}:${who.initials}:${salt.toString("base64url")}:${hash.toString("base64url")}`);
    console.log(`${user}: password hashed (${password.length} characters).`);
  }
  if (!entries.length) process.exit(1);
  writeFileSync(join(dir, "timule-team-env.txt"), `${entries.join(";")}\n`, "utf8");
  console.log("New TIMULE_TEAM value written to .secrets/timule-team-env.txt");
}

void main();
