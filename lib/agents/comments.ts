import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { judgeComment } from "@/lib/community/rules";
import type { Viewer } from "@/lib/community/repository";

/**
 * Comments on an agent's page (e.g. Inspector Iqbal). They go through the same
 * spam rules as community comments (lib/community/rules.ts) and appear straight
 * away; the author or a moderator can delete them.
 */

export const AGENTS = ["investigator"] as const;
export type AgentId = (typeof AGENTS)[number];
export const isAgentId = (value: unknown): value is AgentId => AGENTS.includes(value as AgentId);

export interface AgentComment { id: string; body: string; createdAt: string; author: { id: string; name: string; image: string | null } }

const displayName = (name: string | null, email: string | null) => name?.trim() || email?.split("@")[0] || "Member";

export async function listAgentComments(agent: AgentId, limit = 50): Promise<AgentComment[]> {
  await ensureSchema();
  const result = await db.query<{ id: string; body: string; created_at: Date; author_id: string; name: string | null; email: string | null; image: string | null }>(
    `SELECT c.id, c.body, c.created_at, u.id AS author_id, u.name, u.email, u.image FROM agent_comments c JOIN app_users u ON u.id = c.author_id
     WHERE c.agent = $1 ORDER BY c.created_at DESC LIMIT $2`, [agent, limit]);
  return result.rows.map((row) => ({ id: row.id, body: row.body, createdAt: row.created_at.toISOString(), author: { id: row.author_id, name: displayName(row.name, row.email), image: row.image } }));
}

export async function addAgentComment(viewer: Viewer, agent: AgentId, text: string): Promise<{ ok: true; comment: AgentComment } | { ok: false; status: number; error: string }> {
  await ensureSchema();
  const history = await db.query<{ last_hour: string }>("SELECT count(*) AS last_hour FROM agent_comments WHERE author_id = $1 AND created_at > NOW() - INTERVAL '1 hour'", [viewer.id]);
  const recent = await db.query<{ body: string }>("SELECT body FROM agent_comments WHERE author_id = $1 AND agent = $2", [viewer.id, agent]);
  const verdict = judgeComment(text, { commentsLastHour: Number(history.rows[0].last_hour), recentBodies: recent.rows.map((row) => row.body) });
  if (verdict.outcome === "refuse") return { ok: false, status: verdict.code === "rate_limited" ? 429 : 422, error: verdict.message };
  const inserted = await db.query<{ id: string; created_at: Date }>("INSERT INTO agent_comments (agent, author_id, body) VALUES ($1, $2, $3) RETURNING id, created_at", [agent, viewer.id, text.trim()]);
  const author = (await db.query<{ name: string | null; email: string | null; image: string | null }>("SELECT name, email, image FROM app_users WHERE id = $1", [viewer.id])).rows[0]!;
  return { ok: true, comment: { id: inserted.rows[0]!.id, body: text.trim(), createdAt: inserted.rows[0]!.created_at.toISOString(), author: { id: viewer.id, name: displayName(author.name, author.email), image: author.image } } };
}

export async function deleteAgentComment(viewer: Viewer, id: string): Promise<boolean> {
  await ensureSchema();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  return Boolean((await db.query("DELETE FROM agent_comments WHERE id = $1 AND (author_id = $2 OR $3)", [id, viewer.id, viewer.isModerator])).rowCount);
}
