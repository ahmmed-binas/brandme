# Hosting Formora on your own server

One server runs everything: the app, PostgreSQL, and Caddy, which provides HTTPS for your site and automatic certificates for every customer's custom domain.

## What you need

- A Linux server (2 GB RAM is enough to start) with a **public IPv4 address**, and ports 80 and 443 open.
- Docker with the Compose plugin.
- Your domain (e.g. `formora.app`) with these DNS records pointing at the server:
  - `A formora.app → <server IP>`
  - `A www.formora.app → <server IP>`

## Install

```bash
git clone https://github.com/ahmmed-binas/brandme.git formora && cd formora
cp .env.example .env
nano .env        # fill in the values marked "required for self-hosting"
docker compose up -d --build
```

The app applies database migrations every time it starts. Check it's healthy:

```bash
curl https://formora.app/api/health      # {"ok":true,"database":"ok"}
docker compose logs -f app               # app logs
```

Then:
1. **Google sign-in:** add `https://formora.app/api/auth/callback/google` as a redirect URI in Google Cloud Console (see `GOOGLE_AUTH_SETUP.md`).
2. **Stripe** (plans, AI credits and domains): add the webhook `https://formora.app/api/webhooks/stripe` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`, and put its signing secret in `STRIPE_WEBHOOK_SECRET`. Prices are set in code (`lib/plans.ts`), so there are no Stripe products to create.
3. **Email from your company address:** once your domain and mailbox exist, fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` and `SMTP_TO` (see below). Until then emails are only written to the app log.
4. **Scheduled jobs:** set a long random `CRON_SECRET`. The `cron` service calls `/api/cron` every hour (renewals, trial and renewal emails, monthly credits, automatic portfolio updates, clean-up). Check it with `docker compose logs cron`.
5. **Admins:** put your Google email in `ADMIN_EMAILS`, sign in, and approve templates at `/templates/review`. Customers only see approved templates.
6. **AI:** set `ANTHROPIC_API_KEY` and `AI_DAILY_BUDGET_USD`. Customers can also use their own key from their account page.

### Email settings for common providers

| Provider | SMTP_HOST | SMTP_PORT | SMTP_SECURE | Notes |
| --- | --- | --- | --- | --- |
| Google Workspace | smtp.gmail.com | 587 | false | Use an app password for the mailbox (2-step verification must be on). |
| Microsoft 365 | smtp.office365.com | 587 | false | Enable “Authenticated SMTP” for the mailbox in the admin centre. |
| Zoho Mail | smtp.zoho.com (or .eu) | 465 | true | Use an app-specific password. |
| Fastmail | smtp.fastmail.com | 465 | true | Create an app password with SMTP access. |
| Web host mailbox (cPanel, SupremeBox and similar) | the “outgoing server” shown in your host’s email settings (often `mail.<your domain>` or a server name like `server123.<host>.com`) | 465 | true | `SMTP_USER` is the full mailbox address. Some hosts limit how many emails an hour a mailbox may send. |

Add SPF and DKIM records for your domain as your mail provider describes, so reminders and receipts don’t land in spam. `SMTP_FROM` should be the same mailbox as `SMTP_USER` (or an alias of it), e.g. `Formora <hello@yourdomain.com>`.

After changing these, restart the app (`docker compose up -d`), sign in to the console (your `SUPERADMIN_PATH`) and open **Email settings** (`/admin/email`): it shows the settings the server is using (never the password) and has a **Send a test email** button that reports exactly what the mail server said.

## How custom domains reach the server

```
visitor ─► ada.dev (DNS: A → your server) ─► Caddy :443 ─► app :3000 ─► /sites/ada.dev
```

- Customers point their domain at `SERVER_IPV4` (or CNAME a subdomain to `SITES_CNAME_TARGET`) and add a TXT record proving ownership. The editor shows the exact records and checks them itself.
- On a domain's first visit, Caddy asks the app (`/api/domains/tls-allowed`) whether it may get a certificate. Only verified domains with a published portfolio are allowed, so nobody can make your server request certificates for names you don't serve.
- Domains bought through Formora are pointed at your server automatically.

## Updating

```bash
git pull
docker compose up -d --build
```

## Backups

The database is the only thing to back up (portfolios, users, domains). A nightly dump kept for 14 days:

```bash
# crontab -e
0 3 * * * cd /root/formora && docker compose exec -T db pg_dump -U formora formora | gzip > /root/backups/formora-$(date +\%F).sql.gz && find /root/backups -name 'formora-*.sql.gz' -mtime +14 -delete
```

Restore with `gunzip -c backup.sql.gz | docker compose exec -T db psql -U formora formora`. Copy backups off the server too.

## Without Docker

Run Node 22, PostgreSQL 16 and Caddy directly:

```bash
npm ci && npm run build
cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
npm run db:migrate
cd .next/standalone && PORT=3000 node server.js     # keep it running with systemd or pm2
```

Use the provided `Caddyfile`, replacing `app:3000` with `localhost:3000`. Schedule the jobs with cron: `0 * * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron`. Leave `HOSTNAME` unset (or `0.0.0.0`), not `127.0.0.1`: with a specific address, Next.js treats the custom-domain rewrite as an external request. Block port 3000 from the internet with your firewall so all traffic goes through Caddy.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `/api/health` says `database: unavailable` | `docker compose logs db`; is `POSTGRES_PASSWORD` the same as when the volume was created? |
| A customer domain shows a certificate error | The domain must be verified (green "Live" in the editor) **and** the portfolio published. `docker compose logs caddy` shows why a certificate was refused. |
| Domain stuck on "Waiting for DNS" | `dig +short A theirdomain.com` should print `SERVER_IPV4`; `dig +short TXT _formora.theirdomain.com` should print their `formora-verify=…` value. |
| Sign-in redirects to the wrong place | `APP_URL` must be your public `https://` address. |
