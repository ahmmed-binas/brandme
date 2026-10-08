import { jsonError, readJson, route } from "@/lib/api/http";
import { AccountError, signUp } from "@/lib/accounts/passwords";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { databaseConfigured } from "@/utils/db-schema";

/** Creates an email + password account. The browser then signs in with the "password" provider. */
export const POST = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "Accounts need the database.");
  if (!(await rateLimit(`signup:${clientIp(request)}`, 8, 3600))) return jsonError(429, "Too many sign-ups from here. Try again in an hour.");
  const body = await readJson(request, 4_000);
  if (body instanceof Response) return body;
  const input = (body ?? {}) as Record<string, unknown>;
  const text = (key: string) => (typeof input[key] === "string" ? (input[key] as string) : "");
  if (input.agree !== true) return Response.json({ error: "Please accept the terms to continue.", field: "agree" }, { status: 422 });
  try {
    await signUp({ username: text("username"), email: text("email"), password: text("password"), birthDate: text("birthDate"), name: text("name") });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof AccountError) return Response.json({ error: error.message, field: error.field }, { status: 422 });
    throw error;
  }
});
