// Password accounts, template submissions + admin review, the gallery and its article pages.
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const { zipSync, strToU8, unzipSync } = createRequire(new URL("../../package.json", import.meta.url))("fflate");

const BASE = process.env.BASE ?? "http://localhost:3100";
const S = process.env.S ?? new URL("./.out", import.meta.url).pathname;
const log = (...args) => console.log("•", ...args);
const sql = (query) => execSync(`su postgres -c "psql -d formora -At -c \\"${query.replace(/"/g, '\\\\\\"')}\\""`).toString().trim();
const serverLog = () => readFileSync(`${S}/server.log`, "utf8");
const lastLink = (pattern) => [...serverLog().matchAll(pattern)].pop()?.[0];
const errors = [];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const watch = (page, who) => page.on("pageerror", (error) => errors.push(`${who}: ${error.message}`));
const json = (page, path, method = "GET", data) => page.request.fetch(`${BASE}${path}`, { method, data, headers: data ? { "Content-Type": "application/json" } : undefined }).then(async (r) => ({ status: r.status(), body: await r.json().catch(() => ({})) }));

sql(`DELETE FROM app_users WHERE lower(email) IN ('nadia@example.com') OR lower(username) IN ('nadia_k', 'young_one')`);
sql(`DELETE FROM gallery_submissions WHERE title LIKE 'Harbour%'`);

// 1) Sign up with username, email, password and date of birth
const designer = await browser.newContext({ viewport: { width: 1360, height: 900 } });
const page = await designer.newPage(); watch(page, "designer");
log("too young refused:", (await json(page, "/api/account/signup", "POST", { username: "young_one", email: "young@example.com", password: "a-long-password", birthDate: new Date(Date.now() - 12 * 365 * 86400000).toISOString().slice(0, 10), agree: true })).body.error);
await page.goto(`${BASE}/signup`);
await page.getByLabel("Your name").fill("Nadia Kareem");
await page.locator("input[name=username]").fill("Nadia_K");
await page.locator("input[name=email]").fill("nadia@example.com");
await page.locator("input[name=password]").fill("harbour-lights-42");
await page.locator("input[name=birthDate]").fill("1994-05-17");
await page.getByRole("checkbox").check();
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(/\/account/);
await page.getByText("Please confirm your email address").waitFor();
log("signed up → account, asked to confirm email | username stored:", sql(`SELECT username || ' / ' || (password_hash LIKE 'scrypt$%')::text || ' / dob ' || birth_date FROM app_users WHERE email = 'nadia@example.com'`));
log("duplicate username refused:", (await json(page, "/api/account/signup", "POST", { username: "nadia_k", email: "other@example.com", password: "another-password", birthDate: "1990-01-01", agree: true })).body.error);
// Submitting is blocked until the email is confirmed
await page.goto(`${BASE}/gallery/submit`);
log("submit blocked before verifying:", await page.getByText("Confirm your email address first").isVisible());
const verify = lastLink(/http:\/\/localhost:3100\/api\/account\/verify\?token=[\w-]+/g);
await page.goto(verify);
await page.getByText("Thanks, your email is confirmed.").waitFor();
await page.goto(verify);
log("email verified via link | reused link refused:", await page.getByText("expired or was already used").waitFor({ timeout: 8000 }).then(() => true, () => false));

// 2) Sign out and back in with username + password; wrong password; reset
await page.goto(`${BASE}/api/auth/signout`); await page.getByRole("button", { name: /sign out/i }).click().catch(() => {});
await page.context().clearCookies();
await page.goto(`${BASE}/login`);
await page.getByLabel("Email or username").fill("nadia_k");
await page.locator("input[name=password]").fill("wrong-password-1");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
log("wrong password message:", await page.getByText("don’t match").waitFor({ timeout: 8000 }).then(() => true, () => false));
await page.goto(`${BASE}/forgot-password`);
await page.getByLabel("Email").fill("nadia@example.com");
await page.getByRole("button", { name: "Send reset link" }).click();
await page.getByText("a reset link is on its way").waitFor();
await page.waitForTimeout(500);
await page.goto(lastLink(/http:\/\/localhost:3100\/reset-password\?token=[\w-]+/g));
await page.locator("input[name=password]").fill("new-harbour-lights-7");
await page.getByRole("button", { name: "Save new password" }).click();
await page.getByText("Your password is changed.").waitFor();
await page.goto(`${BASE}/login?callbackUrl=/gallery/submit`);
await page.getByLabel("Email or username").fill("nadia_k");
await page.locator("input[name=password]").fill("new-harbour-lights-7");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForURL(/gallery\/submit/);
log("signed in with username and new password → submit page");

