// The Investigator: plan rules, settings UI, a check in "ask me first" and "automatic" modes,
// what goes live, the email, undo, the hourly schedule, and the safety rules for feeds.
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { encode } from "../../node_modules/@auth/core/jwt.js";

const BASE = process.env.BASE ?? "http://localhost:3100";
const S = process.env.S ?? new URL("./.out", import.meta.url).pathname;
const log = (...args) => console.log("•", ...args);
const sql = (query) => execSync(`su postgres -c "psql -d formora -At -c \\"${query.replace(/"/g, '\\\\\\"')}\\""`).toString().trim();
const serverLog = () => readFileSync(`${S}/server.log`, "utf8");
const account = "google-investigator";
const errors = [];

sql(`DELETE FROM app_users WHERE provider_account_id = '${account}'`);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
await context.addCookies([{ name: "authjs.session-token", value: await encode({ token: { name: "Ada Okafor", email: "ada.investigator@example.com", providerAccountId: account }, secret: process.env.AUTH_SECRET, salt: "authjs.session-token" }), url: BASE }]);
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(error.message));
const api = (path, method = "GET", data) => page.request.fetch(`${BASE}${path}`, { method, data, headers: data ? { "Content-Type": "application/json" } : undefined, timeout: 120000 }).then(async (response) => ({ status: response.status(), body: await response.json().catch(() => ({})) }));

// A published portfolio to keep up to date.
await page.goto(`${BASE}/account`);
await page.getByText("Free trial").first().waitFor();
const userId = sql(`SELECT id FROM app_users WHERE provider_account_id = '${account}'`);
const content = { name: "Ada Okafor", professional_title: "Staff Engineer", tagline: "Calm infrastructure.", summary: ["I make payment systems boring."], experience: [{ job_title: "Staff Engineer", company: "Northwind Pay", start_date: "2021", end_date: "Present" }], highlights: [], projects: [] };
log("portfolio saved:", (await api("/api/portfolios/brief", "PUT", { content, theme: null, baseVersion: null })).status, "| published:", (await api("/api/portfolios/brief/publish", "POST", { slug: "ada-investigator" })).status);
const links = [{ kind: "linkedin", value: "ada-okafor-test" }, { kind: "website", value: "https://ada.example.org" }, { kind: "feed", value: "http://localhost:4010/feeds/demo.xml" }, { kind: "github", value: "ada" }];

// 1) Plans: Basic has no Investigator; the trial gets one free check.
sql(`UPDATE app_users SET plan = 'basic', plan_expires_at = NOW() + INTERVAL '1 year' WHERE id = '${userId}'`);
log("basic: switching on refused:", (await api("/api/investigator", "PUT", { links, ownProfiles: true, enabled: true, frequency: "monthly" })).body.error);
log("basic: check refused:", (await api("/api/investigator/run", "POST")).status);
sql(`UPDATE app_users SET plan = 'trial', trial_ends_at = NOW() + INTERVAL '10 days', plan_expires_at = NULL WHERE id = '${userId}'`);
log("links without confirming they're yours refused:", (await api("/api/investigator", "PUT", { links, ownProfiles: false })).body.error);
log("trial: save links:", (await api("/api/investigator", "PUT", { links, ownProfiles: true })).status);
const trialRun = await api("/api/investigator/run", "POST");
log("trial: free check:", trialRun.status, `found ${trialRun.body.found}`, "| second check:", (await api("/api/investigator/run", "POST")).status);
sql(`DELETE FROM profile_suggestions WHERE owner_id = '${userId}'`);
sql(`DELETE FROM investigator_runs WHERE owner_id = '${userId}'`);

// 2) Pro: set it up in the page, "ask me first", check now.
sql(`UPDATE app_users SET plan = 'pro', plan_expires_at = NOW() + INTERVAL '1 year' WHERE id = '${userId}'`);
sql(`UPDATE investigator_settings SET links = '[]', last_run_at = NULL WHERE owner_id = '${userId}'`);
await page.goto(`${BASE}/account/investigator`);
await page.getByRole("heading", { name: "Your profiles" }).waitFor();
log("pro: daily locked:", await page.getByRole("radio", { name: /Every day/ }).isDisabled(), "| monthly allowed:", !(await page.getByRole("radio", { name: /Every month/ }).isDisabled()));
for (const [index, link] of links.entries()) {
  if (index > 0) await page.getByRole("button", { name: "Add a profile" }).click();
  await page.getByLabel("Profile type").nth(index).selectOption(link.kind);
  await page.locator("input[aria-label$='link or username']").nth(index).fill(link.value);
}
log("limited-profile note shown:", await page.getByText("we never log in as you").isVisible());
await page.getByRole("checkbox").check();
await page.getByRole("radio", { name: /Every month/ }).click();
await page.getByRole("radio", { name: /Ask me first/ }).click();
await page.getByRole("switch").click();
await page.getByText(/Saved\. Next check/).waitFor();
log("switched on:", sql(`SELECT enabled || ' ' || frequency || ' ' || mode || ' next≈now:' || (next_run_at < NOW() + INTERVAL '5 minutes') FROM investigator_settings WHERE owner_id = '${userId}'`));
await page.getByRole("button", { name: "Check now" }).click();
await page.getByText(/^Done:/).waitFor({ timeout: 120000 });
log("check result:", await page.getByText(/^Done:/).textContent());
log("suggestions waiting:", sql(`SELECT string_agg(title, ' | ' ORDER BY title) FROM profile_suggestions WHERE owner_id = '${userId}' AND source = 'investigator' AND status = 'pending'`));
log("low-confidence and old items left out:", !sql(`SELECT count(*) FROM profile_suggestions WHERE owner_id = '${userId}' AND (title LIKE '%different person%' OR title LIKE '%years ago%')`).startsWith("1"));
log("AI used web_fetch + web_search:", (await (await fetch("http://localhost:4010/__log")).json()).some((line) => line.includes("INVESTIGATOR tools=web_fetch_20260209,web_search_20260209")));
await page.getByText("Sources checked").first().click();
log("sources reported:", (await page.locator("details li").allTextContents()).map((text) => text.replace(/\s+/g, " ").trim()).join(" / "));
log("site unchanged in ask mode:", !(await (await fetch(`${BASE}/p/ada-investigator`)).text()).includes("Head of Platform"));
log("email sent:", serverLog().includes("The Investigator found"));
log("second check within 12h refused:", (await api("/api/investigator/run", "POST")).status);

