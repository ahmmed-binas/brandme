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
  {
    id: "003_self_hosted_domains",
    statements: [
      // Domains now point at our own server. Connected domains prove ownership
      // with a TXT record containing this token before they are served.
      `ALTER TABLE custom_domains ADD COLUMN IF NOT EXISTS verification_token TEXT`,
      `UPDATE custom_domains SET verification_token = md5(random()::text || domain) WHERE verification_token IS NULL`,
      `ALTER TABLE custom_domains ALTER COLUMN verification_token SET NOT NULL`,
      `ALTER TABLE custom_domains ADD COLUMN IF NOT EXISTS checked_at TIMESTAMPTZ`,
      // Domains set up under the old Vercel-hosted flow must re-verify against this server.
      `UPDATE custom_domains SET verified_at = NULL`,
    ],
  },
  {
    id: "004_community",
    statements: [
      `CREATE TABLE IF NOT EXISTS community_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        author_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        kind TEXT NOT NULL CHECK (kind IN ('suggestion', 'review', 'design')),
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
        link TEXT,
        -- published: visible to everyone; pending: awaiting a moderator;
        -- refused: rejected before publishing; removed: taken down after publishing.
        status TEXT NOT NULL CHECK (status IN ('published', 'pending', 'refused', 'removed')),
        moderation_note TEXT,
        moderated_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
        moderated_at TIMESTAMPTZ,
        votes INTEGER NOT NULL DEFAULT 0,
        comment_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS community_posts_feed ON community_posts (status, kind, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS community_posts_author ON community_posts (author_id, created_at DESC)`,
      // One live review per person.
      `CREATE UNIQUE INDEX IF NOT EXISTS community_one_review ON community_posts (author_id) WHERE kind = 'review' AND status IN ('published', 'pending')`,
      `CREATE TABLE IF NOT EXISTS community_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        position SMALLINT NOT NULL,
        mime TEXT NOT NULL,
        data BYTEA NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS community_images_post ON community_images (post_id, position)`,
      `CREATE TABLE IF NOT EXISTS community_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('published', 'pending', 'refused', 'removed')),
        moderation_note TEXT,
        moderated_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS community_comments_post ON community_comments (post_id, created_at)`,
      `CREATE TABLE IF NOT EXISTS community_votes (
        post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (post_id, user_id)
      )`,
    ],
  },
];

