import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { auth } from "@/auth";
import { planFor, type PlanLimits } from "@/lib/plans";

export async function saveGoogleUser(input: { providerAccountId: string; email?: string | null; name?: string | null; image?: string | null }) {
  await ensureSchema();
  await db.query(`INSERT INTO app_users (provider, provider_account_id, email, name, image)
    VALUES ('google', $1, $2, $3, $4)
    ON CONFLICT (provider, provider_account_id) DO UPDATE SET
      email = EXCLUDED.email, name = EXCLUDED.name, image = EXCLUDED.image, updated_at = NOW()`,
    [input.providerAccountId, input.email ?? null, input.name ?? null, input.image ?? null]);
}

export interface CurrentUser {
  id: string;
  email: string | null;
  plan: PlanLimits;
  planId: string;
}

/** Resolves the signed-in visitor to their database row, or null when signed out. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const providerAccountId = session?.user?.providerAccountId;
  if (!providerAccountId) return null;
  await ensureSchema();
  const result = await db.query<{ id: string; email: string | null; plan: string }>(
    "SELECT id, email, plan FROM app_users WHERE provider = 'google' AND provider_account_id = $1",
    [providerAccountId],
  );
  const row = result.rows[0];
  if (row) return { id: row.id, email: row.email, plan: planFor(row.plan), planId: row.plan };
  // The sign-in event may have failed to write (e.g. the database was briefly down); repair it now.
  await saveGoogleUser({ providerAccountId, email: session.user?.email, name: session.user?.name, image: session.user?.image });
  return getCurrentUser();
}
