// The Investigator: every plan, any schedule (custom days), the free first check, then paid checks, settings UI, a check in "ask me first" and "automatic" modes,
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
await page.getByText("Basic, free").first().waitFor();
const userId = sql(`SELECT id FROM app_users WHERE provider_account_id = '${account}'`);
const content = { name: "Ada Okafor", professional_title: "Staff Engineer", tagline: "Calm infrastructure.", summary: ["I make payment systems boring."], experience: [{ job_title: "Staff Engineer", company: "Northwind Pay", start_date: "2021", end_date: "Present" }], highlights: [], projects: [] };
log("portfolio saved:", (await api("/api/portfolios/brief", "PUT", { content, theme: null, baseVersion: null })).status, "| published:", (await api("/api/portfolios/brief/publish", "POST", { slug: "ada-investigator" })).status);
const links = [{ kind: "linkedin", value: "ada-okafor-test" }, { kind: "website", value: "http://localhost:4010/spa/ada" }, { kind: "feed", value: "http://localhost:4010/feeds/demo.xml" }, { kind: "github", value: "ada" }];

// 1) Free Basic: any schedule, and the first check is on us.
log("links without confirming they're yours refused:", (await api("/api/investigator", "PUT", { links, ownProfiles: false })).body.error);
log("basic: custom 0 days refused:", (await api("/api/investigator", "PUT", { links, ownProfiles: true, frequency: "custom", customDays: 0 })).body.error);
log("basic: daily allowed:", (await api("/api/investigator", "PUT", { links, ownProfiles: true, enabled: true, frequency: "daily" })).body.settings?.frequency);
await api("/api/investigator", "PUT", { enabled: false, frequency: "monthly" });
const access = (await api("/api/investigator")).body.access;
log("first check is free:", access.freeCheckAvailable, access.paysWith);
const creditsBefore = sql(`SELECT credits FROM app_users WHERE id = '${userId}'`);
const freeRun = await api("/api/investigator/run", "POST");
log("free check:", freeRun.status, `found ${freeRun.body.found}`, "| credits unchanged:", sql(`SELECT credits FROM app_users WHERE id = '${userId}'`) === creditsBefore, "| AI spend recorded:", Number(sql("SELECT COALESCE(SUM(micro_usd), 0) FROM ai_spend")) > 0);
log("after it, checks are paid:", (await api("/api/investigator")).body.access.paysWith, "| second check within 12h refused:", (await api("/api/investigator/run", "POST")).status);
sql(`DELETE FROM profile_suggestions WHERE owner_id = '${userId}'`);
sql(`UPDATE investigator_runs SET started_at = started_at - INTERVAL '13 hours' WHERE owner_id = '${userId}'`);

// 2) Still on Basic: set it up in the page, "ask me first", check now (paid from credits).
sql(`UPDATE investigator_settings SET links = '[]', last_run_at = NULL WHERE owner_id = '${userId}'`);
await page.goto(`${BASE}/account/investigator`);
await page.getByRole("heading", { name: "Your profiles" }).waitFor();
log("every schedule offered:", await page.getByRole("radio", { name: /Every day/ }).isEnabled(), await page.getByRole("radio", { name: "Custom" }).isVisible(), "| cost shown:", await page.getByText(/costs about 20–60 credits/).first().isVisible());
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
log("check result:", await page.getByText(/^Done:/).textContent(), "| paid from credits:", sql(`SELECT count(*) FROM credit_ledger WHERE owner_id = '${userId}' AND reason = 'Investigator check'`) !== "0");
log("suggestions waiting:", sql(`SELECT string_agg(title, ' | ' ORDER BY title) FROM profile_suggestions WHERE owner_id = '${userId}' AND source = 'investigator' AND status = 'pending'`));
log("left out: low confidence, old post, other Ada, 2019 award:", sql(`SELECT count(*) FROM profile_suggestions WHERE owner_id = '${userId}' AND (title LIKE '%different person%' OR title LIKE '%years ago%' OR title LIKE '%RustConf%' OR title LIKE '%Excellence Award%')`) === "0");
log("unconfirmable source kept but not confident:", sql(`SELECT count(*) FROM profile_suggestions WHERE owner_id = '${userId}' AND title LIKE '%Platform Weekly%' AND status = 'pending'`) === "1");
const mockLog = await (await fetch("http://localhost:4010/__log")).json();
log("own page read first, JS content seen:", mockLog.filter((line) => line.startsWith("INVESTIGATOR already-read")).pop(), `(browser: ${Boolean(process.env.OBSCURA_URL)})`);
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

// 6) A custom schedule: every 10 days.
log("custom 10 days:", (await api("/api/investigator", "PUT", { frequency: "custom", customDays: 10, enabled: true })).body.settings?.customDays);
sql(`UPDATE investigator_settings SET next_run_at = NOW() - INTERVAL '1 minute' WHERE owner_id = '${userId}'`);
sql(`UPDATE investigator_runs SET started_at = started_at - INTERVAL '13 hours' WHERE owner_id = '${userId}'`);
await fetch(`${BASE}/api/cron`, { method: "POST", headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
log("next check in ~10 days:", sql(`SELECT (next_run_at BETWEEN NOW() + INTERVAL '9 days' AND NOW() + INTERVAL '11 days')::text FROM investigator_settings WHERE owner_id = '${userId}'`));

// 7) Feeds can't be pointed at our own network (checked without the test override).
const ssrf = execSync(`cd ${new URL("../..", import.meta.url).pathname} && INVESTIGATOR_ALLOW_PRIVATE_FETCH= npx tsx -e 'import { safeFetchText } from "./lib/investigator/feeds"; Promise.all(["http://127.0.0.1:4010/feeds/demo.xml", "http://localhost:5432", "http://169.254.169.254/latest/meta-data", "http://10.0.0.5/"].map((url) => safeFetchText(url).then(() => "FETCHED " + url, (error) => "refused"))).then((r) => console.log(r.join(",")))'`).toString().trim();
log("private addresses refused:", ssrf);

console.log("page errors:", errors.length ? errors : "none");
await browser.close();
