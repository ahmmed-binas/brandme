# Free-first launch plan (agreed with the owner, not built yet)

Status: **steps 1–3 built (October 2026), plus the Investigator page, Book a free call and the legal pages.** Still to build: Basic one-set-of-content (step 1), the agent's character, avatar and comments (step 4), sources clean-up (step 5), blog upgrade (step 6).

## Owner's decisions (7 October 2026)

- **Pro: $24/yr or $2.50/mo.** Self-serve: up to 3 live portfolios, own domain, no branding, 1 GB. Having the owner personally look after a customer's site is a **separate done-for-you service**, sold through "Book a free call" with a price agreed on the call.
- **No trial.** New accounts start on free Basic. Every account's **first Investigator check is free**.
- **The Investigator on every plan, any schedule** (daily, weekly, monthly, 6-monthly, yearly or every N days), because each check's AI step is paid by the customer (credits at cost or their own key). No monthly credit allowances.
- **Book a free call: Cal.com** (free). `BOOKING_URL` = the owner's event link; optional webhook (`CALCOM_WEBHOOK_SECRET`) lists bookings in the console. Cal.com sends the confirmation emails and calendar invites.
- **AI providers: Claude now, ChatGPT/OpenAI later** (after launch; every AI feature would need a second implementation).
- **Legal pages name the owner personally** for now (`LEGAL_NAME`, `LEGAL_COUNTRY`). Domain not bought yet.
- Built details: when Pro ends there are 14 days of grace, then the account is Basic: the first-published portfolio stays live, others rest. Own domains already set up keep working and can be renewed. Old trial accounts became Basic; Premium became Pro (migration `012_free_first`).

Goal for the first ~6 months: **users and engagement first, money later.** Charge only what keeps hosting and the domain running. No profit on AI, domains or card fees beyond a few cents.

## 1. Plans

| Plan | Price | What's in it |
| --- | --- | --- |
| **Basic** | **Free** | Every template; **one portfolio at a time** (one set of content); 1 published site on `name.<our domain>`; small "Made with Formora" link; ~100 MB images; blog; **the Investigator** (each check paid by usage); AI with the customer's own Claude key **or** pay-as-you-go credits |
| **Pro** | **Monthly or yearly** (yearly cheaper; suggested $24/yr, monthly a little above a twelfth because of the 30¢ card fee) | Up to **3 portfolios side by side** (hard maximum); own domain; no branding; more storage; all Investigator schedules |
| **Need more?** | — | **"Book a free call"** with the owner (e.g. a Cal.com/Calendly link) for custom websites, teams, more than 3 sites. Price agreed on the call. No "Enterprise" plan |

- **Premium is removed** (no customers on it yet). Code to update: `lib/plans.ts`, pricing page, Investigator access (`lib/investigator/settings.ts`: Pro gets every frequency), included domain, monthly credits, tests (`billing.mjs`, `investigator.mjs`).
- **Free trial:** open question. Suggested: drop the 14-day trial (Basic is free anyway) but keep **one free Investigator check** so people can see it work.
- AI usage is **independent of the plan**: same price for everyone. The Investigator is on every plan; its checks are paid like any AI use (credits or own key).
- **Basic: one set of data.** Switching template **moves the same content to the new design** (no retyping); the old design's own settings (palette, layout options) are replaced. Show a clear warning first. Technically: Basic users keep a single `portfolios` row whose `template_id` changes, instead of one row per template.

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

- Character: **the detective with the hat** (owner's choice), with a **character name** (to choose: e.g. Inspector Iqbal, Detective Dex, Sherlock Sam, Agent Rafi), a friendly illustrated avatar (hat, magnifying glass). Create it as an SVG/illustration and reuse it in the app (Investigator settings page, emails, editor card).
- Blog-style page: who he is, what he checks (own website via a real browser, GitHub, blogs/Medium/Substack/YouTube, news, Credly…), how he double-checks findings, what he never does (log in, read private data), technology (Claude with web search, Obscura headless browser, fact-checking), plans and cost, FAQ.
- **Comments and reviews** on the page (reuse the community/review system, star rating).
- Visual: images, a short clip of the Investigator updating a site, a call to action ("Let him keep your site up to date").

## 5. Sources the Investigator reads (agreed in discussion)

- Remove **Instagram, TikTok, X** (nothing visible without logging in).
- **Facebook stays for everyone** (personal profiles too): use whatever is public plus name/photo to confirm identity; most personal profiles show little logged out.
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
- "Book a free call": the visitor picks a free time slot; both sides get an automatic confirmation email. Easiest: **Cal.com** (free, open source, sends emails and calendar invites). Alternative: build it in, emailing through our SMTP (or the owner's MCP setup later). Owner to choose and create the account.
- The agent's character name.

## Discussion notes (decisions and reasons, so nothing lives only in chat)

- **Why free-first (option A, not open source):** the owner wants users and engagement before revenue. Technical people will build their own site with AI anyway; the buyers are non-technical professionals. Open-sourcing the app (self-host free, AGPL) was considered and **not chosen for now**.
- **LinkedIn:** never log in with customers' (or the owner's) credentials or scrape LinkedIn; it breaks LinkedIn's terms, LinkedIn has sued scrapers, and storing customers' passwords is a liability. Use copy-paste of the profile, the data export, and "paste your news".
- **The real problem to solve:** people never update their CV/site by hand, so updates must come from where they already talk: the Investigator (background), email forwarding/monthly reply, a ChatGPT/Claude connector (MCP: the AI asks "add this to your website?"), WhatsApp (UAE). We can't read people's ChatGPT history; the connector works when the app is switched on.
- **Obscura** (headless browser, v0.2.3 at the time): works for reading JavaScript-built pages and schema.org Person data. Quirks we handled: no real `innerText` (words ran together), script text in the body, and it refuses DevTools connections by host name (connect by IP; done in `lib/investigator/reader.ts`). Not yet tested on many real-world sites or in its Docker image. Stealth mode stays off.
- **Marketing ideas:** real product screen recordings beat fully AI-generated video. Tools discussed: CapCut (edit, captions), ElevenLabs (voice, incl. Arabic), Canva, Claude for scripts and hooks, Metricool/Buffer for scheduling through official APIs (no bots on new accounts). Video ideas: "CV to website in 60 seconds", free templates, "your website updates itself", one per profession (e.g. Dubai real estate agents).
- **`.ae` domains** (pending owner's OK): show "buy from a UAE registrar" instead of "taken", a short UAE guide, and `.ae` suggestions.
- **Hosting advice given:** Hetzner VPS + Cloudflare domain; SMTP via the company mailbox (rubiconinfo.com is on SupremeBox) or Brevo/Resend.
