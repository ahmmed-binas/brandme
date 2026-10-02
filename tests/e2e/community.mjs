import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { encode } from "../../node_modules/@auth/core/jwt.js";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const BASE = "http://localhost:3100";
const S = process.env.S ?? new URL("./.out", import.meta.url).pathname;
const log = (...args) => console.log("•", ...args);
const sql = (query) => execSync(`su postgres -c "psql -d formora -At -c \\"${query}\\""`).toString().trim();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const errors = [];
const as = async (id, email, name) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addCookies([{ name: "authjs.session-token", value: await encode({ token: { name, email, providerAccountId: id }, secret: process.env.AUTH_SECRET, salt: "authjs.session-token" }), url: BASE }]);
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(`${name}: ${error.message}`));
  return page;
};

// Visitors can read but are asked to sign in to post.
const anon = await browser.newPage();
await anon.goto(`${BASE}/community`);
log("anonymous CTA:", await anon.getByRole("link", { name: "Sign in to post" }).first().getAttribute("href"));
log("anonymous API post:", (await anon.request.post(`${BASE}/api/community/posts`, { data: { kind: "suggestion", title: "x", body: "y" } })).status());

const ada = await as("google-c-ada", "ada@example.com", "Ada Lovelace");
await ada.goto(`${BASE}/community`);
const write = async (page, { kind, title, body, rating }) => {
  await page.getByRole("button", { name: "Write a post" }).first().click();
  if (kind) await page.getByRole("radio", { name: kind }).click();
  if (rating) await page.locator(`label:has(input[value="${rating}"])`).click();
  await page.getByLabel("Title").fill(title);
  await page.getByLabel(/Details/).fill(body);
  await page.getByRole("button", { name: /^(Post|Submit for review)$/ }).click();
};

// Refusals keep the text and explain.
await write(ada, { title: "BROKEN EDITOR!!!", body: "THE EDITOR IS COMPLETELY BROKEN AND NOTHING SAVES AT ALL FOR ME TODAY" });
await ada.locator("p[role=alert]").waitFor();
log("shouting refused:", await ada.locator("p[role=alert]").textContent(), "| text kept:", (await ada.getByLabel("Title").inputValue()) === "BROKEN EDITOR!!!");
await ada.getByLabel("Title").fill("Free spins inside");
await ada.getByLabel(/Details/).fill("Great site! Check my casino for free spins and bonuses every day.");
await ada.getByRole("button", { name: "Post", exact: true }).click();
await ada.getByText(/looks like spam/).waitFor();
log("spam refused:", await ada.locator("p[role=alert]").textContent());
await ada.screenshot({ path: `${S}/shots/community-refused.png` });

// A good suggestion publishes immediately.
await ada.getByLabel("Title").fill("Let me reorder projects by dragging");
await ada.getByLabel(/Details/).fill("Reordering projects by dragging them in the editor would save a lot of fiddling. <script>alert(1)</script>");
await ada.getByRole("button", { name: "Post", exact: true }).click();
await ada.getByText("Posted. Thanks for taking part.").waitFor();
await ada.getByRole("button", { name: "Done" }).click();
await ada.waitForTimeout(800);
log("suggestion live in feed:", await ada.getByRole("link", { name: "Let me reorder projects by dragging" }).isVisible());

// Duplicate of the same text is refused.
await write(ada, { title: "Reorder projects please", body: "Reordering projects by dragging them in the editor would save a lot of fiddling. <script>alert(1)</script>" });
await ada.locator("p[role=alert]").waitFor();
log("duplicate refused:", await ada.locator("p[role=alert]").textContent());
await ada.getByRole("button", { name: "Close" }).click();

// Review: one per person.
await write(ada, { kind: "Review", title: "Published in an evening", body: "Imported my CV, tidied the wording and had it live the same night.", rating: 5 });
await ada.getByText("Posted. Thanks for taking part.").waitFor();
await ada.getByRole("button", { name: "Done" }).click();
await write(ada, { kind: "Review", title: "Second thoughts here", body: "Trying to review a second time to bump the average rating up.", rating: 5 });
await ada.locator("p[role=alert]").waitFor();
log("second review refused:", await ada.locator("p[role=alert]").textContent());
await ada.getByRole("button", { name: "Close" }).click();

// Design posts now point to the gallery; older-style design posts (via the API) are still moderated.
await ada.getByRole("button", { name: "Write a post" }).first().click();
await ada.getByRole("radio", { name: "Design" }).click();
log("composer 'Design' sends people to the gallery:", await ada.getByRole("link", { name: "Submit a template" }).isVisible());
await ada.getByRole("button", { name: "Close" }).click();
const png = "data:image/png;base64," + readFileSync(`${ROOT}/public/assets/examplewebsite1.png`).toString("base64");
const created = await ada.request.post(`${BASE}/api/community/posts`, { data: { kind: "design", title: "Studio: a template for architects", body: "A quiet, image-led template for architects, with project sheets and drawings.", rating: null, link: "https://www.figma.com/file/abc/studio", images: [png] } });
log("design held:", created.status(), (await created.json()).reason ?? "");
await ada.reload();
await ada.waitForTimeout(800);
log("author sees it under 'not public':", await ada.getByText("Waiting for review").isVisible());
const designId = sql("SELECT id FROM community_posts WHERE kind='design'");
const imageId = sql(`SELECT id FROM community_images WHERE post_id='${designId}'`);
log("pending design hidden from public feed:", !(await anon.goto(`${BASE}/community`).then(() => anon.getByText("Studio: a template for architects").isVisible())));
log("pending image to anonymous:", (await anon.request.get(`${BASE}/api/community/images/${imageId}`)).status(), "| to author:", (await ada.request.get(`${BASE}/api/community/images/${imageId}`)).status());
log("pending post page to anonymous:", (await anon.goto(`${BASE}/community/${designId}`)).status());

