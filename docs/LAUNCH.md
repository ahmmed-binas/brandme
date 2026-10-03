# Launching Formora on your domain

The short version: rent a small Linux server (a VPS), point your domain at it, fill in `.env`, and run one command. Everything else — the database, HTTPS for your site, and HTTPS for every customer's own domain — runs on that one server.

## Why not shared hosting?

Shared hosting (cPanel, Hostinger "Web Hosting", GoDaddy Economy and similar) is built for PHP sites like WordPress. Formora needs things those plans don't give you:

| Formora needs | Shared hosting |
| --- | --- |
| A Node.js server that runs all the time | Usually no, or a limited "Node app" that sleeps and restarts |
| PostgreSQL | Usually MySQL only |
| Receiving customers' domains and issuing HTTPS certificates for them automatically (Caddy) | No: you can't run your own web server on ports 80/443 |
| An hourly job (reminders, renewals, updates) | Sometimes cron, but it can't reach a sleeping app reliably |
| Docker | No |

The customer-domain feature is the deal-breaker: on shared hosting every customer domain would have to be added by hand in cPanel. So use your shared hosting for email if it comes with a mailbox, and run Formora on a VPS.

## Which server

Any VPS with a public IPv4 address, Ubuntu 24.04, and at least 2 GB RAM (4 GB is comfortable). Good, inexpensive options:

| Provider | Plan | Approx. price |
| --- | --- | --- |
| Hetzner Cloud | CX22 (2 vCPU, 4 GB) | ~€4–5/month |
| DigitalOcean | Basic droplet, 2 GB | ~$12/month |
| Vultr / Linode (Akamai) | 2 GB shared | ~$10–12/month |

Pick a data-centre region close to most of your customers. Turn on the provider's automatic backups (about 20% extra), which also back up the database.

## Step by step

1. **Buy your domain** (e.g. at Cloudflare, Namecheap or Porkbun) and **create the server**. Note the server's IPv4 address.
2. **DNS:** at your domain's DNS settings add
   - `A  @    → <server IP>`
   - `A  www  → <server IP>`
3. **Install Docker on the server:**
   ```bash
   ssh root@<server IP>
   curl -fsSL https://get.docker.com | sh
   ```
4. **Get the code and settings:**
   ```bash
   git clone https://github.com/ahmmed-binas/brandme.git formora && cd formora
   cp .env.example .env
   nano .env
   ```
   Fill in at least: `POSTGRES_PASSWORD`, `APP_DOMAIN`, `APP_URL=https://<your domain>`, `ACME_EMAIL`, `SERVER_IPV4`, `AUTH_SECRET`, `CRON_SECRET`, and the `SMTP_…` settings for your company mailbox (`SELF_HOSTING.md` has a table). Google sign-in (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`) and `ADMIN_EMAILS` are optional. Leave `DEV_LOGIN` empty.
5. **Start:**
   ```bash
   docker compose up -d --build
   curl https://<your domain>/api/health     # {"ok":true,"database":"ok"}
   ```
   Caddy gets your HTTPS certificate on the first request; give it a minute.
6. **Create your superadmin account** (the owner's login, email and password, no Google needed):
   ```bash
   docker compose exec -it app node scripts/create-superadmin.mjs
   ```
   It asks for your email, name and a password (at least 12 characters, typed hidden). Run it again to change the password; `--remove <email>` takes the role away. Then sign in at `https://<your domain>/login`.
7. **Check email:** open `/admin/email` and press **Send a test email**. If it fails, the message says which setting to fix; change `.env`, run `docker compose up -d`, and try again.
8. *(Optional)* **Google sign-in:** in Google Cloud Console add `https://<your domain>/api/auth/callback/google` as a redirect URI (see `GOOGLE_AUTH_SETUP.md`).
9. **Open `/admin`.** The go-live checklist checks every setting from the live server and tells you what's left: Stripe, email, selling domains, AI.
10. **Approve templates** at `/templates/review` and write your first Journal post at `/admin/journal`.

Updates later:

```bash
cd formora && git pull && docker compose up -d --build
```

## How customers get their own name as a domain

There are two paths, both in the editor's **Publish** dialog:

1. **Buy one through Formora** (the easy path most people take).
   - We suggest names from their portfolio name (`janeokafor.com`, `janeokafor.dev`, `jane-okafor.com`, `okafor.dev`…), or they type their own idea and show which are free, with your price (registrar price + `DOMAIN_MARKUP_PERCENT` + `DOMAIN_SERVICE_FEE_CENTS`).
   - They enter the owner details the domain registry requires (they legally own the domain) and pay with Stripe.
   - We buy it from the registrar (Vercel, used only as a registrar), point it at your server, and Caddy issues HTTPS on the first visit. No DNS work for the customer; it's live in minutes.
   - Premium includes one domain a year at no charge.
   - Each year: reminder emails from 30 days before expiry, and a **Renew** button at `/account/domains`. Nothing renews without them paying, and nothing is charged to you before they've paid.
2. **Connect one they already own.** The editor shows the exact DNS records to add at their registrar (an `A` record to your server and a `TXT` record proving ownership), checks them automatically, and turns the domain on with HTTPS as soon as they're right.

In both cases their blog lives on the same domain (`janeokafor.com/blog`), with its own sitemap for search engines.

What you need for path 1: a Vercel account with a payment method and an API token (`VERCEL_API_TOKEN`), and Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`). Path 2 needs only `SERVER_IPV4`.

## Before you announce it

- [ ] `/admin` checklist all green (yellow is fine for optional features).
- [ ] Sign up as a normal customer with a second Google account, publish a portfolio, write a blog post, and visit it signed out.
- [ ] Do a real Stripe payment in live mode for the cheapest plan, then refund it from the Stripe dashboard.
- [ ] Connect a spare domain or subdomain you own to a test portfolio and check HTTPS works.
- [ ] Send yourself a support request and reply to it from `/community/support`.
- [ ] Check backups are switched on at your server provider.
