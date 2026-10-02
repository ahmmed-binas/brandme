import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const BASE = process.env.BASE ?? "http://localhost:3100";
const source = readFileSync(`${ROOT}/lib/templates/studio-catalog.ts`, "utf8");
const ids = ["editorial-developer", "template-one", "kinetic-portfolio", ...[...source.matchAll(/\{ id: "([a-z-]+)"/g)].map((m) => m[1])];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const bad = []; let ok = 0;
for (const id of ids) {
  const errors = [];
  const onError = (error) => errors.push(error.message.slice(0, 120));
  page.on("pageerror", onError);
  const started = Date.now();
  await page.goto(`${BASE}/templatepreview?template=${id}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  const frame = page.frameLocator("iframe");
  try {
    await frame.locator("body").waitFor({ timeout: 20000 });
    await page.waitForFunction(() => { const doc = document.querySelector("iframe")?.contentDocument; return doc && (doc.body?.innerText ?? "").trim().length > 200; }, null, { timeout: 25000 });
    ok++;
    const ms = Date.now() - started;
    if (ms > 6000) bad.push(`${id}: slow ${ms}ms`);
  } catch { bad.push(`${id}: empty preview`); }
  page.off("pageerror", onError);
  if (errors.length) bad.push(`${id}: ${errors.join(" | ")}`);
}
console.log(`previews rendering: ${ok}/${ids.length}`);
console.log(bad.length ? bad.join("\n") : "no problems");
await browser.close();
