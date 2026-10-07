import { revalidatePath } from "next/cache";
import { jsonError, readJson, requireOwner, route } from "@/lib/api/http";
import { switchTemplate } from "@/lib/portfolio/repository";
import { isTemplateAvailable } from "@/lib/templates/approval";
import { getTemplate, isTemplateId } from "@/lib/templates/catalog";

type Context = { params: Promise<{ templateId: string }> };

/** Moves the owner's portfolio from another design to this one. Body: { from }. */
export const POST = route(async (request: Request, { params }: Context) => {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  const template = getTemplate(owner.templateId);
  if (!template || !(await isTemplateAvailable(template, owner.user.isAdmin))) return jsonError(404, "Unknown template.");
  const body = await readJson(request, 500);
  if (body instanceof Response) return body;
  const from = (body as { from?: unknown } | null)?.from;
  if (typeof from !== "string" || !isTemplateId(from)) return jsonError(422, "Choose the portfolio to move.");
  const result = await switchTemplate(owner.user.id, from, owner.templateId);
  if (!result.ok) return jsonError(result.status, result.error);
  if (result.draft.slug) revalidatePath(`/p/${result.draft.slug}`);
  return Response.json({ draft: result.draft });
});