// 3) Automatic mode: confident updates go live, less certain ones wait; undo puts it back.
sql(`DELETE FROM profile_suggestions WHERE owner_id = '${userId}'`);
sql(`UPDATE investigator_runs SET started_at = started_at - INTERVAL '13 hours' WHERE owner_id = '${userId}'`);
sql(`UPDATE investigator_settings SET last_run_at = NULL WHERE owner_id = '${userId}'`);
await page.reload();
await page.getByRole("radio", { name: /Update my website automatically/ }).click();
await page.getByRole("button", { name: "Check now" }).click();
await page.getByText(/^Done:/).waitFor({ timeout: 120000 });
log("auto check:", await page.getByText(/^Done:/).textContent());
const live = await (await fetch(`${BASE}/p/ada-investigator`)).text();
log("live site now shows new role:", live.includes("Head of Platform"), "| feed post:", live.includes("Why calm on-call wins"), "| medium-confidence talk not live:", !live.includes("DevConf Dubai"));
log("previous role closed:", sql(`SELECT content->'experience'->1->>'end_date' FROM portfolios WHERE owner_id = '${userId}' AND template_id = 'brief'`));
log("waiting for review:", sql(`SELECT string_agg(title, ' | ') FROM profile_suggestions WHERE owner_id = '${userId}' AND status = 'pending'`));
log("email says website updated:", serverLog().includes("Your website is up to date"));
page.once("dialog", (dialog) => dialog.accept());
await page.getByRole("button", { name: "Undo these changes" }).first().click();
await page.getByText("Undone.").waitFor();
const after = await (await fetch(`${BASE}/p/ada-investigator`)).text();
log("after undo: role gone from live site:", !after.includes("Head of Platform"), "| draft restored:", sql(`SELECT content->'experience'->0->>'job_title' FROM portfolios WHERE owner_id = '${userId}' AND template_id = 'brief'`), "| updates back to review:", sql(`SELECT count(*) FROM profile_suggestions WHERE owner_id = '${userId}' AND status = 'pending'`));
log("undo twice refused:", (await api(`/api/investigator/runs/${sql(`SELECT id FROM investigator_runs WHERE owner_id = '${userId}' AND undone_at IS NOT NULL LIMIT 1`)}/undo`, "POST")).status);

// 4) Editor shows them, labelled.
await page.goto(`${BASE}/editor/brief`);
await page.getByRole("tab", { name: "AI" }).click();
await page.getByText("Found by the Investigator").first().waitFor({ timeout: 15000 }).catch(() => undefined);
log("editor AI tab: Investigator card:", await page.getByRole("link", { name: /The Investigator/ }).isVisible(), "| labelled updates:", await page.getByText("Found by the Investigator").count());

// 5) The hourly schedule runs due checks.
sql(`DELETE FROM profile_suggestions WHERE owner_id = '${userId}'`);
sql(`UPDATE investigator_settings SET next_run_at = NOW() - INTERVAL '1 minute', last_run_at = NULL WHERE owner_id = '${userId}'`);
const cron = await fetch(`${BASE}/api/cron`, { method: "POST", headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } }).then((response) => response.json());
log("cron:", JSON.stringify(cron.investigator), "| next check in ~30 days:", sql(`SELECT (next_run_at > NOW() + INTERVAL '29 days')::text FROM investigator_settings WHERE owner_id = '${userId}'`));

// 6) Premium can check daily; plan rules are enforced on the server too.
log("pro: daily via API refused:", (await api("/api/investigator", "PUT", { frequency: "daily", enabled: true })).status);
sql(`UPDATE app_users SET plan = 'premium' WHERE id = '${userId}'`);
log("premium: daily allowed:", (await api("/api/investigator", "PUT", { frequency: "daily", enabled: true })).body.settings?.frequency);

// 7) Feeds can't be pointed at our own network (checked without the test override).
const ssrf = execSync(`cd ${new URL("../..", import.meta.url).pathname} && INVESTIGATOR_ALLOW_PRIVATE_FETCH= npx tsx -e 'import { safeFetchText } from "./lib/investigator/feeds"; Promise.all(["http://127.0.0.1:4010/feeds/demo.xml", "http://localhost:5432", "http://169.254.169.254/latest/meta-data", "http://10.0.0.5/"].map((url) => safeFetchText(url).then(() => "FETCHED " + url, (error) => "refused"))).then((r) => console.log(r.join(",")))'`).toString().trim();
log("private addresses refused:", ssrf);

console.log("page errors:", errors.length ? errors : "none");
await browser.close();
