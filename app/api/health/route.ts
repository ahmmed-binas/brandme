import { db } from "@/utils/db";
import { databaseConfigured, ensureSchema } from "@/utils/db-schema";

export const dynamic = "force-dynamic";

/** Liveness and database check for uptime monitors and the Docker health check. Reveals no configuration details. */
export async function GET() {
  if (!databaseConfigured()) return Response.json({ ok: true, database: "not_configured" });
  try {
    await ensureSchema();
    await db.query("SELECT 1");
    return Response.json({ ok: true, database: "ok" });
  } catch {
    return Response.json({ ok: false, database: "unavailable" }, { status: 503 });
  }
}
