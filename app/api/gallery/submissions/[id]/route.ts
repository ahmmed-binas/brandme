import { jsonError, route } from "@/lib/api/http";
import { readUpload } from "@/lib/gallery/form";
import { deleteSubmission, SubmissionError, updateSubmission } from "@/lib/gallery/submissions";
import { getCurrentUser } from "@/utils/user-account";

type Context = { params: Promise<{ id: string }> };

/** Edit a submission that is waiting or needs changes. Files are optional; missing ones are kept. */
export const PUT = route(async (request: Request, { params }: Context) => {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in first.");
  try {
    const updated = await updateSubmission(user, (await params).id, await readUpload(request, false));
    return updated ? Response.json(updated) : jsonError(404, "That submission doesn’t exist.");
  } catch (error) {
    if (error instanceof SubmissionError) return Response.json({ error: error.message, field: error.field }, { status: 422 });
    throw error;
  }
});

export const DELETE = route(async (_request: Request, { params }: Context) => {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in first.");
  return await deleteSubmission((await params).id, user.id) ? Response.json({ ok: true }) : jsonError(404, "That submission can’t be withdrawn.");
});