migrations.push({
  id: "005_studio_billing",
  statements: [
    // Images uploaded in the editor. Stored once and referenced by URL, so autosaves stay small.
    `CREATE TABLE IF NOT EXISTS portfolio_assets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      mime TEXT NOT NULL,
      size INTEGER NOT NULL,
      data BYTEA NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS portfolio_assets_owner ON portfolio_assets (owner_id)`,
    // The owner approves each template before customers can choose it.
    `CREATE TABLE IF NOT EXISTS template_reviews (
      template_id TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('approved', 'changes', 'rejected')),
      note TEXT,
      reviewed_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    // Plans: trial (14 days), then a 14-day grace period, then paused until paid.
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ`,
    `UPDATE app_users SET trial_ends_at = GREATEST(created_at, NOW()) + INTERVAL '14 days' WHERE trial_ends_at IS NULL`,
    `ALTER TABLE app_users ALTER COLUMN trial_ends_at SET DEFAULT NOW() + INTERVAL '14 days'`,
    `ALTER TABLE app_users ALTER COLUMN trial_ends_at SET NOT NULL`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT TRUE`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS stripe_payment_method TEXT`,
    // Old 'free' and 'pro' values map onto the new plans.
    `UPDATE app_users SET plan = 'trial' WHERE plan = 'free'`,
    `UPDATE app_users SET plan_expires_at = NOW() + INTERVAL '1 year' WHERE plan = 'pro' AND plan_expires_at IS NULL`,
    `ALTER TABLE app_users ALTER COLUMN plan SET DEFAULT 'trial'`,
    // AI: prepaid credits, or the user's own Anthropic key (encrypted at rest).
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0)`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS anthropic_key_enc TEXT`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS anthropic_key_hint TEXT`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS emails_opt_out BOOLEAN NOT NULL DEFAULT FALSE`,
    // Auto-update settings.
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS github_username TEXT`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS auto_update BOOLEAN NOT NULL DEFAULT TRUE`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS last_research_at TIMESTAMPTZ`,
    `CREATE TABLE IF NOT EXISTS credit_ledger (
      id BIGSERIAL PRIMARY KEY,
      owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      delta INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reference TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS credit_ledger_owner ON credit_ledger (owner_id, created_at DESC)`,
    // What the platform key spent per day, so a hard budget can stop AI before it costs too much.
    `CREATE TABLE IF NOT EXISTS ai_spend (day DATE PRIMARY KEY, micro_usd BIGINT NOT NULL DEFAULT 0, requests INTEGER NOT NULL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS billing_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('plan', 'credits', 'renewal')),
      plan TEXT,
      term_years SMALLINT,
      credits INTEGER,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'usd',
      status TEXT NOT NULL DEFAULT 'awaiting_payment' CHECK (status IN ('awaiting_payment', 'paid', 'failed', 'refunded')),
      stripe_session_id TEXT UNIQUE,
      stripe_payment_intent TEXT,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      paid_at TIMESTAMPTZ
    )`,
    `CREATE INDEX IF NOT EXISTS billing_orders_owner ON billing_orders (owner_id, created_at DESC)`,
    // Every lifecycle email is sent at most once per key (e.g. trial-ending:<user>).
    `CREATE TABLE IF NOT EXISTS email_log (
      id BIGSERIAL PRIMARY KEY,
      owner_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      dedupe_key TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS support_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS support_tickets_owner ON support_tickets (owner_id, updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS support_tickets_open ON support_tickets (status, updated_at)`,
    `CREATE TABLE IF NOT EXISTS support_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
      author_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
      from_staff BOOLEAN NOT NULL DEFAULT FALSE,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS support_messages_ticket ON support_messages (ticket_id, created_at)`,
    // Proposed updates from GitHub sync or the research agent. Nothing changes until the owner applies them.
    `CREATE TABLE IF NOT EXISTS profile_suggestions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      source TEXT NOT NULL CHECK (source IN ('github', 'research')),
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      detail TEXT,
      payload JSONB NOT NULL,
      source_url TEXT,
      fingerprint TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      decided_at TIMESTAMPTZ,
      UNIQUE (owner_id, fingerprint)
    )`,
    `CREATE INDEX IF NOT EXISTS profile_suggestions_owner ON profile_suggestions (owner_id, status, created_at DESC)`,
  ],
});

migrations.push({
  id: "006_ratings_blogs_renewals",
  statements: [
    // One star rating (1–5) per person per template. A person can change theirs.
    `CREATE TABLE IF NOT EXISTS template_ratings (
      user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      template_id TEXT NOT NULL,
      stars SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, template_id)
    )`,
    `CREATE INDEX IF NOT EXISTS template_ratings_template ON template_ratings (template_id)`,
    // The site's own Journal, written by admins at /admin/journal.
    `CREATE TABLE IF NOT EXISTS journal_posts (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'Guides',
      body TEXT NOT NULL DEFAULT '',
      author_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    // Customers' own blog posts, shown on their portfolio at /blog.
    `CREATE TABLE IF NOT EXISTS portfolio_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      template_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      cover TEXT,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (owner_id, template_id, slug)
    )`,
    `CREATE INDEX IF NOT EXISTS portfolio_posts_site ON portfolio_posts (owner_id, template_id, published_at DESC)`,
    // Bought domains last a year; renewals are paid by the customer before this date.
    `ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`,
    `ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS renewal_of UUID REFERENCES domain_orders(id) ON DELETE SET NULL`,
    `ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMPTZ`,
    `UPDATE domain_orders SET expires_at = created_at + INTERVAL '1 year' WHERE status = 'completed' AND expires_at IS NULL`,
  ],
});

