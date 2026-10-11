import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Workers (workers/voice/worker.py) sign every request with the shared secret
 * TOOLS_WORKER_TOKEN: "Authorization: Bearer <token>". Without the setting the
 * worker routes are switched off.
 */
export function workerAllowed(request: Request): boolean {
  const expected = process.env.TOOLS_WORKER_TOKEN?.trim();
  if (!expected || expected.length < 24) return false;
  const given =
    request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "")
      .trim() ?? "";
  // Compare fixed-length hashes so the check takes the same time whatever was sent.
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(given), digest(expected));
}

/** The worker's name, for the "engine online" check (one row per computer). */
export function workerName(request: Request): string {
  return (request.headers.get("x-worker-name") ?? "worker").replace(/[^\w.-]/g, "").slice(0, 60) || "worker";
}
