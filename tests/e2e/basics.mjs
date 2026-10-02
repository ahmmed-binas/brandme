import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { encode } from "../../node_modules/@auth/core/jwt.js";

const BASE = "http://localhost:3100";
const log = (...args) => console.log("•", ...args);
const sh = (command) => execSync(command, { stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
const sql = (query) => sh(`su postgres -c "psql -d formora -At -c \\"${query}\\""`);

const token = await encode({ token: { name: "Tab Tester", email: "tabs@example.com", providerAccountId: "google-basics-1" }, secret: process.env.AUTH_SECRET, salt: "authjs.session-token" });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const errors = [];

log("health:", await (await fetch(`${BASE}/api/health`)).text());

// Two separate browsers (like a laptop and a phone) editing the same portfolio.
const open = async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies([{ name: "authjs.session-token", value: token, url: BASE }]);
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${BASE}/editor/template-one`);
  await page.getByText("Saved to your account").waitFor({ timeout: 15000 });
  return page;
};
const laptop = await open();
await laptop.locator('[data-editor-field="name"]').fill("Version From Laptop");
await laptop.getByText("Saved to your account").waitFor({ timeout: 10000 });
await laptop.waitForTimeout(2500);
const phone = await open();
log("phone loads laptop's save:", await phone.locator('[data-editor-field="name"]').inputValue());
await phone.locator('[data-editor-field="name"]').fill("Version From Phone");
await phone.waitForTimeout(2500);
log("version after phone save:", sql("SELECT version FROM portfolios WHERE template_id='template-one'"));

// The laptop still has the older version open; its next save must not overwrite the phone's.
await laptop.locator('[data-editor-field="professional-title"]').fill("Stale laptop edit");
await laptop.getByText("This portfolio was changed in another tab").waitFor({ timeout: 10000 });
log("conflict shown on laptop; server still has:", sql("SELECT content->>'name' FROM portfolios WHERE template_id='template-one'"));
await laptop.screenshot({ path: `${process.env.S ?? new URL("./.out", import.meta.url).pathname}/shots/conflict.png` });
await laptop.getByRole("button", { name: "Load the other version" }).click();
await laptop.waitForTimeout(500);
log("laptop after loading other version:", await laptop.locator('[data-editor-field="name"]').inputValue(), "| banner gone:", !(await laptop.getByText("This portfolio was changed").isVisible()));
await laptop.locator('[data-editor-field="professional-title"]').fill("Laptop edit after resolving");
await laptop.getByText("Saved to your account").waitFor({ timeout: 10000 });
await laptop.waitForTimeout(2500);
log("laptop saves normally again:", sql("SELECT content->>'professional_title' || ' v' || version FROM portfolios WHERE template_id='template-one'"));

// "Keep this one" path: the phone is now stale.
await phone.locator('[data-editor-field="name"]').fill("Phone insists");
await phone.getByText("This portfolio was changed in another tab").waitFor({ timeout: 10000 });
await phone.getByRole("button", { name: "Keep this one" }).click();
await phone.getByText("Saved to your account").waitFor({ timeout: 10000 });
log("keep-mine overwrote:", sql("SELECT content->>'name' FROM portfolios WHERE template_id='template-one'"));

// Database outage while editing: the editor explains, work stays local, and saving resumes afterwards.
sh("service postgresql stop");
await phone.locator('[data-editor-field="name"]').fill("Typed during outage");
await phone.getByText(/can’t reach our database/).waitFor({ timeout: 20000 });
log("outage message:", await phone.getByText(/can’t reach our database/).textContent());
log("health during outage:", (await fetch(`${BASE}/api/health`)).status);
log("local copy kept:", await phone.evaluate(() => JSON.parse(localStorage.getItem("template:template-one:data")).name));
sh("service postgresql start");
await new Promise((resolve) => setTimeout(resolve, 2000));
await phone.locator('[data-editor-field="name"]').fill("Typed after recovery");
await phone.getByText("Saved to your account").waitFor({ timeout: 20000 });
await phone.waitForTimeout(2500);
log("saved after recovery:", sql("SELECT content->>'name' FROM portfolios WHERE template_id='template-one'"));

// Publishing, then deleting the account takes everything offline.
const api = phone.context().request;
await api.post(`${BASE}/api/portfolios/template-one/publish`, { data: { slug: "tab-tester" } });
log("published page:", (await fetch(`${BASE}/p/tab-tester`)).status);
log("delete without confirm:", (await api.delete(`${BASE}/api/account`, { data: { confirm: "yes" } })).status());
await phone.goto(`${BASE}/account`);
await phone.getByRole("button", { name: "Delete my account…" }).click();
await phone.getByLabel("Type DELETE to confirm").fill("DELETE");
await phone.getByRole("button", { name: "Permanently delete" }).click();
await phone.waitForURL(`${BASE}/`, { timeout: 15000 });
log("after deletion → user rows:", sql("SELECT count(*) FROM app_users WHERE email='tabs@example.com'"), "| portfolios:", sql("SELECT count(*) FROM portfolios"), "| page:", (await fetch(`${BASE}/p/tab-tester`)).status);

console.log("page errors:", errors.length ? errors : "none");
await browser.close();
