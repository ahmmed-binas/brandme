import { createHash, timingSafeEqual } from "node:crypto";

/**
 * True when the request carries "Authorization: Bearer <secret>" matching the
 * environment variable `name`. A missing or short (< 24 characters) secret
 * switches the route off. Used by machine callers: the voice engine and the
 * owner's agent.
 */
export function bearerMatches(request: Request, name: string): boolean {
  const expected = process.env[name]?.trim();
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
