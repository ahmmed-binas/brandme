<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Handoff for coding agents (Codex, Claude Code, …)

Read this first, then `docs/plans/project-handoff.pdf` (history, progress, to-do list and long-term plan) and the doc for whatever area you're touching.

## What this is

**Formora** (working name; the owner is considering a rename, see "Open decisions") is a portfolio and personal-website builder for every kind of professional, not just designers and developers. People pick a template drawn for their job (156 job titles, 46 studio designs), fill it by clicking text in a live preview (or import a CV, LinkedIn export or GitHub, or ask the AI assistant), and publish at `/p/<address>` or on their own domain. Templates are also given away free in a **gallery** (content marketing); the paid product is customising, hosting, domains, blogs and keeping the site up to date.

Business model: free trial (14 days, everything in Pro) → Basic $10/yr, Pro $24/yr, Premium $49/yr (`lib/plans.ts`). AI is paid separately with credits or the customer's own Anthropic key. Domains are sold at registrar price + markup.

## Stack and commands

- Next.js 16 App Router (Promise `params`/`searchParams`, `proxy.ts` instead of middleware), React 19, TypeScript, Tailwind v4 (container queries `@3xl:`, `cqw` units in templates).
- PostgreSQL via `pg` (`utils/db.ts`), migrations in `db/migrations.mjs` (append a new `{ id, statements }`; never edit an applied one). They run on start and with `npm run db:migrate`.
- Auth.js v5 (`auth.ts`): Google, email + password (`lib/accounts/passwords.ts`, scrypt), and a localhost-only test login (`DEV_LOGIN=true`, `lib/dev-login.ts`). JWT sessions; `getCurrentUser()` in `utils/user-account.ts` maps the session to an `app_users` row.
- Admin access: `user.isAdmin` (the superadmin, or a confirmed email in `ADMIN_EMAILS`); `user.isSuperadmin` for owner-only pages such as `/admin/email` and the console. The superadmin is created with `npm run admin:create` (`scripts/create-superadmin.mjs`) and signs in **only** at the console's secret address (`SUPERADMIN_PATH`, `lib/console/path.ts`, rewritten in `proxy.ts`); superadmin powers exist only in a console session. Never check `ADMIN_EMAILS` directly. See `docs/CONSOLE.md`.
- Stripe (checkout + webhook), Vercel as domain **registrar only**, Anthropic SDK (model `claude-opus-5-5`), SMTP via nodemailer, Caddy on-demand TLS for customer domains, docker-compose for production (`docs/SELF_HOSTING.md`, `docs/LAUNCH.md`).

```bash
npm install
npm run dev                     # http://localhost:3000 (setup: docs/LOCAL.md)
npx tsc --noEmit                # must be clean
npx eslint <changed paths>      # legacy files have known errors; don't add new ones
npm run build                   # must succeed before pushing
```

End-to-end tests live in `tests/e2e/` (Playwright against the production build, real Postgres, every outside service mocked). See `tests/e2e/README.md`. Run the suites that cover what you changed, on a fresh database, before pushing. Every feature so far was verified this way.

## Map

