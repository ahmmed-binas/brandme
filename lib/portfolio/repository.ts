import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import type { CurrentUser } from "@/utils/user-account";
import type { TemplateId } from "@/lib/templates/types";
import type { ColorTheme } from "./schema";
import { isLive, standingOf } from "@/lib/plans";

/**
 * Server-only data access for portfolios.
 *
 * Business rules:
 * - A user has at most one portfolio per template (the editor is per template).
 * - Editing changes the draft (`content`). Visitors only ever see the snapshot
 *   taken at publish time (`published_content`), so half-finished edits never go live.
 * - The number of simultaneously published portfolios is limited by plan.
 */

export interface PortfolioDraft {
  templateId: TemplateId;
  content: Record<string, unknown>;
  theme: ColorTheme | null;
  slug: string | null;
  publishedAt: string | null;
  updatedAt: string;
  /** True when the draft differs from what visitors currently see. */
  hasUnpublishedChanges: boolean;
  /** Increases on every save; a save must name the version it was based on. */
  version: number;
}

interface PortfolioRow {
  template_id: TemplateId;
  content: Record<string, unknown>;
  theme: ColorTheme | null;
  slug: string | null;
  published_at: Date | null;
  updated_at: Date;
  has_unpublished_changes: boolean;
  version: number;
}

const SELECT_DRAFT = `SELECT template_id, content, theme, slug, published_at, updated_at, version,
  (published_at IS NOT NULL AND (published_content IS DISTINCT FROM content OR published_theme IS DISTINCT FROM theme)) AS has_unpublished_changes
  FROM portfolios`;

const toDraft = (row: PortfolioRow): PortfolioDraft => ({
  templateId: row.template_id,
  content: row.content,
  theme: row.theme,
  slug: row.slug,
  publishedAt: row.published_at?.toISOString() ?? null,
  updatedAt: row.updated_at.toISOString(),
  hasUnpublishedChanges: row.has_unpublished_changes,
  version: row.version,
});

export async function getDraft(ownerId: string, templateId: TemplateId): Promise<PortfolioDraft | null> {
  await ensureSchema();
  const result = await db.query<PortfolioRow>(`${SELECT_DRAFT} WHERE owner_id = $1 AND template_id = $2`, [ownerId, templateId]);
  return result.rows[0] ? toDraft(result.rows[0]) : null;
}

export async function listDrafts(ownerId: string): Promise<PortfolioDraft[]> {
  await ensureSchema();
  const result = await db.query<PortfolioRow>(`${SELECT_DRAFT} WHERE owner_id = $1 ORDER BY updated_at DESC`, [ownerId]);
  return result.rows.map(toDraft);
}

export type SaveResult = { ok: true; draft: PortfolioDraft } | { ok: false; conflict: PortfolioDraft };

/**
 * Saves a draft with optimistic locking. `baseVersion` is the version the
 * editor last loaded or saved; if the stored draft has moved on (another tab
 * or device saved since), nothing is written and the newer draft is returned
 * so the user can choose. `force` overwrites after the user chose to.
 */
export async function saveDraft(ownerId: string, templateId: TemplateId, content: Record<string, unknown>, theme: ColorTheme | null, baseVersion: number | null, force = false): Promise<SaveResult> {
  await ensureSchema();
  const result = await db.query(
    `INSERT INTO portfolios (owner_id, template_id, content, theme) VALUES ($1, $2, $3, $4)
     ON CONFLICT (owner_id, template_id) DO UPDATE
       SET content = EXCLUDED.content, theme = EXCLUDED.theme, updated_at = NOW(), version = portfolios.version + 1
       WHERE $6 OR portfolios.version = $5
     RETURNING id`,
    [ownerId, templateId, JSON.stringify(content), theme, baseVersion, force],
  );
  const draft = (await getDraft(ownerId, templateId))!;
  return result.rowCount ? { ok: true, draft } : { ok: false, conflict: draft };
}

export type PublishResult =
  | { ok: true; draft: PortfolioDraft }
  | { ok: false; status: 404 | 409 | 402; error: string };

