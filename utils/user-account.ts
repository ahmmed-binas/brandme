import { db } from "@/utils/db";

export async function saveGoogleUser(input: { providerAccountId: string; email?: string | null; name?: string | null; image?: string | null }) {
  await db.query(`CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL, email TEXT, name TEXT, image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_account_id)
  )`);
  await db.query(`INSERT INTO app_users (provider, provider_account_id, email, name, image)
    VALUES ('google', $1, $2, $3, $4)
    ON CONFLICT (provider, provider_account_id) DO UPDATE SET
      email = EXCLUDED.email, name = EXCLUDED.name, image = EXCLUDED.image, updated_at = NOW()`,
    [input.providerAccountId, input.email ?? null, input.name ?? null, input.image ?? null]);
}
