# Run Formora on your own computer

This gets the whole site running at http://localhost:3000 with a database and a test account, so you can try every flow (editing, publishing, blogs, ratings, the admin pages) before you buy hosting.

## 1. Install the tools (once)

- **Node.js 22** (LTS) from nodejs.org.
- **Docker Desktop** from docker.com, for the database. (Already have PostgreSQL 16 installed? You can use that instead.)
- **Git**.

## 2. Get the code and start a database

```bash
git clone https://github.com/ahmmed-binas/brandme.git formora
cd formora
npm install

# A PostgreSQL database in Docker, kept between restarts:
docker run -d --name formora-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=formora -e POSTGRES_DB=formora \
  -v formora-db:/var/lib/postgresql/data postgres:16-alpine
```

## 3. Settings

Copy the example and open it:

```bash
cp .env.example .env.local
```

For local testing you only need these lines (leave everything else empty):

```bash
DATABASE_URL=postgres://postgres:formora@localhost:5432/formora
AUTH_SECRET=paste-the-output-of-npx-auth-secret-here
APP_URL=http://localhost:3000
DEV_LOGIN=true
ADMIN_EMAILS=you@yourcompany.com
TEMPLATES_REQUIRE_APPROVAL=true
```

- `npx auth secret` prints a random secret; paste it as `AUTH_SECRET`.
- `DEV_LOGIN=true` adds **Sign in for testing** to the login page: type any email and you're in, no Google setup needed. It only works while `APP_URL` is `localhost`, so it can't be left on by accident on your live site.
- Put the email you'll sign in with into `ADMIN_EMAILS` to get the admin pages.

## 4. Start it

```bash
npm run dev
```

Open http://localhost:3000. The database tables are created on first use.

## 5. Make your account and try everything

1. Go to http://localhost:3000/login, scroll to **Local test account**, enter the email you put in `ADMIN_EMAILS` and your name, and press **Sign in for testing**.
2. **Admin home:** http://localhost:3000/admin shows the tools and a go-live checklist read from your settings.
3. **Approve templates:** http://localhost:3000/templates/review. Customers only see approved ones.
4. **Make a portfolio:** http://localhost:3000/templatechooser → pick one → **Use this template**. Click any text in the preview to edit it. Changes save to the database as you type (the top bar says *Saved to your account*). Reload the page: everything comes back.
5. **Publish:** **Publish** in the top bar → choose an address → your site is at http://localhost:3000/p/your-address.
6. **Blog** (Pro, Premium and the free trial): in the editor open the **Blog** tab → **New post** → write → **Publish post**. It appears at `/p/your-address/blog` and under *Writing* on your portfolio.
7. **Journal (the site's own blog):** http://localhost:3000/admin/journal → **New post**, or edit the articles that ship with the site. Live at http://localhost:3000/blog.
8. **Ratings:** open any template preview and click the stars.
9. **Gallery:** http://localhost:3000/gallery. Hover a tile to play its clip; open one to read about it, rate it and download it free.
10. **A real account with a password:** http://localhost:3000/signup. The confirmation link is printed in the terminal running `npm run dev` (look for `[email body]`). Then submit a template at http://localhost:3000/gallery/submit and approve it as admin at http://localhost:3000/admin/gallery.
11. **The Investigator:** http://localhost:3000/account/investigator. Add your own GitHub username or a blog feed (those are read without AI), tick the box, press **Check now**. LinkedIn, websites and the web search need an Anthropic key in `.env.local`. What it finds waits in the editor's **AI** tab, or goes straight onto your site if you chose *Update my website automatically*. The report email is printed in the terminal. Details: `docs/INVESTIGATOR.md`.
12. **A second, normal customer:** sign out (Account → Sign out) and sign in for testing with a different email that isn't in `ADMIN_EMAILS`.

What doesn't work locally without more setup: Google sign-in (needs Google keys), payments (Stripe test keys work fine if you add them), buying domains (needs a Vercel token), real emails (they're printed in the terminal instead), the AI assistant and the Investigator's AI step (need an Anthropic key).

## Production build (optional)

To test exactly what runs on the server:

```bash
npm run build
npm start
```

## Stopping and resetting

```bash
docker stop formora-db        # stop the database (data is kept)
docker start formora-db       # start it again
docker rm -f formora-db && docker volume rm formora-db   # wipe everything
```
