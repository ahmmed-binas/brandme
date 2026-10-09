// Plans (free Basic, Pro yearly/monthly, grace, back to Basic), credits at cost with card fee, own API key, research agent, renewals and emails.
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
const Stripe = createRequire(new URL("../../package.json", import.meta.url))("stripe");
import { encode } from "../../node_modules/@auth/core/jwt.js";

const BASE = process.env.BASE ?? "http://localhost:3300";
const S = process.env.S ?? new URL("./.out", import.meta.url).pathname;
const log = (...args) => console.log("•", ...args);
const sql = (query) => execSync(`su postgres -c "psql -d formora -At -c \\"${query.replace(/"/g, '\\\\\\"')}\\""`).toString().trim();
const stripe = new Stripe("sk_test_123");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const account = "google-billing-ada";
sql(`DELETE FROM app_users WHERE provider_account_id = '${account}'`);
await context.addCookies([{ name: "authjs.session-token", value: await encode({ token: { name: "Ada Billing", email: "ada.billing@example.com", providerAccountId: account }, secret: process.env.AUTH_SECRET, salt: "authjs.session-token" }), url: BASE }]);
const page = await context.newPage();
const api = (path, method = "GET", data) => page.request.fetch(`${BASE}${path}`, { method, data, headers: data ? { "Content-Type": "application/json" } : undefined }).then(async (response) => ({ status: response.status(), body: await response.json().catch(() => ({})) }));
const webhook = async (orderId, intent = "pi_test_1") => {
  const payload = JSON.stringify({ id: `evt_${Date.now()}`, object: "event", type: "checkout.session.completed", data: { object: { id: "cs_x", object: "checkout.session", payment_status: "paid", payment_intent: intent, metadata: { billingOrderId: orderId } } } });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
  return (await fetch(`${BASE}/api/webhooks/stripe`, { method: "POST", body: payload, headers: { "stripe-signature": header, "Content-Type": "application/json" } })).status;
};
const cron = () => fetch(`${BASE}/api/cron`, { method: "POST", headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } }).then((response) => response.json());

// New account: free Basic + welcome credits.
await page.goto(`${BASE}/account`);
await page.getByText("Basic, free").first().waitFor();
const userId = sql(`SELECT id FROM app_users WHERE provider_account_id = '${account}'`);
log("new account:", sql(`SELECT plan || ' / expires ' || COALESCE(plan_expires_at::text, 'never') || ' / credits ' || credits FROM app_users WHERE id = '${userId}'`));
log("welcome ledger:", sql(`SELECT reason || ' ' || delta FROM credit_ledger WHERE owner_id = '${userId}'`));

// AI assistant spends credits (platform key, mock Claude).
const content = { name: "Ada Billing", professional_title: "Engineer", tagline: "Hi", summary: ["I build things."] };
const edit = await api("/api/ai/assist", "POST", { templateId: "terminal", content, instruction: "Tighten my title" });
log("AI edit:", edit.status, "| charged:", edit.body.charged, "| credits now:", edit.body.credits, "| name protected:", edit.body.content?.name);

// Own key: bad key refused, good key saved and used (no credits spent).
log("bad key:", (await api("/api/account/ai-key", "PUT", { key: "sk-ant-api03-wrongwrongwrongwrongwrong" })).body.error);
log("good key:", (await api("/api/account/ai-key", "PUT", { key: "sk-ant-api03-validkeyvalidkeyvalidkey" })).body);
log("stored encrypted:", !sql(`SELECT ai_key_enc FROM app_users WHERE id='${userId}'`).includes("validkey"));
const before = Number(sql(`SELECT credits FROM app_users WHERE id='${userId}'`));
const ownEdit = await api("/api/ai/assist", "POST", { templateId: "terminal", content, instruction: "Tighten my title" });
const usedKey = (await (await fetch("http://localhost:4010/__log")).json()).filter((line) => line.startsWith("CLAUDE-KEY")).at(-1);
log("own-key edit:", ownEdit.status, "| charged:", ownEdit.body.charged, "| credits unchanged:", Number(sql(`SELECT credits FROM app_users WHERE id='${userId}'`)) === before, "|", usedKey);
await api("/api/account/ai-key", "DELETE");

// Out of credits → clear message.
sql(`UPDATE app_users SET credits = 2 WHERE id='${userId}'`);
log("no credits:", (await api("/api/ai/assist", "POST", { templateId: "terminal", content, instruction: "x" })).body.error);
sql(`UPDATE app_users SET credits = 200 WHERE id='${userId}'`);

// Global daily budget stops the platform key.
sql("INSERT INTO ai_spend (day, micro_usd) VALUES (CURRENT_DATE, 999000000) ON CONFLICT (day) DO UPDATE SET micro_usd = 999000000");
log("budget exhausted:", (await api("/api/ai/assist", "POST", { templateId: "terminal", content, instruction: "x" })).status);
sql("DELETE FROM ai_spend");

