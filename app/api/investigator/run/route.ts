import { jsonError, route } from "@/lib/api/http";
import { InvestigatorError, runInvestigator } from "@/lib/investigator/run";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

export const maxDuration = 300;

/** “Check now”: runs a check straight away (the first one is free; after that, at most every 12 hours). */
export const POST = route(async () => {
  if (!databaseConfigured()) return jsonError(503, "The Investigator needs the database.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in first.");
  try {
    return Response.json(await runInvestigator(user.id, "manual"));
  } catch (error) {
    if (error instanceof InvestigatorError) return jsonError(error.status, error.message);
    throw error;
  }
});
