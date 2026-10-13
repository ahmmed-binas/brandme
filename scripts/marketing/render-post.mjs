// Renders a marketing HTML page (e.g. marketing/instagram/support-post.html) to a PNG beside it,
// at its body's size and 2x pixel density for sharp text.
//   node scripts/marketing/render-post.mjs marketing/instagram/support-post.html
// Needs Playwright's Chromium (or CHROMIUM_PATH).
import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";

const file = path.resolve(process.argv[2]);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(file).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const { width, height } = await page.evaluate(() => ({
  width: document.body.scrollWidth,
  height: document.body.scrollHeight,
}));
await page.setViewportSize({ width, height });
const out = file.replace(/\.html$/, ".png");
await page.screenshot({ path: out });
await browser.close();
console.log("✓", path.relative(process.cwd(), out));