// Research agent: save a draft, run research, get suggestions (low-confidence one dropped).
const saved = await api("/api/portfolios/terminal", "PUT", { content: { ...content, name: "Ines Okafor", experience: [{ job_title: "Staff Software Engineer", company: "Northwind Pay", start_date: "2022", end_date: "Present" }] }, theme: null, baseVersion: null });
log("draft saved:", saved.status);
const research = await api("/api/suggestions/refresh", "POST", { kind: "research", templateId: "terminal" });
log("research:", research.status, research.body.added, "added | charged", research.body.charged);
const suggestions = await api("/api/suggestions");
log("suggestions:", suggestions.body.suggestions.map((item) => item.title).join(" | "));
log("research again too soon:", (await api("/api/suggestions/refresh", "POST", { kind: "research", templateId: "terminal" })).status);
await api("/api/suggestions", "PUT", { githubUsername: "ada" });
const gh = await api("/api/suggestions/refresh", "POST", { kind: "github" });
log("github sync added:", gh.body.added);
const first = (await api("/api/suggestions")).body.suggestions[0];
log("dismiss:", (await api(`/api/suggestions/${first.id}`, "POST", { action: "dismissed" })).status, "| twice:", (await api(`/api/suggestions/${first.id}`, "POST", { action: "dismissed" })).status);

// Buying Pro: checkout → webhook (twice) → active plan, receipt email, card saved.
log("Basic can't be bought:", (await api("/api/billing/checkout", "POST", { plan: "basic", interval: "year" })).body.error);
log("bad interval refused:", (await api("/api/billing/checkout", "POST", { plan: "pro", interval: "week" })).body.error);
const checkout = await api("/api/billing/checkout", "POST", { plan: "pro", interval: "year" });
log("checkout url:", checkout.status, checkout.body.url?.slice(0, 40));
const mockLog = (await (await fetch("http://localhost:4010/__log")).json()).filter((line) => line.startsWith("CHECKOUT")).at(-1);
log("stripe got:", mockLog);
const orderId = sql(`SELECT id FROM billing_orders WHERE owner_id='${userId}' AND kind='plan'`);
log("order:", sql(`SELECT amount_cents || 'c / ' || term_months || ' months' FROM billing_orders WHERE id='${orderId}'`));
log("webhook:", await webhook(orderId), "| again:", await webhook(orderId));
log("plan after payment:", sql(`SELECT plan || ' ' || plan_interval || ' until ' || to_char(plan_expires_at, 'YYYY-MM') || ' (expected ' || to_char(NOW() + INTERVAL '1 year', 'YYYY-MM') || ') card=' || COALESCE(stripe_payment_method,'none') FROM app_users WHERE id='${userId}'`));
log("receipt emails:", sql(`SELECT count(*) FROM email_log WHERE owner_id='${userId}' AND kind='receipt'`));

// Credits pack: sold at cost, card fee as its own line.
await api("/api/billing/checkout", "POST", { credits: "plus" });
const creditOrder = sql(`SELECT id FROM billing_orders WHERE owner_id='${userId}' AND kind='credits'`);
log("credits order total (1000 + 59 fee):", sql(`SELECT amount_cents FROM billing_orders WHERE id='${creditOrder}'`), "| stripe lines:", (await (await fetch("http://localhost:4010/__log")).json()).filter((line) => line.startsWith("CHECKOUT")).at(-1));
const credBefore = Number(sql(`SELECT credits FROM app_users WHERE id='${userId}'`));
await webhook(creditOrder, "pi_credits"); await webhook(creditOrder, "pi_credits");
log("credits added once:", Number(sql(`SELECT credits FROM app_users WHERE id='${userId}'`)) - credBefore);

// Paying monthly while yearly Pro runs adds a month on top and switches to monthly renewal.
const yearUntil = sql(`SELECT to_char(plan_expires_at, 'YYYY-MM-DD') FROM app_users WHERE id='${userId}'`);
await api("/api/billing/checkout", "POST", { plan: "pro", interval: "month" });
const monthOrder = sql(`SELECT id FROM billing_orders WHERE owner_id='${userId}' AND kind='plan' AND term_months = 1`);
log("monthly order:", sql(`SELECT amount_cents FROM billing_orders WHERE id='${monthOrder}'`));
await webhook(monthOrder, "pi_month");
log("pro until", yearUntil, "→", sql(`SELECT to_char(plan_expires_at, 'YYYY-MM-DD') || ' ' || plan_interval FROM app_users WHERE id='${userId}'`));

