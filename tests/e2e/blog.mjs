// Dev login, template ratings, Journal admin, portfolio blogs (incl. custom domain), domain renewals.
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
const Stripe = createRequire(new URL("../../package.json", import.meta.url))("stripe");

const BASE = process.env.BASE ?? "http://localhost:3100";
const log = (...args) => console.log("•", ...args);
const sql = (query) => execSync(`su postgres -c "psql -d formora -At -c \\"${query.replace(/"/g, '\\\\\\"')}\\""`).toString().trim();
const stripe = new Stripe("sk_test_123");
const errors = [];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(error.message));
const api = (path, method = "GET", data) => page.request.fetch(`${BASE}${path}`, { method, data, headers: data ? { "Content-Type": "application/json" } : undefined }).then(async (response) => ({ status: response.status(), body: await response.json().catch(() => ({})) }));
sql(`DELETE FROM app_users WHERE provider_account_id = 'dev:mod@example.com'`);
sql(`DELETE FROM journal_posts`);

// 1) Local test login (admin email)
await page.goto(`${BASE}/login?callbackUrl=/account`);
await page.getByLabel("Test email").fill("mod@example.com");
await page.getByLabel(/^Name/).fill("Mo Admin");
await page.getByRole("button", { name: "Sign in for testing" }).click();
await page.waitForURL(/\/account/);
await page.getByText("mod@example.com").first().waitFor();
log("dev login → account page:", page.url().endsWith("/account"));

// 2) Ratings
await page.goto(`${BASE}/templatepreview?template=brief`);
await page.getByText("No ratings yet").first().waitFor();
log("preview shows 'No ratings yet'");
await page.getByRole("radio", { name: "4 stars" }).click();
await page.getByText("4.0").first().waitFor();
log("after rating:", await page.locator("[aria-label^='Rated']").first().getAttribute("aria-label"));
await page.goto(`${BASE}/templatechooser`);
log("gallery card shows rating:", await page.locator("[aria-label^='Rated 4.0']").count() >= 1, "| unrated cards say none:", await page.getByText("No ratings yet").count() > 5);
log("bad rating rejected:", (await api("/api/templates/brief/rating", "POST", { stars: 9 })).status);
const reviews = Number(sql(`SELECT count(*) FROM community_posts WHERE kind = 'review' AND status = 'published'`));
await page.goto(`${BASE}/community`);
log("community review stat:", reviews ? await page.getByText(/\/ 5 from/).count() === 1 : await page.getByText("No reviews yet").count() === 1, `(${reviews} reviews)`);

// 3) Admin hub + Journal
await page.goto(`${BASE}/admin`);
log("admin hub:", await page.locator("h1").textContent(), "| checklist items:", await page.locator("section li").count());
await page.goto(`${BASE}/admin/journal`);
await page.getByRole("button", { name: "New post" }).click();
await page.getByPlaceholder("A clear, specific title").fill("Launch notes: blogs are here");
await page.locator("textarea").first().fill("Every portfolio can now have a blog.");
await page.getByRole("textbox", { name: "Post", exact: true }).fill("Every portfolio now has a **blog**. Write in the editor's Blog tab.\n\n## Why\n\n- Search engines like fresh writing\n- Clients like to see how you think\n\n[Try it](/templatechooser)");
await page.getByRole("button", { name: "Publish", exact: true }).click();
await page.getByText("Published.").waitFor();
const article = await page.goto(`${BASE}/blog/launch-notes-blogs-are-here`);
log("journal post live:", article.status(), "| has list:", await page.locator(".post-body li").count(), "| bold:", await page.locator(".post-body strong").textContent());
log("on /blog:", (await (await fetch(`${BASE}/blog`)).text()).includes("Launch notes"));
// Edit a built-in article, then restore it
await page.goto(`${BASE}/admin/journal`);
await page.getByRole("button", { name: /How to write an introduction/ }).click();
await page.getByPlaceholder("A clear, specific title").fill("How to write an introduction (edited)");
await page.getByRole("button", { name: "Update" }).click();
await page.getByText("Published.").waitFor();
log("built-in edited:", (await (await fetch(`${BASE}/blog/write-a-portfolio-introduction`)).text()).includes("(edited)"));
page.once("dialog", (dialog) => dialog.accept());
await page.getByRole("button", { name: "Restore original" }).click();
await page.getByText("Original restored.").waitFor({ timeout: 5000 });
log("restored:", !(await (await fetch(`${BASE}/blog/write-a-portfolio-introduction`)).text()).includes("(edited)"));
const hidden = await api("/api/admin/journal", "POST", { originalSlug: "portfolio-accessibility-basics", slug: "portfolio-accessibility-basics", title: "Accessibility basics", description: "x", category: "Design", body: "x", publish: false });
log("hide built-in:", hidden.status, "| now 404:", (await fetch(`${BASE}/blog/portfolio-accessibility-basics`)).status);
await api("/api/admin/journal?slug=portfolio-accessibility-basics", "DELETE");
log("non-admin blocked:", (await fetch(`${BASE}/api/admin/journal`)).status);

