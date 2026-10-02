import { jsonError, readJson, route } from "@/lib/api/http";
import { db } from "@/utils/db";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/** Account preferences: automatic renewal and reminder emails. */
export const PUT = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "Accounts are not configured on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in first.");
  const body = await readJson(request, 500);
  if (body instanceof Response) return body;
  const { autoRenew, emailsOptOut } = (body ?? {}) as { autoRenew?: unknown; emailsOptOut?: unknown };
  if (typeof autoRenew === "boolean") await db.query("UPDATE app_users SET auto_renew = $2 WHERE id = $1", [user.id, autoRenew]);
  if (typeof emailsOptOut === "boolean") await db.query("UPDATE app_users SET emails_opt_out = $2 WHERE id = $1", [user.id, emailsOptOut]);
  return Response.json({ saved: true });
});