// Pro publishes three; when Pro ends: grace keeps all live, then Basic keeps the first.
const extra = { ...content, name: "Ines Okafor" };
await api("/api/portfolios/swiss", "PUT", { content: extra, theme: null, baseVersion: null });
await api("/api/portfolios/broadsheet", "PUT", { content: extra, theme: null, baseVersion: null });
await api("/api/portfolios/blueprint", "PUT", { content: extra, theme: null, baseVersion: null });
const publishes = [];
for (const [id, slug] of [["terminal", "ines-billing"], ["swiss", "ines-two"], ["broadsheet", "ines-three"], ["blueprint", "ines-four"]]) publishes.push((await api(`/api/portfolios/${id}/publish`, "POST", { slug })).status);
log("Pro publishes 3 then refuses the 4th:", publishes.join(","));
sql(`UPDATE app_users SET plan_expires_at = NOW() - INTERVAL '3 days' WHERE id='${userId}'`);
const graceStatus = await Promise.all(["ines-billing", "ines-two", "ines-three"].map(async (slug) => { await page.goto(`${BASE}/p/${slug}`); return await page.getByText("portfolio is resting").isVisible() ? "resting" : "live"; }));
log("grace:", graceStatus.join(","), "| standing:", (await api("/api/account/status")).body.account.standing);
await page.goto(`${BASE}/editor/terminal`);
await page.getByText("plan has ended").waitFor({ timeout: 10000 }).catch(() => undefined);
log("editor banner (grace):", await page.getByText("plan has ended").isVisible());
await page.screenshot({ path: `${S}/shots/editor-grace-banner.png` });
sql(`UPDATE app_users SET plan_expires_at = NOW() - INTERVAL '20 days' WHERE id='${userId}'`);
const after = await Promise.all(["ines-billing", "ines-two", "ines-three"].map(async (slug) => { await page.goto(`${BASE}/p/${slug}`); return await page.getByText("portfolio is resting").isVisible() ? "resting" : "live"; }));
log("after grace (Basic): first live, rest resting:", after.join(","), "| plan shown:", (await api("/api/account/status")).body.account.planName);
log("Basic can't publish a second:", (await api("/api/portfolios/blueprint/publish", "POST", { slug: "ines-four" })).status);

// Scheduled jobs: emails (once), renewal with a saved card (yearly and monthly), failed renewal.
sql(`UPDATE app_users SET plan_expires_at = NOW() - INTERVAL '12 days' WHERE id='${userId}'`);
const firstRun = await cron();
const secondRun = await cron();
log("cron emails first/second run:", firstRun.emails, secondRun.emails);
log("emails logged:", sql(`SELECT string_agg(kind, ',' ORDER BY kind) FROM email_log WHERE owner_id='${userId}'`));
sql(`UPDATE app_users SET plan='pro', plan_interval='year', plan_expires_at = NOW() + INTERVAL '2 days', auto_renew = TRUE, stripe_customer_id='cus_1', stripe_payment_method='pm_card_visa' WHERE id='${userId}'`);
const renewal = await cron();
log("yearly renewal:", JSON.stringify(renewal.renewals), "| now until:", sql(`SELECT to_char(plan_expires_at, 'YYYY-MM-DD') FROM app_users WHERE id='${userId}'`), "| charged:", sql(`SELECT amount_cents FROM billing_orders WHERE owner_id='${userId}' AND kind='renewal' ORDER BY created_at DESC LIMIT 1`));
log("renew again same period:", JSON.stringify((await cron()).renewals));
sql(`UPDATE app_users SET plan_interval='month', plan_expires_at = NOW() + INTERVAL '1 day' WHERE id='${userId}'`);
const monthly = await cron();
log("monthly renewal:", JSON.stringify(monthly.renewals), "| charged:", sql(`SELECT amount_cents || 'c, ' || term_months || ' month' FROM billing_orders WHERE owner_id='${userId}' AND kind='renewal' ORDER BY created_at DESC LIMIT 1`), "| until in ~1 month:", sql(`SELECT (plan_expires_at BETWEEN NOW() + INTERVAL '28 days' AND NOW() + INTERVAL '33 days')::text FROM app_users WHERE id='${userId}'`));
sql(`UPDATE app_users SET plan_expires_at = NOW() + INTERVAL '1 day', stripe_payment_method='pm_decline' WHERE id='${userId}'`);
log("declined renewal:", JSON.stringify((await cron()).renewals), "| email:", sql(`SELECT count(*) FROM email_log WHERE owner_id='${userId}' AND kind='renewal-failed'`));
log("cron without secret:", (await fetch(`${BASE}/api/cron`, { method: "POST" })).status);

// Pricing page and checkout entry.
await page.goto(`${BASE}/pricing`);
log("pricing cards:", await page.locator("li h2").allTextContents());
await page.getByRole("radio", { name: "Monthly" }).click();
log("monthly price shown:", await page.getByText("$6").first().isVisible(), "| card fee shown:", await page.getByText("+ $0.59 card fee").isVisible());
await page.screenshot({ path: `${S}/shots/pricing.png`, fullPage: true });
await page.goto(`${BASE}/account`);
await page.getByText("AI help").waitFor();
await page.screenshot({ path: `${S}/shots/account.png`, fullPage: true });
await browser.close();
