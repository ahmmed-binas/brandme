// The superadmin: created with `npm run admin:create`, signs in with a password,
// sees the admin pages and the email settings page, and sends a test email.
// Needs the server started with SMTP pointing at tests/e2e/smtp-sink.mjs (see README),
// and ADMIN_EMAILS=mod@example.com (test.env).
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { encode } from "../../node_modules/@auth/core/jwt.js";

const BASE = process.env.BASE ?? "http://localhost:3100";
const ROOT = new URL("../..", import.meta.url).pathname;
const MAIL = new URL("./.out/mail", import.meta.url).pathname;
const log = (...args) => console.log("•", ...args);
const sql = (query) => execSync(`su postgres -c "psql -d formora -At -c \\"${query.replace(/"/g, '\\\\\\"')}\\""`).toString().trim();
const errors = [];

// 1) Create the superadmin from the command line (password piped, as a script would).
sql("DELETE FROM app_users WHERE lower(email) IN ('owner@company.test', 'mod@example.com')");
mkdirSync(MAIL, { recursive: true });
for (const file of readdirSync(MAIL)) rmSync(`${MAIL}/${file}`);
const created = execSync(`printf 'A calm long passphrase 42\\nA calm long passphrase 42\\n' | node scripts/create-superadmin.mjs --email owner@company.test --name "Site Owner"`, { cwd: ROOT }).toString();
log("command:", created.includes("is the superadmin") && created.includes("the normal /login refuses this account"));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (error) => errors.push(error.message));

// 2) The normal sign-in refuses the superadmin; the console's secret address (SUPERADMIN_PATH) signs them in.
const CONSOLE = process.env.SUPERADMIN_PATH || "/console";
await page.goto(`${BASE}/login`);
await page.getByLabel("Email or username").fill("owner@company.test");
await page.locator("input[name=password]").fill("A calm long passphrase 42");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.getByRole("alert").first().waitFor();
log("normal /login refuses the superadmin:", page.url().endsWith("/login"));
await page.goto(`${BASE}${CONSOLE}`);
await page.getByLabel("Email").fill("owner@company.test");
await page.getByLabel("Password").fill("A calm long passphrase 42");
await page.getByRole("button", { name: "Sign in to the console" }).click();
await page.getByText("How the business is doing").waitFor({ timeout: 30000 });
await page.goto(`${BASE}/admin`);
log("signed in → admin home:", await page.getByRole("link", { name: /Email settings/ }).isVisible(), "| checklist lists superadmin:", await page.getByText("owner@company.test").first().isVisible());
await page.goto(`${BASE}/templates/review`);
log("can open template approvals:", (await page.title()) !== "404" && !(await page.getByText("This page could not be found").count()));

// 3) Email settings: shows the values (never the password) and sends a test.
await page.goto(`${BASE}/admin/email`);
log("email page:", await page.getByRole("heading", { level: 1 }).textContent(), "| password hidden:", !(await page.content()).includes(process.env.SMTP_PASSWORD ?? "right-password"));
await page.getByRole("button", { name: "Send a test email" }).click();
const outcome = page.getByText(/^Sent to |refused|Couldn’t reach|didn’t/).first();
await outcome.waitFor({ timeout: 30000 });
log("test send:", await outcome.textContent());
if (process.env.EXPECT_SMTP_FAIL) { console.log("page errors:", errors.length ? errors : "none"); await browser.close(); process.exit(0); }
await new Promise((resolve) => setTimeout(resolve, 500));
const mail = readdirSync(MAIL).map((file) => readFileSync(`${MAIL}/${file}`, "utf8")).find((text) => text.includes("Test email"));
log("arrived at the mail server:", Boolean(mail), "| to the superadmin:", Boolean(mail?.includes("To: owner@company.test")));

// 4) Nobody else gets the email page; an unconfirmed password account using an ADMIN_EMAILS address isn't an admin.
const other = await (await browser.newContext()).newPage();
await other.context().addCookies([{ name: "authjs.session-token", value: await encode({ token: { name: "Moderator", email: "mod@example.com", providerAccountId: "google-mod-superadmin-test" }, secret: process.env.AUTH_SECRET, salt: "authjs.session-token" }), url: BASE }]);
await other.goto(`${BASE}/account`);
log("ADMIN_EMAILS moderator: admin home", (await other.goto(`${BASE}/admin`)).status(), "| email page", (await other.goto(`${BASE}/admin/email`)).status(), "| test API", (await other.request.post(`${BASE}/api/admin/email/test`, { data: {} })).status());
sql("DELETE FROM app_users WHERE lower(email) = 'mod@example.com'");
sql(`INSERT INTO app_users (provider, provider_account_id, email, name, username, password_hash) VALUES ('password', 'pw_squatter', 'mod@example.com', 'Squatter', 'squatter', (SELECT password_hash FROM app_users WHERE email = 'owner@company.test'))`);
const squatter = await (await browser.newContext()).newPage();
await squatter.goto(`${BASE}/login?callbackUrl=/account`);
await squatter.getByLabel("Email or username").fill("squatter");
await squatter.locator("input[name=password]").fill("A calm long passphrase 42");
await squatter.getByRole("button", { name: "Sign in", exact: true }).click();
await squatter.waitForURL(`${BASE}/account`).catch(() => undefined);
log("unconfirmed account with an admin email: admin home", (await squatter.goto(`${BASE}/admin`)).status(), "| approvals API", (await squatter.request.post(`${BASE}/api/templates/review`, { data: {} })).status());
sql("DELETE FROM app_users WHERE provider_account_id = 'pw_squatter'");

// 5) Removing the superadmin.
log("remove:", execSync("node scripts/create-superadmin.mjs --remove owner@company.test", { cwd: ROOT }).toString().trim(), "| email page now", (await page.goto(`${BASE}/admin/email`)).status());
execSync(`printf 'A calm long passphrase 42\\nA calm long passphrase 42\\n' | node scripts/create-superadmin.mjs --email owner@company.test`, { cwd: ROOT });

console.log("page errors:", errors.length ? errors : "none");
await browser.close();
