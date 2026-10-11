import { jsonError, route } from "@/lib/api/http";
import { claimJob, workerSeen } from "@/lib/tools/voice";
import { workerAllowed, workerName } from "@/lib/tools/worker-auth";

export const dynamic = "force-dynamic";

/** A worker asks for its next job (which also shows the engine is online). { job: null } when there's none. */
export const POST = route(async (request: Request) => {
  if (!workerAllowed(request)) return jsonError(404, "Not found.");
  await workerSeen(workerName(request));
  return Response.json({ job: await claimJob() });
});
