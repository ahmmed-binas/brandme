import { bearerMatches } from "@/lib/security/bearer";

/**
 * Workers (workers/voice/worker.py) sign every request with the shared secret
 * TOOLS_WORKER_TOKEN: "Authorization: Bearer <token>". Without the setting the
 * worker routes are switched off.
 */
export const workerAllowed = (request: Request) => bearerMatches(request, "TOOLS_WORKER_TOKEN");

/** The worker's name, for the "engine online" check (one row per computer). */
export function workerName(request: Request): string {
  return (request.headers.get("x-worker-name") ?? "worker").replace(/[^\w.-]/g, "").slice(0, 60) || "worker";
}