migrations.push({
  id: "007_template_downloads",
  statements: [
    // How often each free template has been downloaded, shown in the gallery.
    `CREATE TABLE IF NOT EXISTS template_downloads (
      template_id TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  ],
});

migrations.push({
  id: "008_accounts_and_gallery",
  statements: [
    // Email + password accounts, and a public @username for everyone.
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS username TEXT`,
    `CREATE UNIQUE INDEX IF NOT EXISTS app_users_username ON app_users (lower(username)) WHERE username IS NOT NULL`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_hash TEXT`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS birth_date DATE`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ`,
    `CREATE INDEX IF NOT EXISTS app_users_email ON app_users (lower(email))`,
    // One-time links for verifying an email address or resetting a password. Only a hash is stored.
    `CREATE TABLE IF NOT EXISTS auth_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      purpose TEXT NOT NULL CHECK (purpose IN ('verify', 'reset')),
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    // Templates people submit to the gallery. Nothing is public until an admin approves it.
    `CREATE TABLE IF NOT EXISTS gallery_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      idea TEXT NOT NULL,
      process TEXT NOT NULL,
      inspiration TEXT NOT NULL,
      audience TEXT NOT NULL,
      tags TEXT[] NOT NULL DEFAULT '{}',
      license TEXT NOT NULL DEFAULT 'MIT',
      live_url TEXT,
      cover BYTEA NOT NULL,
      cover_mime TEXT NOT NULL,
      clip BYTEA,
      clip_mime TEXT,
      zip BYTEA NOT NULL,
      zip_files JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'changes', 'rejected')),
      review_note TEXT,
      reviewed_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS gallery_submissions_status ON gallery_submissions (status, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS gallery_submissions_owner ON gallery_submissions (owner_id, created_at DESC)`,
  ],
});

migrations.push({
  id: "009_investigator",
  statements: [
    // The Investigator: which of their own profiles a customer asks us to watch, and how often.
    `CREATE TABLE IF NOT EXISTS investigator_settings (
      owner_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
      enabled BOOLEAN NOT NULL DEFAULT FALSE,
      frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'six_months', 'yearly')),
      mode TEXT NOT NULL DEFAULT 'ask' CHECK (mode IN ('ask', 'auto')),
      links JSONB NOT NULL DEFAULT '[]',
      template_id TEXT,
      next_run_at TIMESTAMPTZ,
      last_run_at TIMESTAMPTZ,
      failures INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS investigator_due ON investigator_settings (next_run_at) WHERE enabled`,
    // Every check, what it read, what it found and changed, so it can be explained and undone.
    `CREATE TABLE IF NOT EXISTS investigator_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      trigger TEXT NOT NULL CHECK (trigger IN ('schedule', 'manual')),
      status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'done', 'failed')),
      sources JSONB NOT NULL DEFAULT '[]',
      found INTEGER NOT NULL DEFAULT 0,
      applied INTEGER NOT NULL DEFAULT 0,
      template_id TEXT,
      content_before JSONB,
      published_before JSONB,
      error TEXT,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      finished_at TIMESTAMPTZ,
      undone_at TIMESTAMPTZ
    )`,
    `CREATE INDEX IF NOT EXISTS investigator_runs_owner ON investigator_runs (owner_id, started_at DESC)`,
    `ALTER TABLE profile_suggestions DROP CONSTRAINT IF EXISTS profile_suggestions_source_check`,
    `ALTER TABLE profile_suggestions ADD CONSTRAINT profile_suggestions_source_check CHECK (source IN ('github', 'research', 'investigator'))`,
    `ALTER TABLE profile_suggestions ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES investigator_runs(id) ON DELETE SET NULL`,
  ],
});

