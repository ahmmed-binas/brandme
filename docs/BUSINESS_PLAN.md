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

People whose work is visible and changes over time, and who are judged on it: software engineers, designers, artists and illustrators, photographers, writers, architects, researchers, data scientists, marketers, consultants, musicians, film-makers, founders, students, and practitioners such as therapists and coaches.

Each profession gets its own templates (35 originals, plus the 3 earlier ones), because a photographer needs a contact sheet and a researcher needs a references list, not the same "skills bar" with a different colour. That specificity is what generic website builders don't do well and what AI page generators make look the same.

## 3. The model: cheap, prepaid, and hard to leave because it's useful

The goal is not big margins. It's **never losing money on a customer, and becoming the place someone's portfolio lives for years**: so convenient that they never have to think about updating it again.

| | Price | Terms | What it adds |
| --- | --- | --- | --- |
| **Free trial** | $0 | 14 days, no card | Everything in Pro, 60 AI credits |
| **Basic** | $10/year | 1 or 2 years ($18 for two) | One live portfolio, every template and design option, own domain with HTTPS, unlimited edits, 200 MB images |
| **Pro** | $24/year | 1, 2 or 5 years ($44 / $90) | Three portfolios, no Formora link, weekly GitHub sync, career-news search every 3 months, 100 AI credits a month |
| **Premium** | $49/year | 1, 2 or 5 years ($88 / $185) | A domain name included (up to $20/yr), monthly career-news search, 300 AI credits a month, ten portfolios, priority support |

Why it's shaped this way:
- **Yearly and prepaid.** A portfolio isn't a monthly habit; a monthly bill invites cancelling. Paying for 2 or 5 years up front gives you the cash before the costs arrive, and gives the customer one less thing to manage. Basic stops at 2 years, Pro and Premium go to 5 (what you asked for).
- **AI is never inside the flat price.** AI costs money every time it runs, so it's paid as you go: credits priced from the real token usage with a 1.6× margin, or the customer's own Claude API key (no cost to us at all). A hard daily budget (`AI_DAILY_BUDGET_USD`) stops the platform key if anything goes wrong. This is what makes "never at a loss" true.
- **Trial → grace → rest, never delete.** When a trial or plan ends, the site stays up for 14 more days with a friendly banner and a few kind emails. Then it "rests" (visitors see a short holding page). Nothing is deleted, so coming back is one click. That is both humane and the strongest retention lever: people return to the thing they built.
- **Switching plans is fair.** Unused time converts into time on the new plan; nobody pays twice.

Prices live in one file, `lib/plans.ts`. Change them there; checkout, the pricing page and the account page follow.

## 4. Unit economics (per customer per year)

| Item | Basic ($10) | Pro ($24) | Premium ($49) |
| --- | --- | --- | --- |
| Stripe fees (2.9% + 30¢, once per term) | $0.59 | $1.00 | $1.72 |
| Hosting (DB row, images, rendering on your server) | ~$0.10 | ~$0.30 | ~$1.00 |
| Included AI credits at cost (credits ÷ 1.6) | $0 | up to $7.50 | up to $22.50 |
| Research runs (≈$0.10–0.20 each) | — | ~$0.80 | ~$2.40 |
| Included domain | — | — | up to $20 |
| **Worst case left over** | **~$9.30** | **~$14.40** | **~$1.40** |

Typical usage is far below the worst case (most people use a fraction of included credits). Premium's worst case is thin because it includes both a domain and the most credits; if real usage shows Premium users max out both, lower the monthly credits to 200 before touching the price.

Credits: $5 = 500, $10 = 1,200, $20 = 3,000. A rewrite costs about 5–10 credits, a full career search 30–60. Real cost is measured per request (`lib/ai/metering.ts`) and the platform's daily spend is recorded in `ai_spend`.

Domains bought through Formora: registrar price + 20% + $3, prepaid (a $12 .com sells for $18).

## 5. What makes people stay

1. **It updates itself.** Pro and Premium check GitHub weekly and search the web for new talks, publications, awards, press and roles. Findings arrive as suggestions (email digest + editor panel); one click adds them. Nothing changes without the owner's approval, and low-confidence or same-name results are dropped.
2. **It lives at their own name.** A domain connected or bought through Formora is the most durable lock-in there is, and it's one people are glad of.
3. **Five-year prepay.** Fewer renewal moments means fewer decisions to leave.
4. **Their design is specific to them.** Rebuilding a crafted, profession-specific site elsewhere is real work.

## 6. Abuse and safety

- One trial per Google account; credits only via the ledger (every grant has a unique reference, so webhooks or retries can't double-grant).
- Per-plan daily AI request caps, even when credits remain; customers' own keys are encrypted at rest and verified before saving.
- Global daily AI budget; scheduled research only runs within the customer's credits.
- Image uploads are type-checked by their bytes, size-limited and counted against plan storage; orphaned uploads are deleted after a week.
- Community and support: spam terms, shouting, link limits, rate limits, moderation with reasons.
- Templates only reach customers after the owner approves them at `/templates/review`.

## 7. What exists today (October 2026)

- 49 templates (46 profession-specific, five of them animated, across 30 professions from software to law, trades, healthcare, teaching and hospitality) with palettes, font pairings, accent colour, section show/hide and renaming; a gallery filtered by field, profession, style and light/dark; an approval desk for the owner.
- A fast editor with autosave (browser + account, conflict-safe), undo/redo, click-in-preview to edit, device previews, image uploads, AI writing help and imports.
- Plans, trial, grace and resting sites; Stripe Checkout for plans and credits with saved cards, automatic renewal and receipts; customers' own Claude keys.
- Lifecycle email over your own SMTP mailbox; an hourly job for emails, renewals, monthly credits, auto-updates and clean-up.
- Custom domains on your own server (Caddy, automatic HTTPS), domain purchases with refunds on failure, Premium's included domain.
- Community board (suggestions, reviews, design submissions, moderation) and a private support desk.

## 8. Next, in order

1. **Your name, domain and company mailbox.** Then set `SMTP_*`, `APP_URL`, Stripe keys and the webhook (see `docs/SELF_HOSTING.md`).
2. **Approve templates** at `/templates/review`; edit `lib/about.ts` with your story.
3. **Legal pages:** privacy policy and terms (needed for Google sign-in verification and payments).
4. **Domain renewals** before purchased domains turn one year old.
5. **Analytics per portfolio** (page views, no personal data): the first thing people feel in Pro.
6. **Verification badges** (GitHub ownership, live link checks) to make portfolios more trustworthy than AI-written CVs.

## 9. Metrics that matter

| Stage | Metric | Early target |
| --- | --- | --- |
| Activation | Trials that publish in the first session | 30%+ |
| Conversion | Trials that buy a plan (including in grace) | 8–15% |
| Term mix | Payments that are multi-year | 40%+ |
| Retention | Customers who renew or are on a multi-year term after 1 year | 70%+ |
| Updates | Suggestions applied per Pro customer per quarter | 2+ |
| Cost | AI cost per paying customer per year | below included credits at cost |
