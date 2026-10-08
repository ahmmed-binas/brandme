import { resolve4 } from "node:dns/promises";
import { db } from "@/utils/db";
import { databaseConfigured, ensureSchema } from "@/utils/db-schema";
import { mailConfigured } from "@/lib/email/mailer";
import { stripeConfigured } from "@/lib/payments/stripe";
import { registrarConfigured } from "@/lib/domains/vercel";
import { platformAiConfigured } from "@/lib/ai/metering";
import { devLoginEnabled } from "@/lib/dev-login";
import { bookingUrl, bookingWebhookConfigured } from "@/lib/booking";
import { legal, legalConfigured } from "@/lib/legal";

/**
 * The go-live checklist on /admin: each check reads the server's real
 * configuration, so it says what is actually set up, not what should be.
 */
export type CheckState = "ok" | "todo" | "warn";
export interface Check { id: string; group: string; title: string; state: CheckState; detail: string; fix?: string }

function host(url?: string) { try { return url ? new URL(url) : null; } catch { return null; } }

export async function runSetupChecks(): Promise<Check[]> {
  const checks: Check[] = [];
  const add = (check: Check) => checks.push(check);
  const app = host(process.env.APP_URL);
  const production = process.env.NODE_ENV === "production";

  // Site address
  add(app ? { id: "app-url", group: "Your site", title: "Site address (APP_URL)", state: app.protocol === "https:" || !production ? "ok" : "warn", detail: app.origin, fix: app.protocol === "https:" ? undefined : "Use https:// once your domain is live." }
    : { id: "app-url", group: "Your site", title: "Site address (APP_URL)", state: "todo", detail: "Not set.", fix: "Set APP_URL to https://yourdomain.com and APP_DOMAIN to yourdomain.com." });
  const ip = process.env.SERVER_IPV4;
  add({ id: "server-ip", group: "Your site", title: "Server address (SERVER_IPV4)", state: ip ? "ok" : "todo", detail: ip ?? "Not set.", fix: ip ? undefined : "Set it to your server’s public IPv4 address. Customers’ domains point here." });
  if (app && ip && !["localhost", "127.0.0.1"].includes(app.hostname)) {
    const found = await resolve4(app.hostname).catch(() => [] as string[]);
    add({ id: "dns", group: "Your site", title: `DNS for ${app.hostname}`, state: found.includes(ip) ? "ok" : "todo", detail: found.length ? `Points to ${found.join(", ")}` : "No A record found yet.", fix: found.includes(ip) ? undefined : `At your registrar add an A record for @ (and www) pointing to ${ip}. It can take up to an hour to apply.` });
  }

  // Accounts
  add({ id: "auth-secret", group: "Accounts", title: "Session secret (AUTH_SECRET)", state: (process.env.AUTH_SECRET ?? "").length >= 32 ? "ok" : "todo", detail: process.env.AUTH_SECRET ? "Set." : "Not set.", fix: "Generate one with: npx auth secret" });
  const google = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  add({ id: "google", group: "Accounts", title: "Google sign-in", state: google ? "ok" : "todo", detail: google ? "Configured." : "Not configured: people can still sign up with an email and password, but not with Google.", fix: google ? `Make sure ${app?.origin ?? "your site"}/api/auth/callback/google is an authorised redirect URI in Google Cloud.` : "See docs/GOOGLE_AUTH_SETUP.md." });
  const superadmins = databaseConfigured() ? await ensureSchema().then(() => db.query<{ email: string }>("SELECT email FROM app_users WHERE is_superadmin AND (provider <> 'password' OR email_verified_at IS NOT NULL) ORDER BY created_at")).then((result) => result.rows.map((row) => row.email), () => [] as string[]) : [];
  add({ id: "superadmin", group: "Accounts", title: "Superadmin", state: superadmins.length ? "ok" : "todo", detail: superadmins.length ? superadmins.join(", ") : "None yet.", fix: "On the server, run: npm run admin:create (with Docker: docker compose exec -it app node scripts/create-superadmin.mjs)." });
  const consolePath = (process.env.SUPERADMIN_PATH ?? "").trim();
  add({ id: "console-path", group: "Accounts", title: "Console address (SUPERADMIN_PATH)", state: /^\/?[A-Za-z0-9_-]{3,64}\/?$/.test(consolePath) && consolePath.replace(/\//g, "") !== "console" ? "ok" : "warn", detail: consolePath ? `The console is at ${consolePath.startsWith("/") ? consolePath : `/${consolePath}`}.` : "The console is at /console, which is easy to guess.", fix: "Set SUPERADMIN_PATH in .env to a secret address, e.g. /hq-7c41e9, and restart. Keep it to yourself." });
  add({ id: "admins", group: "Accounts", title: "Admins (ADMIN_EMAILS)", state: "ok", detail: process.env.ADMIN_EMAILS ? `${process.env.ADMIN_EMAILS.split(",").filter(Boolean).length} admin email(s).` : "None besides the superadmin.", fix: "Optional: other people (comma-separated emails) who can approve templates, moderate and write the Journal. They need a confirmed account with that email." });
  if (process.env.DEV_LOGIN === "true") add({ id: "dev-login", group: "Accounts", title: "Local test login (DEV_LOGIN)", state: devLoginEnabled() ? (production ? "warn" : "ok") : "ok", detail: devLoginEnabled() ? "On (localhost only)." : "Set, but ignored because the site isn’t on localhost.", fix: production ? "Remove DEV_LOGIN from your server’s .env." : undefined });

  add({ id: "obscura", group: "Accounts", title: "Page reader for the Investigator (OBSCURA_URL)", state: "ok", detail: process.env.OBSCURA_URL ? "A headless browser reads customers’ pages, so pages built with JavaScript are understood." : "Off: pages are read with a plain fetch. Pages built with JavaScript may look empty.", fix: undefined });

  // Database
  if (!databaseConfigured()) add({ id: "db", group: "Database", title: "PostgreSQL", state: "todo", detail: "DATABASE_URL is not set.", fix: "docker-compose sets this for you." });
  else {
    try {
      await ensureSchema();
      const applied = (await db.query<{ count: string }>("SELECT count(*) FROM schema_migrations")).rows[0]!.count;
      add({ id: "db", group: "Database", title: "PostgreSQL", state: "ok", detail: `Connected; ${applied} migrations applied.` });
    } catch (error) {
      add({ id: "db", group: "Database", title: "PostgreSQL", state: "todo", detail: `Can’t connect: ${(error as Error).message}` });
    }
  }

  // Money and mail
  add({ id: "stripe", group: "Payments & email", title: "Stripe (plans, credits, domains)", state: stripeConfigured() ? (process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ? "warn" : "ok") : "todo", detail: stripeConfigured() ? (process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ? "Test mode keys: no real payments." : "Live keys.") : "Not configured; nobody can pay.", fix: stripeConfigured() ? undefined : `Add STRIPE_SECRET_KEY and a webhook to ${app?.origin ?? "https://yourdomain"}/api/webhooks/stripe (STRIPE_WEBHOOK_SECRET).` });
  add({ id: "smtp", group: "Payments & email", title: "Email (SMTP)", state: mailConfigured() ? "ok" : "todo", detail: mailConfigured() ? `Sending as ${process.env.SMTP_FROM || process.env.SMTP_USER}.` : "Not configured; emails are only written to the server log.", fix: mailConfigured() ? undefined : "Use your company mailbox’s SMTP settings (Google Workspace, Zoho, Microsoft 365)." });
  add({ id: "cron", group: "Payments & email", title: "Scheduled jobs (CRON_SECRET)", state: (process.env.CRON_SECRET ?? "").length >= 24 ? "ok" : "todo", detail: process.env.CRON_SECRET ? "Set. docker-compose’s cron service calls /api/cron every hour." : "Not set: reminders, renewals and auto-updates won’t run.", fix: "Set a long random CRON_SECRET." });

  // Security: secrets kept apart, and nothing meant for tests left switched on.
  const encryption = (process.env.ENCRYPTION_KEY ?? "").length >= 32;
  add({ id: "encryption-key", group: "Security", title: "Key for stored secrets (ENCRYPTION_KEY)", state: encryption ? "ok" : "warn", detail: encryption ? "Customers’ own AI keys are encrypted with their own key." : "Customers’ own AI keys are encrypted with AUTH_SECRET. It works, but one leaked secret then unlocks both.", fix: encryption ? undefined : "Set ENCRYPTION_KEY to a long random value (openssl rand -base64 48) before anyone saves a key; changing it later means they paste their keys again." });
  const testOnly = ["OPENAI_BASE_URL", "ANTHROPIC_BASE_URL", "GITHUB_API_URL", "STRIPE_API_URL", "VERCEL_API_URL", "INVESTIGATOR_ALLOW_PRIVATE_FETCH"].filter((name) => process.env[name]);
  add({ id: "test-settings", group: "Security", title: "Settings meant only for tests", state: testOnly.length && production ? "warn" : "ok", detail: testOnly.length ? `Set: ${testOnly.join(", ")}.` : "None set.", fix: testOnly.length && production ? "Remove these from the server’s .env: they point the site at stand-ins or let it read private addresses." : undefined });

  // Domains and AI
  add({ id: "registrar", group: "Domains & AI", title: "Selling domains (VERCEL_API_TOKEN)", state: registrarConfigured() ? "ok" : "warn", detail: registrarConfigured() ? "Customers can search, buy and renew domains." : "Off: customers can still connect domains they own.", fix: registrarConfigured() ? undefined : "Create a Vercel account, add a payment method, and create an API token. Vercel is only the registrar." });
  add({ id: "ai", group: "Domains & AI", title: "AI assistant (ANTHROPIC_API_KEY)", state: platformAiConfigured() ? "ok" : "warn", detail: platformAiConfigured() ? `On, with a daily limit of $${process.env.AI_DAILY_BUDGET_USD ?? 25}.` : "Off: customers can still add their own key.", fix: platformAiConfigured() ? undefined : "Create a key at platform.claude.com." });
  add({ id: "approval", group: "Domains & AI", title: "Template approval", state: process.env.TEMPLATES_REQUIRE_APPROVAL === "false" ? "warn" : "ok", detail: process.env.TEMPLATES_REQUIRE_APPROVAL === "false" ? "Off: customers see every template, approved or not." : "On: customers see only templates you’ve approved." });

  // Legal pages and calls
  add({ id: "legal", group: "Legal & calls", title: "Privacy policy and terms (LEGAL_NAME, LEGAL_COUNTRY)", state: legalConfigured() ? "ok" : "todo", detail: legalConfigured() ? `Run by ${legal.name}, under the law of ${legal.country}.` : "The /privacy and /terms pages show a draft notice until these are set.", fix: legalConfigured() ? "Read both pages once more before launch; they’re a starting point, not legal advice." : "Set LEGAL_NAME (you, or your company) and LEGAL_COUNTRY, then read /privacy and /terms." });
  add({ id: "booking", group: "Legal & calls", title: "Book a free call (BOOKING_URL)", state: bookingUrl() ? "ok" : "warn", detail: bookingUrl() ? `“Book a free call” opens ${bookingUrl()}.${bookingWebhookConfigured() ? " Bookings are listed in the console." : ""}` : "Not set: “Book a free call” opens the contact page.", fix: bookingUrl() ? (bookingWebhookConfigured() ? undefined : "Optional: add a Cal.com webhook to /api/webhooks/calcom with CALCOM_WEBHOOK_SECRET to list bookings in the console.") : "Create a free Cal.com account with a 20-minute event and set BOOKING_URL to its link (https://cal.com/you/free-call)." });
  return checks;
}
