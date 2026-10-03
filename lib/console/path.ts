/**
 * The superadmin console lives at a secret address set by SUPERADMIN_PATH
 * (e.g. "/hq-7c41e9"). proxy.ts rewrites that address to the internal
 * /console route and hides /console itself, so the console can only be
 * reached through the secret address. Without SUPERADMIN_PATH it is /console.
 */
export const INTERNAL_CONSOLE = "/console";

export function consoleBase(): string {
  const raw = (process.env.SUPERADMIN_PATH ?? "").trim();
  const clean = `/${raw.replace(/^\/+|\/+$/g, "")}`;
  // Only simple, single-segment paths: letters, numbers, - and _.
  return /^\/[A-Za-z0-9_-]{3,64}$/.test(clean) ? clean : INTERNAL_CONSOLE;
}

/** A link inside the console, as the browser should see it. */
export const consoleHref = (path = "") => `${consoleBase()}${!path || path.startsWith("/") || path.startsWith("?") ? path : `/${path}`}`;
