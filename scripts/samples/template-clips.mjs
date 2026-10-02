// Records the short square clips the gallery plays: each template with its
// sample person, holding on the first screen and then scrolling slowly down.
// Writes public/gallery/<id>.webm (VP9), <id>.mp4 (H.264 fallback), both silent, and <id>.webp (poster).
//   BASE=http://localhost:3000 node scripts/samples/template-clips.mjs [id,id]
// Needs the app running (with TEMPLATES_REQUIRE_APPROVAL=false to include
// unapproved designs), Playwright's Chromium (or CHROMIUM_PATH) and ffmpeg.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = path.join(root, "public/gallery");
const base = process.env.BASE ?? "http://localhost:3000";
const source = await readFile(path.join(root, "lib/templates/studio-catalog.ts"), "utf8");
const all = [...source.matchAll(/\{ id: "([a-z-]+)"/g)].map((match) => match[1]);
const only = process.argv[2]?.split(",");
const SIZE = 1200; // viewport, square
const VIDEO = 640; // recorded size
const HOLD = 1400; // ms on the first screen
const SCROLL = 6200; // ms of scrolling
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
for (const id of only ?? all) {
  const tmp = path.join(os.tmpdir(), `clip-${id}`);
  await rm(tmp, { recursive: true, force: true });
  const context = await browser.newContext({ viewport: { width: SIZE, height: SIZE }, recordVideo: { dir: tmp, size: { width: VIDEO, height: VIDEO } } });
  const page = await context.newPage();
  const started = Date.now();
  await page.goto(`${base}/templates/${id}?sample=1`, { waitUntil: "networkidle", timeout: 120000 });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important} ::-webkit-scrollbar{display:none}" });
  await page.evaluate(() => document.querySelectorAll("img[loading=lazy]").forEach((img) => { img.loading = "eager"; }));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  const begin = (Date.now() - started) / 1000;
  await page.waitForTimeout(HOLD);
  // One smooth, eased scroll down about two screens, like someone browsing.
  await page.evaluate((duration) => new Promise((resolve) => {
    const distance = Math.min(document.documentElement.scrollHeight - innerHeight, innerHeight * 2.2);
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      window.scrollTo({ top: distance * eased, behavior: "instant" });
      if (t < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  }), SCROLL);
  await page.waitForTimeout(700);
  await context.close();
  const webm = path.join(tmp, (await readdir(tmp)).find((name) => name.endsWith(".webm")));
  const length = (HOLD + SCROLL + 700) / 1000;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(begin), "-i", webm, "-t", String(length), "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "30", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path.join(out, `${id}.mp4`)]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(out, `${id}.mp4`), "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "40", "-row-mt", "1", "-deadline", "good", path.join(out, `${id}.webm`)]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", "0.2", "-i", path.join(out, `${id}.mp4`), "-frames:v", "1", "-c:v", "libwebp", "-quality", "72", path.join(out, `${id}.webp`)]);
  await rm(tmp, { recursive: true, force: true });
  console.log("✓", id);
}
await browser.close();
