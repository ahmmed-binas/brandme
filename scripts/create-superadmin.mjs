// Creates the superadmin: the one account that runs the whole site. It signs in
// with an email and password at the console's secret address (SUPERADMIN_PATH,
// default /console), never at the normal /login.
//
//   npm run admin:create                      asks for email, name and password
//   npm run admin:create -- --email you@company.com --name "Your Name"
//   npm run admin:create -- --remove you@company.com
//
// Running it again for the same email changes the password. If the email
// already has a Google account, that account as it is (an ordinary customer account) and a separate superadmin login
// is created for the console. The password is typed hidden, or read from
// standard input when piped (for scripts), and is never stored, only its hash.
import pg from "pg";
import { randomBytes, randomUUID, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { createInterface } from "node:readline";
import { runMigrations } from "../db/migrations.mjs";

const MIN_PASSWORD = 12;
const scrypt = promisify(scryptCallback);
// Same format as lib/accounts/passwords.ts, so the normal sign-in form accepts it.
const PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, 64, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

const args = process.argv.slice(2);
const flag = (name) => { const index = args.indexOf(`--${name}`); return index >= 0 ? args[index + 1] : undefined; };
const fail = (message) => { console.error(`\n${message}`); process.exit(1); };

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
    if (hidden && process.stdin.isTTY) {
      // Print the question, then swallow the characters typed after it.
      rl._writeToOutput = (text) => { if (!rl.muted) rl.output.write(text); };
      rl.muted = false;
      rl.question(question, (answer) => { rl.output.write("\n"); rl.close(); resolve(answer); });
      rl.muted = true;
    } else {
      rl.question(question, (answer) => { rl.close(); resolve(answer); });
    }
  });
}

let stdinLines;
async function readPassword(question) {
  if (process.stdin.isTTY) return ask(question, { hidden: true });
  // Piped: first line is the password, second its confirmation (or the same again).
  stdinLines ??= (await new Promise((resolve) => { let data = ""; process.stdin.on("data", (chunk) => { data += chunk; }); process.stdin.on("end", () => resolve(data.split(/\r?\n/))); }));
  return stdinLines.shift() ?? "";
}

if (!process.env.DATABASE_URL) fail("DATABASE_URL is not set. Run this where the app's .env is (npm run admin:create reads .env.local).");
const ssl = process.env.DATABASE_SSL === "require" ? { rejectUnauthorized: false } : process.env.DATABASE_SSL === "verify" ? { rejectUnauthorized: true } : undefined;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl, max: 1 });

try {
  await runMigrations(pool);

  const removing = flag("remove");
  if (removing) {
    const result = await pool.query("UPDATE app_users SET is_superadmin = FALSE WHERE lower(email) = $1 AND is_superadmin RETURNING email", [removing.trim().toLowerCase()]);
    console.log(result.rowCount ? `${removing} is no longer a superadmin. The account itself is kept.` : `No superadmin with the email ${removing}.`);
    process.exit(0);
  }

  const email = (flag("email") ?? (await ask("Email you'll sign in with: "))).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fail("That isn't a valid email address.");

  const existing = (await pool.query("SELECT id, provider, name FROM app_users WHERE lower(email) = $1 AND provider = 'password' LIMIT 1", [email])).rows[0];

  const name = (flag("name") ?? (existing?.name || (await ask("Your name: ")))).trim().slice(0, 120) || email.split("@")[0];
  const password = await readPassword(existing ? "New password (hidden): " : "Password (hidden): ");
  if (password.length < MIN_PASSWORD) fail(`Use at least ${MIN_PASSWORD} characters. A short sentence works well.`);
  if (password.length > 200) fail("That password is too long.");
  if (password.toLowerCase().includes(email.split("@")[0])) fail("The password shouldn't contain your email.");
  if ((await readPassword("Type it again: ")) !== password) fail("The two passwords didn't match. Nothing was changed.");
  const hash = await hashPassword(password);

  if (existing) {
    // Changing the password signs out nothing by itself; it just stops the old one working.
    await pool.query("UPDATE app_users SET password_hash = $2, is_superadmin = TRUE, email_verified_at = COALESCE(email_verified_at, NOW()), name = $3 WHERE id = $1", [existing.id, hash, name]);
    console.log(`\nDone. ${email} is the superadmin with the new password.`);
  } else {
    // A free username based on the email, e.g. "imran" or "imran_2".
    const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "").slice(0, 20).padEnd(3, "0");
    let username = base;
    for (let n = 2; (await pool.query("SELECT 1 FROM app_users WHERE lower(username) = $1", [username])).rowCount || ["admin", "administrator", "root", "support"].includes(username); n++) username = `${base}_${n}`;
    await pool.query(
      `INSERT INTO app_users (provider, provider_account_id, email, name, username, password_hash, email_verified_at, is_superadmin, plan, plan_expires_at)
       VALUES ('password', $1, $2, $3, $4, $5, NOW(), TRUE, 'premium', NOW() + INTERVAL '100 years')`,
      [`pw_${randomUUID()}`, email, name, username, hash],
    );
    console.log(`\nDone. ${email} is the superadmin.`);
  }
  const path = (process.env.SUPERADMIN_PATH ?? "").trim().replace(/^\/+|\/+$/g, "");
  const consolePath = /^[A-Za-z0-9_-]{3,64}$/.test(path) ? `/${path}` : "/console";
  console.log(`Sign in at ${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}${consolePath} (the normal /login refuses this account).`);
  if (consolePath === "/console") console.log("Tip: set SUPERADMIN_PATH in .env to a secret address, e.g. SUPERADMIN_PATH=/hq-" + randomBytes(4).toString("hex"));
} catch (error) {
  fail(error.message);
} finally {
  await pool.end().catch(() => {});
}
