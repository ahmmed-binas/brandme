# Custom domains and profile import: setup

Portfolios are served by **your own server** (see `SELF_HOSTING.md`). Caddy issues HTTPS certificates for customer domains automatically.

## How custom domains work

1. **Buy a domain** (any plan). In the editor's Publish dialog the user searches a name; suggestions such as `adalovelace.com` and `adalovelace.dev` are checked against the Vercel registrar, with the customer's price shown. They enter the registrant details ICANN requires (they become the legal owner) and pay through Stripe Checkout. The Stripe webhook buys the domain, then sets its DNS (`@` and `www`) to `SERVER_IPV4`. If registration fails, the payment is refunded automatically. Vercel is only the registrar; nothing is hosted there.
2. **Connect a domain they already own** (plans with `connectOwnDomain`, Pro by default). The editor shows two records to add at their DNS provider:
   - `TXT _formora.<domain>` = `formora-verify=<token>`. This proves they control the domain, so nobody can claim someone else's.
   - `A <domain>` and `A www.<domain>` → `SERVER_IPV4` (or `CNAME` → `SITES_CNAME_TARGET` for a subdomain like `me.ada.dev`).
   The app checks DNS itself and turns the domain "Live" once both are correct.
3. **Serving.** `proxy.ts` rewrites requests for customer hosts to `/sites/<host>`, which renders the published portfolio. Only verified domains are served. Caddy asks `/api/domains/tls-allowed` before issuing a certificate and gets a yes only for verified domains with a published portfolio.

Code: `lib/domains/` (names, DNS checks, registrar client, business rules), `app/api/domains/`, `app/api/webhooks/stripe/`, `components/editor/DomainPanel.tsx`, `proxy.ts`, `Caddyfile`.

## One-time setup

1. **`SERVER_IPV4`**: your server's public IPv4 address. Without it, custom domains are switched off.
2. **`APP_URL`**: your site's own URL (e.g. `https://formora.app`), so the app can tell its own domain from customers' domains.
3. To **sell** domains:
   - **Vercel token:** Vercel → Account Settings → Tokens → `VERCEL_API_TOKEN` (plus `VERCEL_TEAM_ID` if the token belongs to a team). Add a card on Vercel; domain purchases are charged there, after your customer has already paid you.
   - **Stripe:** Dashboard → Developers → API keys → `STRIPE_SECRET_KEY`. Then Developers → Webhooks → endpoint `https://YOUR-DOMAIN/api/webhooks/stripe` with the events `checkout.session.completed` and `checkout.session.async_payment_succeeded` → signing secret into `STRIPE_WEBHOOK_SECRET`.
   - Pricing: the registrar's price plus Stripe's card fee (2.9% + 30¢), so domains are sold at cost: a $12 domain is $12.65. `DOMAIN_MARKUP_PERCENT` and `DOMAIN_SERVICE_FEE_CENTS` (both 0 by default) can add a margin later.
   - Buying or connecting a domain needs **Pro**. Domains already set up keep working if Pro ends, and can always be renewed.

## Renewals

Domains are bought for one year with auto-renew **off**, so Formora never pays for a renewal the customer hasn't paid for.

- From **30 days before expiry** the hourly job emails the owner once a week ("Renew ada.dev by 12 October") until they renew.
- **/account/domains** lists their bought domains with the expiry date and a **Renew for $X** button (open from 90 days before expiry). The price is the registrar's renewal price plus the card fee, like a purchase.
- After Stripe confirms payment, the webhook calls the registrar's renew endpoint and moves the expiry date on a year. The owner gets a confirmation email.
- If the registrar refuses the renewal, the payment is **kept** and the order is marked `renewal_manual`; an email to `SMTP_TO` says which domain to renew by hand in the Vercel dashboard, with the SQL to mark it done. Check the renew endpoint against Vercel's current API docs before the first renewals are due.

Code: `startRenewal`, `fulfilRenewal` and `remindRenewals` in `lib/domains/service.ts`, `app/api/domains/renew/`, `app/account/domains/`.

## Blogs on custom domains

`proxy.ts` keeps the path when it rewrites a customer's host, so `ada.dev/blog` and `ada.dev/blog/<post>` serve that portfolio's blog, and `ada.dev/sitemap.xml` and `ada.dev/robots.txt` are generated for that domain. Any other path is a 404.

## Not built yet

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
