// The superadmin console: secret address, its own sign-in, the dashboard's figures and charts,
// the users list, and cookie-less visitor counting.
// Start the server with SUPERADMIN_PATH=/hq-e2e (see README).
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { encode } from "../../node_modules/@auth/core/jwt.js";

const BASE = process.env.BASE ?? "http://localhost:3100";
const CONSOLE = process.env.SUPERADMIN_PATH ?? "/hq-e2e";
const ROOT = new URL("../..", import.meta.url).pathname;
const log = (...args) => console.log("•", ...args);
const sql = (query) => execSync(`su postgres -c "psql -d formora -At -c \\"${query.replace(/"/g, '\\\\\\"')}\\""`).toString().trim();
const errors = [];
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
const visit = (path, ip, ua = UA, referrer = null) => fetch(`${BASE}/api/t`, { method: "POST", body: JSON.stringify({ path, referrer }), headers: { "Content-Type": "text/plain", "User-Agent": ua, "X-Forwarded-For": ip } });

// Data: the superadmin, a paying customer and a few visits.
sql("DELETE FROM app_users WHERE lower(email) IN ('owner@company.test', 'paying@console.test')");
sql("DELETE FROM page_views WHERE path LIKE '/console-test%'");
execSync(`printf 'A calm long passphrase 42\\nA calm long passphrase 42\\n' | node scripts/create-superadmin.mjs --email owner@company.test --name "Site Owner"`, { cwd: ROOT });
const customer = sql("INSERT INTO app_users (provider, provider_account_id, email, name, plan, plan_expires_at) VALUES ('google', 'google-console-paying', 'paying@console.test', 'Paying Person', 'pro', NOW() + INTERVAL '1 year') RETURNING id").split("\n")[0];
sql(`INSERT INTO billing_orders (owner_id, kind, plan, term_years, amount_cents, status, paid_at) VALUES ('${customer}', 'plan', 'pro', 1, 2400, 'paid', NOW())`);
const statuses = [];
for (const [path, ip, ua, referrer] of [["/console-test-pricing", "203.0.113.1"], ["/console-test-pricing", "203.0.113.2", UA, "https://www.linkedin.com/feed/"], ["/console-test-pricing", "203.0.113.1"], ["/console-test-gallery", "203.0.113.3"], ["/console-test-pricing", "203.0.113.9", "Googlebot/2.1"], ["/admin", "203.0.113.4"], [`${CONSOLE}/users`, "203.0.113.5"], ["/p/console-test-portfolio", "203.0.113.6"]]) {
  statuses.push((await visit(path, ip, ua, referrer)).status);
}
log("beacon always answers 204:", statuses.every((status) => status === 204));
log("visits stored (bot, admin and console skipped):", sql("SELECT string_agg(path || '=' || n || ' views/' || v || ' visitors', ', ' ORDER BY path) FROM (SELECT path, count(*) n, count(DISTINCT visitor) v FROM page_views WHERE path LIKE '/console-test%' OR path LIKE '/p/console-test%' GROUP BY path) x"), "| /admin or console counted:", sql(`SELECT count(*) FROM page_views WHERE path = '/admin' OR path LIKE '${CONSOLE}%'`));
log("no IP addresses stored:", !sql("SELECT string_agg(visitor || coalesce(referrer, ''), ',') FROM page_views").includes("203.0.113"), "| referrer kept as host:", sql("SELECT string_agg(DISTINCT referrer, ',') FROM page_views WHERE path = '/console-test-pricing' AND referrer IS NOT NULL"));
log("portfolio visit counted for its slug:", sql("SELECT kind || ':' || portfolio_slug FROM page_views WHERE path = '/p/console-test-portfolio'"));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
// A real (non-automated) visitor: the beacon in the page counts the view.
const human = await (await browser.newContext({ userAgent: UA })).newPage();
await human.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
await human.goto(`${BASE}/pricing`);
await human.waitForTimeout(1500);
log("page beacon counted /pricing:", Number(sql("SELECT count(*) FROM page_views WHERE path = '/pricing' AND at > NOW() - INTERVAL '1 minute'")) >= 1);
const robot = await (await browser.newContext()).newPage();
await robot.goto(`${BASE}/about`);
await robot.waitForTimeout(1500);
log("automated browser not counted:", sql("SELECT count(*) FROM page_views WHERE path = '/about' AND at > NOW() - INTERVAL '1 minute'") === "0");

// The console's address.
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
page.on("pageerror", (error) => errors.push(error.message));
log("/console itself is hidden:", (await page.goto(`${BASE}/console`)).status(), "| secret address:", (await page.goto(`${BASE}${CONSOLE}`)).status(), "| not indexed:", (await page.request.get(`${BASE}${CONSOLE}`)).headers()["x-robots-tag"]);
log("shows the console sign-in, no site header:", await page.getByRole("button", { name: "Sign in to the console" }).isVisible(), !(await page.getByRole("link", { name: "Pricing" }).count()));

