import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { encode } from "../../node_modules/@auth/core/jwt.js";

const BASE = "http://localhost:3100";
const shots = process.env.SHOTS;
const log = (...args) => console.log("•", ...args);

// Start from a clean account (domains.mjs uses the same one and leaves it published).
execSync(`su postgres -c "psql -d formora -At -c \\"DELETE FROM app_users WHERE provider_account_id = 'google-test-1'\\""`);
const token = await encode({
  token: { name: "Test User", email: "test@example.com", providerAccountId: "google-test-1", sub: "x" },
  secret: process.env.AUTH_SECRET,
  salt: "authjs.session-token",
});

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const errors = [];

// 1) Signed-out editor: edits persist on the device, list fields accept commas.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (error) => errors.push(`signed-out: ${error.message}`));
  await page.goto(`${BASE}/editor/template-one`);
  await page.getByText("Saved on this device only").waitFor({ timeout: 15000 }).catch(() => {});
  const name = page.locator('[data-editor-field="name"]');
  await name.fill("Ada Lovelace");
  const skills = page.locator('[data-editor-field="skills"] input');
  await skills.click();
  await skills.fill("");
  await skills.pressSequentially("Math, Engines, Poetry");
  log("skills input while typing:", await skills.inputValue());
  await page.waitForTimeout(800);
  await page.reload();
  await page.locator('[data-editor-field="name"]').waitFor();
  await page.waitForTimeout(500);
  log("name after reload (signed out):", await page.locator('[data-editor-field="name"]').inputValue());
  // Clearing a field must stay cleared after reload (used to revert to sample data).
  await page.locator('[data-editor-field="professional-title"]').fill("");
  await page.waitForTimeout(800);
  await page.reload();
  await page.waitForTimeout(800);
  log("cleared title after reload:", JSON.stringify(await page.locator('[data-editor-field="professional-title"]').inputValue()));
  await page.getByRole("button", { name: /Publish/ }).click();
  log("publish dialog when signed out shows:", await page.getByRole("link", { name: "Sign in to publish" }).isVisible());
  if (shots) await page.screenshot({ path: `${shots}/editor-desktop.png` });
  await page.close();
}

// 2) Signed-in: local draft uploads, publish, view public page, unpublish.
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addCookies([{ name: "authjs.session-token", value: token, url: BASE }]);
{
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(`signed-in: ${error.message}`));
  await page.goto(`${BASE}/editor/template-one`);
  await page.getByText("Saved to your account").waitFor({ timeout: 15000 });
  await page.locator('[data-editor-field="name"]').fill("Ada Lovelace");
  await page.locator('[data-editor-field="professional-title"]').fill("Analyst & Writer");
  await page.getByText("Saving…").waitFor({ timeout: 5000 }).catch(() => {});
  await page.getByText("Saved to your account").waitFor({ timeout: 10000 });
  log("cloud save status shown");

  await page.getByRole("button", { name: /Publish/ }).click();
  const address = page.getByPlaceholder("your-name");
  log("suggested address:", await address.inputValue());
  await address.fill("javascript");
  await address.fill("ada-lovelace");
  await page.getByRole("button", { name: "Publish portfolio" }).click();
  await page.getByText("Visitors see your latest version").waitFor({ timeout: 10000 });
  log("published");
  if (shots) await page.screenshot({ path: `${shots}/publish-dialog.png` });
  await page.keyboard.press("Escape");

  // A later edit must not go live until republished.
  await page.locator('[data-editor-field="name"]').fill("Ada King");
  await page.getByText("Saved to your account").waitFor({ timeout: 10000 });
  await page.waitForTimeout(2500);
  const pub = await context.newPage();
  await pub.goto(`${BASE}/p/ada-lovelace`);
  const html = await pub.content();
  log("public page title:", await pub.title());
  log("public page shows published name:", html.includes("Ada Lovelace"), "| leaks unpublished draft:", html.includes("Ada King"));
  if (shots) await pub.screenshot({ path: `${shots}/public-page.png` });

  await page.getByRole("button", { name: /Live/ }).click();
  log("dialog flags unpublished changes:", await page.getByText("You have changes that aren’t live yet").isVisible());
  await page.getByRole("button", { name: "Publish latest changes" }).click();
  await page.getByText("Visitors see your latest version").waitFor({ timeout: 10000 });
  await pub.reload();
  log("after republish public shows new name:", (await pub.content()).includes("Ada King"));

  // Plan limit: a second live portfolio on the free plan is refused.
  const second = await context.newPage();
  await second.goto(`${BASE}/editor/kinetic-portfolio`);
  await second.getByText("Saved to your account").waitFor({ timeout: 15000 });
  await second.locator('[data-editor-field="name"]').fill("Second Portfolio");
  await second.getByText("Saved to your account").waitFor({ timeout: 10000 });
  await second.waitForTimeout(2000);
  await second.getByRole("button", { name: /Publish/ }).click();
  await second.getByPlaceholder("your-name").fill("second-one");
  await second.getByRole("button", { name: "Publish portfolio" }).click();
  await second.getByText(/plan includes 1 live portfolio/).waitFor({ timeout: 10000 });
  log("free plan limit enforced");
  const t1 = await (await context.request.get(`${BASE}/api/portfolios/template-one`)).json();
  log("template-one draft unaffected by kinetic edits:", t1.draft.content.name === "Ada King");

  await page.getByRole("button", { name: "Unpublish" }).click();
  await page.getByRole("button", { name: "Publish portfolio" }).waitFor({ timeout: 10000 });
  await pub.reload();
  log("after unpublish public status:", (await pub.goto(`${BASE}/p/ada-lovelace`)).status());

  const account = await context.newPage();
  await account.goto(`${BASE}/account`);
  await account.getByText("Your portfolios").waitFor({ timeout: 10000 });
  await account.waitForTimeout(500);
  log("account lists:", (await account.locator("li p.truncate").allTextContents()).join(" | "));
  if (shots) await account.screenshot({ path: `${shots}/account.png` });
}

