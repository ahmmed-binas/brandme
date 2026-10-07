import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { chargeCredits } from "@/lib/billing/credits";
import { decryptSecret } from "@/lib/security/secrets";
import type { CurrentUser } from "@/utils/user-account";

/**
 * The single gate every AI request goes through.
 *
 * - People who saved their own Anthropic key use it: no credits, a generous rate limit.
 * - Everyone else spends prepaid credits, priced from the real token usage plus 5%.
 * - A per-plan daily request cap stops anyone hammering the service.
 * - A global daily budget for the platform key (AI_DAILY_BUDGET_USD) is a hard
 *   stop: past it, only own-key requests run until midnight UTC.
 */

/** USD per million tokens, and per web search. Keep in step with Anthropic's price list. */
const PRICES = { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5, webSearch: 0.01 };
/** Price of AI = cost × this: a 5% service fee. Card fees are shown separately when credits are bought. */
const MARKUP = 1.05;
/** Minimum balance to start a request, so a long answer can't run far below zero. */
export const MIN_CREDITS_TO_START = 5;
const OWN_KEY_DAILY_CAP = 400;

export const platformAiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);
const dailyBudgetMicros = () => Math.round(Number(process.env.AI_DAILY_BUDGET_USD ?? 25) * 1_000_000);

export interface AiAccess { client: Anthropic; ownerId: string; billing: "own-key" | "credits" | "free" }
export type AiGate = { ok: true; access: AiAccess } | { ok: false; status: 402 | 429 | 503; error: string };

async function countRequest(ownerId: string, cap: number): Promise<boolean> {
  const result = await db.query(
    `INSERT INTO ai_usage (owner_id, day, requests) VALUES ($1, CURRENT_DATE, 1)
     ON CONFLICT (owner_id, day) DO UPDATE SET requests = ai_usage.requests + 1 WHERE ai_usage.requests < $2
     RETURNING requests`,
    [ownerId, cap],
  );
  return Boolean(result.rowCount);
}

/** Decides who pays for a request and opens a client, or explains why it can't run. */
export async function openAi(user: CurrentUser): Promise<AiGate> {
  await ensureSchema();
  if (user.hasOwnKey) {
    const row = await db.query<{ anthropic_key_enc: string | null }>("SELECT anthropic_key_enc FROM app_users WHERE id = $1", [user.id]);
    const apiKey = row.rows[0]?.anthropic_key_enc ? decryptSecret(row.rows[0].anthropic_key_enc) : null;
    if (!apiKey) return { ok: false, status: 402, error: "Your saved Claude API key can’t be read any more. Add it again in Account → AI." };
    if (!(await countRequest(user.id, OWN_KEY_DAILY_CAP))) return { ok: false, status: 429, error: "That’s a lot of AI for one day. Please try again tomorrow." };
    return { ok: true, access: { client: new Anthropic({ apiKey }), ownerId: user.id, billing: "own-key" } };
  }
  if (!platformAiConfigured()) return { ok: false, status: 503, error: "AI isn’t switched on for this site yet. You can add your own Claude API key in Account → AI." };
  if (user.credits < MIN_CREDITS_TO_START) return { ok: false, status: 402, error: "You’re out of AI credits. Add credits, or connect your own Claude API key, in Account → AI." };
  const spent = await db.query<{ micro_usd: string }>("SELECT micro_usd FROM ai_spend WHERE day = CURRENT_DATE");
  if (Number(spent.rows[0]?.micro_usd ?? 0) >= dailyBudgetMicros()) return { ok: false, status: 503, error: "The AI assistant is resting until tomorrow. Your own Claude API key still works, and nothing you’ve written is lost." };
  if (!(await countRequest(user.id, user.plan.aiEditsPerDay))) return { ok: false, status: 429, error: `You’ve reached today’s ${user.plan.aiEditsPerDay} AI requests on the ${user.plan.name} plan. They reset at midnight UTC.` };
  return { ok: true, access: { client: new Anthropic(), ownerId: user.id, billing: "credits" } };
}

