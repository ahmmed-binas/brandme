import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { WELCOME_CREDITS } from "@/lib/plans";
import { sendMail } from "@/lib/email/mailer";
import { siteUrl } from "@/lib/site";
import { brand } from "@/lib/brand";

/**
 * Email and password accounts, alongside Google sign-in.
 *
 * - Passwords are hashed with scrypt and a per-user salt; the password itself is never stored.
 * - People must be at least MIN_AGE; the date of birth is used only for that check.
 * - Verification and reset links are random tokens; only their SHA-256 hash is stored,
 *   they expire, and each works once.
 */

const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, keylen: number, options: { N: number; r: number; p: number; maxmem: number }) => Promise<Buffer>;
const PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
export const MIN_AGE = 16;
export const MIN_PASSWORD = 10;
export const USERNAME = /^[a-z0-9_]{3,24}$/;
const RESERVED = new Set(["admin", "administrator", "root", "support", "help", "formora", "staff", "moderator", "system", "api", "gallery", "about", "pricing", "login", "signup", "account", "null", "undefined"]);

export class AccountError extends Error {
  constructor(message: string, readonly field?: string) { super(message); }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, 64, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  const parts = stored?.split("$");
  if (!parts || parts.length !== 6 || parts[0] !== "scrypt") {
    // Spend the same time as a real check so timing doesn't reveal which emails exist.
    await scrypt(password, randomBytes(16), 64, PARAMS);
    return false;
  }
  const [, n, r, p, salt, hash] = parts;
  const expected = Buffer.from(hash!, "base64");
  const key = await scrypt(password.normalize("NFKC"), Buffer.from(salt!, "base64"), expected.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: PARAMS.maxmem });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export function checkUsername(raw: string): string {
  const username = raw.trim().toLowerCase().replace(/^@/, "");
  if (!USERNAME.test(username)) throw new AccountError("Usernames are 3–24 characters: letters, numbers and underscores.", "username");
  if (RESERVED.has(username)) throw new AccountError("That username is reserved. Try another.", "username");
  return username;
}

export async function usernameTaken(username: string, exceptUserId?: string): Promise<boolean> {
  await ensureSchema();
  return Boolean((await db.query("SELECT 1 FROM app_users WHERE lower(username) = $1 AND id IS DISTINCT FROM $2", [username.toLowerCase(), exceptUserId ?? null])).rowCount);
}

function ageOn(birth: Date, today = new Date()): number {
  const age = today.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday = today.getUTCMonth() < birth.getUTCMonth() || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate());
  return beforeBirthday ? age - 1 : age;
}

export interface SignUpInput { username: string; email: string; password: string; birthDate: string; name?: string }

