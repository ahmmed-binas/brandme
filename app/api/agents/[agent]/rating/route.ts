import { jsonError, route } from "@/lib/api/http";
import { ratingResponse } from "@/lib/templates/rating-route";

const RATED_AGENTS = new Set(["reviewer", "editor"]);

/** Star ratings for Rowan (reviewer) and Ellis (editor). The Investigator has its own route. */
const handler = route(async (request: Request, { params }: { params: Promise<{ agent: string }> }) => {
  const { agent } = await params;
  return RATED_AGENTS.has(agent) ? ratingResponse(request, `agent:${agent}`) : jsonError(404, "Unknown agent.");
});
export { handler as GET, handler as POST };
