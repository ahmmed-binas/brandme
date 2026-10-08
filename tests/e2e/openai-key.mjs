// Own OpenAI key (ChatGPT / Codex users): a bad key is refused, a good one is
// checked, encrypted, picks the newest GPT model, runs the assistant without
// spending credits, never comes back to the browser, and is deleted on removal.
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { encode } from "../../node_modules/@auth/core/jwt.js";

const BASE = process.env.BASE ?? "http://localhost:3300";
const MOCK = process.env.MOCK ?? "http://localhost:4010";
// PSQL lets this run outside the test container, e.g. PSQL="docker exec formora-db psql -U postgres -d formora -At -c".
const sql = (query) => execSync(process.env.PSQL ? `${process.env.PSQL} "${query.replace(/"/g, '\\"')}"` : `su postgres -c "psql -d formora -At -c \\"${query.replace(/"/g, '\\\\\\"')}\\""`).toString().trim();
const log = (...args) => console.log("•", ...args);
const failures = [];
const expect = (label, ok) => { log(`${ok ? "✓" : "✗"} ${label}`); if (!ok) failures.push(label); };

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: process.env.BROWSER_CHANNEL ?? "chromium" });
const context = await browser.newContext();
const account = "google-openai-key";
sql(`DELETE FROM app_users WHERE provider_account_id = '${account}'`);
await context.addCookies([{ name: "authjs.session-token", value: await encode({ token: { name: "Gina GPT", email: "gina.gpt@example.com", providerAccountId: account }, secret: process.env.AUTH_SECRET, salt: "authjs.session-token" }), url: BASE }]);
const page = await context.newPage();
const api = (path, method = "GET", data) => page.request.fetch(`${BASE}${path}`, { method, data, headers: data ? { "Content-Type": "application/json" } : undefined }).then(async (response) => ({ status: response.status(), body: await response.json().catch(() => ({})) }));
const mockLog = async () => (await (await fetch(`${MOCK}/__log`)).json());

await api("/api/account/status");
const userId = sql(`SELECT id FROM app_users WHERE provider_account_id = '${account}'`);

const notOpenAi = await api("/api/account/ai-key", "PUT", { provider: "openai", key: "sk-ant-api03-thisisaclaudekeynotopenai" });
expect(`a Claude key in the OpenAI box is refused (${notOpenAi.body.error})`, notOpenAi.status === 422);
const bad = await api("/api/account/ai-key", "PUT", { provider: "openai", key: "sk-proj-wrongwrongwrongwrongwrongwrong" });
expect(`a wrong key is refused after asking OpenAI (${bad.body.error})`, bad.status === 422 && /OpenAI didn’t accept/.test(bad.body.error));

const good = await api("/api/account/ai-key", "PUT", { provider: "openai", key: "sk-proj-validopenaikeyvalidopenaikey" });
expect(`a good key is saved with the newest GPT model (${good.body.model}, hint ${good.body.hint})`, good.status === 200 && good.body.model === "gpt-5.2" && good.body.hint === "sk-proj-…ikey");
expect("the key is stored encrypted", !sql(`SELECT ai_key_enc FROM app_users WHERE id='${userId}'`).includes("validopenai"));
const billing = await api("/api/account/billing");
expect("the account page shows the provider and hint but never the key", billing.body.ai.ownKey?.provider === "openai" && !JSON.stringify(billing.body).includes("validopenai"));

const before = Number(sql(`SELECT credits FROM app_users WHERE id='${userId}'`));
const edit = await api("/api/ai/assist", "POST", { templateId: "terminal", content: { name: "Gina GPT", professional_title: "Engineer", tagline: "I build calm systems.", summary: ["I build things."] }, instruction: "Sharpen my tagline" });
const call = (await mockLog()).filter((line) => line.startsWith("OPENAI model=")).at(-1) ?? "";
expect(`the assistant runs on OpenAI (${call})`, edit.status === 200 && /sharpened by GPT/.test(edit.body.content?.tagline ?? "") && /model=gpt-5\.2/.test(call) && /format=json_schema/.test(call));
expect("OpenAI is asked not to store the request", /store=false/.test(call));
expect("no credits are spent", Number(sql(`SELECT credits FROM app_users WHERE id='${userId}'`)) === before && !edit.body.charged);

await page.goto(`${BASE}/account#ai`);
await page.getByText("AI runs on").waitFor();
expect("the account page says AI runs on your OpenAI key", await page.getByText("your OpenAI key").first().isVisible());

await api("/api/account/ai-key", "DELETE");
expect("removing the key deletes it", sql(`SELECT COALESCE(ai_key_enc, 'gone') FROM app_users WHERE id='${userId}'`) === "gone");

const attempts = [];
for (let i = 0; i < 9; i++) attempts.push((await api("/api/account/ai-key", "PUT", { provider: "openai", key: "sk-proj-wrongwrongwrongwrongwrongwrong" })).status);
expect(`repeated key attempts are rate limited (${attempts.join(",")})`, attempts.includes(429));

sql(`DELETE FROM app_users WHERE id='${userId}'`);
await browser.close();
console.log(failures.length ? `\n${failures.length} failed` : "\nall passed");
process.exit(failures.length ? 1 : 0);
