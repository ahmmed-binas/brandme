import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { auth } from "@/auth";
import { WELCOME_CREDITS, standingOf, type AccountStanding, type PlanLimits } from "@/lib/plans";

/** Creates or refreshes the account row on sign-in. New accounts get welcome credits, once. */
export async function saveGoogleUser(input: { providerAccountId: string; email?: string | null; name?: string | null; image?: string | null }) {
  await ensureSchema();
  const result = await db.query<{ id: string; inserted: boolean }>(`INSERT INTO app_users (provider, provider_account_id, email, name, image, credits)
    VALUES ('google', $1, $2, $3, $4, $5)
    ON CONFLICT (provider, provider_account_id) DO UPDATE SET
      email = EXCLUDED.email, name = EXCLUDED.name, image = EXCLUDED.image, updated_at = NOW()
    RETURNING id, (xmax = 0) AS inserted`,
    [input.providerAccountId, input.email ?? null, input.name ?? null, input.image ?? null, WELCOME_CREDITS]);
  const row = result.rows[0];
  if (row?.inserted) {
    await db.query(`INSERT INTO credit_ledger (owner_id, delta, balance_after, reason, reference) VALUES ($1, $2, $2, 'Welcome credits', $3) ON CONFLICT (reference) DO NOTHING`, [row.id, WELCOME_CREDITS, `welcome:${row.id}`]);
  }
  return row;
}

export interface CurrentUser {
  id: string;
  email: string | null;
  name: string | null;
  plan: PlanLimits;
  planId: string;
  standing: AccountStanding;
  credits: number;
  /** The user saved their own Anthropic API key; AI then runs on their account, not ours. */
  hasOwnKey: boolean;
  /** Public handle shown on gallery submissions, e.g. "ada_l". Null until chosen. */
  username: string | null;
  /** Google accounts are verified by Google; password accounts once they click the link we email. */
  emailVerified: boolean;
}

interface UserRow { id: string; email: string | null; name: string | null; plan: string; trial_ends_at: Date; plan_expires_at: Date | null; credits: number; has_key: boolean; username: string | null; verified: boolean }

export const USER_COLUMNS = "id, email, name, plan, trial_ends_at, plan_expires_at, credits, anthropic_key_enc IS NOT NULL AS has_key, username, (provider <> 'password' OR email_verified_at IS NOT NULL) AS verified";

export function toCurrentUser(row: UserRow): CurrentUser {
  const standing = standingOf(row);
  return { id: row.id, email: row.email, name: row.name, plan: standing.plan, planId: row.plan, standing, credits: row.credits, hasOwnKey: row.has_key, username: row.username, emailVerified: row.verified };
}

export async function getUserById(id: string): Promise<CurrentUser | null> {
  await ensureSchema();
  const result = await db.query<UserRow>(`SELECT ${USER_COLUMNS} FROM app_users WHERE id = $1`, [id]);
  return result.rows[0] ? toCurrentUser(result.rows[0]) : null;
}

/** Resolves the signed-in visitor to their database row, or null when signed out. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const providerAccountId = session?.user?.providerAccountId;
  if (!providerAccountId) return null;
  await ensureSchema();
  const provider = session.user?.provider === "password" ? "password" : "google";
  const result = await db.query<UserRow>(`SELECT ${USER_COLUMNS} FROM app_users WHERE provider = $1 AND provider_account_id = $2`, [provider, providerAccountId]);
  const row = result.rows[0];
  if (row) return toCurrentUser(row);
  if (provider === "password") return null; // Deleted account: the session no longer maps to anyone.
  // The sign-in event may have failed to write (e.g. the database was briefly down); repair it now.
  await saveGoogleUser({ providerAccountId, email: session.user?.email, name: session.user?.name, image: session.user?.image });
  return getCurrentUser();
}
