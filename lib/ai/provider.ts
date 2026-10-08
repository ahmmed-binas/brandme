import Anthropic from "@anthropic-ai/sdk";

/**
 * One way to ask an AI model for an answer, whichever company runs it.
 *
 * - Claude (Anthropic): the platform's own key (paid with credits) or a
 *   customer's Claude API key.
 * - OpenAI: a customer's own OpenAI API key (people who use ChatGPT or Codex).
 *   A ChatGPT or Codex subscription doesn't include API access; the key comes
 *   from platform.openai.com and is billed by OpenAI.
 *
 * Features describe what they need (instructions, the request, an optional JSON
 * schema for the answer, optional web search and page reading) and get back
 * the text, why it stopped, and token usage in one shape.
 */

export type AiProviderId = "anthropic" | "openai";
export const PROVIDER_NAMES: Record<AiProviderId, string> = { anthropic: "Claude", openai: "OpenAI" };

const CLAUDE_MODEL = "claude-opus-5-5";

export interface AiUsage { input_tokens?: number | null; output_tokens?: number | null; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null; server_tool_use?: { web_search_requests?: number | null } | null }

export interface AiRequest {
  system: string;
  user: string;
  /** A JSON schema the answer must follow (every property required, no extras). */
  schema?: Record<string, unknown>;
  /** Let the model search the web, up to this many times. */
  webSearch?: number;
  /** Let the model open web pages, up to this many times (Claude only; OpenAI's search reads pages itself). */
  webFetch?: number;
  maxTokens?: number;
}

export interface AiAnswer { text: string; stop: "done" | "refusal" | "max_tokens"; usage: AiUsage[] }

/** Something went wrong talking to the provider. `busy` means try again shortly. */
export class AiProviderError extends Error {
  constructor(message: string, readonly kind: "busy" | "auth" | "failed", readonly status?: number) { super(message); }
}

export interface AiClient { provider: AiProviderId; model: string; ask(request: AiRequest): Promise<AiAnswer> }

/** Claude, with the platform key (no apiKey) or a customer's own. */
export function claudeClient(apiKey?: string): AiClient {
  const client = apiKey ? new Anthropic({ apiKey }) : new Anthropic();
  return {
    provider: "anthropic",
    model: CLAUDE_MODEL,
    async ask({ system, user, schema, webSearch, webFetch, maxTokens = 16000 }) {
      const tools: Anthropic.Beta.BetaToolUnion[] = [];
      if (webFetch) tools.push({ type: "web_fetch_20260209", name: "web_fetch", max_uses: webFetch, max_content_tokens: 8000 });
      if (webSearch) tools.push({ type: "web_search_20260209", name: "web_search", max_uses: webSearch });
      const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: user }];
      const usage: AiUsage[] = [];
      let text = "";
      try {
        // Server-side tools can pause a long turn; continue it a few times at most.
        for (let turn = 0; turn < 4; turn++) {
          const response = await client.beta.messages.create({
            model: CLAUDE_MODEL, max_tokens: maxTokens, system, messages,
            betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
            output_config: { effort: "medium", ...(schema ? { format: { type: "json_schema", schema } } : {}) },
            ...(tools.length ? { tools } : {}),
          });
          usage.push(response.usage);
          if (response.stop_reason === "refusal") return { text: "", stop: "refusal", usage };
          text = response.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
          if (response.stop_reason === "max_tokens") return { text, stop: "max_tokens", usage };
          if (response.stop_reason !== "pause_turn") break;
          messages.push({ role: "assistant", content: response.content });
        }
      } catch (error) {
        if (error instanceof Anthropic.RateLimitError || error instanceof Anthropic.InternalServerError) throw new AiProviderError("busy", "busy", error.status);
        if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) throw new AiProviderError("auth", "auth", error.status);
        if (error instanceof Anthropic.APIError) { console.error("Claude request failed", error.status, error.message); throw new AiProviderError("failed", "failed", error.status); }
        throw error;
      }
      return { text, stop: "done", usage };
    },
  };
}

/** OpenAI’s API. Tests point OPENAI_BASE_URL at a stand-in; never set it in production. */
const OPENAI = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

interface OpenAiResponse {
  status?: string;
  incomplete_details?: { reason?: string } | null;
  output?: Array<{ type: string; content?: Array<{ type: string; text?: string; refusal?: string }> }>;
  usage?: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { cached_tokens?: number } };
  error?: { message?: string } | null;
}

