// Renders the Journal's cover images (1600×900 WebP) from marketing/blog-covers/cover.html
// into public/blog-covers/<slug>.webp, one per post listed below.
//   node scripts/marketing/blog-covers.mjs [slug,slug]
// Needs Playwright's Chromium (or CHROMIUM_PATH) and sharp.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = path.join(root, "public/blog-covers");

/** Each post's cover: short title (the article page shows the full one), the italic words, and which templates to show. */
export const COVERS = [
  {
    slug: "what-to-put-on-a-portfolio",
    category: "Portfolio strategy",
    title: "What to show when your work isn’t visual",
    accent: "isn’t visual",
    shots: "prospectus",
    address: "yourname.com",
    badge: "£140m raised|shown as numbers, not pictures",
  },
  {
    slug: "write-a-portfolio-introduction",
    category: "Writing",
    title: "An introduction people actually finish",
    accent: "actually finish",
    shots: "keynote",
    address: "yourname.com",
  },
  {
    slug: "portfolio-project-case-study",
    category: "Case studies",
    title: "A simple structure for a case study",
    accent: "case study",
    shots: "roadmap,roadmap",
    address: "yourname.com/work",
    badge: "Problem → work → result|in three short parts",
  },
  {
    slug: "choose-portfolio-template",
    category: "Design",
    title: "Choose a template that fits your work",
    accent: "fits your work",
    shots: "atelier,dispatch,radar",
    frame: "phones",
  },
  {
    slug: "own-domain-name-for-portfolio",
    category: "Getting online",
    title: "Why your portfolio needs your own domain",
    accent: "your own domain",
    shots: "clinic",
    address: "drferrer.com",
  },
  {
    slug: "portfolio-for-career-change",
    category: "Career",
    title: "A portfolio for changing careers",
    accent: "changing careers",
    shots: "practice,field-report",
    address: "yourname.com",
  },
  {
    slug: "keep-your-portfolio-up-to-date",
    category: "Workflow",
    title: "Keeping your portfolio up to date, easily",
    accent: "easily",
    shots: "annual-report",
    address: "yourname.com",
    badge: "Updated today|without starting again",
  },
  {
    slug: "portfolio-accessibility-basics",
    category: "Design",
    title: "Accessibility basics every portfolio needs",
    accent: "every portfolio",
    shots: "duet",
    address: "yourname.com",
  },
  {
    slug: "best-ai-for-writing-case-studies",
    category: "AI & writing",
    title: "The best AI for writing case studies",
    accent: "case studies",
    shots: "roadmap,contributions",
    address: "yourname.com/work",
  },
  {
    slug: "building-a-personal-portfolio-with-django",
    category: "Developers",
    title: "Building a personal portfolio with Django",
    accent: "with Django",
    shots: "terminal,terminal",
    address: "yourname.dev",
  },
];

const only = process.argv[2]?.split(",");
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
const template = pathToFileURL(path.join(root, "marketing/blog-covers/cover.html")).href;
for (const cover of COVERS.filter((item) => !only || only.includes(item.slug))) {
  const query = new URLSearchParams(
    Object.entries(cover).filter(([key]) => key !== "slug").map(([key, value]) => [key, String(value)]),
  );
  await page.goto(`${template}?${query}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const png = await page.screenshot();
  await sharp(png).webp({ quality: 86 }).toFile(path.join(out, `${cover.slug}.webp`));
  console.log("✓", cover.slug);
}
await browser.close();
