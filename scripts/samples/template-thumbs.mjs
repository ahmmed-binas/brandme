// Captures gallery thumbnails of every template with its sample person into
// public/templates/<id>.webp (desktop) and <id>-phone.webp (phone).
//   BASE=http://localhost:3000 node scripts/samples/template-thumbs.mjs [id,id]
// Needs the app running, Playwright's Chromium (or CHROMIUM_PATH) and sharp.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = path.join(root, "public/templates");
const base = process.env.BASE ?? "http://localhost:3000";
const source = await readFile(path.join(root, "lib/templates/studio-catalog.ts"), "utf8");
const all = ["editorial-developer", "template-one", "kinetic-portfolio", ...[...source.matchAll(/\{ id: "([a-z-]+)"/g)].map((match) => match[1])];
const only = process.argv[2]?.split(",");
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
for (const id of only ?? all) {
  for (const [suffix, width, height, outWidth] of [["", 1440, 960, 960], ["-phone", 390, 780, 390]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.addInitScript(() => { const mark = () => { if (document.documentElement) document.documentElement.dataset.static = ""; }; mark(); document.addEventListener("readystatechange", mark); });
    await page.goto(`${base}/templates/${id}?sample=1${id === "kinetic-portfolio" || id === "template-one" ? "&demo=true" : ""}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all([...document.images].map((img) => img.complete ? null : new Promise((resolve) => { img.onload = img.onerror = resolve; setTimeout(resolve, 4000); }))));
    // Hide the Next.js dev indicator if present.
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await page.waitForTimeout(500);
    const png = await page.screenshot({ clip: { x: 0, y: 0, width, height } });
    await sharp(png).resize({ width: outWidth }).webp({ quality: 72 }).toFile(path.join(out, `${id}${suffix}.webp`));
    await page.close();
  }
  console.log("✓", id);
}
await browser.close();
