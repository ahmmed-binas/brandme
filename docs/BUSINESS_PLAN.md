# Formora business plan: building a portfolio business that AI makes stronger, not obsolete

_Last reviewed: October 2026._

## 1. The uncomfortable starting point

Any chatbot can now produce a good-looking one-page portfolio in under a minute. Website builders all ship "describe your site" generators. So **templates and an editor are not a business on their own**. They will keep getting cheaper until they are free. If Formora's pitch is "pick a nice template and edit it", it competes with free and loses.

The question is not "how do we use AI?" but **"what does a job-seeker or freelancer still need after AI has written their site?"** Five things stay valuable, and a few of them get *more* valuable as AI floods the world with generated content:

| What people need | Why AI doesn't remove the need | What Formora sells |
| --- | --- | --- |
| **A trustworthy page that is always online** at a stable, shareable address | A generated HTML file isn't a website. Someone still has to host it, keep it up, give it a link preview, and update it. | Publishing, hosting, custom domains, fast mobile pages, link previews |
| **Proof that it's true** | When anyone can generate an impressive portfolio, recruiters stop trusting portfolios. Verified claims become the scarce thing. | Verification: "GitHub verified", "live project checked", "employer email verified" |
| **Staying current with no effort** | People don't update portfolios; that's why they go stale. | Sync from GitHub, a re-imported CV, and AI rewrites that keep it fresh |
| **Knowing whether it works** | AI can't tell you who looked at your page. | Analytics: views, which projects got clicked, where visitors came from |
| **A design that can't be broken** | Generated sites drift, break on mobile, and look like everyone else's. | Professionally designed templates where content can't break the layout (already the core rule of this codebase) |

**Positioning:** _Formora is where your professional proof lives. You publish once, it stays current, and visitors can trust it._ AI is the engine underneath (writing, importing, updating), not the product being sold.

## 2. Who it's for

Start narrow. Portfolio needs differ a lot by profession, and a focused product beats a generic one.

1. **Primary: software developers looking for work** (students, graduates, career changers, bootcamp grads). The existing Editorial Developer template, the GitHub angle, and the founder's own background all point here. This group also feels the trust problem most: recruiters are already overwhelmed by AI-written applications.
2. **Next: designers and creative technologists** (Midnight and Kinetic templates).
3. **Later, B2B: bootcamps, universities, and career services** that need every student to have a credible portfolio.

## 3. What to charge for

Portfolio use is **episodic**: people care intensely during a job search, then ignore their portfolio for months. A pure monthly subscription churns as soon as someone is hired. The pricing below matches that rhythm.

| Plan | Price (suggested; test it) | What's included |
| --- | --- | --- |
| **Free** | £0 | 1 live portfolio at `/p/your-name`, all free templates, "Made with Formora" badge, 3 AI edits/day, browser + account saving |
| **Job Search Pass** | £19 one-off for 3 months | Everything in Pro for one job hunt. No subscription to forget about. |
| **Pro** | £7/month or £60/year | Custom domain, no badge, up to 10 portfolios, analytics, verification badges, premium templates, 50 AI edits/day, PDF export |
| **Cohort** (B2B) | £8–15 per student per year | Pro for a whole cohort, a staff dashboard to review portfolios, the school's own branding |

Rules that keep pricing honest:
- **Never paywall basic editing or publishing.** The free tier must produce a real, shareable portfolio. That page is the marketing.
- **The free badge is the growth loop.** Every free portfolio a recruiter opens advertises Formora.
- **Charge for outcomes that cost money or create trust:** custom domains, verification, analytics, and heavy AI use.

## 4. Unit economics

| Cost | Estimate | Notes |
| --- | --- | --- |
| One AI edit (Claude Opus 5.5 at $4 / $20 per million input/output tokens) | **~$0.03–0.06** | About 2k tokens in and 1–2k out, including reasoning. Measure the real figure once live; the server logs each request. |
| Free user, worst case (3 AI edits every day) | ~$3–5/month | Rare in practice; typical free users make a handful of edits in total. Keep the daily cap. |
| Hosting a published portfolio | well under $0.01/month | One database row, rendered on request |
| Custom domain + SSL | Registrar price (about $10–20 a year for .com/.dev); HTTPS is free on Vercel | Built: customers pay registrar price + 20% + $3, prepaid via Stripe. A $12 domain sells for $18, about $6 margin per domain per year. |

At £7/month, a Pro user who makes 50 AI edits a month costs about £2 in AI, leaving a healthy margin. **Watch the AI cost per paying user monthly.** If it rises, lower the effort setting or move routine edits to a cheaper model, but only after measuring that quality holds.

All limits live in one file: `lib/plans.ts`. The server enforces them; the UI only explains them.

## 5. What exists today (October 2026)

