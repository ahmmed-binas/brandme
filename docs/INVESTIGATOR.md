# The Investigator

The Investigator keeps a customer's website up to date with their career. They give it **their own** public profiles, choose how often it checks, and choose whether what it finds waits for them or goes straight onto the site. It emails them after every check that finds something.

Settings: `/account/investigator`. Code: `lib/investigator/*`. Tests: `tests/e2e/investigator.mjs`.

## Who gets what

Every plan, including free Basic, gets the Investigator on any schedule: every day, week, month, 6 months, year, or **custom** (every 1–365 days). The customer pays for the AI step of each check (credits at cost + 5%, or their own Claude key), so the schedule is their choice. **Each account's first check is free**: its AI step runs on the platform key without charging credits (`openFreeAi` in `lib/ai/metering.ts`), still within `AI_DAILY_BUDGET_USD`. After that, **Check now** works at most once every 12 hours. Rules live in `accessFor()` in `lib/investigator/settings.ts`; schedules and labels are in `lib/investigator/schedule.ts` (safe to import in the browser).

## What happens in a check (`runInvestigator` in `lib/investigator/run.ts`)

1. **GitHub** (free, no AI): new public repositories, through the existing GitHub sync.
2. **Feeds** (free, no AI): RSS/Atom from a blog, Medium, Substack or a YouTube channel. New posts since the last check (or the past 6 months the first time), at most three per feed. Feeds are fetched by our server with `safeFetchText` (`lib/investigator/feeds.ts`), which refuses private and internal addresses, re-checks every redirect, and limits size and time.
3. **Their own pages, read by us first** (`lib/investigator/reader.ts`). With `OBSCURA_URL` set, pages open in **Obscura** (github.com/h4ckf0r0day/obscura), a small headless browser, so pages that build their content with JavaScript (most portfolio builders, link-in-bio pages, Behance) are read properly, including the schema.org “Person” data many sites publish (job title, employer). Without it, the HTML is fetched. Public addresses only, no logins or cookies, stealth mode off. Login-walled networks (LinkedIn, Instagram, Facebook, X, TikTok) aren't opened this way. The text is given to Claude as data.
4. **Everything else** (AI, paid with credits or the customer's own Claude key): Claude reads each profile with web fetch, searches the web around the person, compares with what's already on the portfolio and returns only cited professional changes from roughly the last 18 months, each with a confidence. Pages and search results are treated as data, never instructions. If this step fails or credits run out, the free sources still count and the history says which links were skipped.
5. **Fact-check** (`lib/investigator/verify.ts`). We read the page each finding cites ourselves:
   - the page mentions the person and the claim → confirmed, kept as is;
   - it mentions them but not the claim, or it can't be read (login wall, 404) → kept, but never “high”, so it always waits for the owner;
   - it can be read and doesn't mention them → dropped (probably someone else with the same name);
   - older than about two years → dropped as old news.
   Low-confidence items, and anything already on the site (projects, highlights and roles, compared loosely) or already suggested, are dropped too. The history shows a line like “Checked against their sources: 2 confirmed, 1 not confirmed, 1 left out”.
6. **Ask me first** (the default): updates wait in the editor's **AI** tab, labelled “Found by the Investigator”.
   **Update my website automatically**: only confident items are applied (high-confidence AI findings, plus GitHub and feed items). The site is updated and, if published, the live page too. Less certain items still wait. The previous draft and published content are saved with the run, so **Undo** on the Investigator page puts everything back for 30 days.
7. An email lists what changed or what is waiting, and which profiles couldn't be read.

Scheduled checks run from the hourly job (`POST /api/cron`, step `investigator`, ten due accounts per run). A failing check retries the next day; after five failures in a row the Investigator switches itself off and emails the customer. While the Investigator is on, the older research job skips that customer so they aren't charged twice.

## What it can't do (say this honestly to customers)

- **It never logs in anywhere, and never asks for passwords.** LinkedIn, Instagram, Facebook, X and TikTok show very little to logged-out visitors, so from those it usually gets a name and headline at most. The history marks them “Partly readable” or “Needs a login”. Those links still help it confirm it has found the right person. For LinkedIn job changes, the LinkedIn data export upload in the editor is the reliable route.
- It only looks at the account owner, with their consent (the checkbox is required whenever profiles change). It must never be extended to other people.
- It updates the website only. There is no PDF CV.

## Costs

The GitHub and feed steps cost nothing. The AI step is charged from real token usage like every other AI feature (`lib/ai/metering.ts`, 1 credit = $0.01, cost + 5%). A real check, reading several pages and running a few searches, is **estimated** at roughly 20–60 credits (`CHECK_CREDITS_ESTIMATE`, shown to customers; not yet measured against the real API: check `credit_ledger` rows with reason “Investigator check” after the first real runs and adjust the estimate). When credits run out, checks carry on with GitHub and feeds only and say so. Daily schedules simply use more credits; there are no monthly allowances any more.

## Data

Migration `009_investigator`: `investigator_settings` (one row per owner: links, frequency, mode, portfolio, next/last run, failures) and `investigator_runs` (sources read, counts, content before automatic changes, undo time). Findings are ordinary `profile_suggestions` rows with `source = 'investigator'` and a `run_id`.

## Trying it locally

See `docs/LOCAL.md`, step 11. Without an Anthropic key only GitHub and feeds are checked. For the tests, `INVESTIGATOR_ALLOW_PRIVATE_FETCH=true` lets feeds come from the local mock server; never set it in production.