| Area | Where |
| --- | --- |
| Templates: catalogue, palettes, fonts, sections | `lib/templates/studio-catalog.ts`, `lib/templates/types.ts` |
| Template components | `components/templates/studio/<field>/<Name>.tsx`, shared `kit.tsx` (`useStudio`, `ed()`, `Picture`, `StudioRoot`), `motion.tsx`, `studio.css`, `registry.tsx` |
| Owner approval of templates | `lib/templates/approval.ts`, shipped decisions in `lib/templates/decisions.ts`, desk at `/templates/review` |
| Job titles and sample content | `lib/templates/roles/*`, personas `lib/templates/personas*.ts`, `lib/templates/samples.ts` |
| Editor | `components/editor/studio/StudioEditor.tsx` (+ `fields.tsx`, `BlogPanel.tsx`, `SuggestionsPanel.tsx`), persistence `components/editor/usePortfolioPersistence.ts` |
| Content model and validation | `lib/portfolio/schema.ts`; storage `lib/portfolio/repository.ts` |
| Publishing and custom domains | `app/p/[slug]`, `app/sites/[host]` (via `proxy.ts`), `lib/domains/*`, `Caddyfile` |
| Blogs | Journal: `lib/content/journal.ts`, `/admin/journal`, `/blog`. Customer blogs: `lib/portfolio/posts.ts`, `lib/portfolio/blog-pages.tsx` (Pro feature) |
| Gallery, free downloads, submissions | `lib/gallery/*`, `lib/templates/export.ts`, `app/gallery/*`, `/admin/gallery`, clips in `public/gallery/` (`scripts/samples/template-clips.mjs`) |
| Ratings | `lib/templates/ratings.ts`, `lib/templates/rating-route.ts` |
| Plans, billing, credits, AI metering | `lib/plans.ts`, `lib/billing/*`, `lib/ai/*`, `app/api/webhooks/stripe` |
| Auto-updates (GitHub, research agent) | `lib/autoupdate/*`, hourly jobs `lib/jobs/scheduled.ts` (`POST /api/cron`) |
| The Investigator (checks the owner's own profiles on a schedule, updates the site) | `lib/investigator/*` (page reader `reader.ts` with optional Obscura headless browser, fact-check `verify.ts`), `/account/investigator`, `app/api/investigator/*`, `docs/INVESTIGATOR.md` |
| Imports' accuracy | `lib/import/grounding.ts` (drops AI-imported facts not in the source text), `lib/import/linkedin-export.ts`, `tests/e2e/accuracy.mts` |
| Community and support | `lib/community/*`, `lib/support/*`, `app/community/*` |
| Superadmin console (dashboard, users, visitor counts) | `app/console/*` behind `SUPERADMIN_PATH`, `components/console/*`, `lib/console/metrics.ts`, `lib/analytics/track.ts` (+ `/api/t`, `components/common/VisitBeacon.tsx`), `docs/CONSOLE.md` |
| Admin | `/admin` (go-live checklist `lib/setup-checks.ts`), moderators = `ADMIN_EMAILS` |

More: `docs/PROJECT_STRUCTURE.md`, `docs/TEMPLATES.md`, `docs/GALLERY.md`, `docs/INVESTIGATOR.md`, `docs/CONSOLE.md`, `docs/CUSTOM_DOMAINS.md`, `docs/BUSINESS_PLAN.md`.

## Rules the owner has set

1. **Ask before major decisions** (pricing, licences, data collection, anything that changes what customers pay or see). Make small, conventional calls yourself and say so.
2. **New templates need the owner's approval** before customers see them. Add them as pending; never mark them approved yourself. Rejected templates are deleted from the code.
3. **Don't open pull requests unless asked.** Work on the current branch (`improve-editor-and-business`; not merged into `main` yet), commit with clear messages, push.
4. **Never put AI model identifiers in commits, PR text or code comments.**
5. **Test like a user.** Every change was checked end to end before pushing; keep doing that and report results honestly (what passed, what didn't, what you couldn't test).
6. Customers' data is theirs: only the account owner's own public information may be fetched or researched, with their consent. Don't build scraping of other people or logged-in social accounts, and don't turn on Obscura's stealth mode or other ways round sites that block automated visitors.

## Conventions

- **Writing:** plain, warm, specific British English (colour, organise, “ ” quotes, en dash for ranges). No marketing filler. UI copy explains what happens next.
- **Templates:** size with container queries (`@3xl:`, `cqw`), never viewport breakpoints or `position: fixed` (they render inside the editor and phone preview). Every visible piece of content gets `{...ed("path")}` so clicking it opens its field. Empty sections hide via `has()`. Respect `motionOff()` (static captures, reduced motion). Each template must show the name in an `<h1>` even with almost no content (`tests/e2e/blank.mjs`).
- **APIs:** wrap handlers in `route()` from `lib/api/http.ts`; validate everything on the server; owner-only routes use `requireOwner`; admin routes check `user.isAdmin` (or `isSuperadmin`) and return 404 otherwise.
- **Pages that depend on who is signed in** export `dynamic = "force-dynamic"`. Without it, a build without `DATABASE_URL` (as in Docker) pre-renders them once, baking in a sign-in redirect or a 404.
- **Security:** no secrets in the repo; uploads are checked by content (magic bytes), size and, for ZIPs, paths and file types; one-time tokens are stored hashed; rate limits on sign-in, sign-up and uploads.
- **Money:** prices are calculated on the server; a domain is never bought before the customer has paid; renewals never happen without the customer paying.

## Open decisions (waiting on the owner)

- Brand name (currently Formora; “BrandMe” was considered but is taken by a London agency).
- Auto-update: answered by the Investigator (Pro: monthly / 6 months / yearly; Premium: also weekly and daily; trial: one check; the customer chooses “ask me first” or “update automatically”; website only, no PDF CV). Still open: daily Investigator checks cost more AI credits than Premium's monthly allowance covers (see `docs/INVESTIGATOR.md`, “Costs”).
- Approve or reject the five moving templates (Residence, Margin Notes, Pulse, Counsel, Mise) at `/templates/review`.
- Pricing (the owner was advised $10/yr is too low to pay for ads; a “done for you” offer was suggested).
- Licence for the free templates (MIT chosen; owner may prefer credit-required).
- A privacy notice page (none yet). It should cover accounts, payments, the Investigator and the cookie-less visitor counts (`docs/CONSOLE.md`).
- The Journal's new-tab option for agents (asked for, parked for later).

## Next work, in order

See the PDF for detail. In short: configurable auto-update (done: the Investigator), analytics (owner side done: the console; still to do: views per portfolio for customers), a done-for-you order flow, blog link in template menus and blogs for the three original templates, production launch on a VPS, then growth work (SEO pages, the MCP/“update my site from Claude or ChatGPT” connector, more sources).
