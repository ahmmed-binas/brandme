// Records vertical (9:16, 1080×1920) marketing clips of templates for TikTok,
// Reels and Shorts: a phone-sized visit that holds on the hero, scrolls, and
// uses each template's interactive parts (currency switch, mortgage sliders,
// saved homes, the floor picker…). Silent; add music in the app you post from.
// Writes marketing/clips/<id>.mp4 (not shipped with the site).
//   BASE=http://localhost:3000 node scripts/samples/tiktok-clips.mjs [id,id]
// Needs the app running (with TEMPLATES_REQUIRE_APPROVAL=false for unapproved
// designs), a Chromium browser (CHROMIUM_PATH, or BROWSER_CHANNEL=msedge|chrome) and ffmpeg.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = path.join(root, "marketing/clips");
const base = process.env.BASE ?? "http://localhost:3000";
const W = 432, H = 768; // CSS pixels; recorded at 2.5× for 1080×1920

/** Smoothly scrolls the page by `by` pixels over `ms`. */
const glide = (page, by, ms = 1600) => page.evaluate(([distance, duration]) => new Promise((resolve) => {
  const from = scrollY, start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    scrollTo({ top: from + distance * (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), behavior: "instant" });
    if (t < 1) requestAnimationFrame(step); else resolve();
  };
  requestAnimationFrame(step);
}), [by, ms]);
/** Brings an element to the middle of the screen with a smooth scroll. */
const to = async (page, selector, ms = 1400) => {
  const y = await page.evaluate((s) => { const node = document.querySelector(s); return node ? node.getBoundingClientRect().top + node.getBoundingClientRect().height / 2 - innerHeight / 2 : null; }, selector);
  if (y !== null) await glide(page, y, ms);
};
/** Moves a range slider to a value the way a finger would, firing React's input events. */
const slide = (page, index, values, ms = 900) => page.evaluate(async ([i, list, duration]) => {
  const input = document.querySelectorAll('input[type="range"]')[i];
  if (!input) return;
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  for (const value of list) {
    const from = Number(input.value), start = performance.now();
    await new Promise((resolve) => {
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        set.call(input, String(Math.round((from + (value - from) * t) / Number(input.step || 1)) * Number(input.step || 1)));
        input.dispatchEvent(new Event("input", { bubbles: true }));
        if (t < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  }
}, [index, values, ms]);
const tap = async (page, locator, wait = 900) => { const target = page.locator(locator).first(); if (await target.count()) { await target.scrollIntoViewIfNeeded(); await target.click(); } await page.waitForTimeout(wait); };

/** What each clip does after the opening hold. Templates without a script just scroll. */
const SCRIPTS = {
  skyline: async (page) => {
    await glide(page, H * 1.1);
    for (const code of ["USD", "GBP", "EUR"]) await tap(page, `[role=radio]:has-text("${code}")`, 1100);
    await glide(page, H * 2.6, 3200);
    await to(page, 'input[type="range"]'); await slide(page, 1, [9.5, 5]);
    await to(page, "#gallery"); await tap(page, "#gallery button", 1300);
    await page.keyboard.press("ArrowRight"); await page.waitForTimeout(1100); await page.keyboard.press("ArrowRight"); await page.waitForTimeout(1100); await page.keyboard.press("Escape");
    await to(page, "#contact", 1800); await page.waitForTimeout(1200);
  },
  manor: async (page) => {
    await glide(page, H * 1.6, 2200);
    await to(page, "#particulars"); await glide(page, H * 2, 2600);
    await to(page, "#villages"); for (const name of ["Bibury", "Painswick"]) await tap(page, `#villages button:has-text("${name}")`, 1500);
    await to(page, "#valuation", 1600);
    await page.locator("#valuation input").first().pressSequentially("Sarah Lane", { delay: 70 });
    await page.locator("#valuation input").nth(1).pressSequentially("OX18 4RE", { delay: 90 });
    await page.waitForTimeout(1200);
  },
  "front-door": async (page) => {
    await glide(page, H * 0.9, 2400); await page.waitForTimeout(500);
    await to(page, "#afford"); await slide(page, 0, [900000, 450000], 1100); await slide(page, 1, [25], 900); await tap(page, 'button:has-text("15 yrs")', 900);
    await to(page, "#homes", 1400);
    const hearts = page.locator('#homes button[aria-label^="Save"]');
    for (let i = 0; i < 3 && i < await hearts.count(); i++) { await hearts.nth(0).scrollIntoViewIfNeeded(); await hearts.nth(0).click(); await page.waitForTimeout(700); }
    await page.waitForTimeout(1500);
  },
  shoreline: async (page) => {
    await page.waitForTimeout(800);
    await glide(page, H * 3, 4200);
    await to(page, 'input[type="range"]'); await slide(page, 0, [900, 1400], 1000); await slide(page, 1, [30], 900);
    await to(page, "#places", 1400); await page.waitForTimeout(1600);
  },
  "off-plan": async (page) => {
    await page.waitForTimeout(1500);
    await to(page, "#progress", 1400); await page.waitForTimeout(1200);
    await to(page, "#availability", 1400);
    const floors = page.locator('ol[aria-label="Floors"] button');
    for (const i of [6, 3, 1, 0]) { if (await floors.count() > i) { await floors.nth(i).click(); await page.waitForTimeout(1000); } }
    await to(page, "#register", 2000); await page.waitForTimeout(1200);
  },
};

await mkdir(out, { recursive: true });
const only = process.argv[2]?.split(",");
const ids = only ?? Object.keys(SCRIPTS);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: process.env.BROWSER_CHANNEL ?? "chrome" });
for (const id of ids) {
  const tmp = path.join(os.tmpdir(), `tiktok-${id}`);
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  // A real phone viewport at 2.5× pixel density, captured frame by frame from the
  // browser, so the layout is exactly a phone's and the video is sharp at 1080×1920.
  const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2.5 });
  const page = await context.newPage();
  await page.goto(`${base}/templates/${id}?sample=1`, { waitUntil: "networkidle", timeout: 180000 });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important} ::-webkit-scrollbar{display:none} *{scrollbar-width:none}" });
  await page.evaluate(() => document.querySelectorAll("img[loading=lazy]").forEach((img) => { img.loading = "eager"; }));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  // Run down the page once off camera so every photo is loaded and decoded.
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } });
  await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode().catch(() => {}))));
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(1200);
  const cdp = await context.newCDPSession(page);
  const frames = [];
  let writing = Promise.resolve();
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    const file = path.join(tmp, `${String(frames.length).padStart(5, "0")}.jpg`);
    frames.push({ file, time: metadata.timestamp });
    writing = writing.then(() => writeFile(file, Buffer.from(data, "base64")));
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W * 2.5, maxHeight: H * 2.5, everyNthFrame: 1 });
  await page.waitForTimeout(1800); // hold on the hero
  await (SCRIPTS[id] ?? (async (p) => glide(p, H * 4, 8000)))(page);
  await page.waitForTimeout(400);
  await cdp.send("Page.stopScreencast");
  const end = Date.now() / 1000;
  await writing;
  await context.close();
  // Frames arrive only when something changes, so each one is held until the next.
  const posix = (file) => file.split(path.sep).join("/");
  const list = frames.map((frame, index) => `file '${posix(frame.file)}'\nduration ${Math.max(0.001, (frames[index + 1]?.time ?? end) - frame.time).toFixed(4)}`).join("\n");
  await writeFile(path.join(tmp, "frames.txt"), `ffconcat version 1.0\n${list}\nfile '${posix(frames.at(-1).file)}'\n`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(tmp, "frames.txt"), "-vf", "scale=1080:1920:flags=lanczos,fps=30", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path.join(out, `${id}.mp4`)]);
  const length = end - frames[0].time;
  await rm(tmp, { recursive: true, force: true });
  console.log("✓", id, `${length.toFixed(1)}s`);
}
await browser.close();