export async function publish(user: CurrentUser, templateId: TemplateId, slug: string): Promise<PublishResult> {
  await ensureSchema();
  if (user.standing.standing === "paused") return { ok: false, status: 402, error: "Your free trial has ended. Choose a plan to put your portfolio back online; everything you made is still here." };
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    // Serialise publishes per owner so two tabs cannot both slip under the plan limit.
    const owned = await client.query<{ id: string; published_at: Date | null }>(
      "SELECT id, published_at FROM portfolios WHERE owner_id = $1 ORDER BY id FOR UPDATE",
      [user.id],
    );
    const current = await client.query<{ id: string; published_at: Date | null }>(
      "SELECT id, published_at FROM portfolios WHERE owner_id = $1 AND template_id = $2",
      [user.id, templateId],
    );
    const portfolio = current.rows[0];
    if (!portfolio) {
      await client.query("ROLLBACK");
      return { ok: false, status: 404, error: "Save your portfolio before publishing it." };
    }
    const liveElsewhere = owned.rows.filter((row) => row.published_at && row.id !== portfolio.id).length;
    if (liveElsewhere >= user.plan.publishedPortfolios) {
      await client.query("ROLLBACK");
      return { ok: false, status: 402, error: `The ${user.plan.name} plan includes ${user.plan.publishedPortfolios} live portfolio${user.plan.publishedPortfolios === 1 ? "" : "s"}. Unpublish another portfolio or upgrade to publish this one.` };
    }
    const taken = await client.query("SELECT 1 FROM portfolios WHERE slug = $1 AND id <> $2", [slug, portfolio.id]);
    if (taken.rowCount) {
      await client.query("ROLLBACK");
      return { ok: false, status: 409, error: "That address is already taken. Try another." };
    }
    await client.query(
      `UPDATE portfolios SET slug = $2, published_content = content, published_theme = theme, published_at = NOW() WHERE id = $1`,
      [portfolio.id, slug],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    // A concurrent publish can still claim the slug between our check and update.
    if ((error as { code?: string }).code === "23505") return { ok: false, status: 409, error: "That address is already taken. Try another." };
    throw error;
  } finally {
    client.release();
  }
  return { ok: true, draft: (await getDraft(user.id, templateId))! };
}

/** Takes the portfolio offline. The address stays reserved for this owner so links can be restored. */
export async function unpublish(ownerId: string, templateId: TemplateId): Promise<PortfolioDraft | null> {
  await ensureSchema();
  await db.query("UPDATE portfolios SET published_content = NULL, published_theme = NULL, published_at = NULL WHERE owner_id = $1 AND template_id = $2", [ownerId, templateId]);
  return getDraft(ownerId, templateId);
}

export interface PublishedPortfolio {
  ownerId: string;
  templateId: TemplateId;
  content: Record<string, unknown>;
  theme: ColorTheme | null;
  showsBranding: boolean;
  /** The owner's trial or plan has lapsed; visitors see a holding page, not the portfolio. */
  resting: boolean;
  ownerName: string | null;
  updatedAt: string;
}

export async function getPublished(slug: string): Promise<PublishedPortfolio | null> {
  return findPublished("p.slug = $1", [slug]);
}

/** The published portfolio behind a custom domain. */
export async function getPublishedFor(ownerId: string, templateId: TemplateId): Promise<PublishedPortfolio | null> {
  return findPublished("p.owner_id = $1 AND p.template_id = $2", [ownerId, templateId]);
}

async function findPublished(where: string, params: unknown[]): Promise<PublishedPortfolio | null> {
  await ensureSchema();
  const result = await db.query<{ owner_id: string; template_id: TemplateId; published_content: Record<string, unknown>; published_theme: ColorTheme | null; published_at: Date; plan: string; trial_ends_at: Date; plan_expires_at: Date | null; name: string | null }>(
    `SELECT p.owner_id, p.template_id, p.published_content, p.published_theme, p.published_at, u.plan, u.trial_ends_at, u.plan_expires_at, u.name
     FROM portfolios p JOIN app_users u ON u.id = p.owner_id
     WHERE ${where} AND p.published_at IS NOT NULL`,
    params,
  );
  const row = result.rows[0];
  if (!row) return null;
  const standing = standingOf(row);
  return {
    ownerId: row.owner_id, templateId: row.template_id, content: row.published_content, theme: row.published_theme, updatedAt: row.published_at.toISOString(),
    showsBranding: standing.plan.showsBranding, resting: !isLive(standing.standing), ownerName: (row.published_content.name as string | undefined) ?? row.name,
  };
}
