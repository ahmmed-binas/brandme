# Free-first launch plan (agreed with the owner, not built yet)

Status: **planned only.** Start when the owner says "implement". Work in the order at the bottom, test end to end, then update the docs.

Goal for the first ~6 months: **users and engagement first, money later.** Charge only what keeps hosting and the domain running. No profit on AI, domains or card fees beyond a few cents.

## 1. Plans

| Plan | Price | What's in it |
| --- | --- | --- |
| **Basic** | **Free** | Every template; 1 published site on `name.<our domain>`; small "Made with Formora" link; ~100 MB images; blog; AI with the customer's own Claude key **or** pay-as-you-go credits |
| **Pro** | $24 / year (suggested; owner to confirm) | Up to **3 sites/portfolios** (hard maximum); the **Investigator** (all schedules, even daily, since AI is paid by usage); own domain; no branding; more storage |
| **Need more?** | — | **"Book a free call"** with the owner (e.g. a Cal.com/Calendly link) for custom websites, teams, more than 3 sites. Price agreed on the call. No "Enterprise" plan |

- **Premium is removed** (no customers on it yet). Code to update: `lib/plans.ts`, pricing page, Investigator access (`lib/investigator/settings.ts`: Pro gets every frequency), included domain, monthly credits, tests (`billing.mjs`, `investigator.mjs`).
- **Free trial:** open question. Suggested: drop the 14-day trial (Basic is free anyway) but keep **one free Investigator check** so people can see it work.
- AI usage is **independent of the plan**: same price for everyone.

## 2. Money: at cost, fees shown clearly

Card fees (Stripe standard, check the live rate for the account's country): about **2.9% + $0.30** per payment, plus ~1.5% for international cards and ~1% for currency conversion. **Stripe does not return its fee on a refund.**

- **AI credits:** Anthropic's real cost **+ 5% service fee** (today the markup is 60%: `MARKUP` in `lib/ai/metering.ts`). Packs of **$5, $10, $20** (smaller payments lose money to the fixed 30¢). Show the card fee as its own line at checkout, e.g. "$10 credits + $0.59 card fee". Credits never expire.
- **Domains:** registrar price + card fee only, no markup (today: markup in `lib/domains`).
- **Pro:** $24/yr ≈ $23 after fees. Hosting ~$20–25/month (Hetzner VPS + backups) plus ~$12/yr domain is covered by about **13 Pro customers**. Owner confirms the price.
- **Refunds:** possible for unused credits and for Pro within 14 days; the amount returned is the payment minus Stripe's fee, and this is said **before** paying (checkout, pricing page, receipt, terms).
- Every price and fee visible before payment (checkout screen, pricing page in the footer, "Upgrade" dialogs).

## 3. Website navigation

- Remove **Pricing** from the top menu (keep `/pricing`, linked from the footer and every "Upgrade" button).
- Add **Agents** to the menu. First entry: **the Investigator** (`/agents/investigator`).
- Menu: Templates · Gallery · Agents · Community · Journal.

## 4. The Investigator Agent page

- Character: **the detective with the hat** (owner's choice), a friendly illustrated avatar (hat, magnifying glass). Create it as an SVG/illustration and reuse it in the app (Investigator settings page, emails, editor card).
- Blog-style page: who he is, what he checks (own website via a real browser, GitHub, blogs/Medium/Substack/YouTube, news, Credly…), how he double-checks findings, what he never does (log in, read private data), technology (Claude with web search, Obscura headless browser, fact-checking), plans and cost, FAQ.
- **Comments and reviews** on the page (reuse the community/review system, star rating).
- Visual: images, a short clip of the Investigator updating a site, a call to action ("Let him keep your site up to date").

## 5. Sources the Investigator reads (agreed in discussion)

- Remove **Instagram, TikTok, X** (nothing visible without logging in).
- **Facebook → "Facebook business Page"** only.
- Keep **LinkedIn** (identity + headline) and make **copy-paste of the profile** the main LinkedIn import (Ctrl+A, Ctrl+C → Paste anything), with the data export for full history. **Never** log in or scrape LinkedIn with credentials.
- Add: **Credly**, **Stack Overflow**, **Sessionize**, **podcast feeds**; later **Property Finder / Bayut agent profiles** (Dubai real-estate niche). Possibly a different source list per profession.

## 6. "Keep it alive" channels (later phases)

1. **Email:** a private forwarding address per customer + a monthly "anything new? just reply" email.
2. **ChatGPT / Claude connector (MCP):** "Tell ChatGPT your news, your website updates itself."
3. **WhatsApp** monthly check-in (text or voice note), for the UAE launch.

All go through the same path: extract → fact-check → "ask me first" or "update automatically" (email + 30-day undo).

## 7. Blog upgrade (Journal and customers' blogs)

The blog is where visitors are attracted; today posts have no images.

- A **media block at the top of a post**: image, video (upload or YouTube/Vimeo), or **custom HTML/CSS** (shown in a sandboxed iframe so it can't touch the site or steal sessions).
- Images inside posts, a cover image for each post, nicer list cards with covers.
- Available to the **superadmin** (Journal) **and to every user for free** (their portfolio blog).
- Upload checks as elsewhere (content type by magic bytes, size limits).

## 8. Marketing (owner)

- Advertise on TikTok/Instagram/LinkedIn with short videos; the owner may build an agent to make them.
- We can supply vertical 9:16 product clips from the existing recorder (`scripts/samples/template-clips.mjs`).
- Track engagement in the console (sign-ups, visitors, which agent pages are read).

## Order of work (when told "implement")

1. Plans: Basic free / Pro, remove Premium, 3-site max, "Book a free call".
2. Money: credits at cost + 5%, packs, fees shown, refund wording, domain price at cost.
3. Navigation: Pricing out, Agents in.
4. The Investigator Agent page + avatar + comments/reviews.
5. Investigator sources clean-up (remove Instagram/TikTok/X, Facebook Pages, LinkedIn copy-paste as main import).
6. Blog upgrade (media block, images, sandboxed HTML).
7. Tests for each (`billing.mjs`, `investigator.mjs`, new ones for agents and blog media), docs, commit, push.
8. Later: email channel → ChatGPT/Claude connector → WhatsApp; new sources (Credly, Stack Overflow, Sessionize, podcasts, Property Finder/Bayut).

## Questions still open for the owner

- Pro price ($24/yr suggested) and whether to also offer monthly.
- Keep or drop the 14-day trial (suggested: drop, keep one free Investigator check).
- The booking link for "Book a free call" (Cal.com/Calendly account).
- The agent's name ("The Investigator", or a character name).
