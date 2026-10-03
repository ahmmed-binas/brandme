import { jsonError, route } from "@/lib/api/http";
import { InvestigatorError, undoRun } from "@/lib/investigator/run";
import { getCurrentUser } from "@/utils/user-account";

/** Undo an automatic update: the portfolio goes back to how it was before that check. */
export const POST = route(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in first.");
  try {
    await undoRun(user, (await params).id);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof InvestigatorError) return jsonError(error.status, error.message);
    throw error;
  }
});
