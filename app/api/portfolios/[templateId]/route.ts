import { jsonError, readJson, requireOwner, route } from "@/lib/api/http";
import { getDraft, roomFor, saveDraft } from "@/lib/portfolio/repository";
import { isColorTheme, MAX_CONTENT_BYTES, validateContent } from "@/lib/portfolio/schema";

type Context = { params: Promise<{ templateId: string }> };

/** The signed-in owner's saved draft for this template (or `null`), and whether their plan has room for a new one. */
export const GET = route(async (_request: Request, { params }: Context) => {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  return Response.json({ draft: await getDraft(owner.user.id, owner.templateId), room: await roomFor(owner.user, owner.templateId) });
});

/**
 * Saves the draft. Visitors keep seeing the last published version until the owner publishes again.
 * Body: { content, theme, baseVersion, force? }. A stale baseVersion returns 409 with the newer draft.
 */
export const PUT = route(async (request: Request, { params }: Context) => {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  const body = await readJson(request, MAX_CONTENT_BYTES + 10_000);
  if (body instanceof Response) return body;
  const { content, theme, baseVersion, force } = (body ?? {}) as { content?: unknown; theme?: unknown; baseVersion?: unknown; force?: unknown };
  const validation = validateContent(owner.templateId, content);
  if (!validation.ok) return jsonError(422, validation.error);
  const result = await saveDraft(owner.user.id, owner.templateId, validation.content, isColorTheme(theme) ? theme : null, Number.isInteger(baseVersion) ? (baseVersion as number) : null, force === true, owner.user.plan.portfolios);
  if (!result.ok && "full" in result) return Response.json({ error: `The ${owner.user.plan.name} plan keeps ${owner.user.plan.portfolios === 1 ? "one portfolio" : `${owner.user.plan.portfolios} portfolios`}. Move your content to this design, or upgrade to keep more.`, room: await roomFor(owner.user, owner.templateId) }, { status: 402 });
  if (!result.ok) return Response.json({ error: "This portfolio was changed in another tab or on another device.", draft: result.conflict }, { status: 409 });
  return Response.json({ draft: result.draft });
});
