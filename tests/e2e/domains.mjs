import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { zipSync, strToU8 } from "../../node_modules/fflate/esm/index.mjs";
import Stripe from "../../node_modules/stripe/esm/stripe.esm.node.js";
import { encode } from "../../node_modules/@auth/core/jwt.js";

const BASE = "http://localhost:3100";
const S = process.env.S ?? new URL("./.out", import.meta.url).pathname;
const log = (...args) => console.log("•", ...args);
const sql = (query) => execSync(`su postgres -c "psql -d formora -At -c \\"${query}\\""`).toString().trim();
// Start from a clean account so the run can be repeated.
sql("DELETE FROM app_users WHERE provider_account_id = 'google-test-1'");
const mockLog = async () => (await fetch("http://localhost:4010/__log")).json();
// The mock keeps its log across runs; only look at what this run adds.
const logStart = (await mockLog()).length;

const token = await encode({ token: { name: "Ada Lovelace", email: "ada@example.com", providerAccountId: "google-test-1" }, secret: process.env.AUTH_SECRET, salt: "authjs.session-token" });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addCookies([{ name: "authjs.session-token", value: token, url: BASE }]);
const errors = [];
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(error.message));
await page.goto(`${BASE}/editor/template-one`);
await page.getByText("Saved to your account").waitFor({ timeout: 15000 });

// --- GitHub import
await page.getByRole("button", { name: /^GitHub/ }).click();
await page.getByLabel("GitHub username").fill("https://github.com/ada");
await page.getByRole("button", { name: "Import", exact: true }).click();
await page.getByText(/Imported from GitHub/).waitFor({ timeout: 10000 });
log("github message:", await page.getByText(/Imported from GitHub/).textContent());
const projectNames = await page.locator('[data-editor-field="projects"]').locator("xpath=..").locator('label:has-text("Project name") input').evaluateAll((inputs) => inputs.map((input) => input.value));
log("projects after GitHub import (fork excluded):", projectNames.join(" | "));
await page.getByRole("button", { name: /^GitHub/ }).click();
await page.getByLabel("GitHub username").fill("nobody");
await page.getByRole("button", { name: "Import", exact: true }).click();
await page.getByText("No GitHub account has that username.").waitFor({ timeout: 10000 });
log("unknown GitHub user handled");

// --- LinkedIn export import (with a "Notes" preamble and multi-line quoted summary, like real exports)
const zip = zipSync({
  "Profile.csv": strToU8('First Name,Last Name,Maiden Name,Address,Birth Date,Headline,Summary,Industry,Zip Code,Geo Location,Twitter Handles,Websites,Instant Messengers\nAda,Lovelace,,,,"Mathematician, Writer","First paragraph about engines.\n\nSecond paragraph, with ""quotes"".",Research,,"London, UK",,[PORTFOLIO:https://github.com/ada],\n'),
  "Positions.csv": strToU8('Company Name,Title,Description,Location,Started On,Finished On\nAnalytical Society,Lead Programmer,"Wrote the first published algorithm.",London,Jan 1842,Dec 1843\nBabbage & Co,Translator,,London,1840,\n'),
  "Skills.csv": strToU8("Name\nMathematics\nAlgorithms\nPoetry\n"),
  "Connections.csv": strToU8("Notes:\nignored\n"),
});
writeFileSync(`${S}/linkedin.zip`, zip);
await page.getByRole("button", { name: /^LinkedIn/ }).click();
await page.locator('input[accept=".zip,.csv"]').setInputFiles(`${S}/linkedin.zip`);
await page.getByText(/Imported from LinkedIn/).waitFor({ timeout: 10000 });
log("linkedin message:", await page.getByText(/Imported from LinkedIn/).textContent());
log("title from headline:", await page.locator('[data-editor-field="professional-title"]').inputValue());
log("bio paragraphs:", await page.locator('textarea[data-editor-field="about-you"]').inputValue(), "/ total paragraphs:", await page.getByText(/^About you \d/).count());
await page.getByRole("button", { name: "Undo" }).click();
await page.waitForTimeout(300);
log("undo restores GitHub-import name & tagline title:", await page.locator('[data-editor-field="professional-title"]').inputValue() !== "Mathematician, Writer");
await page.getByRole("button", { name: "Undo" }).click(); // keep LinkedIn version for the rest? redo not available; re-import instead
await page.locator('input[accept=".zip,.csv"]').setInputFiles(`${S}/linkedin.zip`).catch(async () => {
  await page.getByRole("button", { name: /^LinkedIn/ }).click();
  await page.locator('input[accept=".zip,.csv"]').setInputFiles(`${S}/linkedin.zip`);
});
await page.getByText("Saved to your account").waitFor({ timeout: 10000 });
await page.waitForTimeout(2000);

