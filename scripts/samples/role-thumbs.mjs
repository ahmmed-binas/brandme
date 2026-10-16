// Captures the designs fanned at the top of a job page, filled with that job's
// sample content, into public/templates/roles/<job>/<template>.webp. Without
// these, the fan shows each design's own sample person (an accountant on the
// project manager page). Run it for the jobs people find us with (Search Console).
//   BASE=http://localhost:3100 node scripts/samples/role-thumbs.mjs project-manager,tiler
// Needs the production build running at BASE, and Edge (or CHROMIUM_PATH) and sharp.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const base = process.env.BASE ?? "http://localhost:3100";
const jobs = (process.argv[2] ?? "").split(",").filter(Boolean);
if (!jobs.length) {
  console.error("Name the jobs, e.g. project-manager,tiler");
  process.exit(1);
}

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: "msedge" },
);

/** The designs the job page fans out, in order (from its "Start with …" links). */
async function fanFor(job) {
  const page = await browser.newPage();
  await page.goto(`${base}/for/${job}`, { waitUntil: "domcontentloaded" });
  const ids = await page.$$eval("header a[href^='/editor/']", (links) =>
    links.map((link) => new URL(link.href).pathname.split("/")[2]),
  );
  await page.close();
  return [...new Set(ids)].slice(0, 3);
}

async function capture(job, id) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
  // Static capture: every moving effect shows its finished state.
  await page.addInitScript(() => {
    const mark = () => {
      if (document.documentElement) document.documentElement.dataset.static = "";
    };
    mark();
    document.addEventListener("readystatechange", mark);
  });
  await page.goto(`${base}/templates/${id}?sample=1&role=${job}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 960 } });
  const folder = path.join(root, "public/templates/roles", job);
  await mkdir(folder, { recursive: true });
  await sharp(png)
    .resize({ width: 960 })
    .webp({ quality: 80 })
    .toFile(path.join(folder, `${id}.webp`));
  await page.close();
}

for (const job of jobs) {
  const ids = await fanFor(job);
  for (const id of ids) await capture(job, id);
  console.log("✓", job, ids.join(", "));
}
await browser.close();
