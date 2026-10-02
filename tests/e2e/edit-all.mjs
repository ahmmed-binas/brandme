// Editing sweep: for every studio template, every click-to-edit element opens a field,
// edits reach the preview, autosave reaches Postgres, and a reload restores them.
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { encode } from "../../node_modules/@auth/core/jwt.js";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const BASE = process.env.BASE ?? "http://localhost:3100";
const sql = (query) => execSync(`su postgres -c "psql -d formora -At -c \\"${query.replace(/"/g, '\\\\\\"')}\\""`).toString().trim();
const only = process.env.ONLY?.split(",");
const account = "google-sweep";
sql(`DELETE FROM app_users WHERE provider_account_id = '${account}'`);
const ids = JSON.parse(execSync(`cd ${ROOT} && npx tsx -e 'import { templateCatalog } from "./lib/templates/catalog"; console.log(JSON.stringify(templateCatalog.filter((t) => t.collection === "studio").map((t) => t.id)))'`).toString());
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addCookies([{ name: "authjs.session-token", value: await encode({ token: { name: "Sweep", email: "mod@example.com", providerAccountId: account }, secret: process.env.AUTH_SECRET, salt: "authjs.session-token" }), url: BASE }]);
const problems = [];
let checked = 0;

for (const id of ids.filter((id) => !only || only.includes(id))) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(`${BASE}/editor/${id}`);
    await page.locator(".studio-root").first().waitFor({ timeout: 20000 });
    await page.getByText(/Saved to your account|Saved on this device/).first().waitFor({ timeout: 15000 }).catch(() => {});
    // 1) Every distinct editable spot opens a matching field.
    const paths = await page.locator("main [data-edit]").evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getAttribute("data-edit")))]);
    const sample = [...new Set(paths.map((path) => path.replace(/\.(\d+)$/, (_, n) => (Number(n) > 1 ? ".1" : `.${n}`))))];
    const dead = [];
    for (const path of sample) {
      const target = page.locator(`main [data-edit="${path}"]`).first();
      if (!(await target.isVisible().catch(() => false))) continue;
      // A DOM click, so moving or overlapping decoration can't steal it; what's tested is the mapping to a field.
      await target.evaluate((node) => node.click()).catch(() => {});
      await page.waitForTimeout(160);
      const ok = await page.evaluate(() => { const el = document.activeElement; return Boolean(el && el.closest("aside") && el.matches("input, textarea, select, button")); });
      if (!ok) dead.push(path);
    }
    // 2) Edits show in the preview and save to the account.
    const name = `Sweep ${id}`;
    await page.locator('main [data-edit="name"]').first().evaluate((node) => node.click());
    await page.locator('[data-field="name"]').first().fill(name);
    await page.locator('[data-field="tagline"]').first().fill(`Tagline for ${id}`);
    const nameShown = await page.locator(`main [data-edit="name"]`).first().innerText().then((text) => text.replace(/\s+/g, " ").includes(name.split(" ")[1]) || text.replace(/\s+/g, " ").toLowerCase().includes("sweep")).catch(() => false);
    let stored = "";
    for (let tries = 0; tries < 40 && stored !== name; tries++) { await page.waitForTimeout(300); stored = sql(`SELECT content->>'name' FROM portfolios p JOIN app_users u ON u.id = p.owner_id WHERE u.provider_account_id = '${account}' AND template_id = '${id}'`); }
    // 3) A reload brings the saved version back.
    await page.reload();
    await page.locator(".studio-root").first().waitFor({ timeout: 20000 });
    await page.waitForTimeout(1200);
    const reloaded = await page.locator('[data-field="name"]').first().inputValue();
    const result = { id, editable: sample.length, dead, nameShown, stored: stored === name, reloaded: reloaded === name, errors };
    checked += 1;
    if (dead.length || !nameShown || stored !== name || reloaded !== name || errors.length) problems.push(result);
    console.log(`${dead.length || !nameShown || stored !== name || reloaded !== name || errors.length ? "✗" : "✓"} ${id}: ${sample.length} editable spots${dead.length ? `, dead: ${dead.join(" ")}` : ""}${nameShown ? "" : ", name not in preview"}${stored === name ? "" : `, db=${stored}`}${reloaded === name ? "" : `, reload=${reloaded}`}${errors.length ? `, errors: ${errors.join(" | ").slice(0, 200)}` : ""}`);
  } catch (error) {
    problems.push({ id, error: error.message.split("\n")[0] });
    console.log(`✗ ${id}: ${error.message.split("\n")[0]}`);
  }
  await page.close();
}
console.log(`\n${checked}/${ids.length} templates checked, ${problems.length} with problems`);
await browser.close();