/** A request we pay for (each account's first Investigator check). Still counted against the daily caps. */
export async function openFreeAi(user: CurrentUser): Promise<AiGate> {
  await ensureSchema();
  if (!platformAiConfigured()) return { ok: false, status: 503, error: "AI isn’t switched on for this site yet. You can add your own Claude API key in Account → AI." };
  const spent = await db.query<{ micro_usd: string }>("SELECT micro_usd FROM ai_spend WHERE day = CURRENT_DATE");
  if (Number(spent.rows[0]?.micro_usd ?? 0) >= dailyBudgetMicros()) return { ok: false, status: 503, error: "The AI assistant is resting until tomorrow. Your free check is still waiting for you." };
  if (!(await countRequest(user.id, user.plan.aiEditsPerDay))) return { ok: false, status: 429, error: `You’ve reached today’s ${user.plan.aiEditsPerDay} AI requests. They reset at midnight UTC.` };
  return { ok: true, access: { client: new Anthropic(), ownerId: user.id, billing: "free" } };
}

type Usage = Partial<Pick<Anthropic.Beta.BetaUsage, "input_tokens" | "output_tokens" | "cache_read_input_tokens" | "cache_creation_input_tokens">> & { server_tool_use?: { web_search_requests?: number } | null };

/** Adds up usage from several responses (e.g. a research turn that was continued). */
export function sumUsage(items: Usage[]): Usage {
  let input = 0, output = 0, cacheRead = 0, cacheWrite = 0, searches = 0;
  for (const usage of items) {
    input += usage.input_tokens ?? 0; output += usage.output_tokens ?? 0;
    cacheRead += usage.cache_read_input_tokens ?? 0; cacheWrite += usage.cache_creation_input_tokens ?? 0;
    searches += usage.server_tool_use?.web_search_requests ?? 0;
  }
  return { input_tokens: input, output_tokens: output, cache_read_input_tokens: cacheRead, cache_creation_input_tokens: cacheWrite, server_tool_use: { web_search_requests: searches } };
}

/** Cost in micro-dollars of one response. */
export function costMicros(usage: Usage | null | undefined): number {
  if (!usage) return 0;
  const tokens = (count: number | null | undefined, perMillion: number) => (count ?? 0) * perMillion;
  return Math.round(tokens(usage.input_tokens, PRICES.input) + tokens(usage.output_tokens, PRICES.output) + tokens(usage.cache_read_input_tokens, PRICES.cacheRead)
    + tokens(usage.cache_creation_input_tokens, PRICES.cacheWrite) + (usage.server_tool_use?.web_search_requests ?? 0) * PRICES.webSearch * 1_000_000);
}

export const creditsFor = (micros: number) => Math.max(1, Math.ceil((micros * MARKUP) / 10_000));

/** Records what a request cost and charges credits when it ran on the platform key (not for a free check). */
export async function settleAi(access: AiAccess, usage: Usage | null | undefined, reason: string): Promise<{ charged: number; balance: number | null }> {
  if (access.billing === "own-key") return { charged: 0, balance: null };
  const micros = costMicros(usage);
  await db.query(`INSERT INTO ai_spend (day, micro_usd, requests) VALUES (CURRENT_DATE, $1, 1) ON CONFLICT (day) DO UPDATE SET micro_usd = ai_spend.micro_usd + $1, requests = ai_spend.requests + 1`, [micros]);
  if (!usage || access.billing === "free") return { charged: 0, balance: null };
  return chargeCredits(access.ownerId, creditsFor(micros), reason);
}

/** A failed request still counted against the daily cap; give it back. */
export async function releaseRequest(ownerId: string): Promise<void> {
  await db.query("UPDATE ai_usage SET requests = GREATEST(0, requests - 1) WHERE owner_id = $1 AND day = CURRENT_DATE", [ownerId]);
}

/** Checks a key works with one tiny request before saving it. */
export async function verifyAnthropicKey(apiKey: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(apiKey)) return { ok: false, error: "That doesn’t look like a Claude API key. It starts with “sk-ant-”." };
  try {
    await new Anthropic({ apiKey, maxRetries: 0, timeout: 15_000 }).models.list({ limit: 1 });
    return { ok: true };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) return { ok: false, error: "Anthropic didn’t accept that key. Check it’s active and copied in full." };
    if (error instanceof Anthropic.APIError) return { ok: false, error: "Anthropic couldn’t confirm the key right now. Please try again in a minute." };
    return { ok: false, error: "We couldn’t reach Anthropic to check the key. Please try again." };
  }
}
