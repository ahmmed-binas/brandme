// Makes Kitefolio's social images in marketing/brand/ with the real brand fonts
// (run: node scripts/marketing/brand-images.mjs; uses the Edge browser on this PC):
//   profile.png   1080×1080 profile picture (Instagram, TikTok, LinkedIn, X, WhatsApp)
//   banner.png    1500×500 cover (X, LinkedIn)
//   post.png      1080×1350 announcement post
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const require = createRequire(process.cwd() + "/package.json");
const { chromium } = require("playwright");
const root = process.cwd();
const outDir = join(root, "marketing", "brand");
mkdirSync(outDir, { recursive: true });

const font = (path) => pathToFileURL(join(root, "node_modules", path)).href;
const bricolage = font("@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2");

const kite = (ink, gold, pale) => `
<svg viewBox="0 0 48 48" class="kite" aria-hidden="true">
  <path d="M24 1.6 L37.6 15 L24 33.4 L10.4 15 Z" fill="none" stroke="${ink}" stroke-width="1.1" stroke-linejoin="round"/>
  <path d="M23.2 4.4 L13.2 14.2 L23.2 14.2 Z" fill="${gold}"/>
  <path d="M24.8 4.4 L34.8 14.2 L24.8 14.2 Z" fill="${ink}"/>
  <path d="M13.2 15.8 L23.2 15.8 L23.2 30 Z" fill="${ink}"/>
  <path d="M24.8 15.8 L34.8 15.8 L24.8 30 Z" fill="${pale}"/>
  <circle cx="24" cy="15" r="1.5" fill="${gold}"/>
  <path d="M24 33.4 C 20.6 36.4, 27.6 38.6, 24.2 41.6 S 27 45, 25.4 47.4" fill="none" stroke="${ink}" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M20.8 35.6 L23.3 36.9 L20.8 38.2 Z M25.8 35.6 L23.3 36.9 L25.8 38.2 Z" fill="${gold}"/>
  <path d="M22.1 39.9 L24.6 41.2 L22.1 42.5 Z M27.1 39.9 L24.6 41.2 L27.1 42.5 Z" fill="${pale}"/>
  <path d="M23.7 43.9 L26.1 45.1 L23.7 46.3 Z M28.5 43.9 L26.1 45.1 L28.5 46.3 Z" fill="${gold}"/>
</svg>`;

const DARK = kite("#f4f0e8", "#e0a43a", "#a8742a");
const LIGHT = kite("#15140f", "#c4851c", "#e8c27a");

const page = (width, height, body) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Bricolage; src: url("${bricolage}") format("woff2"); font-weight: 200 800; }
* { margin: 0; box-sizing: border-box; }
html, body { width: ${width}px; height: ${height}px; }
body { font-family: Bricolage, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; }
.kite { display: block; }
.word { font-weight: 500; letter-spacing: -0.035em; line-height: 1; }
</style></head><body>${body}</body></html>`;

const IMAGES = [
  {
    name: "profile",
    width: 1080,
    height: 1080,
    // Kept inside the middle circle, since most apps crop profile pictures round.
    html: `<div style="width:100%;height:100%;background:#15140f;display:flex;align-items:center;justify-content:center">
      <div style="width:640px;height:640px">${DARK}</div></div>`,
  },
  {
    name: "banner",
    width: 1500,
    height: 500,
    html: `<div style="width:100%;height:100%;background:#f4f0e8;color:#15140f;display:flex;align-items:center;gap:56px;padding:0 120px">
      <div style="width:260px;height:260px;flex-shrink:0">${LIGHT}</div>
      <div><div class="word" style="font-size:140px">kitefolio</div>
      <div style="font-size:38px;margin-top:22px;color:#57534a;letter-spacing:-0.01em">Your website, made for your job. Free to start.</div></div></div>`,
  },
  {
    name: "post",
    width: 1080,
    height: 1350,
    html: `<div style="width:100%;height:100%;background:#15140f;color:#f4f0e8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:56px;text-align:center;padding:80px">
      <div style="width:460px;height:460px">${DARK}</div>
      <div class="word" style="font-size:150px">kitefolio</div>
      <div style="font-size:46px;color:#f4f0e8b3;letter-spacing:-0.01em;max-width:820px">Your website, made for your job.<br/>kitefolio.com</div></div>`,
  },
];

const browser = await chromium.launch({ channel: "msedge" });
for (const image of IMAGES) {
  const file = join(outDir, `${image.name}.html`);
  writeFileSync(file, page(image.width, image.height, image.html));
  const tab = await browser.newPage({ viewport: { width: image.width, height: image.height } });
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({ path: join(outDir, `${image.name}.png`) });
  await tab.close();
  console.log(`${image.name}.png ${image.width}×${image.height}`);
}
await browser.close();