// 4) Portfolio blog from the editor
await page.goto(`${BASE}/editor/brief`);
await page.getByRole("button", { name: "Start from blank" }).click();
await page.locator('[data-field="name"]').fill("Mo Admin");
await page.locator('[data-field="professional_title"]').fill("Employment lawyer");
await page.waitForTimeout(2500);
await page.getByRole("tab", { name: "Blog" }).click();
await page.getByRole("button", { name: "New post" }).click();
await page.locator('[data-field="post.title"]').fill("Three questions to ask before signing a settlement");
await page.getByRole("textbox", { name: "Post", exact: true }).fill("Settlement agreements move fast. Before you sign, ask these.\n\n## 1. Is the reference agreed?\n\nGet the wording in writing.");
await page.getByText("Saved", { exact: true }).waitFor({ timeout: 8000 });
await page.getByRole("button", { name: "Publish post" }).click();
await page.getByRole("button", { name: "Unpublish" }).waitFor();
log("post published in editor");
await page.getByRole("tab", { name: "Content" }).click();
await page.locator("header").getByRole("button", { name: /Publish/ }).click();
await page.getByPlaceholder("your-name").fill("mo-admin-blog");
await page.getByRole("button", { name: "Publish portfolio" }).click();
await page.getByText("Visitors see your latest version").waitFor({ timeout: 10000 });
const slug = sql(`SELECT slug FROM portfolios p JOIN app_users u ON u.id = p.owner_id WHERE u.provider_account_id = 'dev:mod@example.com' AND template_id = 'brief'`);
log("portfolio slug:", slug);
const home = await (await fetch(`${BASE}/p/${slug}`)).text();
log("home shows Writing:", home.includes("Three questions to ask"));
const index = await fetch(`${BASE}/p/${slug}/blog`);
log("blog index:", index.status, (await index.text()).includes("Three questions"));
const postPage = await page.goto(`${BASE}/p/${slug}/blog/three-questions-to-ask-before-signing-a-settlement`);
log("post page:", postPage.status(), "| h2:", await page.locator(".post-body h2").textContent(), "| title tag:", await page.title());
log("sitemap lists post:", (await (await fetch(`${BASE}/sitemap.xml`)).text()).includes(`/p/${slug}/blog/three-questions`));
log("draft hidden:", (await fetch(`${BASE}/p/${slug}/blog/untitled-post`)).status);

