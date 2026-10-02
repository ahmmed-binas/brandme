import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { encode } from "../../node_modules/@auth/core/jwt.js";

const BASE = process.env.BASE ?? "http://localhost:3300";
const S = process.env.S ?? new URL("./.out", import.meta.url).pathname;
const log = (...args) => console.log("•", ...args);
const sql = (query) => execSync(`su postgres -c "psql -d formora -At -c \\"${query}\\""`).toString().trim();
sql("DELETE FROM template_reviews");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const as = async (id, email) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  if (id) await context.addCookies([{ name: "authjs.session-token", value: await encode({ token: { name: email, email, providerAccountId: id }, secret: process.env.AUTH_SECRET, salt: "authjs.session-token" }), url: BASE }]);
  return context.newPage();
};
const cards = (page) => page.locator("main li h2, ul li h2").count();

const anon = await as(null);
await anon.goto(`${BASE}/templatechooser`);
log("customer sees before approval:", await cards(anon));
log("unapproved editor for customer:", (await anon.goto(`${BASE}/editor/residence`)).status());

const mod = await as("google-mod-1", "mod@example.com");
await mod.goto(`${BASE}/templatechooser`);
log("admin sees:", await cards(mod), "| admin banner:", await mod.getByText("because you’re an admin").isVisible());
await mod.goto(`${BASE}/templates/review`);
log("review heading:", await mod.locator("h1").textContent());
await mod.screenshot({ path: `${S}/shots/review.png` });
// Request changes on one, approve one, then approve the rest.
const salon = mod.locator("li", { has: mod.getByRole("heading", { name: "Residence" }) });
await salon.getByRole("button", { name: "Request changes…" }).click();
await salon.getByRole("button", { name: "Save request" }).click();
await salon.locator("p[role=alert]").waitFor();
log("changes without note refused:", await salon.locator("p[role=alert]").textContent());
await salon.getByRole("textbox").fill("Frames feel heavy on phones.");
await salon.getByRole("button", { name: "Save request" }).click();
await mod.waitForTimeout(800);
log("salon status:", sql("SELECT status || ': ' || note FROM template_reviews WHERE template_id='residence'"));
mod.on("dialog", (dialog) => dialog.accept());
// "Approve all" only appears when more than one template is waiting.
const bulk = mod.getByRole("button", { name: /Approve all/ });
if (await bulk.count()) await bulk.click();
else await mod.locator("li", { has: mod.getByRole("heading", { name: "Datasheet" }) }).getByRole("button", { name: "Approve", exact: true }).click();
await mod.waitForTimeout(1500);
log("approved:", sql("SELECT count(*) FROM template_reviews WHERE status='approved'"), "| salon still:", sql("SELECT status FROM template_reviews WHERE template_id='residence'"));

await anon.goto(`${BASE}/templatechooser`);
log("customer sees after approval:", await cards(anon), "(salon hidden:", !(await anon.getByRole("heading", { name: "Residence" }).count()) + ")");
await anon.getByRole("button", { name: /^Business/ }).click();
log("business field:", await cards(anon), "| url:", anon.url().split("?")[1]);
await anon.getByRole("button", { name: /^Law & legal/ }).click();
log("law & legal:", await cards(anon), "| names:", (await anon.locator("ul li h2").allTextContents()).join(", "));
await anon.getByRole("button", { name: /^Creative/ }).click();
await anon.getByRole("button", { name: /Photography/ }).click();
log("photography filter:", await cards(anon), "| url:", anon.url().split("?")[1]);
await anon.getByRole("button", { name: "Dark", exact: true }).click();
log("+ dark:", await cards(anon));
await anon.getByRole("button", { name: /Clear/ }).click();
await anon.getByPlaceholder(/What do you do/).fill("architect");
log("search architect:", await cards(anon));
await anon.getByPlaceholder(/What do you do/).fill("");
await anon.screenshot({ path: `${S}/shots/gallery.png` });
await anon.goto(`${BASE}/templatechooser?for=music`);
log("deep link ?for=music:", await cards(anon));
await anon.goto(`${BASE}/templatechooser?for=trades`);
log("deep link ?for=trades:", await cards(anon), "| field chip pressed:", await anon.getByRole("button", { name: /^Trades & hospitality/ }).getAttribute("aria-pressed"));
await anon.getByPlaceholder(/What do you do/).fill("electrician");
log("search electrician:", (await anon.locator("ul li h2").allTextContents()).join(", "));
await browser.close();
