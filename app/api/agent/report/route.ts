import { jsonError, route } from "@/lib/api/http";
import { recentErrors } from "@/lib/owner/alerts";
import { loadDailyReport } from "@/lib/owner/daily-report";
import { bearerMatches } from "@/lib/security/bearer";

export const dynamic = "force-dynamic";

/**
 * The last 24 hours in numbers, for the owner's agent (a scheduled assistant on
 * the owner's PC, signing in with AGENT_TOKEN). It reads this instead of logging
 * in to the server, then suggests what to do next.
 */
export const GET = route(async (request: Request) => {
  if (!bearerMatches(request, "AGENT_TOKEN")) return jsonError(404, "Not found.");
  // Recent server errors too, so the agent can fix real bugs at its next run.
  return Response.json({ ...(await loadDailyReport()), errors: await recentErrors() });
});
