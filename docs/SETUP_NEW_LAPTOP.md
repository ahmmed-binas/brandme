# Set up Formora on a new laptop (Windows), with every feature

Commands are for **Command Prompt** (cmd). Each part is optional after part 4, except where noted.

## 1. Install once

- **Git:** https://git-scm.com
- **Node.js 22 LTS:** https://nodejs.org (check: `node -v` shows v22 or newer)
- **Docker Desktop:** https://docker.com (for the database). Start it and leave it running.
- *(For payments)* **Stripe CLI:** https://docs.stripe.com/stripe-cli

## 2. Get the code (the right branch)

```
git clone -b improve-editor-and-business https://github.com/ahmmed-binas/brandme.git formora
cd formora
npm install
```

## 3. Start the database

```
docker run -d --name formora-db -p 5432:5432 -e POSTGRES_PASSWORD=formora -e POSTGRES_DB=formora -v formora-db:/var/lib/postgresql/data postgres:16-alpine
```

Next time you only need `docker start formora-db`.

## 4. Settings file (required)

```
copy .env.example .env.local
npx auth secret
notepad .env.local
```

Fill in (leave the rest empty for now):

```
DATABASE_URL=postgres://postgres:formora@localhost:5432/formora
AUTH_SECRET=<what `npx auth secret` printed, if it didn't add it itself>
APP_URL=http://localhost:3000
SUPERADMIN_PATH=/hq-<something-secret>
TEMPLATES_REQUIRE_APPROVAL=true
CRON_SECRET=<any long random text>
```

`.env.local` stays on your laptop; it is never uploaded to GitHub.

## 5. Database tables, your superadmin, start

```
npm run db:migrate
npm run admin:create
npm run dev
```

- Open http://localhost:3000. The website works.
- Sign in as superadmin at **http://localhost:3000/hq-<something-secret>** (your `SUPERADMIN_PATH`), **not** `/login`.
- The console shows the dashboard, users, and **Go-live checklist**, which tells you what is still missing.
- Approve templates in the console: **Template approvals**.

Stop with Ctrl+C. Next time: `docker start formora-db` then `npm run dev`.

## 6. Google sign-in

1. https://console.cloud.google.com → create a project.
2. **APIs & Services → OAuth consent screen** → External → app name, your email → add your Gmail as a test user.
3. **Credentials → Create credentials → OAuth client ID** → *Web application*.
   Authorised redirect URI: `http://localhost:3000/api/auth/callback/google`
   (later also `https://<your domain>/api/auth/callback/google`)
4. Into `.env.local`:
   ```
   AUTH_GOOGLE_ID=...apps.googleusercontent.com
   AUTH_GOOGLE_SECRET=...
   ```
5. Restart `npm run dev`. "Continue with Google" works on `/login`. Before launch, press **Publish app** on the consent screen.

## 7. Email (SMTP)

```
SMTP_HOST=<outgoing server from your mail host, e.g. SupremeBox panel>
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=<full mailbox address>
SMTP_PASSWORD=<mailbox password>
SMTP_FROM="Formora <same mailbox address>"
SMTP_TO=<where support messages should arrive>
```

Restart, then console → **Email settings** → **Send a test email**. The message says what to fix if it fails. Without SMTP, emails are printed in the terminal (handy for testing sign-up links).

## 8. Payments (Stripe, test mode)

1. https://dashboard.stripe.com → stay in **Test mode** → Developers → API keys → copy the **Secret key** (`sk_test_...`).
2. In a **second** Command Prompt:
   ```
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   It prints a signing secret `whsec_...`. Keep this window open while testing.
3. Into `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
4. Restart. Buy a plan or credits on the site with the test card **4242 4242 4242 4242**, any future date, any CVC.

Live later: use the live key, and in the Stripe dashboard add a webhook to `https://<your domain>/api/webhooks/stripe` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`, and use its secret.

## 9. AI (editor assistant, CV import, the Investigator)

1. https://platform.claude.com → API keys → create a key, add a little credit.
2. `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   AI_DAILY_BUDGET_USD=5
   ```
3. Restart. Customers can also add their own key in Account → AI.

## 10. Optional extras

- **Selling domains:** Vercel token (Account settings → Tokens) → `VERCEL_API_TOKEN=`, `VERCEL_TEAM_ID=` (if you use a team). See `docs/CUSTOM_DOMAINS.md`.
- **Higher GitHub import limits:** a fine-grained token with no scopes → `GITHUB_TOKEN=`.
- **Obscura** (Investigator reads JavaScript pages): download the Windows zip from https://github.com/h4ckf0r0day/obscura/releases, run `obscura serve --port 9222`, then `OBSCURA_URL=ws://127.0.0.1:9222/devtools/browser`.
- **Scheduled jobs** (emails, renewals, Investigator schedules) run hourly on the server. Locally, run them by hand:
  ```
  curl -X POST -H "Authorization: Bearer <your CRON_SECRET>" http://localhost:3000/api/cron
  ```
- **Contact email in the footer:** `NEXT_PUBLIC_CONTACT_EMAIL=`.

After each change to `.env.local`, restart `npm run dev`, then check the console's **Go-live checklist**.

## 11. Updating later

```
git pull
npm install
npm run db:migrate
npm run dev
```

## 12. When something breaks

- **A page shows an error / can't reach the database:** start Docker Desktop, then `docker start formora-db`.
- **"Port 3000 in use":** another `npm run dev` is still running; close it.
- **Google sign-in error "redirect_uri_mismatch":** the redirect URI in Google Cloud must be exactly `http://localhost:3000/api/auth/callback/google`.
- **Superadmin can't sign in at /login:** that's by design; use your `SUPERADMIN_PATH` address.
- **Forgot the superadmin password:** run `npm run admin:create` again with the same email.

Going live on a server: `docs/LAUNCH.md`.
