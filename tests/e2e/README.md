# End-to-end tests

Browser tests (Playwright) that drive the real production build against a real
PostgreSQL database, with every outside service mocked. They were used to verify
every feature before it was pushed. They print `•` lines; check them for `false`
and for `page errors: none`.

## One-time setup

```bash
cd tests/e2e && npm install && cd ../..   # dns2 for the DNS mock
npx playwright install chromium            # or set CHROMIUM_PATH in test.env
```

The tests run SQL with `su postgres -c "psql -d formora …"` (a local PostgreSQL
where you can become the postgres user). Adjust the `sql` helper at the top of a
test if your database runs elsewhere (for example in Docker:
`docker exec -i formora-db psql -U postgres -d formora …`).

## Running

```bash
source tests/e2e/test.env
# fresh database
su postgres -c "psql -c 'DROP DATABASE IF EXISTS formora' -c 'CREATE DATABASE formora'"
# mocks (GitHub, Vercel, Stripe, Anthropic on :4010; DNS on :5353)
node tests/e2e/mock.mjs & node tests/e2e/dns.mjs &
# the app, production build, logging to where gallery2.mjs reads verification links
mkdir -p tests/e2e/.out/shots && npm run build && npx next start -p 3100 > tests/e2e/.out/server.log 2>&1 &
# then any suite, e.g.
BASE=http://localhost:3100 node tests/e2e/blog.mjs
```

| Suite | Covers |
| --- | --- |
| `run.mjs` | Original editor, saving, publishing, public page |
| `basics.mjs` | Database saving, conflicts between tabs, reloads |
| `community.mjs` | Community board, moderation, spam rules (needs a fresh database each run) |
| `gallery.mjs` | Template chooser, filters, approval desk |
| `billing.mjs` | Plans, trial, credits, own API key, renewals, emails, cron |
| `support.mjs` | Support tickets and replies |
| `domains.mjs` | Buying (Stripe + registrar mocks), connecting, DNS checks, custom-domain serving |
| `studio-editor.mjs` | Studio editor: click-to-edit, images, palettes, undo, reload |
| `roles.mjs` | 156 job titles, finder, SEO pages |
| `blog.mjs` | Test login, ratings, Journal admin, portfolio blogs (+ custom domain), domain renewals, Pro-only blog |
| `gallery2.mjs` | Password accounts, template submissions + admin review, gallery tiles/search, article pages, downloads |
| `investigator.mjs` | The Investigator: plan rules, settings page, ask and automatic modes, live site, emails, undo, cron, private-address blocking (server needs `INVESTIGATOR_ALLOW_PRIVATE_FETCH=true`, set in `test.env`) |
| `edit-all.mjs` | Every studio template: every click-to-edit spot opens a field, autosave to the database, reload |
| `blank.mjs` | Every studio template still shows a name and heading with almost no content |
| `previews.mjs` | Every template preview renders |
| `motion.mjs` | The moving templates' scroll effects, and reduced motion |

Some suites refuse duplicates or rate-limit (community, sign-up), so rerun them on a fresh database or after restarting the server.