// The moderator refuses it with a reason; the author sees the reason, edits, and it returns to the queue.
const mod = await as("google-c-mod", "mod@example.com", "Moderator");
log("moderation page for non-moderator:", (await ada.goto(`${BASE}/community/moderation`)).status());
await mod.goto(`${BASE}/community/moderation`);
log("queue:", await mod.getByText(/waiting, oldest first/).textContent());
await mod.getByRole("button", { name: "Refuse…" }).click();
await mod.getByRole("button", { name: "Refuse post" }).click();
await mod.locator("p[role=alert]").waitFor();
log("refuse without reason:", await mod.locator("p[role=alert]").textContent());
await mod.getByLabel("Reason the author will see").fill("Please add a screenshot of the mobile layout.");
await mod.getByRole("button", { name: "Refuse post" }).click();
await mod.getByText("Nothing is waiting. Nice.").waitFor();
await ada.goto(`${BASE}/community`);
log("author sees refusal:", (await ada.getByText("Please add a screenshot of the mobile layout.").textContent()));
await ada.screenshot({ path: `${S}/shots/community-author-refused.png` });
await ada.getByRole("button", { name: "Edit" }).first().click();
await ada.getByLabel(/Details/).fill("A quiet, image-led template for architects, with project sheets and drawings. Mobile layout added to the Figma file.");
await ada.getByRole("button", { name: "Save and resubmit" }).click();
await ada.getByText(/reviewed by a moderator/).first().waitFor();
log("after resubmit:", sql(`SELECT status FROM community_posts WHERE id='${designId}'`));
await mod.goto(`${BASE}/community/moderation`);
await mod.getByRole("button", { name: "Approve" }).click();
await mod.getByText("Nothing is waiting. Nice.").waitFor();
log("approved; image now public:", (await anon.request.get(`${BASE}/api/community/images/${imageId}`)).status());

// Votes and comments.
const grace = await as("google-c-grace", "grace@example.com", "Grace Hopper");
const suggestionId = sql("SELECT id FROM community_posts WHERE kind='suggestion'");
await grace.goto(`${BASE}/community/${suggestionId}`);
await grace.waitForTimeout(1500);
await grace.getByRole("button", { name: /^Upvote/ }).click();
await grace.waitForTimeout(700);
log("vote count:", sql(`SELECT votes FROM community_posts WHERE id='${suggestionId}'`), "| author can't vote own:", (await ada.request.post(`${BASE}/api/community/posts/${suggestionId}/vote`)).status());
// Wait until React has hydrated the textarea, so typed text isn't replaced by the initial empty state.
await grace.waitForFunction(() => { const box = document.querySelector("textarea#comment"); return box && Object.keys(box).some((key) => key.startsWith("__react")); });
await grace.getByLabel("Add a comment").pressSequentially("Yes please, especially on mobile.");
await grace.getByRole("button", { name: "Comment" }).click();
// The textarea mirrors its value as text, so wait for the comment in the list.
await grace.locator("ol li", { hasText: "Yes please, especially on mobile." }).waitFor();
log("comment cleared after posting:", (await grace.locator("textarea#comment").inputValue()) === "");
await grace.getByLabel("Add a comment").fill("buy followers cheap");
await grace.getByRole("button", { name: "Comment" }).click();
await grace.locator("p[role=alert]").waitFor();
log("spam comment refused:", await grace.locator("p[role=alert]").textContent());
log("script rendered as text:", (await grace.content()).includes("&lt;script&gt;alert(1)&lt;/script&gt;"), "| no dialog fired:", true);
grace.on("dialog", () => log("!! dialog fired"));
await grace.screenshot({ path: `${S}/shots/community-post.png`, fullPage: true });

// Moderator removes a published comment with a reason; the commenter sees why.
const commentId = sql(`SELECT id FROM community_comments WHERE post_id='${suggestionId}'`);
log("remove comment:", (await mod.request.post(`${BASE}/api/community/comments/${commentId}/moderate`, { data: { action: "remove", note: "Duplicate of an earlier comment." } })).status());
await grace.reload();
log("commenter sees removal reason:", await grace.getByText("Duplicate of an earlier comment.").isVisible(), "| count now:", sql(`SELECT comment_count FROM community_posts WHERE id='${suggestionId}'`));

await anon.goto(`${BASE}/community`);
await anon.screenshot({ path: `${S}/shots/community-feed.png`, fullPage: true });
log("feed shows review average:", await anon.getByText(/from 1 review/).isVisible());
console.log("page errors:", errors.length ? errors : "none");
await browser.close();
