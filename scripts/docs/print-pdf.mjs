// Prints an HTML document to a PDF next to it, with the same name.
//
//   node scripts/docs/print-pdf.mjs docs/plans/voice-tool-how-it-works.html
//
// Uses Playwright with Microsoft Edge (installed on every Windows PC), or Playwright's
// own Chromium elsewhere.
import { chromium } from "playwright";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const input = process.argv[2];
if (!input) {
  console.error("Give the HTML file to print, e.g. docs/plans/report.html");
  process.exit(1);
}
const output = resolve(input).replace(/\.html?$/i, ".pdf");

const browser = await chromium.launch({ channel: "msedge" }).catch(() => chromium.launch());
const page = await browser.newPage();
await page.goto(pathToFileURL(resolve(input)).href, { waitUntil: "networkidle" });
// Margins come from the document's own @page rule.
await page.pdf({ path: output, format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log(`Saved ${output}`);
