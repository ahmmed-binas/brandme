// With only a name filled in, every template still shows the name and a page heading.
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { encode } from "../../node_modules/@auth/core/jwt.js";
const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const BASE = process.env.BASE ?? "http://localhost:3100";
const ids = JSON.parse(execSync(`cd ${ROOT} && npx tsx -e 'import { templateCatalog } from "./lib/templates/catalog"; console.log(JSON.stringify(templateCatalog.filter((t) => t.collection === "studio").map((t) => t.id)))'`).toString());
const only = process.env.ONLY?.split(",");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
// Signed in as an admin so unapproved templates open; a fresh account each run, never saved over real data.
await context.addCookies([{ name: "authjs.session-token", value: await encode({ token: { name: "Blank", email: "mod@example.com", providerAccountId: `google-blank-${Date.now()}` }, secret: process.env.AUTH_SECRET, salt: "authjs.session-token" }), url: BASE }]);
const bad = [];
for (const id of ids.filter((id) => !only || only.includes(id))) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${BASE}/editor/${id}`);
  await page.locator(".studio-root").first().waitFor({ timeout: 20000 });
  // Content follows you between templates, so after the first one the blank draft is already loaded.
  await page.getByRole("button", { name: "Start from blank" }).click({ timeout: 4000 }).catch(() => {});
  await page.locator('[data-field="name"]').fill("Noor Haddad");
  await page.waitForTimeout(500);
  const shown = await page.locator("main .studio-root").first().innerText();
  const h1 = await page.locator("main .studio-root h1").count();
  const nameEditable = await page.locator('main [data-edit="name"]').count();
  const ok = /noor/i.test(shown) && h1 > 0 && nameEditable > 0 && !errors.length;
  if (!ok) bad.push(id);
  console.log(`${ok ? "✓" : "✗"} ${id}: name ${/noor/i.test(shown) ? "shown" : "MISSING"}, h1 ${h1}, editable ${nameEditable}${errors.length ? `, errors ${errors[0]}` : ""}`);
  await page.close();
}
console.log(`\n${bad.length} templates with problems${bad.length ? `: ${bad.join(", ")}` : ""}`);
await browser.close();