// 5) The same blog on a custom domain
const owner = sql(`SELECT id FROM app_users WHERE provider_account_id = 'dev:mod@example.com'`);
sql(`DELETE FROM custom_domains WHERE domain = 'moadmin.example'`);
sql(`INSERT INTO custom_domains (domain, owner_id, template_id, source, verification_token, verified_at) VALUES ('moadmin.example', '${owner}', 'brief', 'connected', 'tok', NOW())`);
const viaHost = (path) => execSync(`curl -s -o /dev/null -w "%{http_code}" -H "Host: moadmin.example" ${BASE}${path}`).toString();
const bodyViaHost = (path) => execSync(`curl -s -H "Host: moadmin.example" ${BASE}${path}`).toString();
log("custom domain /:", viaHost("/"), "| /blog:", viaHost("/blog"), "| post:", viaHost("/blog/three-questions-to-ask-before-signing-a-settlement"), "| /nope:", viaHost("/nope"));
log("custom domain links stay on domain:", bodyViaHost("/blog").includes('href="/blog/three-questions'), "| canonical:", /canonical" href="https:\/\/moadmin\.example\/blog"/.test(bodyViaHost("/blog")));
log("custom sitemap:", bodyViaHost("/sitemap.xml").includes("https://moadmin.example/blog/three-questions"), "| robots:", bodyViaHost("/robots.txt").includes("Sitemap: https://moadmin.example/sitemap.xml"));

// 6) Domain renewal
sql(`DELETE FROM domain_orders WHERE owner_id = '${owner}'`);
const orderId = sql(`INSERT INTO domain_orders (owner_id, template_id, domain, registrar_price, charged_cents, status, expires_at) VALUES ('${owner}', 'brief', 'moadmin.example', 12, 2000, 'completed', NOW() + INTERVAL '10 days') RETURNING id`).split("\n")[0];
const cronRun = await fetch(`${BASE}/api/cron`, { method: "POST", headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } }).then((response) => response.json());
log("cron renewal reminders:", JSON.stringify(cronRun.domainRenewals));
await page.goto(`${BASE}/account/domains`);
log("domains page:", await page.locator("li").filter({ hasText: "moadmin.example" }).innerText().then((text) => text.replace(/\s+/g, " ")));
const renew = await api("/api/domains/renew", "POST", { orderId });
log("renew → checkout:", renew.status, String(renew.body.url ?? renew.body.error).slice(0, 60));
const renewalId = sql(`SELECT id FROM domain_orders WHERE renewal_of = '${orderId}'`);
const payload = JSON.stringify({ id: `evt_${Date.now()}`, object: "event", type: "checkout.session.completed", data: { object: { id: "cs_r", object: "checkout.session", payment_status: "paid", payment_intent: "pi_renew", metadata: { orderId: renewalId, renewal: "1" } } } });
await fetch(`${BASE}/api/webhooks/stripe`, { method: "POST", body: payload, headers: { "stripe-signature": stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET }), "Content-Type": "application/json" } });
log("after payment:", sql(`SELECT status || ' until ' || to_char(expires_at, 'YYYY-MM-DD') FROM domain_orders WHERE id = '${renewalId}'`), "| registrar called:", (await (await fetch("http://localhost:4010/__log")).json()).some((line) => line.startsWith("RENEW moadmin.example")));
log("second renew refused (too early):", (await api("/api/domains/renew", "POST", { orderId: renewalId })).status);

// 7) Blogs are on every plan: on free Basic the blog stays, on the free address and the custom domain it already has.
sql(`UPDATE app_users SET plan = 'basic', plan_expires_at = NULL WHERE id = '${owner}'`);
log("basic: new post allowed:", (await api("/api/portfolios/brief/posts", "POST", { title: "Basic plan post" })).status, "| list allowed:", (await api("/api/portfolios/brief/posts")).body.allowed);
log("basic: blog live:", (await fetch(`${BASE}/p/${slug}/blog`)).status, "| custom domain still serves it:", viaHost("/blog"));
sql(`UPDATE app_users SET plan = 'pro', plan_expires_at = NOW() + INTERVAL '1 year' WHERE id = '${owner}'`);
console.log("page errors:", errors.length ? errors : "none");
await browser.close();
