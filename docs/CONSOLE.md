# The superadmin console

The owner's own control room: how the business is doing, every customer account, and links to every admin tool. It has its own look (always dark, no site header) and its own address.

Code: `app/console/*` (the internal route), `components/console/*`, `lib/console/*`, `lib/analytics/track.ts`. Tests: `tests/e2e/console.mjs`, `tests/e2e/superadmin.mjs`.

## Signing in

1. Create the account once: `npm run admin:create` (Docker: `docker compose exec -it app node scripts/create-superadmin.mjs`).
2. Choose a secret address and put it in `.env`: `SUPERADMIN_PATH=/hq-7c41e9`. Restart.
3. Sign in at `https://<your domain>/hq-7c41e9`.

Rules (in `auth.ts`, `lib/accounts/passwords.ts`, `utils/user-account.ts`, `proxy.ts`):

- The console has its own sign-in (`console` provider). It accepts only confirmed superadmin accounts.
- The normal `/login` refuses the superadmin account with the same message as a wrong password, so it doesn't reveal that the account exists.
- Superadmin powers (`user.isSuperadmin`) come only with a console sign-in; the same account signed in any other way has none.
- `/console` answers "not found" once `SUPERADMIN_PATH` is set; the secret address is rewritten to it and sent with `X-Robots-Tag: noindex`.
- Five wrong passwords for an email (or ten from one address) pause console sign-in for 15 minutes.
- The go-live checklist warns while the console is still at `/console`.

A secret address is a second lock, not the only one: the password, the attempt limit and HTTPS are what keep the console safe. Use a long password and don't share the address.

## The dashboard

Ranges: 7 days, 30 days, 90 days (per day) and 12 months (per week). All amounts are US dollars at the time of payment (every price is charged in USD).

| Figure | Where it comes from |
| --- | --- |
| Revenue | Paid `billing_orders` (plans, AI credits) + paid `domain_orders` (not refunded), with the change against the previous period |
| Yearly run rate | Active paying accounts × their plan's yearly list price |
| Paying subscribers, trials, lapsed | `app_users` plan and expiry dates (the superadmin is left out of every user count) |
| Sign-up to paid | Of the people who joined in the range, the share who have paid for a plan |
| Domain margin | Charged for domains minus the registrar's price |
| AI cost to you | `ai_spend`: what AI on your own key cost, next to the credits sold |
| Visitors, page views, top pages, referrers, devices | `page_views` (below) |
| Portfolio views, most-viewed portfolios | `page_views` of `/p/<address>` and customer domains |
| Waiting for you | Open support requests, gallery submissions and posts to moderate |

Charts are SVG with a hover tooltip and a "Show table" view. Colours come from a validated palette (blue, orange, aqua; checked for colour blindness and contrast on the dark background).

**Users** lists every account (search by email, name or username; filter paying, trial or lapsed) with plan, portfolios, credits and what they have paid in total.

## Visitor counting (no cookies)

`components/common/VisitBeacon.tsx` sends the page's path and referrer to `/api/t` on each page view. `lib/analytics/track.ts` stores:

- the host and path, whether it's the marketing site or a customer's portfolio, the referring site's host name, and the device type;
- a visitor id that is a hash of IP address, browser, **today's date** and a secret. The same person counts once per day and can't be followed from day to day.

No IP address, cookie or account id is stored. Bots, automated browsers, `/api`, `/admin` and the console aren't counted. Rows older than 400 days are deleted by the hourly job. Nothing is stored on the visitor's device and nothing identifies them, which is the approach privacy-friendly analytics tools take to avoid cookie banners. Still describe it in a privacy notice, and check the rules where your customers are (the site has no privacy page yet: owner's decision).
