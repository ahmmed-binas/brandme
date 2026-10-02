import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { encode } from "../../node_modules/@auth/core/jwt.js";

const BASE = process.env.BASE ?? "http://localhost:3300";
const S = process.env.S ?? new URL("./.out", import.meta.url).pathname;
const log = (...args) => console.log("•", ...args);
const sql = (query) => execSync(`su postgres -c "psql -d formora -At -c \\"${query}\\""`).toString().trim();
sql("DELETE FROM support_tickets");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const as = async (id, email, name) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addCookies([{ name: "authjs.session-token", value: await encode({ token: { name, email, providerAccountId: id }, secret: process.env.AUTH_SECRET, salt: "authjs.session-token" }), url: BASE }]);
  return context.newPage();
};

const anon = await browser.newPage();
await anon.goto(`${BASE}/community/support`);
log("signed-out prompt:", await anon.getByRole("link", { name: "Sign in" }).first().isVisible());

const ada = await as("google-support-ada", "ada.support@example.com", "Ada Support");
await ada.goto(`${BASE}/community/support`);
await ada.getByRole("button", { name: "Send to support" }).click();
await ada.locator("p[role=alert]").waitFor();
log("empty form refused:", await ada.locator("p[role=alert]").textContent());
await ada.getByLabel("Subject").fill("My domain isn’t connecting");
await ada.getByLabel("About").selectOption("Domains");
await ada.getByLabel("What’s happening?").fill("I added the TXT record yesterday but the editor still says waiting.");
await ada.getByRole("button", { name: "Send to support" }).click();
await ada.getByText("Waiting for us").waitFor();
log("ticket listed for customer:", await ada.getByText("My domain isn’t connecting").isVisible());
log("emails for new ticket:", sql("SELECT count(*) FROM support_tickets"), "ticket(s)");

const grace = await as("google-support-grace", "grace.support@example.com", "Grace");
await grace.goto(`${BASE}/community/support`);
log("other customer can't see it:", !(await grace.getByText("My domain isn’t connecting").count()));
const ticketId = sql("SELECT id FROM support_tickets LIMIT 1");
log("other customer reply via API:", (await grace.request.post(`${BASE}/api/support/${ticketId}`, { data: { message: "sneaky reply here" } })).status());

const mod = await as("google-support-mod", "mod@example.com", "Moderator");
await mod.goto(`${BASE}/community/support?view=queue`);
await mod.getByText("Needs a reply").waitFor();
log("staff queue shows customer email:", await mod.getByText("ada.support@example.com", { exact: false }).isVisible());
await mod.getByPlaceholder(/Reply to the customer/).fill("Thanks Ada. DNS can take a few hours; I’ve re-checked and it’s verified now.");
await mod.getByRole("button", { name: "Send reply" }).click();
await mod.getByText("We replied").waitFor();
await ada.reload();
log("customer sees reply:", await ada.getByText("verified now").isVisible(), "| status:", sql("SELECT status FROM support_tickets"));
await ada.getByRole("button", { name: /solved/ }).click();
await ada.getByText("Closed").first().waitFor();
log("closed by customer:", sql("SELECT status FROM support_tickets"));
await ada.screenshot({ path: `${S}/shots/support.png`, fullPage: true });
await browser.close();