// 3) Submit a template
const zip = zipSync({ "harbour/index.html": strToU8("<!doctype html><title>Harbour</title><h1>Harbour</h1>"), "harbour/README.md": strToU8("Open index.html"), "harbour/style.css": strToU8("body{font-family:serif}") });
writeFileSync(`${S}/harbour.zip`, zip);
writeFileSync(`${S}/bad.zip`, zipSync({ "x/index.html": strToU8("<h1>x</h1>"), "x/setup.exe": strToU8("MZ") }));
const cover = `${ROOT}/public/gallery/residence.webp`, clip = `${ROOT}/public/gallery/residence.mp4`;
await page.locator("input[name=title]").fill("Harbour");
await page.locator("input[name=summary]").fill("A calm one-page site for marine photographers, with tide-table typography.");
await page.locator("input[name=tags]").fill("photographer, minimal, motion");
await page.locator("textarea[name=idea]").fill("I wanted a portfolio that feels like standing on a quiet harbour wall at dawn.");
await page.locator("textarea[name=process]").fill("Sketched on paper, then built in plain HTML and CSS. I prompted an AI for the tide-table layout and rewrote the CSS by hand.");
await page.locator("textarea[name=inspiration]").fill("Old Admiralty tide tables and the photographs of Hiroshi Sugimoto.");
await page.locator("textarea[name=audience]").fill("Photographers, especially landscape and marine photographers.");
await page.locator("input[name=zip]").setInputFiles(`${S}/bad.zip`);
await page.locator("input[name=cover]").setInputFiles(cover);
await page.locator("input[name=clip]").setInputFiles(clip);
await page.getByRole("checkbox").check();
await page.getByRole("button", { name: "Submit for review" }).click();
log("zip with a program refused:", await page.getByText("Programs and scripts aren’t allowed").waitFor({ timeout: 15000 }).then(() => true, async () => { await page.screenshot({ path: `${S}/submit-fail.png`, fullPage: true }); return false; }));
await page.locator("input[name=zip]").setInputFiles(`${S}/harbour.zip`);
await page.getByRole("button", { name: "Submit for review" }).click();
await page.getByText("Your template is in the review queue").waitFor({ timeout: 20000 });
log("submitted | listed as:", await page.getByText("Waiting for review").first().textContent());
const id = sql(`SELECT id FROM gallery_submissions WHERE title = 'Harbour'`);
sql(`DELETE FROM template_ratings WHERE template_id = 'brief'`);
log("not public before approval:", (await fetch(`${BASE}/gallery/harbour`)).status, (await fetch(`${BASE}/api/gallery/submissions/${id}/zip`)).status);

// 4) Admin reviews it
const admin = await browser.newContext({ viewport: { width: 1360, height: 900 } });
const adminPage = await admin.newPage(); watch(adminPage, "admin");
await adminPage.goto(`${BASE}/login?callbackUrl=/admin/gallery`);
await adminPage.getByLabel("Test email").fill("mod@example.com");
await adminPage.getByRole("button", { name: "Sign in for testing" }).click();
await adminPage.waitForURL(/admin\/gallery/);
await adminPage.getByRole("heading", { name: "Harbour" }).waitFor();
log("admin sees it with story + zip listing:", await adminPage.getByText("Old Admiralty tide tables").isVisible(), "|", (await adminPage.locator("details summary").first().textContent()).trim());
await adminPage.getByRole("button", { name: "Ask for changes" }).click();
log("changes needs a note:", await adminPage.getByText("Tell the designer why").waitFor({ timeout: 5000 }).then(() => true, () => false));
await adminPage.getByPlaceholder(/Note to the designer/).fill("Lovely. Please add a phone screenshot to the README.");
await adminPage.getByRole("button", { name: "Ask for changes" }).click();
await adminPage.waitForTimeout(1200);
log("status:", sql(`SELECT status FROM gallery_submissions WHERE id = '${id}'`), "| designer emailed:", serverLog().includes(`About your template “Harbour”`));
await page.reload();
log("designer sees note:", await page.getByText("Please add a phone screenshot").waitFor({ timeout: 8000 }).then(() => true, () => false));
await page.getByRole("button", { name: "Edit" }).click();
await page.locator("textarea[name=process]").fill("Sketched on paper, then built in plain HTML and CSS. I prompted an AI for the tide-table layout and rewrote the CSS by hand. Added phone screenshots.");
await page.getByRole("checkbox").check();
await page.getByRole("button", { name: "Save and send for review" }).click();
await page.getByText("back in the review queue").waitFor({ timeout: 20000 });
await adminPage.goto(`${BASE}/admin/gallery`);
await adminPage.getByRole("button", { name: "Approve" }).first().click();
await adminPage.waitForTimeout(1200);
log("approved:", sql(`SELECT status FROM gallery_submissions WHERE id = '${id}'`));

