import { revalidatePath } from "next/cache";
import { readJson, route } from "@/lib/api/http";
import { refusal, requireViewer } from "@/lib/community/http";
import { addComment } from "@/lib/community/repository";

/** Comment on a published post. */
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const viewer = await requireViewer();
  if (viewer instanceof Response) return viewer;
  const { id } = await params;
  const body = await readJson(request, 10_000);
  if (body instanceof Response) return body;
  const result = await addComment(viewer, id, String((body as { body?: unknown } | null)?.body ?? ""));
  if (!result.ok) return refusal(result.status, result.code, result.error);
  revalidatePath(`/community/${id}`);
  return Response.json({ comment: result.comment }, { status: 201 });
});