/** Creates a password account and emails a verification link. Returns the id used to sign in. */
export async function signUp(input: SignUpInput): Promise<{ userId: string }> {
  const username = checkUsername(input.username);
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) throw new AccountError("Enter a valid email address.", "email");
  if (input.password.length < MIN_PASSWORD) throw new AccountError(`Use at least ${MIN_PASSWORD} characters for your password.`, "password");
  if (input.password.length > 200) throw new AccountError("That password is too long.", "password");
  if (input.password.toLowerCase().includes(username) || input.password.toLowerCase() === email) throw new AccountError("Your password shouldn’t contain your username or email.", "password");
  const birth = /^\d{4}-\d{2}-\d{2}$/.test(input.birthDate) ? new Date(`${input.birthDate}T00:00:00Z`) : null;
  if (!birth || Number.isNaN(birth.getTime()) || birth.getUTCFullYear() < 1900 || birth > new Date()) throw new AccountError("Enter your date of birth.", "birthDate");
  if (ageOn(birth) < MIN_AGE) throw new AccountError(`You need to be at least ${MIN_AGE} to create an account.`, "birthDate");
  await ensureSchema();
  if ((await db.query("SELECT 1 FROM app_users WHERE lower(email) = $1", [email])).rowCount) throw new AccountError("There’s already an account with this email. Sign in instead, or reset your password.", "email");
  if (await usernameTaken(username)) throw new AccountError("That username is taken. Try another.", "username");
  const hash = await hashPassword(input.password);
  const name = (input.name ?? "").trim().slice(0, 120) || username;
  const inserted = await db.query<{ id: string }>(
    `INSERT INTO app_users (provider, provider_account_id, email, name, username, password_hash, birth_date, credits)
     VALUES ('password', $1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [`pw_${randomUUID()}`, email, name, username, hash, input.birthDate, WELCOME_CREDITS],
  ).catch((error: { code?: string }) => {
    if (error.code === "23505") throw new AccountError("That username or email was just taken. Try another.", "username");
    throw error;
  });
  const userId = inserted.rows[0]!.id;
  await db.query(`INSERT INTO credit_ledger (owner_id, delta, balance_after, reason, reference) VALUES ($1, $2, $2, 'Welcome credits', $3) ON CONFLICT (reference) DO NOTHING`, [userId, WELCOME_CREDITS, `welcome:${userId}`]);
  await sendVerification(userId).catch((error) => console.error("Verification email failed", error));
  return { userId };
}

/**
 * For the sign-in forms: the account's sign-in id when the password is right, else null.
 * The superadmin signs in only at the console's own address (`as: "console"`); the
 * normal form refuses that account with the same answer as a wrong password, and the
 * console refuses everyone else.
 */
export async function checkCredentials(emailOrUsername: string, password: string, as: "customer" | "console" = "customer"): Promise<{ providerAccountId: string; email: string; name: string } | null> {
  await ensureSchema();
  const login = emailOrUsername.trim().toLowerCase().replace(/^@/, "");
  const row = (await db.query<{ provider_account_id: string; email: string; name: string | null; password_hash: string | null; is_superadmin: boolean; verified: boolean }>(
    "SELECT provider_account_id, email, name, password_hash, is_superadmin, email_verified_at IS NOT NULL AS verified FROM app_users WHERE provider = 'password' AND (lower(email) = $1 OR lower(username) = $1) LIMIT 1",
    [login],
  )).rows[0];
  const ok = await verifyPassword(password, row?.password_hash ?? null);
  if (!ok || !row) return null;
  if (as === "console" ? !(row.is_superadmin && row.verified) : row.is_superadmin) return null;
  return { providerAccountId: row.provider_account_id, email: row.email, name: row.name ?? row.email };
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function issueToken(userId: string, purpose: "verify" | "reset", hours: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.query("INSERT INTO auth_tokens (token_hash, user_id, purpose, expires_at) VALUES ($1, $2, $3, NOW() + make_interval(hours => $4))", [hashToken(token), userId, purpose, hours]);
  return token;
}

/** Marks a token used and returns its user, if it is valid, unused and unexpired. */
async function consumeToken(token: string, purpose: "verify" | "reset"): Promise<string | null> {
  await ensureSchema();
  const row = (await db.query<{ user_id: string }>(
    "UPDATE auth_tokens SET used_at = NOW() WHERE token_hash = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > NOW() RETURNING user_id",
    [hashToken(token), purpose],
  )).rows[0];
  return row?.user_id ?? null;
}

export async function sendVerification(userId: string): Promise<void> {
  await ensureSchema();
  const user = (await db.query<{ email: string | null; name: string | null; email_verified_at: Date | null }>("SELECT email, name, email_verified_at FROM app_users WHERE id = $1", [userId])).rows[0];
  if (!user?.email || user.email_verified_at) return;
  const link = `${siteUrl}/api/account/verify?token=${await issueToken(userId, "verify", 48)}`;
  await sendMail({
    to: user.email,
    subject: `Confirm your email for ${brand.name}`,
    text: `Hi ${user.name ?? "there"},\n\nConfirm your email address by opening this link (it works for 48 hours):\n${link}\n\nIf you didn’t create a ${brand.name} account, ignore this email.`,
  });
}

export async function verifyEmail(token: string): Promise<boolean> {
  const userId = await consumeToken(token, "verify");
  if (!userId) return false;
  await db.query("UPDATE app_users SET email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = $1", [userId]);
  return true;
}

/** Always looks the same to the caller, so it can't be used to find out which emails have accounts. */
export async function requestReset(email: string): Promise<void> {
  await ensureSchema();
  const user = (await db.query<{ id: string; name: string | null; email: string }>("SELECT id, name, email FROM app_users WHERE provider = 'password' AND lower(email) = $1", [email.trim().toLowerCase()])).rows[0];
  if (!user) return;
  const recent = await db.query("SELECT 1 FROM auth_tokens WHERE user_id = $1 AND purpose = 'reset' AND created_at > NOW() - INTERVAL '2 minutes'", [user.id]);
  if (recent.rowCount) return;
  const link = `${siteUrl}/reset-password?token=${await issueToken(user.id, "reset", 1)}`;
  await sendMail({
    to: user.email,
    subject: `Reset your ${brand.name} password`,
    text: `Hi ${user.name ?? "there"},\n\nSomeone (hopefully you) asked to reset your password. Choose a new one here; the link works for one hour:\n${link}\n\nIf it wasn’t you, ignore this email and your password stays the same.`,
  });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  if (password.length < MIN_PASSWORD) throw new AccountError(`Use at least ${MIN_PASSWORD} characters for your password.`, "password");
  if (password.length > 200) throw new AccountError("That password is too long.", "password");
  const userId = await consumeToken(token, "reset");
  if (!userId) throw new AccountError("This reset link has expired or was already used. Ask for a new one.");
  // Resetting by email proves the address too.
  await db.query("UPDATE app_users SET password_hash = $2, email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW() WHERE id = $1", [userId, await hashPassword(password)]);
}

export async function setUsername(userId: string, raw: string): Promise<string> {
  const username = checkUsername(raw);
  if (await usernameTaken(username, userId)) throw new AccountError("That username is taken. Try another.", "username");
  await db.query("UPDATE app_users SET username = $2, updated_at = NOW() WHERE id = $1", [userId, username]);
  return username;
}

/** A simple in-memory limit on sign-in and sign-up attempts per key (one server). */
const attempts = new Map<string, number[]>();
export function tooManyAttempts(key: string, limit = 10, windowMs = 15 * 60_000): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < windowMs);
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 10_000) for (const [entry, times] of attempts) if (!times.some((time) => now - time < windowMs)) attempts.delete(entry);
  return recent.length > limit;
}

/** Like tooManyAttempts, but only failures count: check with `blockedAfterFailures`, record with `noteFailure`. */
const failures = new Map<string, number[]>();
export function blockedAfterFailures(key: string, limit: number, windowMs = 15 * 60_000): boolean {
  const now = Date.now();
  const recent = (failures.get(key) ?? []).filter((time) => now - time < windowMs);
  failures.set(key, recent);
  return recent.length >= limit;
}
export function noteFailure(key: string): void {
  failures.set(key, [...(failures.get(key) ?? []), Date.now()]);
  if (failures.size > 10_000) failures.clear();
}
