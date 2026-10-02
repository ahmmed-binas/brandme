import { jsonError, readJson, requireOwner } from "@/lib/api/http";
import { getDraft, saveDraft } from "@/lib/portfolio/repository";
import { isColorTheme, MAX_CONTENT_BYTES, validateContent } from "@/lib/portfolio/schema";

type Context = { params: Promise<{ templateId: string }> };

/** The signed-in owner's saved draft for this template, or `{ draft: null }`. */
export async function GET(_request: Request, { params }: Context) {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  return Response.json({ draft: await getDraft(owner.user.id, owner.templateId) });
}

/** Saves the draft. Visitors keep seeing the last published version until the owner publishes again. */
export async function PUT(request: Request, { params }: Context) {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  const body = await readJson(request, MAX_CONTENT_BYTES + 10_000);
  if (body instanceof Response) return body;
  const { content, theme } = (body ?? {}) as { content?: unknown; theme?: unknown };
  const validation = validateContent(owner.templateId, content);
  if (!validation.ok) return jsonError(422, validation.error);
  const draft = await saveDraft(owner.user.id, owner.templateId, validation.content, isColorTheme(theme) ? theme : null);
  return Response.json({ draft });
}
