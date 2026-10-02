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
2. **Stripe** (only for selling domains): add the webhook `https://formora.app/api/webhooks/stripe` (see `CUSTOM_DOMAINS.md`).

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

Use the provided `Caddyfile`, replacing `app:3000` with `localhost:3000`. Leave `HOSTNAME` unset (or `0.0.0.0`), not `127.0.0.1`: with a specific address, Next.js treats the custom-domain rewrite as an external request. Block port 3000 from the internet with your firewall so all traffic goes through Caddy.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `/api/health` says `database: unavailable` | `docker compose logs db`; is `POSTGRES_PASSWORD` the same as when the volume was created? |
| A customer domain shows a certificate error | The domain must be verified (green "Live" in the editor) **and** the portfolio published. `docker compose logs caddy` shows why a certificate was refused. |
| Domain stuck on "Waiting for DNS" | `dig +short A theirdomain.com` should print `SERVER_IPV4`; `dig +short TXT _formora.theirdomain.com` should print their `formora-verify=…` value. |
| Sign-in redirects to the wrong place | `APP_URL` must be your public `https://` address. |