// 3) Mobile layout: content panel reachable.
{
  const page = await context.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/editor/template-one`);
  await page.getByRole("button", { name: "Content", exact: true }).click();
  await page.locator('[data-editor-field="name"]').waitFor({ state: "visible", timeout: 10000 });
  log("mobile content panel visible:", await page.locator('[data-editor-field="name"]').isVisible());
  if (shots) await page.screenshot({ path: `${shots}/editor-mobile.png` });
}

// 4) Editorial editor loads and saves.
{
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(`editorial: ${error.message}`));
  await page.goto(`${BASE}/editor/editorial-developer`);
  await page.getByText("Saved to your account").waitFor({ timeout: 15000 });
  await page.getByLabel("Name", { exact: true }).first().fill("Grace Hopper");
  await page.getByText("Saved to your account").waitFor({ timeout: 10000 });
  await page.waitForTimeout(4000);
  const frame = page.frameLocator('iframe[title$="live preview"]');
  const ftext = await frame.locator("body").innerText();
  log("editorial preview shows edit:", ftext.includes("Grace Hopper"), "| editor field:", await page.getByLabel("Name", { exact: true }).first().inputValue(), "|", ftext.slice(0, 60).replace(/\n/g, " "));
}

// 5) API guards.
{
  const api = context.request;
  const anon = await browser.newContext();
  log("anonymous PUT status:", (await anon.request.put(`${BASE}/api/portfolios/template-one`, { data: { content: {} } })).status());
  const evil = await api.put(`${BASE}/api/portfolios/template-one`, { data: { content: { name: "X", github: "javascript:alert(1)", projects: [{ title: "p", live_url: " JaVaScRiPt:alert(1)", image: "data:image/svg+xml;base64,PHN2Zz4=" }] }, theme: "<script>" } });
  const evilBody = await evil.json();
  log("script links stripped:", JSON.stringify({ github: evilBody.draft.content.github, live: evilBody.draft.content.projects[0].live_url, image: evilBody.draft.content.projects[0].image, theme: evilBody.draft.theme }));
  log("reserved slug:", (await api.post(`${BASE}/api/portfolios/template-one/publish`, { data: { slug: "admin" } })).status());
  log("unknown template:", (await api.get(`${BASE}/api/portfolios/not-a-template`)).status());
  log("oversized body:", (await api.put(`${BASE}/api/portfolios/template-one`, { data: { content: { name: "x".repeat(5_000_000) } } })).status());
  log("bad editorial shape:", (await api.put(`${BASE}/api/portfolios/editorial-developer`, { data: { content: { personal: {} } } })).status());
  log("AI without key:", (await api.post(`${BASE}/api/ai/assist`, { data: {} })).status());
  await anon.close();
}

console.log("page errors:", errors.length ? errors : "none");
await browser.close();
