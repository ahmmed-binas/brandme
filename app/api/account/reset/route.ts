import { readJson, route } from "@/lib/api/http";
import { AccountError, resetPassword } from "@/lib/accounts/passwords";

export const POST = route(async (request: Request) => {
  const body = await readJson(request, 2_000);
  if (body instanceof Response) return body;
  const { token, password } = (body ?? {}) as { token?: unknown; password?: unknown };
  try {
    await resetPassword(String(token ?? ""), String(password ?? ""));
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AccountError) return Response.json({ error: error.message, field: error.field }, { status: 422 });
    throw error;
  }
});
