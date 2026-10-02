import { db } from "@/utils/db";

/**
 * Idempotent schema setup, run once per server process before the first query.
 * Kept in code (rather than a migration tool) because the project has no
 * migration runner yet; every statement is safe to re-run.
 */
const statements = [
  `CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL, email TEXT, name TEXT, image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_account_id)
  )`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'`,
  `CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL,
    content JSONB NOT NULL,
    theme TEXT,
    slug TEXT UNIQUE,
    published_content JSONB,
    published_theme TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (owner_id, template_id)
  )`,
  `CREATE INDEX IF NOT EXISTS portfolios_published_slug ON portfolios (slug) WHERE published_at IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS ai_usage (
    owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    requests INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (owner_id, day)
  )`,
];

let ready: Promise<void> | undefined;

export function ensureSchema(): Promise<void> {
  ready ??= (async () => {
    for (const statement of statements) await db.query(statement);
  })().catch((error) => {
    ready = undefined; // Retry on the next request instead of caching a failure.
    throw error;
  });
  return ready;
}

export const databaseConfigured = () => Boolean(process.env.DATABASE_URL);