// Wrong password, then a customer, then the superadmin.
await page.getByLabel("Email").fill("owner@company.test");
await page.getByLabel("Password").fill("wrong password entirely");
await page.getByRole("button", { name: "Sign in to the console" }).click();
log("wrong password:", (await page.getByText(/^That didn’t work/).textContent())?.slice(0, 40));
const customerPage = await (await browser.newContext()).newPage();
await customerPage.context().addCookies([{ name: "authjs.session-token", value: await encode({ token: { name: "Paying Person", email: "paying@console.test", providerAccountId: "google-console-paying", provider: "google" }, secret: process.env.AUTH_SECRET, salt: "authjs.session-token" }), url: BASE }]);
await customerPage.goto(`${BASE}${CONSOLE}`);
log("signed-in customer sees only the sign-in:", await customerPage.getByRole("button", { name: "Sign in to the console" }).isVisible(), "| no dashboard:", !(await customerPage.getByText("How the business is doing").count()));
// A forged token claiming console powers for a non-superadmin is still refused.
await customerPage.context().addCookies([{ name: "authjs.session-token", value: await encode({ token: { name: "Paying Person", email: "paying@console.test", providerAccountId: "google-console-paying", provider: "google", console: true }, secret: process.env.AUTH_SECRET, salt: "authjs.session-token" }), url: BASE }]);
await customerPage.goto(`${BASE}${CONSOLE}`);
log("console flag without superadmin role refused:", !(await customerPage.getByText("How the business is doing").count()));

await page.getByLabel("Password").fill("A calm long passphrase 42");
await page.getByRole("button", { name: "Sign in to the console" }).click();
await page.getByText("How the business is doing").waitFor({ timeout: 30000 });
const tile = async (label) => (await page.locator("div", { has: page.getByText(label, { exact: true }) }).last().locator("p").nth(1).textContent())?.trim();
log("revenue tile:", await page.getByText(/^Revenue, last 30 days$/).locator("..").locator("p").nth(1).textContent(), "| paying subscribers:", await tile("Paying subscribers"));
log("charts drawn:", await page.locator("svg[aria-label='Revenue by source']").count(), await page.locator("svg[aria-label='Visitors and page views']").count(), await page.locator("svg[aria-label='New sign-ups']").count());
await page.locator("svg[aria-label='Revenue by source'] rect[fill='transparent']").last().hover();
log("hover tooltip:", (await page.locator("div.pointer-events-none").first().textContent())?.replace(/\s+/g, " ").slice(0, 60));
await page.getByRole("button", { name: "Show table" }).first().click();
log("table view:", await page.locator("table").first().locator("th").allTextContents());
log("top pages lists the test page:", await page.getByText("/console-test-pricing").isVisible(), "| referrer:", await page.getByText("linkedin.com").first().isVisible());
await page.getByRole("link", { name: "12 months" }).click();
await page.waitForURL(/range=12m/);
log("12 months, weekly:", await page.getByText(/Per week/).first().isVisible());

// Users list and search.
await page.getByRole("link", { name: "Users", exact: true }).first().click();
await page.waitForURL(new RegExp(`${CONSOLE}/users`));
await page.getByPlaceholder("Email, name or username").fill("paying@console");
await page.getByRole("button", { name: "Search" }).click();
await page.waitForURL(/q=paying/);
log("user search:", (await page.locator("tbody tr").first().textContent())?.replace(/\s+/g, " ").slice(0, 90));
await page.goto(`${BASE}${CONSOLE}/users?q=owner%40company`);
log("superadmin not listed as a customer:", await page.getByText("No accounts match.").isVisible());

// Admin tools work for the console session; sign out returns to the console sign-in.
log("tools reachable:", (await page.goto(`${BASE}/admin/email`)).status(), (await page.goto(`${BASE}/templates/review`)).status());
await page.goto(`${BASE}${CONSOLE}`);
await page.getByRole("button", { name: "Sign out" }).click();
await page.getByRole("button", { name: "Sign in to the console" }).waitFor();
log("signed out:", page.url().endsWith(CONSOLE), "| email page now:", (await page.goto(`${BASE}/admin/email`)).status());

// Five wrong passwords pause console sign-in, even with the right one afterwards.
await page.goto(`${BASE}${CONSOLE}`);
for (let i = 0; i < 5; i++) {
  await page.getByLabel("Email").fill("owner@company.test");
  await page.getByLabel("Password").fill(`wrong password ${i}`);
  await page.getByRole("button", { name: "Sign in to the console" }).click();
  await page.getByText(/^That didn’t work/).waitFor();
}
await page.getByLabel("Password").fill("A calm long passphrase 42");
await page.getByRole("button", { name: "Sign in to the console" }).click();
await page.waitForTimeout(2000);
log("paused after five wrong passwords:", !(await page.getByText("How the business is doing").count()));

console.log("page errors:", errors.length ? errors : "none");
await browser.close();
