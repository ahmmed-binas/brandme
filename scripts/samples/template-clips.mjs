// Records the short square clips the gallery plays: each template with its
// sample person, holding on the first screen and then scrolling slowly down.
// Writes public/gallery/<id>.webm (VP9), <id>.mp4 (H.264 fallback), both silent, and <id>.webp (poster).
// Each frame is a sharp screenshot (not a screen recording, which came out blurry at 640 px),
// so text stays crisp when the clip fills the article page on a Retina screen.
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
const all = [...source.matchAll(/^\s*id: "([a-z-]+)",$/gm)].map((match) => match[1]);
const only = process.argv[2]?.split(",");
const SIZE = 1200; // viewport, square
const SCALE = 1.5; // screenshots at 1800 px, sharp after scaling to VIDEO
const VIDEO = 1440; // clip size
const FPS = 30;
const HOLD = 1.4; // seconds on the first screen
const SCROLL = 6.2; // seconds of scrolling
const TAIL = 0.7; // seconds held at the end
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
/** Scroll position at time t: hold, one eased scroll of about two screens, then hold. */
function scrollAt(t, distance) {
  const x = Math.min(1, Math.max(0, (t - HOLD) / SCROLL));
  const eased = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  return Math.round(distance * eased);
}

for (const id of only ?? all) {
  const tmp = path.join(os.tmpdir(), `clip-${id}`);
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  const page = await browser.newPage({
    viewport: { width: SIZE, height: SIZE },
    deviceScaleFactor: SCALE,
  });
  // Static mode: entrance animations would otherwise replay or leave blanks between frames.
  await page.addInitScript(() => {
    const mark = () => {
      if (document.documentElement) document.documentElement.dataset.static = "";
    };
    mark();
    document.addEventListener("readystatechange", mark);
  });
  await page.goto(`${base}/templates/${id}?sample=1`, { waitUntil: "networkidle", timeout: 120000 });
  await page.addStyleTag({
    content: "nextjs-portal{display:none!important} ::-webkit-scrollbar{display:none}",
  });
  await page.evaluate(() =>
    document.querySelectorAll("img[loading=lazy]").forEach((img) => {
      img.loading = "eager";
    }),
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  const distance = await page.evaluate(() =>
    Math.min(document.documentElement.scrollHeight - innerHeight, innerHeight * 2.2),
  );
  const frames = Math.round((HOLD + SCROLL + TAIL) * FPS);
  let last = null;
  for (let frame = 0; frame < frames; frame++) {
    const top = scrollAt(frame / FPS, distance);
    if (top !== last) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())));
    }
    last = top;
    await page.screenshot({ path: path.join(tmp, `${String(frame).padStart(4, "0")}.png`) });
  }
  await page.close();
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-framerate",
    String(FPS),
    "-i",
    path.join(tmp, "%04d.png"),
    "-vf",
    `scale=${VIDEO}:${VIDEO}:flags=lanczos`,
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "23",
    "-tune",
    "stillimage",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    path.join(out, `${id}.mp4`),
  ]);
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-i",
    path.join(out, `${id}.mp4`),
    "-an",
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "0",
    "-crf",
    "36",
    "-row-mt",
    "1",
    "-deadline",
    "good",
    path.join(out, `${id}.webm`),
  ]);
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-i",
    path.join(tmp, "0000.png"),
    "-vf",
    `scale=${VIDEO}:${VIDEO}:flags=lanczos`,
    "-frames:v",
    "1",
    "-c:v",
    "libwebp",
    "-quality",
    "82",
    path.join(out, `${id}.webp`),
  ]);
  await rm(tmp, { recursive: true, force: true });
  console.log("✓", id);
}
await browser.close();
