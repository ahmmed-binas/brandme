import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/**
 * Server-side AI copy editing for portfolio content.
 *
 * The model never sees or returns the whole document structure. It receives a
 * flat list of the existing text fields and may only return new values for
 * those exact paths, so it cannot add links, change images, invent sections,
 * or break a template's data shape.
 */

const MODEL = "claude-opus-5-5";
const MAX_FIELDS = 250;
const MAX_FIELD_LENGTH = 4000;

/** Keys whose values are links, media, identifiers, settings, or factual lists — never rewritten by AI. */
const PROTECTED_KEY = /(^id$|slug|url|link|href|github|linkedin|instagram|twitter|website|email|phone|whatsapp|avatar|image|photo|logo|icon|date|year|status|channel|featured|placeholders|fileurl|technolog|^skills$|^tools$)/i;
/** The owner's own name is never changed by AI. */
const PROTECTED_PATH = new Set(["name", "personal.name"]);

export interface EditableField { path: string; value: string }

export function collectEditableFields(content: unknown): EditableField[] {
  const fields: EditableField[] = [];
  const walk = (value: unknown, path: string[], key: string) => {
    if (fields.length >= MAX_FIELDS) return;
    if (typeof value === "string") {
      if (value.trim() && !PROTECTED_KEY.test(key) && !PROTECTED_PATH.has(path.join(".")) && value.length <= MAX_FIELD_LENGTH && !value.startsWith("[ADD")) fields.push({ path: path.join("."), value });
      return;
    }
    if (Array.isArray(value)) value.forEach((item, index) => walk(item, [...path, String(index)], key));
    else if (value && typeof value === "object") for (const [childKey, child] of Object.entries(value)) if (!PROTECTED_KEY.test(childKey)) walk(child, [...path, childKey], childKey);
  };
  walk(content, [], "");
  return fields;
}

const resultSchema = z.object({
  reply: z.string(),
  changes: z.array(z.object({ path: z.string(), value: z.string() })),
});

const RESULT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "changes"],
  properties: {
    reply: { type: "string", description: "One or two sentences telling the user what you changed, or why you changed nothing." },
    changes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["path", "value"],
        properties: { path: { type: "string" }, value: { type: "string" } },
      },
    },
  },
} as const;

const SYSTEM_PROMPT = `You edit the written content of a person's professional portfolio website.

You receive the portfolio's editable text fields as JSON (each has a path and its current value) and the owner's request. Return only the fields you are changing, using paths exactly as given.

Rules:
- Keep every fact the owner provided: employers, titles, dates, numbers, technologies, and project names. Never invent achievements, metrics, clients, or credentials; if the request needs facts you don't have, say what to add instead.
- Write in the owner's voice (first person where the existing copy is first person), plainly and specifically. Avoid buzzwords and filler.
- Respect the length of each field: a title stays a short title, a tagline stays one sentence.
- If the request is not about the portfolio's written content (for example layout, colours, or adding a new section), change nothing and explain that the template controls design and that sections are added from the Content panel.`;

export type AssistResult =
  | { ok: true; content: Record<string, unknown>; reply: string; changed: number }
  | { ok: false; status: 422 | 502 | 503; error: string };

export function assistantConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function applyChanges(content: Record<string, unknown>, allowed: Map<string, string>, changes: EditableField[]) {
  const next = structuredClone(content);
  let changed = 0;
  for (const { path, value } of changes) {
    const original = allowed.get(path);
    if (original === undefined || original === value) continue;
    const keys = path.split(".");
    let target: unknown = next;
    for (const key of keys.slice(0, -1)) target = (target as Record<string, unknown>)[key];
    (target as Record<string, unknown>)[keys.at(-1)!] = value.slice(0, Math.max(MAX_FIELD_LENGTH, original.length * 3));
    changed += 1;
  }
  return { next, changed };
}

export async function assistWithContent(content: Record<string, unknown>, instruction: string): Promise<AssistResult> {
  if (!assistantConfigured()) return { ok: false, status: 503, error: "The AI assistant is not configured on this server." };
  const fields = collectEditableFields(content);
  if (!fields.length) return { ok: false, status: 422, error: "Add some content first, then ask me to improve it." };

  const client = new Anthropic();
  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: RESULT_JSON_SCHEMA } },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Editable fields:\n${JSON.stringify(fields)}\n\nRequest from the portfolio owner:\n${instruction}` }],
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return { ok: false, status: 503, error: "The assistant is busy right now. Try again in a minute." };
    if (error instanceof Anthropic.APIError) {
      console.error("AI assist request failed", error.status, error.message);
      return { ok: false, status: 502, error: "The assistant could not complete that request." };
    }
    throw error;
  }

  if (response.stop_reason === "refusal") return { ok: false, status: 422, error: "The assistant can't help with that request." };
  if (response.stop_reason === "max_tokens") return { ok: false, status: 502, error: "That change was too large. Try asking for one section at a time." };
  const text = response.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
  let parsed: z.infer<typeof resultSchema>;
  try {
    parsed = resultSchema.parse(JSON.parse(text));
  } catch {
    return { ok: false, status: 502, error: "The assistant returned an unreadable answer. Please try again." };
  }

  const { next, changed } = applyChanges(content, new Map(fields.map((field) => [field.path, field.value])), parsed.changes);
  return { ok: true, content: next, reply: parsed.reply, changed };
}
