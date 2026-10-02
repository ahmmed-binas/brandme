import { timingSafeEqual } from "node:crypto";
import { jsonError, route } from "@/lib/api/http";
import { runScheduledJobs } from "@/lib/jobs/scheduled";
import { databaseConfigured } from "@/utils/db-schema";

const authorised = (header: string | null) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
};

/** Runs the scheduled jobs. Call hourly with "Authorization: Bearer $CRON_SECRET". */
export const POST = route(async (request: Request) => {
  if (!authorised(request.headers.get("authorization"))) return jsonError(404, "Not found.");
  if (!databaseConfigured()) return jsonError(503, "The database is not configured.");
  return Response.json(await runScheduledJobs());
});
