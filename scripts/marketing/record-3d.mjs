#!/usr/bin/env node
/**
 * Records a 3D template being played with, as a phone screen (1080×1920, 30 fps),
 * for TikTok and Reels. The page's clock is faked and stepped one frame at a
 * time, and every frame is a sharp screenshot, so the 3D motion is perfectly
 * smooth however slow the screenshots are. Mouse drags and taps happen between
 * frames, exactly as a visitor would do them.
 *
 *   BASE=http://localhost:3200 node scripts/marketing/record-3d.mjs <shot> <out.mp4>
 *
 * Shots are defined below (lane, studio-desk, control-room). Needs the app
 * running with unapproved templates visible, Chrome (CHROMIUM_PATH) and ffmpeg.
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const base = process.env.BASE ?? "http://localhost:3000";
const FPS = 30;
const WIDTH = 360;
const HEIGHT = 640;
const SCALE = 3; // 1080×1920 frames

/** Where on the 3D canvas, as fractions of its box. */
const at = (box, x, y) => [box.x + box.width * x, box.y + box.height * y];

/**
 * Each shot: the template, how far to scroll so the 3D sits well in frame,
 * its length, and what the "visitor" does on each frame.
 */
const SHOTS = {
  lane: {
    id: "lane",
    scroll: 0,
    seconds: 6.5,
    async act(page, frame, box) {
      // Drive for a second, drag the car over two lanes, let go, then tap to park.
      if (frame === 30) await page.mouse.move(...at(box, 0.5, 0.55));
      if (frame === 31) await page.mouse.down();
      if (frame > 31 && frame <= 70) await page.mouse.move(...at(box, 0.5 - (frame - 31) * 0.009, 0.55 + (frame - 31) * 0.008));
      if (frame === 71) await page.mouse.up();
      if (frame === 150) {
        await page.mouse.move(...at(box, 0.5, 0.5));
        await page.mouse.down();
        await page.mouse.up();
      }
    },
  },
  "studio-desk": {
    id: "studio-desk",
    scroll: "canvas",
    seconds: 7,
    async act(page, frame, box) {
      // Tap three objects on the desk in turn.
      const taps = { 25: [0.72, 0.42], 85: [0.3, 0.6], 150: [0.5, 0.48] };
      if (taps[frame]) {
        await page.mouse.move(...at(box, ...taps[frame]));
        await page.mouse.down();
        await page.mouse.up();
      }
    },
  },
  "control-room": {
    id: "control-room",
    scroll: "canvas",
    seconds: 5,
    async act(page, frame, box) {
      // Spin the turntable with a long drag.
      if (frame === 20) {
        await page.mouse.move(...at(box, 0.8, 0.6));
        await page.mouse.down();
      }
      if (frame > 20 && frame <= 70) await page.mouse.move(...at(box, 0.8 - (frame - 20) * 0.012, 0.6));
      if (frame === 71) await page.mouse.up();
    },
  },
};

const [name, out] = process.argv.slice(2);
const shot = SHOTS[name];
if (!shot || !out) {
  console.error(`Usage: record-3d.mjs <${Object.keys(SHOTS).join("|")}> <out.mp4>`);
  process.exit(1);
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: SCALE,
  isMobile: true,
  hasTouch: false,
});
await page.clock.install({ time: new Date("2026-10-14T10:00:00") });
await page.goto(`${base}/templates/${shot.id}?sample=1`, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
// Let fonts, images and three.js load in real time while the fake clock runs on.
for (let i = 0; i < 20; i++) {
  await page.clock.runFor(100);
  await page.waitForTimeout(150);
}
const canvas = page.locator("canvas").first();
await canvas.waitFor();
if (shot.scroll === "canvas") {
  await page.evaluate(() => {
    const element = document.querySelector("canvas");
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, Math.max(0, top - 150));
  });
  await page.clock.runFor(500);
}
const box = await canvas.boundingBox();

const tmp = path.join(os.tmpdir(), `kitefolio-3d-${name}`);
await rm(tmp, { recursive: true, force: true });
await mkdir(tmp, { recursive: true });
const frames = Math.round(shot.seconds * FPS);
for (let frame = 0; frame < frames; frame++) {
  await shot.act(page, frame, box);
  await page.clock.runFor(1000 / FPS);
  await page.screenshot({ path: path.join(tmp, `${String(frame).padStart(4, "0")}.png`) });
}
await browser.close();

execFileSync(
  "ffmpeg",
  [
    "-y", "-v", "error", "-framerate", String(FPS), "-i", path.join(tmp, "%04d.png"),
    "-vf", "scale=1080:1920:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-crf", "14",
    "-pix_fmt", "yuv420p", out,
  ],
  { stdio: "inherit" },
);
await rm(tmp, { recursive: true, force: true });
console.log("✓", out, `${shot.seconds}s`);
