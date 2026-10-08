/**
 * Local test sign-in. With DEV_LOGIN=true and the site running on localhost,
 * /login offers “Sign in with any email” so you can try accounts, admin
 * pages and publishing without setting up Google. It is refused on any
 * other host, so it cannot be switched on by accident in production.
 */
export function devLoginEnabled(): boolean {
  if (process.env.DEV_LOGIN !== "true") return false;
  // No default: a server with no APP_URL set must not fall back to “localhost” and allow it.
  const url = process.env.APP_URL ?? process.env.AUTH_URL;
  if (!url) return false;
  try {
    return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}