// --- Paste-with-Claude requires sign-in + key; without a key it isn't offered
await page.getByRole("button", { name: /Paste anything/ }).click();
log("paste option without AI key shows sign-in/unavailable note:", await page.getByText(/to let Claude turn pasted text/).isVisible());
await page.keyboard.press("Escape");


// --- Publish, then buy a domain
await page.getByRole("button", { name: /Publish/ }).click();
await page.getByPlaceholder("your-name").fill("ada-lovelace");
await page.getByRole("button", { name: "Publish portfolio" }).click();
await page.getByText("Visitors see your latest version").waitFor({ timeout: 10000 });
await page.getByRole("button", { name: "Get a domain" }).click();
await page.getByRole("button", { name: /\/yr$/ }).first().waitFor({ timeout: 10000 });
const offers = await page.locator("li").evaluateAll((items) => items.map((item) => item.textContent));
log("domain offers:", offers.join(" · "));
await page.getByRole("button", { name: /\/yr$/ }).first().click();
await page.getByLabel("Phone").fill("07700900123");
await page.getByLabel("Street address").fill("12 St James's Square");
await page.getByLabel("City").fill("London");
await page.getByLabel("Postcode").fill("SW1Y 4LB");
await page.getByLabel("Country").selectOption("GB");
await page.getByRole("button", { name: "Continue to payment" }).click();
await page.getByText(/country code/).waitFor({ timeout: 5000 });
log("bad phone rejected:", await page.getByText(/country code/).textContent());
await page.getByLabel("Phone").fill("+44 7700 900123");
await page.getByRole("button", { name: "Continue to payment" }).click();
await page.waitForURL(/fake-stripe-checkout/, { timeout: 10000 });
log("redirected to Stripe checkout");
const [orderId, domain, charged, status] = sql("SELECT id, domain, charged_cents, status FROM domain_orders ORDER BY created_at DESC LIMIT 1").split("|");
log("order:", domain, "charged", charged, "cents, status", status);

// Webhook with a bad signature is refused; a correctly signed one fulfils the order exactly once.
const payload = JSON.stringify({ id: "evt_1", object: "event", type: "checkout.session.completed", data: { object: { id: "cs_test", object: "checkout.session", payment_status: "paid", payment_intent: "pi_123", metadata: { orderId } } } });
const bad = await fetch(`${BASE}/api/webhooks/stripe`, { method: "POST", headers: { "stripe-signature": "t=1,v1=bad" }, body: payload });
log("forged webhook status:", bad.status);
writeFileSync(new URL("./records.json", import.meta.url), JSON.stringify({ A: {} })); // nothing resolves until the test says so
const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_test" });
for (let i = 0; i < 2; i += 1) await fetch(`${BASE}/api/webhooks/stripe`, { method: "POST", headers: { "stripe-signature": header, "content-type": "application/json" }, body: payload });
const buys = (await mockLog()).slice(logStart).filter((line) => line.startsWith("BUY"));
log("registrar purchases after duplicate webhook:", buys.length, "|", buys[0]);
log("contact details wiped after purchase:", sql(`SELECT contact IS NULL FROM domain_orders WHERE id='${orderId}'`));

