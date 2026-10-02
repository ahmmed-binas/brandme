import { jsonError, route } from "@/lib/api/http";
import { readUpload } from "@/lib/gallery/form";
import { createSubmission, listSubmissions, SubmissionError } from "@/lib/gallery/submissions";
import { tooManyAttempts } from "@/lib/accounts/passwords";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/** Your own submissions and where each one stands. */
export const GET = route(async () => {
  const user = databaseConfigured() ? await getCurrentUser() : null;
  if (!user) return jsonError(401, "Sign in first.");
  return Response.json({ submissions: await listSubmissions({ ownerId: user.id }) });
});

/** Submit a template to the gallery (multipart form). It waits for an admin to approve it. */
export const POST = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "Submissions need the database.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to submit a template.");
  if (tooManyAttempts(`submit:${user.id}`, 10, 60 * 60_000)) return jsonError(429, "Too many uploads. Try again in an hour.");
  try {
    const created = await createSubmission(user, await readUpload(request, true));
    return Response.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof SubmissionError) return Response.json({ error: error.message, field: error.field }, { status: 422 });
    throw error;
  }
});
