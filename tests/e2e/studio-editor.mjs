import { chromium } from "playwright";
import { encode } from "../../node_modules/@auth/core/jwt.js";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const BASE = process.env.BASE ?? "http://localhost:3300";
const S = process.env.S ?? new URL("./.out", import.meta.url).pathname;
const log = (...args) => console.log("•", ...args);
import { execSync } from "node:child_process";
// Studio templates must be approved before customers can open them.
const sql = (query) => execSync(`su postgres -c "psql -d formora -At -c \\"${query}\\""`).toString().trim();
for (const id of ["terminal", "specimen", "liner-notes", "swiss", "broadsheet"]) sql(`INSERT INTO template_reviews (template_id, status) VALUES ('${id}', 'approved') ON CONFLICT (template_id) DO UPDATE SET status = 'approved'`);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addCookies([{ name: "authjs.session-token", value: await encode({ token: { name: "Ines Test", email: "ines@example.com", providerAccountId: "google-studio-ines" }, secret: process.env.AUTH_SECRET, salt: "authjs.session-token" }), url: BASE }]);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error" && !/404|Failed to load resource/.test(message.text())) errors.push(message.text().slice(0, 3000)); });

await page.goto(`${BASE}/editor/terminal`);
await page.getByText("This is sample content").waitFor();
log("sample banner shown");
await page.screenshot({ path: `${S}/shots/studio-editor.png` });

// Click the name in the preview → the Name field is focused.
await page.locator("[data-edit='name']").first().click();
await page.waitForTimeout(400);
log("click-to-edit focused:", await page.evaluate(() => document.activeElement?.getAttribute("data-field")));

// Typing updates the preview.
await page.locator("[data-field='name']").fill("Grace Hopper");
await page.waitForTimeout(500);
log("preview shows new name:", await page.locator("[data-edit='name']").first().textContent());

// Click a project in the preview → that project opens in the list.
await page.locator("[data-edit='projects.1']").first().click();
await page.waitForTimeout(400);
log("project 2 opened:", await page.locator("[data-field='projects.1.title']").inputValue());
await page.locator("[data-field='projects.1.title']").fill("COBOL compiler");
await page.waitForTimeout(400);
log("preview project title:", (await page.locator("[data-edit='projects.1']").first().textContent())?.includes("COBOL compiler"));

// Upload an image to the project.
const chooser = page.waitForEvent("filechooser");
await page.locator("[data-field='projects.1']").getByRole("button", { name: /Replace|Upload/ }).first().click();
await (await chooser).setFiles(`${ROOT}/public/samples/photo-sea.webp`);
await page.waitForFunction(() => [...document.querySelectorAll("img")].some((img) => img.src.includes("/media/")), null, { timeout: 15000 });
log("uploaded image served from /media");

// Design: palette and fonts.
await page.getByRole("tab", { name: "Design" }).click();
await page.getByRole("button", { name: /Amber CRT/ }).click();
await page.waitForTimeout(400);
log("palette applied:", await page.locator(".studio-root").first().evaluate((node) => getComputedStyle(node).backgroundColor));
await page.getByRole("button", { name: /VT323/ }).click();
await page.getByRole("switch", { name: "Show Skills" }).click();
await page.waitForTimeout(500);
log("skills hidden:", !(await page.getByText("echo $STACK").isVisible().catch(() => false)));
await page.screenshot({ path: `${S}/shots/studio-editor-design.png` });

// Undo the hide, then redo it.
await page.getByRole("button", { name: "Undo" }).click();
await page.waitForTimeout(300);
log("undo restores skills:", await page.getByText("echo $STACK").isVisible());
await page.getByRole("button", { name: "Redo" }).click();

// Autosave reaches the account; reload keeps everything.
await page.getByText("Saved to your account").waitFor({ timeout: 15000 });
await page.reload();
await page.locator("[data-edit='name']").first().waitFor();
await page.waitForTimeout(800);
log("after reload name:", await page.locator("[data-edit='name']").first().textContent(), "| bg:", await page.locator(".studio-root").first().evaluate((node) => getComputedStyle(node).backgroundColor));

// Phone preview.
await page.getByRole("button", { name: "Preview on phone" }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${S}/shots/studio-editor-phone.png` });

// AI tab renders suggestions + assistant.
await page.getByRole("tab", { name: /AI/ }).click();
await page.getByText("Keep it up to date").waitFor({ timeout: 10000 }).catch(() => undefined);
log("suggestions panel:", await page.getByText("Keep it up to date").isVisible());

// Sections from other templates aren't offered on this one.
await page.getByRole("tab", { name: "Content" }).click();
log("terminal has no 'Services' section:", !(await page.locator("[data-section='services']").count()));
console.log("page errors:", errors.length ? errors : "none");
await browser.close();
