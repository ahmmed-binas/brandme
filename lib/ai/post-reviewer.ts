import { z } from "zod";
import { AiProviderError, type AiClient, type AiUsage } from "./provider";

/**
 * Rowan, the Reviewer: reads a blog post before it's published and says what
 * to fix. It only reviews; nothing changes until the owner applies a
 * suggestion. It never invents facts: claims that need a source are flagged,
 * not rewritten.
 */

export const MAX_REVIEW_CHARS = 40_000;

const ISSUE_KINDS = ["spelling", "clarity", "structure", "title", "claims", "links", "tone"] as const;

const reviewSchema = z.object({
  verdict: z.enum(["ready", "almost", "needs-work"]),
  summary: z.string(),
  strengths: z.array(z.string()),
  issues: z.array(z.object({ kind: z.enum(ISSUE_KINDS), quote: z.string(), fix: z.string() })),
  better_title: z.string(),
  better_summary: z.string(),
});
export type PostReview = z.infer<typeof reviewSchema>;

const str = { type: "string" } as const;
const REVIEW_JSON_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["verdict", "summary", "strengths", "issues", "better_title", "better_summary"],
  properties: {
    verdict: { type: "string", enum: ["ready", "almost", "needs-work"], description: "ready: publish as is. almost: small fixes. needs-work: fix before publishing." },
    summary: { type: "string", description: "Two sentences at most: your overall view, addressed to the writer as “you”." },
    strengths: { type: "array", items: str, description: "Up to three specific things that work." },
    issues: {
      type: "array", description: "Up to eight problems, most important first. Empty if there are none.",
      items: { type: "object", additionalProperties: false, required: ["kind", "quote", "fix"], properties: {
        kind: { type: "string", enum: [...ISSUE_KINDS] },
        quote: { type: "string", description: "The exact words from the post (under 20 words), or empty for a whole-post issue." },
        fix: { type: "string", description: "What to do, concretely. For spelling, the corrected words." },
      } },
    },
    better_title: { type: "string", description: "A clearer, more specific title, or empty if the current one is good." },
    better_summary: { type: "string", description: "One or two sentences (under 200 characters) for search results and lists." },
  },
} as const;

const SYSTEM = `You are Rowan, a careful editor who reviews blog posts on professionals' websites before they are published.

Review the post you are given and report, in plain British English:
- spelling and grammar mistakes (quote them exactly and give the correction);
- sentences or paragraphs that are hard to follow, and how to make them clearer;
- structure: a weak opening, missing headings in a long post, an ending that trails off;
- the title: is it specific enough that the right reader would click?
- claims: numbers, results or comparisons stated as fact that a reader would want a source for. Flag them; never invent a source or a figure;
- links written in the text that look broken or incomplete (you cannot open them);
- tone that might put off clients (overselling, jargon, negativity about others).

Rules: keep the writer's voice and facts. Never add achievements, clients, prices or credentials. Be kind and specific; no generic advice. If the post is good, say so and keep the issues list short.`;

export type ReviewResult =
  | { ok: true; review: PostReview; usage: AiUsage[] }
  | { ok: false; status: 422 | 502 | 503; error: string; usage?: AiUsage[] };

export async function reviewPost(client: AiClient, post: { title: string; body: string; excerpt: string }): Promise<ReviewResult> {
  if (post.body.trim().length < 80) return { ok: false, status: 422, error: "Write a little more first: Rowan needs a few paragraphs to review." };
  let answer;
  try {
    answer = await client.ask({ system: SYSTEM, schema: REVIEW_JSON_SCHEMA, maxTokens: 4000, user: `Title: ${post.title || "(no title yet)"}\nSummary: ${post.excerpt || "(none)"}\n\nPost (Markdown):\n${post.body.slice(0, MAX_REVIEW_CHARS)}` });
  } catch (error) {
    if (!(error instanceof AiProviderError)) throw error;
    if (error.kind === "busy") return { ok: false, status: 503, error: "Rowan is busy right now. Try again in a minute." };
    if (error.kind === "auth") return { ok: false, status: 502, error: "Your AI provider didn’t accept the saved API key. Check it in Account → AI." };
    return { ok: false, status: 502, error: "The review couldn’t be completed. Please try again." };
  }
  if (answer.stop === "refusal") return { ok: false, status: 422, error: "Rowan can’t review this post.", usage: answer.usage };
  try {
    const review = reviewSchema.parse(JSON.parse(answer.text));
    return { ok: true, review: { ...review, strengths: review.strengths.slice(0, 3), issues: review.issues.slice(0, 8) }, usage: answer.usage };
  } catch {
    return { ok: false, status: 502, error: "The review came back unreadable. Please try again.", usage: answer.usage };
  }
}
