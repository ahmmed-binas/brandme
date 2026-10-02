import { revalidatePath } from "next/cache";
import { jsonError, readJson, requireOwner } from "@/lib/api/http";
import { getDraft, publish, unpublish } from "@/lib/portfolio/repository";
import { normaliseSlug, slugError } from "@/lib/portfolio/schema";

type Context = { params: Promise<{ templateId: string }> };

/** Publishes the saved draft at /p/<slug>, snapshotting it so later edits stay private until republished. */
export async function POST(request: Request, { params }: Context) {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  const body = await readJson(request, 2_000);
  if (body instanceof Response) return body;
  const slug = normaliseSlug(String((body as { slug?: unknown } | null)?.slug ?? ""));
  const invalid = slugError(slug);
  if (invalid) return jsonError(422, invalid);
  const previous = await getDraft(owner.user.id, owner.templateId);
  const result = await publish(owner.user, owner.templateId, slug);
  if (!result.ok) return jsonError(result.status, result.error);
  revalidatePath(`/p/${slug}`);
  if (previous?.slug && previous.slug !== slug) revalidatePath(`/p/${previous.slug}`);
  return Response.json({ draft: result.draft, url: `/p/${slug}` });
}

/** Takes the portfolio offline. */
export async function DELETE(_request: Request, { params }: Context) {
  const owner = await requireOwner(params);
  if (owner instanceof Response) return owner;
  const draft = await unpublish(owner.user.id, owner.templateId);
  if (draft?.slug) revalidatePath(`/p/${draft.slug}`);
  return Response.json({ draft });
}
