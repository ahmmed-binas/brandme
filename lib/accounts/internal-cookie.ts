/**
 * The cookie that marks a browser as the owner's or team's, so its visits
 * aren't counted (see lib/accounts/internal.ts). Kept apart from the database
 * code so proxy.ts can set it when the console's secret address is opened.
 */

export const INTERNAL_COOKIE = "fuccura_internal";

/** True when the request comes from a browser marked as the team's. */
export const hasInternalCookie = (request: Request) =>
  (request.headers.get("cookie") ?? "").split(/;\s*/).includes(`${INTERNAL_COOKIE}=1`);

/** The header that marks this browser as the team's, for a year. */
export const internalCookieHeader = () =>
  `${INTERNAL_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly; Secure`;
