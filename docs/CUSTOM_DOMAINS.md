# Custom domains and profile import: setup

## How custom domains work

1. **Buy a domain** (any plan). In the editor's Publish dialog the user searches a name; suggestions such as `adalovelace.com` and `adalovelace.dev` are checked against the Vercel registrar, with the customer's price shown. They enter the registrant details ICANN requires (they become the legal owner) and pay through Stripe Checkout. The Stripe webhook then buys the domain, attaches it (and `www.`) to the project, and Vercel issues HTTPS automatically. If registration fails, the payment is refunded automatically.
2. **Connect a domain they already own** (plans with `connectOwnDomain`, Pro by default). The domain is added to the Vercel project, and the user sees the exact DNS records to add (an `A` record for a root domain, a `CNAME` for a subdomain, plus a `TXT` record if Vercel needs ownership proof). The status updates by itself once DNS is correct.
3. **Serving.** `proxy.ts` rewrites any request whose host isn't the site's own (`APP_URL` / `APP_HOSTS`) to `/sites/<host>`, which renders that person's published portfolio. Unpublished portfolios and unknown domains return 404.

Code: `lib/domains/` (names, Vercel client, business rules), `app/api/domains/`, `app/api/webhooks/stripe/`, `components/editor/DomainPanel.tsx`.

## One-time setup

The site must be hosted on **Vercel** (it attaches domains to the Vercel project and Vercel provides the certificates).

1. **Vercel token:** Vercel → Account Settings → Tokens → create a token with access to the team that owns the project → `VERCEL_API_TOKEN`.
2. **Project id:** Vercel → Project → Settings → General → Project ID → `VERCEL_PROJECT_ID`. If the project belongs to a team, also set `VERCEL_TEAM_ID` (Team Settings → General).
3. **Payment method on Vercel:** domain purchases are charged to the Vercel account, so add a card there. Formora charges the customer first, so purchases are always pre-paid.
4. **Stripe:** Dashboard → Developers → API keys → `STRIPE_SECRET_KEY`. Then Developers → Webhooks → Add endpoint `https://YOUR-DOMAIN/api/webhooks/stripe` with the events `checkout.session.completed` and `checkout.session.async_payment_succeeded` → copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
5. **`APP_URL`:** the site's own URL (e.g. `https://formora.app`). Without it, custom-domain routing stays off.
6. Optional pricing: `DOMAIN_MARKUP_PERCENT` (default 20) and `DOMAIN_SERVICE_FEE_CENTS` (default 300). A $12 domain sells for $18.

## Not built yet

- **Renewals.** Domains are bought for one year with auto-renew **off**, so Formora never pays for a renewal the customer hasn't paid for. Before the first renewals are due (one year after launch), add a renewal reminder email and a "Renew for $X" checkout that calls Vercel's renew endpoint, or convert purchases to a yearly Stripe subscription.
- **Transfers out.** Customers own their domains; support requests to move one away are handled manually in the Vercel dashboard for now.

## Profile import

| Source | What it fills | How |
| --- | --- | --- |
| CV upload | Everything (with AI), or name, contact and skills (without) | File is read in the browser; with AI enabled the text is structured by Claude |
| GitHub | Name, bio, location, top original repositories as projects, languages as skills | Public API, no login. Set `GITHUB_TOKEN` to raise the rate limit from 60 to 5,000 requests/hour |
| LinkedIn | Name, headline, About, positions, skills, projects | The member's own **data export** ZIP, parsed in the browser |
| Paste anything | Everything found in the text | Claude (`/api/ai/import`), counts as one AI edit |

Why not "Connect LinkedIn / Instagram / Facebook" buttons?

- **LinkedIn**'s self-serve API (Sign In with LinkedIn) only returns name, email and photo. Work history, headline and skills need a LinkedIn partner agreement, and stored profile data is limited to 24 hours. The data export contains everything and is the member's own data to share.
- **Instagram** closed its API for personal accounts in December 2024. Business and Creator accounts can be connected through "Instagram API with Instagram Login" (Meta app review required). That would be worth adding for a photo-gallery template, but it's not useful for CV-style content.
- **Facebook** Login gives name and photo only.
- Scraping these sites breaks their terms and gets accounts blocked, so the app doesn't do it.
