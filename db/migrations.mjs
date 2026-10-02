// @ts-check
/**
 * Versioned database migrations, shared by the app (run lazily on first query)
 * and `npm run db:migrate` (run on deploy). Plain JavaScript so the deploy
 * script needs no build step.
 *
 * Rules: never edit a migration that has shipped; add a new one. Each
 * migration runs in its own transaction, and an advisory lock stops two
 * server processes from migrating at the same time.
 */

/** @type {Array<{ id: string; statements: string[] }>} */
export const migrations = [
  {
    // The schema as first shipped. Written with IF NOT EXISTS so databases
    // created before migrations existed are adopted without changes.
    id: "001_initial",
    statements: [
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
  `CREATE TABLE IF NOT EXISTS custom_domains (
    domain TEXT PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('connected', 'purchased')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (owner_id, template_id)
  )`,
  `CREATE TABLE IF NOT EXISTS domain_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    registrar_price NUMERIC(10, 2) NOT NULL,
    charged_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'awaiting_payment',
    contact JSONB,
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent TEXT,
    registrar_order_id TEXT,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS domain_orders_owner ON domain_orders (owner_id, created_at DESC)`,
],
  },
  {
    id: "002_portfolio_versions",
    statements: [
      // Optimistic locking: each save must name the version it was based on, so
      // two tabs editing the same portfolio can't silently overwrite each other.
      `ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1`,
    ],
  },
];

const LOCK_KEY = 72_901_337; // Arbitrary constant identifying this app's migration lock.

/**
 * Applies pending migrations using one pooled client.
 * @param {import("pg").Pool} pool
 * @param {(message: string) => void} [log]
 * @returns {Promise<string[]>} ids applied in this run
 */
export async function runMigrations(pool, log = () => {}) {
  const client = await pool.connect();
  const applied = [];
  try {
    await client.query("SELECT pg_advisory_lock($1)", [LOCK_KEY]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    const done = new Set((await client.query("SELECT id FROM schema_migrations")).rows.map((row) => row.id));
    for (const migration of migrations) {
      if (done.has(migration.id)) continue;
      await client.query("BEGIN");
      try {
        for (const statement of migration.statements) await client.query(statement);
        await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [migration.id]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${migration.id} failed: ${/** @type {Error} */ (error).message}`, { cause: error });
      }
      applied.push(migration.id);
      log(`applied ${migration.id}`);
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK_KEY]).catch(() => {});
    client.release();
  }
  return applied;
}