/** A customer's own OpenAI key, using the model chosen when the key was saved. */
export function openAiClient(apiKey: string, model: string): AiClient {
  return {
    provider: "openai",
    model,
    async ask({ system, user, schema, webSearch, webFetch, maxTokens = 16000 }) {
      const body = {
        model, instructions: system, input: user, max_output_tokens: maxTokens, store: false,
        ...(schema ? { text: { format: { type: "json_schema", name: "answer", schema, strict: true } } } : {}),
        ...(webSearch || webFetch ? { tools: [{ type: "web_search" }] } : {}),
      };
      let response: Response;
      try {
        response = await fetch(`${OPENAI}/responses`, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(300_000) });
      } catch {
        throw new AiProviderError("busy", "busy");
      }
      if (response.status === 429 || response.status >= 500) throw new AiProviderError("busy", "busy", response.status);
      if (response.status === 401 || response.status === 403) throw new AiProviderError("auth", "auth", response.status);
      const data = await response.json().catch(() => null) as OpenAiResponse | null;
      if (!response.ok || !data) { console.error("OpenAI request failed", response.status, data?.error?.message); throw new AiProviderError("failed", "failed", response.status); }
      const usage: AiUsage[] = [{ input_tokens: data.usage?.input_tokens, output_tokens: data.usage?.output_tokens, cache_read_input_tokens: data.usage?.input_tokens_details?.cached_tokens }];
      const parts = (data.output ?? []).filter((item) => item.type === "message").flatMap((item) => item.content ?? []);
      if (parts.some((part) => part.type === "refusal")) return { text: "", stop: "refusal", usage };
      const text = parts.filter((part) => part.type === "output_text").map((part) => part.text ?? "").join("");
      if (data.status === "incomplete" && data.incomplete_details?.reason === "max_output_tokens") return { text, stop: "max_tokens", usage };
      return { text, stop: "done", usage };
    },
  };
}

/** The newest general GPT model this key can use (“gpt-5.2” over “gpt-5”), skipping mini, nano and special-purpose ones. */
function newestModel(ids: string[]): string | null {
  const ranked = ids
    .map((id) => ({ id, version: id.match(/^gpt-(\d+(?:\.\d+)?)$/)?.[1] }))
    .filter((entry): entry is { id: string; version: string } => Boolean(entry.version))
    .sort((a, b) => Number(b.version) - Number(a.version));
  return ranked[0]?.id ?? null;
}

/** Checks a customer's key with the provider before it's saved. For OpenAI, also picks the model to use. */
export async function verifyKey(provider: AiProviderId, apiKey: string): Promise<{ ok: true; model: string } | { ok: false; error: string }> {
  if (provider === "anthropic") {
    if (!/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(apiKey)) return { ok: false, error: "That doesn’t look like a Claude API key. It starts with “sk-ant-”." };
    try {
      await new Anthropic({ apiKey, maxRetries: 0, timeout: 15_000 }).models.list({ limit: 1 });
      return { ok: true, model: CLAUDE_MODEL };
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) return { ok: false, error: "Anthropic didn’t accept that key. Check it’s active and copied in full." };
      if (error instanceof Anthropic.APIError) return { ok: false, error: "Anthropic couldn’t confirm the key right now. Please try again in a minute." };
      return { ok: false, error: "We couldn’t reach Anthropic to check the key. Please try again." };
    }
  }
  if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(apiKey) || apiKey.startsWith("sk-ant-")) return { ok: false, error: "That doesn’t look like an OpenAI API key. It starts with “sk-” (often “sk-proj-”)." };
  let response: Response;
  try {
    response = await fetch(`${OPENAI}/models`, { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(15_000) });
  } catch {
    return { ok: false, error: "We couldn’t reach OpenAI to check the key. Please try again." };
  }
  if (response.status === 401 || response.status === 403) return { ok: false, error: "OpenAI didn’t accept that key. Check it’s active and copied in full, and that the project allows model access." };
  if (!response.ok) return { ok: false, error: "OpenAI couldn’t confirm the key right now. Please try again in a minute." };
  const list = await response.json().catch(() => null) as { data?: Array<{ id: string }> } | null;
  const model = process.env.OPENAI_MODEL || newestModel((list?.data ?? []).map((item) => item.id));
  if (!model) return { ok: false, error: "That key works, but it can’t use any GPT models. Check the project’s model permissions at platform.openai.com." };
  return { ok: true, model };
}

/** “sk-ant-…a1b2”, enough for the owner to recognise which key is saved. */
export const keyHint = (value: string) => `${value.slice(0, value.startsWith("sk-proj-") ? 8 : 7)}…${value.slice(-4)}`;