// 5) The gallery
const visitor = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const v = await visitor.newPage(); watch(v, "visitor");
await v.goto(`${BASE}/gallery`);
const tiles = v.locator("main li a[href^='/gallery/']");
await tiles.first().waitFor();
log("gallery tiles:", await tiles.count(), "| community tile:", await v.locator("a[href='/gallery/harbour']").count());
const first = v.locator("a[href='/gallery/brief']");
await first.scrollIntoViewIfNeeded(); await first.hover({ position: { x: 60, y: 60 } }); await v.waitForTimeout(900);
log("hover: tilt", await first.evaluate((node) => node.style.getPropertyValue("--rx")), "| clip playing:", await first.locator("video").evaluate((video) => !video.paused));
await v.getByPlaceholder(/Search/).fill("lawyer");
await v.waitForTimeout(300);
log("search 'lawyer':", await tiles.count(), "results →", (await tiles.evaluateAll((links) => links.map((link) => link.getAttribute("href").replace("/gallery/", "")))).join(", "));
await v.getByPlaceholder(/Search/).fill("tide harbour");
await v.waitForTimeout(300);
log("search 'tide harbour' (story text not searched, title is):", await tiles.count());
await v.getByPlaceholder(/Search/).fill("");
await v.getByRole("button", { name: "Community" }).click();
log("community filter:", await tiles.count());

// 6) Article pages
await v.goto(`${BASE}/gallery/harbour`);
log("community article:", await v.locator("h1").textContent(), "| story:", await v.getByText("Old Admiralty tide tables").isVisible(), "| designer:", await v.getByText("@nadia_k").first().isVisible());
const dl = await v.request.get(`${BASE}/api/gallery/submissions/${id}/zip`);
log("community zip:", dl.status(), dl.headers()["content-disposition"], "| counted:", sql(`SELECT count FROM template_downloads WHERE template_id = 'community:harbour'`));
await v.goto(`${BASE}/gallery/brief`);
log("original article:", await v.locator("h1").textContent(), "| inspired by:", await v.getByText("Pleading paper used in courts").isVisible(), "| clip:", await v.locator("figure video").count(), "| live preview iframe:", await v.locator("iframe").count());
const download = await Promise.all([v.waitForEvent("download"), v.getByRole("link", { name: "Download free" }).first().click()]).then(([event]) => event);
const path = `${S}/brief-dl.zip`; await download.saveAs(path);
const files = Object.keys(unzipSync(new Uint8Array(readFileSync(path))));
log("original zip:", files.length, "files incl.", files.filter((name) => /package\.json|Brief\.tsx|content\.json|README/.test(name)).map((name) => name.split("/").slice(1).join("/")).join(", "));
log("after click: setup steps shown:", await v.getByText("Downloading. The setup steps are below.").isVisible());
// Rating on the gallery page is the same rating as everywhere else
await page.goto(`${BASE}/gallery/brief`);
await page.getByRole("radio", { name: "5 stars" }).click();
await page.waitForTimeout(800);
await page.goto(`${BASE}/templatepreview?template=brief`);
log("same rating on template preview:", await page.locator("[aria-label^='Rated']").first().getAttribute("aria-label"));
await page.goto(`${BASE}/gallery/harbour`);
await page.getByRole("radio", { name: "4 stars" }).click();
await page.waitForTimeout(800);
log("community rating stored:", sql(`SELECT stars FROM template_ratings WHERE template_id = 'community:harbour'`));
// Community composer points designs to the gallery
await page.goto(`${BASE}/community`);
await page.getByRole("button", { name: /Write a post/ }).click();
await page.getByRole("radio", { name: "Design" }).click();
log("community 'Design' → gallery link:", await page.getByRole("link", { name: "Submit a template" }).isVisible());
await v.goto(`${BASE}/`);
log("navbar has Gallery:", await v.locator("nav[aria-label=Primary] a[href='/gallery']").count());
log("sitemap lists gallery:", (await (await fetch(`${BASE}/sitemap.xml`)).text()).includes("/gallery/brief"), "(the sitemap is cached for an hour, so new community items appear later)");
console.log("page errors:", errors.length ? errors : "none");
await browser.close();