migrations.push({
  id: "010_superadmin",
  statements: [
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN NOT NULL DEFAULT FALSE`,
  ],
});

migrations.push({
  id: "011_page_views",
  statements: [
    // Cookie-less visitor counts: no IP addresses or cookies, only a daily-rotating hash.
    `CREATE TABLE IF NOT EXISTS page_views (
      id BIGSERIAL PRIMARY KEY,
      at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      host TEXT NOT NULL,
      path TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('site', 'portfolio')),
      portfolio_slug TEXT,
      referrer TEXT,
      visitor TEXT NOT NULL,
      device TEXT NOT NULL CHECK (device IN ('mobile', 'tablet', 'desktop'))
    )`,
    `CREATE INDEX IF NOT EXISTS page_views_at ON page_views (at)`,
    `CREATE INDEX IF NOT EXISTS page_views_kind_at ON page_views (kind, at)`,
  ],
});

migrations.push({
  id: "012_free_first",
  statements: [
    // Free-first launch: Basic is free, Pro is paid yearly or monthly, no trial and no Premium.
    `UPDATE app_users SET plan = 'basic', plan_expires_at = NULL WHERE plan IN ('trial', 'free', 'basic')`,
    `UPDATE app_users SET plan = 'pro' WHERE plan = 'premium'`,
    `ALTER TABLE app_users ALTER COLUMN plan SET DEFAULT 'basic'`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS plan_interval TEXT NOT NULL DEFAULT 'year' CHECK (plan_interval IN ('year', 'month'))`,
    `ALTER TABLE billing_orders ADD COLUMN IF NOT EXISTS term_months SMALLINT`,
    // The Investigator runs on any schedule the customer picks, including every N days.
    `ALTER TABLE investigator_settings DROP CONSTRAINT IF EXISTS investigator_settings_frequency_check`,
    `ALTER TABLE investigator_settings ADD CONSTRAINT investigator_settings_frequency_check CHECK (frequency IN ('daily', 'weekly', 'monthly', 'six_months', 'yearly', 'custom'))`,
    `ALTER TABLE investigator_settings ADD COLUMN IF NOT EXISTS custom_days SMALLINT CHECK (custom_days BETWEEN 1 AND 365)`,
  ],
});

migrations.push({
  id: "013_call_bookings",
  statements: [
    // Free calls booked with the owner through Cal.com, reported by its webhook.
    `CREATE TABLE IF NOT EXISTS call_bookings (
      uid TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('booked', 'rescheduled', 'cancelled')),
      title TEXT NOT NULL,
      starts_at TIMESTAMPTZ NOT NULL,
      ends_at TIMESTAMPTZ,
      name TEXT,
      email TEXT,
      time_zone TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS call_bookings_starts ON call_bookings (starts_at)`,
  ],
});

migrations.push({
  id: "014_investigator_sources",
  statements: [
    // Instagram, TikTok and X show nothing without a login, so the Investigator no longer offers them.
    `UPDATE investigator_settings SET links = COALESCE((SELECT jsonb_agg(link) FROM jsonb_array_elements(links) link WHERE link->>'kind' NOT IN ('instagram', 'x', 'tiktok')), '[]'::jsonb)
     WHERE links @> '[{"kind": "instagram"}]' OR links @> '[{"kind": "x"}]' OR links @> '[{"kind": "tiktok"}]'`,
  ],
});

migrations.push({
  id: "015_agent_comments",
  statements: [
    // Comments on an agent's page, such as Inspector Iqbal's.
    `CREATE TABLE IF NOT EXISTS agent_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent TEXT NOT NULL,
      author_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS agent_comments_agent ON agent_comments (agent, created_at DESC)`,
  ],
});

migrations.push({
  id: "016_blog_media",
  statements: [
    // A media block at the top of a post (image, YouTube/Vimeo video or sandboxed custom HTML), and Journal covers.
    `ALTER TABLE portfolio_posts ADD COLUMN IF NOT EXISTS media JSONB`,
    `ALTER TABLE journal_posts ADD COLUMN IF NOT EXISTS media JSONB`,
    `ALTER TABLE journal_posts ADD COLUMN IF NOT EXISTS cover TEXT`,
  ],
});

migrations.push({
  id: "017_own_ai_key_provider",
  statements: [
    // A customer's own AI key can now be Claude (Anthropic) or OpenAI. Existing keys are Claude keys.
    `ALTER TABLE app_users RENAME COLUMN anthropic_key_enc TO ai_key_enc`,
    `ALTER TABLE app_users RENAME COLUMN anthropic_key_hint TO ai_key_hint`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS ai_key_provider TEXT NOT NULL DEFAULT 'anthropic' CHECK (ai_key_provider IN ('anthropic', 'openai'))`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS ai_key_model TEXT`,
    `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS ai_key_saved_at TIMESTAMPTZ`,
  ],
});

migrations.push({
  id: "018_rate_limits",
  statements: [
    // Rate limits that survive restarts (lib/security/rate-limit.ts).
    `CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT NOT NULL,
      window_start TIMESTAMPTZ NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (key, window_start)
    )`,
  ],
});

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
