import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3100";
const S = process.env.S ?? new URL("./.out", import.meta.url).pathname;
const log = (...args) => console.log("•", ...args);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

// Gallery: find a job title
await page.goto(`${BASE}/templatechooser`);
const finder = page.getByRole("combobox", { name: "What do you do?" });
await finder.fill("pediatr");
await page.getByRole("option", { name: /Paediatrician/ }).waitFor();
log("suggestions for 'pediatr':", (await page.locator("#role-suggestions li").allTextContents()).join(" | "));
await page.getByRole("option", { name: /Paediatrician/ }).click();
await page.waitForTimeout(400);
log("url:", page.url().split("?")[1], "| banner:", await page.getByText("Best designs for paediatricians first").isVisible());
log("first cards:", (await page.locator("ul li h2").allTextContents()).slice(0, 3).join(", "));
await page.screenshot({ path: `${S}/shots/roles-gallery.png` });
await finder.fill("nurse");
log("typing 'nurse' suggests:", (await page.locator("#role-suggestions li").allTextContents()).join(" | "));
await finder.fill("");
await page.getByRole("button", { name: /Stop showing templates for paediatricians/ }).click();
await finder.fill("plumber");
await finder.press("Enter");
await page.waitForTimeout(400);
log("enter picks plumber:", page.url().includes("role=plumber"), "| cards:", (await page.locator("ul li h2").allTextContents()).join(", "));

// Preview with a role
await page.goto(`${BASE}/templatepreview?template=clinic&role=paediatrician`);
const frame = page.frameLocator("iframe");
await frame.getByText("Consultant Paediatrician").first().waitFor({ timeout: 20000 });
log("preview iframe shows paediatrician:", true, "| newborn check:", await frame.getByText("Newborn check").first().isVisible());
log("preview-as chips:", (await page.locator("ul li a[href*='role=']").allTextContents()).slice(0, 8).join(", "));
await page.screenshot({ path: `${S}/shots/roles-preview.png` });

// Editor with a role, then switch role
await page.goto(`${BASE}/editor/clinic?role=paediatrician`);
await page.getByLabel("What you do").waitFor();
log("editor title:", await page.getByLabel("What you do").inputValue());
await page.getByLabel("Job title for the sample content").selectOption("dentist");
await page.waitForFunction(() => document.querySelector("input[data-field='professional_title'], input")?.value !== undefined);
await page.waitForTimeout(1200);
log("after switching to dentist:", await page.getByLabel("What you do").inputValue(), "| url role:", new URL(page.url()).searchParams.get("role"));
await page.screenshot({ path: `${S}/shots/roles-editor.png` });

// Job-title pages
await page.goto(`${BASE}/for`);
log("job titles index links:", await page.locator("a[href^='/for/']").count());
await page.goto(`${BASE}/for/sales-manager`);
log("sales manager h1:", (await page.locator("h1").textContent()).trim(), "| designs:", (await page.locator("li h3").allTextContents()).join(", "));
await page.screenshot({ path: `${S}/shots/roles-landing.png`, fullPage: true });
log("unknown role page:", (await page.goto(`${BASE}/for/astronaut-chef`)).status());
log("unknown role api:", (await page.request.get(`${BASE}/api/samples?template=clinic&role=nope`)).status());
const sitemap = await (await page.request.get(`${BASE}/sitemap.xml`)).text();
log("sitemap has /for/paediatrician:", sitemap.includes("/for/paediatrician"));

// Every role renders its own title in its first suggested design
const roles = await (await page.request.get(`${BASE}/for`)).text();
const ids = [...roles.matchAll(/href="\/for\/([a-z-]+)"/g)].map((match) => match[1]);
let ok = 0; const bad = [];
for (const id of ids) {
  const landing = await (await page.request.get(`${BASE}/for/${id}`)).text();
  const template = landing.match(/templatepreview\?template=([a-z-]+)&amp;role=/)?.[1];
  if (!template) { bad.push(`${id}: no design`); continue; }
  const sample = await (await page.request.get(`${BASE}/api/samples?template=${template}&role=${id}`)).json();
  const html = await (await page.request.get(`${BASE}/templates/${template}?sample=1&role=${id}`)).text();
  const title = sample.content.professional_title.replace(/&/g, "&amp;").replace(/’/g, "’");
  if (html.includes(title) || html.includes(sample.content.professional_title)) ok++; else bad.push(`${id} on ${template}`);
}
log(`roles rendering their title: ${ok}/${ids.length}`, bad.length ? "| problems: " + bad.join("; ") : "");
console.log("page errors:", errors.length ? errors.join(" | ") : "none");
await browser.close();
