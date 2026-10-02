import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3200";
const S = process.env.S ?? new URL("./.out", import.meta.url).pathname;
const log = (...args) => console.log("•", ...args);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const scrollTo = async (y) => { await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y); await page.waitForTimeout(450); };

// Residence: listings travel sideways while the page scrolls down.
await page.goto(`${BASE}/templates/residence?sample=1`, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${S}/shots/motion-residence-hero.png` });
const homes = page.locator("#homes .will-change-transform");
const homesTop = await page.locator("#homes").evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
const shifts = [];
for (const extra of [500, 1100, 1700]) { await scrollTo(homesTop + extra); shifts.push(await homes.evaluate((node) => node.style.transform)); }
log("residence track transforms:", shifts.join(" → "));
await page.screenshot({ path: `${S}/shots/motion-residence-track.png` });
const counted = await page.locator("section").nth(1).innerText();
log("stats after counting:", counted.replace(/\s+/g, " ").slice(0, 80));

// Margin Notes: the pinned story changes step as you scroll.
await page.goto(`${BASE}/templates/margin-notes?sample=1`, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(1200);
const yearTop = await page.locator("#year").evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
const stepsSeen = [];
for (const extra of [300, 1000, 1700]) { await scrollTo(yearTop + extra); stepsSeen.push(await page.locator("#year h3").first().textContent()); }
log("margin notes steps:", stepsSeen.join(" → "));
await page.screenshot({ path: `${S}/shots/motion-margin-step.png` });

// Counsel: matters stack (sticky) and the outcomes ticker moves.
await page.goto(`${BASE}/templates/counsel?sample=1`, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(1200);
const ticker = page.locator("[class*='studio-marquee']").first();
const t1 = await ticker.evaluate((node) => getComputedStyle(node).transform); await page.waitForTimeout(800);
const t2 = await ticker.evaluate((node) => getComputedStyle(node).transform);
log("counsel ticker moving:", t1 !== t2);
const mattersTop = await page.locator("#matters").evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
await scrollTo(mattersTop + 900);
const tops = await page.locator("#matters article").evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().top)));
log("counsel stacked card tops:", tops.join(", "));
await page.screenshot({ path: `${S}/shots/motion-counsel-stack.png` });

// Inside the editor: motion follows the preview panel, not the window.
await page.goto(`${BASE}/editor/residence`, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(1500);
const panelShift = await page.evaluate(async () => {
  const track = document.querySelector("#homes .will-change-transform");
  if (!track) return "no pinned track (narrow preview)";
  let parent = track.parentElement; while (parent && !(/(auto|scroll)/.test(getComputedStyle(parent).overflowY) && parent.scrollHeight > parent.clientHeight)) parent = parent.parentElement;
  const homes = document.querySelector("#homes"); parent.scrollTop = homes.offsetTop + 900;
  await new Promise((resolve) => setTimeout(resolve, 400));
  return track.style.transform;
});
log("editor preview track transform after panel scroll:", panelShift);

// Reduced motion: final states, no pinning.
const calm = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await calm.goto(`${BASE}/templates/margin-notes?sample=1`, { waitUntil: "networkidle", timeout: 120000 });
await calm.waitForTimeout(800);
log("reduced motion: steps listed:", await calm.locator("#year ol li").count(), "| pinned panel:", await calm.locator("#year .sticky").count());
console.log("page errors:", errors.length ? errors.join(" | ") : "none");
await browser.close();
