# Security

How Formora protects customers and their data, what was checked before launch (October 2026), and what to keep doing.

## What protects the site

| Area | How |
| --- | --- |
| Transport | Caddy serves only HTTPS (automatic certificates). `Strict-Transport-Security` tells browsers to keep using HTTPS. Only Caddy's ports 80/443 are public; the app, database and headless browser are reachable only inside Docker. |
| Response headers | `next.config.ts`: HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` and CSP `frame-ancestors 'self'` (no clickjacking), `Referrer-Policy`, `Permissions-Policy` (no camera, microphone, location, payment), CSP `base-uri 'self'; object-src 'none'`. |
| Sign-in | Google, or email + password hashed with scrypt (minimum 10 characters). Sessions are signed JWT cookies (HttpOnly, SameSite=Lax, Secure on HTTPS). Attempt limits are stored in the database so they survive restarts: 10 per account and 30 per address every 15 minutes. Password-reset and verification tokens are random, stored hashed, single-use and expire. |
| Superadmin | Signs in only at the secret console address (`SUPERADMIN_PATH`); `/console` answers “not found”. Five wrong passwords per email (ten per address) pause console sign-in for 15 minutes. Superadmin powers lapse **12 hours** after a console sign-in. The normal `/login` refuses the superadmin account. |
| Cross-site requests | Cookies are SameSite=Lax, and every API route wrapped in `route()` (`lib/api/http.ts`) refuses writes sent from another website’s page (`Sec-Fetch-Site` / `Origin`). Webhooks and the cron job have no browser origin and use their own signatures and secrets. |
| Who can do what | Owner-only routes use `requireOwner`; admin routes check `isAdmin`/`isSuperadmin` and answer 404 otherwise. Content passes `validateContent` (zod) before it’s saved or shown; links with `javascript:`/`data:` are dropped. |
| Injected HTML | React escapes everything by default. Search-engine JSON-LD escapes `<`, so text such as `</script>` in a community post can't break out (this was a real hole, fixed before launch). Custom HTML in blog posts runs in an `<iframe sandbox="allow-scripts">` with no same-origin access. Text from uploaded CVs is escaped before it's shown. |
| Database | Every query passes values as parameters; the few pieces of SQL built in code come from fixed lists, never from what a visitor typed. |
| Uploads | Checked by content (magic bytes), size and type; SVG refused; ZIPs checked for paths and file types; per-hour limits and plan storage limits. |
| Outgoing requests | Addresses customers give us (feeds, their own pages) must be public: private, loopback, link-local and cloud-metadata addresses are refused, including IPv4-in-IPv6 forms, on every redirect and again **at the moment of connecting** (no DNS rebinding). Size and time limits apply. |
| Customers’ AI keys | Claude or OpenAI keys are checked with the provider before saving, encrypted with AES-256-GCM (`ENCRYPTION_KEY`), never sent back to the browser (only a hint), used only for that customer's requests, and deleted on removal. Key attempts are limited to 10 an hour. OpenAI requests are sent with `store: false`. |
| Money | Prices are calculated on the server; Stripe webhooks are verified by signature; a domain is never bought before payment. |
| Abuse limits | Sign-up (8/hour/address), password reset (5/hour/email, 20/hour/address), contact form (5/hour/address, 200/day overall), GitHub import (30/hour/address), page-view counter (300/hour/address), AI (per-plan daily caps and a global daily budget), community posting rules. |
| Server | The app runs as a non-root user. The headless browser image is pinned by digest. Secrets live only in `.env` on the server, never in the repository. |

## Fixed in the pre-launch review (October 2026)

1. **Stored cross-site scripting on community review pages.** A review title containing `</script><script>…` would have run in every visitor's browser. JSON-LD on every page now escapes `<`; tested with a real attack.
2. **No security headers.** Added (see above).
3. **No cross-site request check.** Added in `route()`.
4. **Vulnerable dependencies.** Next.js 16.2 had remote-code-execution and SSRF advisories (including in `next/og`, which renders our social cards) → 16.4.0. PDF.js could run JavaScript from a malicious PDF → 6.4. nodemailer → 10. SheetJS → the fixed 0.20.3 from SheetJS's own site (npm's copy is abandoned). Unused `axios` removed. `npm audit --omit=dev` went from 34 issues (2 critical) to 10 (none critical), all in build-time tooling (`shadcn` CLI) or `mammoth`'s command-line helpers, none of which run on the server.
5. **Sign-in limits reset on restart.** Moved to the database (`lib/security/rate-limit.ts`, migration 018).
6. **Superadmin sessions lasted 30 days.** Powers now lapse after 12 hours.
7. **Unlimited public endpoints.** Contact form, GitHub import, password reset (per address) and the page-view counter are now limited.
8. **Outgoing-request gaps.** IPv4-in-IPv6 addresses and DNS rebinding.
9. **Local test login could switch on without an address.** It now needs an explicit localhost `APP_URL`.
10. **Unpinned third-party image.** Obscura is pinned to 0.2.4 by digest.
11. **Go-live checklist** (`/admin`) now warns when `ENCRYPTION_KEY` isn't separate from `AUTH_SECRET` and when settings meant for tests are left on.

## Before launch

- Set every secret to a long random value: `AUTH_SECRET`, `ENCRYPTION_KEY` (separate!), `CRON_SECRET`, `POSTGRES_PASSWORD`, `CALCOM_WEBHOOK_SECRET`.
- Leave unset in production: `DEV_LOGIN`, `TEMPLATES_REQUIRE_APPROVAL=false`, and anything ending in `_BASE_URL`/`_API_URL` used by tests, plus `INVESTIGATOR_ALLOW_PRIVATE_FETCH`. The `/admin` checklist flags them.
- Use a long, unique superadmin password and keep `SUPERADMIN_PATH` private.
- Turn on two-factor authentication for every outside account: Stripe, Vercel, Anthropic, Google Cloud, the server host, the email provider and GitHub.
- Back up the database daily to somewhere off the server, and test a restore once.
- Keep the server updated (`unattended-upgrades` on Ubuntu) and allow only ports 22, 80 and 443 in the firewall; SSH with keys only.

## Keep doing

- Run `npm audit --omit=dev` monthly and before each release; update Next.js promptly when it publishes security releases.
- Run the end-to-end suites (`tests/e2e/`) on a fresh database before pushing.
- Next step for defence in depth: a full script Content-Security-Policy with per-request nonces, so that even an injected script couldn't run.
- Report security problems to the support inbox; don't open public issues for them.