// Return from checkout: dialog reopens and shows progress; registration completes on the next check.
await page.goto(`${BASE}/editor/template-one?domainOrder=${orderId}`);
await page.getByText(domain, { exact: true }).waitFor({ timeout: 15000 });
log("dialog reopened with domain, url cleaned:", page.url());
log("DNS records set on the bought domain:", (await mockLog()).slice(logStart).filter((line) => line.startsWith("DNS")).join(" ; "));
writeFileSync(new URL("./records.json", import.meta.url), JSON.stringify({ A: { [domain]: "127.0.0.1", [`www.${domain}`]: "127.0.0.1" } }));
await page.getByRole("button", { name: "Check again" }).click();
await page.getByText("Live", { exact: true }).waitFor({ timeout: 15000 });
log("order status:", sql(`SELECT status FROM domain_orders WHERE id='${orderId}'`));
await page.screenshot({ path: `${S}/shots/domain-live.png` });

sql(`SELECT 1`);
// The custom domain serves the published portfolio without the Formora site chrome.
const html = execSync(`curl -s -H "Host: ${domain}" ${BASE}/`).toString();
const wwwHtml = execSync(`curl -s -H "Host: www.${domain}" ${BASE}/`).toString();
log("custom domain serves portfolio:", html.includes("Ada Lovelace"), "| www too:", wwwHtml.includes("Ada Lovelace"), "| no app header:", !html.includes("Sign in"), "| canonical:", html.match(/rel="canonical" href="([^"]+)"/)?.[1]);
log("unknown host → 404:", execSync(`curl -s -o /dev/null -w "%{http_code}" -H "Host: stranger.example" ${BASE}/`).toString());
log("app host unaffected:", execSync(`curl -s -o /dev/null -w "%{http_code}" ${BASE}/templatechooser`).toString());

// --- Failed registration is refunded automatically
const failOrder = sql(`INSERT INTO domain_orders (owner_id, template_id, domain, registrar_price, charged_cents, contact) SELECT owner_id, 'kinetic-portfolio', 'fail-ada.com', 12, 1800, '{}' FROM portfolios LIMIT 1 RETURNING id`).split("\n")[0];
sql(`INSERT INTO portfolios (owner_id, template_id, content) SELECT owner_id, 'kinetic-portfolio', '{}' FROM portfolios WHERE template_id='template-one' ON CONFLICT DO NOTHING`);
const failPayload = JSON.stringify({ id: "evt_2", object: "event", type: "checkout.session.completed", data: { object: { id: "cs_2", object: "checkout.session", payment_status: "paid", payment_intent: "pi_fail", metadata: { orderId: failOrder } } } });
await fetch(`${BASE}/api/webhooks/stripe`, { method: "POST", headers: { "stripe-signature": Stripe.webhooks.generateTestHeaderString({ payload: failPayload, secret: "whsec_test" }) }, body: failPayload });
log("failed purchase:", sql(`SELECT status FROM domain_orders WHERE id='${failOrder}'`), "| refund issued:", (await mockLog()).includes("REFUND pi_fail"), "| domain released:", sql("SELECT count(*) FROM custom_domains WHERE domain='fail-ada.com'") === "0");

// --- Connecting an owned domain: free plan refused, Pro allowed with DNS instructions
const api = context.request;
const free = await api.post(`${BASE}/api/domains/kinetic-portfolio`, { data: { domain: "me.ada-needs-txt.org" } });
log("free plan connect:", free.status(), (await free.json()).error);
sql("UPDATE app_users SET plan='pro'");
const pro = await api.post(`${BASE}/api/domains/kinetic-portfolio`, { data: { domain: "https://Me.Ada-Needs-Txt.org/path" } });
const proBody = await pro.json();
log("pro connect:", pro.status(), proBody.domain?.domain, proBody.domain?.status, JSON.stringify(proBody.domain?.records));
log("same domain on another portfolio:", (await api.post(`${BASE}/api/domains/template-one`, { data: { domain: "me.ada-needs-txt.org" } })).status());
log("invalid domain:", (await api.post(`${BASE}/api/domains/kinetic-portfolio`, { data: { domain: "not a domain" } })).status());
log("disconnect:", (await api.delete(`${BASE}/api/domains/kinetic-portfolio`)).status(), sql("SELECT count(*) FROM custom_domains WHERE domain='me.ada-needs-txt.org'"));
sql("UPDATE app_users SET plan='free'");

console.log("page errors:", errors.length ? errors : "none");
await browser.close();