Built in this round:
- Accounts (Google sign-in) with **portfolios saved per user**, and autosave to both the browser and the account
- **Publishing** to `/p/<address>`, with draft/live separation: edits stay private until republished
- **Plan limits enforced on the server**: live portfolio count and daily AI edits
- **AI copy editing** that can only rewrite existing text and never touches names, links, dates, images, or skill lists. It refunds failed requests.
- Content validation on every save (blocks script links, unsafe images, and oversized payloads)
- An editor that works on mobile, with undo, a save status indicator, and image compression

Also built: **custom domains** (buy `yourname.com` through Formora with automatic setup, or connect your own on Pro) and **profile import** from a CV, GitHub, a LinkedIn data export, or pasted text organised by Claude. See `docs/CUSTOM_DOMAINS.md`.

Not built yet (in priority order, see section 6): Pro subscriptions, domain renewals, analytics, verification, privacy policy and terms, and account deletion.

## 6. Roadmap

### Phase 1: launch-ready (weeks 1–4)
1. **Pick one name and one domain.** The codebase mixes "Formora", "CV Gen Studio", "brandme", and the placeholder `formora.example` (in `app/layout.tsx` and `lib/brand.ts`). Fix this before any marketing.
2. **Legal basics:** privacy policy, terms, and an account deletion endpoint. Google OAuth verification and GDPR require them.
3. **Payments:** Stripe is already wired in for domain purchases. Add Checkout for the Job Search Pass and Pro, and have the existing webhook set `app_users.plan`. Nothing else needs to change, because limits already read from the plan.
4. **Domain renewals** before the first purchased domains turn one year old (see `docs/CUSTOM_DOMAINS.md`).
5. **Share previews:** an Open Graph image per published portfolio, so links look good on LinkedIn and Slack.
6. **Simple analytics:** count page views per portfolio (no personal data) and show them in the account page. This is the first Pro feature people can feel.
7. **Remove dead paths:** `app/backend/server.js` (an Express server calling a local Ollama model) and the CV extractor's call to `localhost:5000` don't work once deployed. Route CV parsing through the new server-side AI (`lib/ai/`) instead.

### Phase 2: the trust layer (weeks 5–10). This is the moat.
1. **GitHub verification:** connect GitHub and show a "verified" badge on projects whose repository belongs to the user.
2. **Live link checks:** check project links weekly and show "checked on <date>". Warn the owner about broken links.
3. **Employer email verification:** confirm a role by email to an address at the company's domain.
4. A **public verification summary** at the bottom of each portfolio, explaining what was checked and when.

### Phase 3: the living portfolio (weeks 10–16)
1. **AI CV import:** turn an uploaded CV into structured portfolio content, replacing the regex parser.
2. **GitHub sync:** suggest new projects when a user ships a notable repository.
3. **"Refresh my portfolio" nudges** by email when content is stale or a job search starts.

### Phase 4: distribution (after product-market fit)
1. **Cohort accounts** for bootcamps and universities.
2. An optional **talent directory** that recruiters can search, opt-in only. This creates a two-sided network, the strongest moat of all, but only worth building once there are thousands of verified portfolios.

## 7. Metrics that matter

| Stage | Metric | Target to aim for early |
| --- | --- | --- |
| Activation | Visitors who publish a portfolio in their first session | 20%+ of people who open the editor |
| Value | Published portfolios that get at least one outside view in 7 days | 50%+ |
| Retention | Portfolios updated again within 60 days | 30%+ |
| Revenue | Free → paid conversion among publishers | 3–5% |
| Cost | AI cost per paying user per month | under 25% of revenue |

## 8. Risks and how to handle them

| Risk | Mitigation |
| --- | --- |
| Big platforms (LinkedIn, website builders) add AI portfolios | Compete on verification and a developer focus, which generic tools won't prioritise. Keep the free tier genuinely useful. |
| AI costs grow faster than revenue | Daily caps per plan, refunds only for failures, and a monthly review of cost per user |
| Fake or abusive published pages | Account-required publishing, content validation, reserved addresses, and (next) a report-abuse link and takedown process |
| Users churn after getting a job | The Job Search Pass captures that revenue up front, and the free tier keeps the page live, so they come back for the next search |
| Unverifiable AI-written content erodes trust in Formora pages | The AI never invents facts (enforced in its instructions and by protecting factual fields), and verification badges separate checked claims from unchecked ones |

## 9. What to do this week

1. Choose the name and domain; replace the placeholders.
2. Set up production Postgres (Neon, Supabase, or Vercel Postgres all work with `DATABASE_URL`) and deploy.
3. Add `ANTHROPIC_API_KEY` to turn on the AI assistant.
4. Publish your own portfolio on it, and share it with 10 developers who are job hunting. Watch where they get stuck.
5. Then build payments, in Phase 1 order.
