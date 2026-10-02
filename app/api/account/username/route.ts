import { jsonError, readJson, route } from "@/lib/api/http";
import { AccountError, setUsername } from "@/lib/accounts/passwords";
import { getCurrentUser } from "@/utils/user-account";

/** Choose or change your public @username. */
export const PUT = route(async (request: Request) => {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in first.");
  const body = await readJson(request, 500);
  if (body instanceof Response) return body;
  try {
    return Response.json({ username: await setUsername(user.id, String((body as { username?: unknown } | null)?.username ?? "")) });
  } catch (error) {
    if (error instanceof AccountError) return jsonError(422, error.message);
    throw error;
  }
});
