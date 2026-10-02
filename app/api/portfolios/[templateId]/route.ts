import { jsonError, readJson, requireOwner, route } from "@/lib/api/http";
import { getDraft, saveDraft } from "@/lib/portfolio/repository";
import { isColorTheme, MAX_CONTENT_BYTES, validateContent } from "@/lib/portfolio/schema";

type Context = { params: Promise<{ templateId: string }> };

/** The signed-in owner's saved draft for this template, or `{ draft: null }`. */
export const GET = route(async (_request: Request, { params }: Context) => {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  return Response.json({ draft: await getDraft(owner.user.id, owner.templateId) });
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
  const result = await saveDraft(owner.user.id, owner.templateId, validation.content, isColorTheme(theme) ? theme : null, Number.isInteger(baseVersion) ? (baseVersion as number) : null, force === true);
  if (!result.ok) return Response.json({ error: "This portfolio was changed in another tab or on another device.", draft: result.conflict }, { status: 409 });
  return Response.json({ draft: result.draft });
});
