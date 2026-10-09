<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Handoff for coding agents (Codex, Claude Code, …)

Read this first, then `docs/plans/project-handoff.pdf` (history, progress, to-do list and long-term plan) and the doc for whatever area you're touching.

## What this is

**Formora** (working name; the owner is considering a rename, see "Open decisions") is a portfolio and personal-website builder for every kind of professional, not just designers and developers. People pick a template drawn for their job (156 job titles, 51 studio designs, including a real estate collection built to sell from), fill it by clicking text in a live preview (or import a CV, LinkedIn export or GitHub, or ask the AI assistant), and publish at `/p/<address>` or on their own domain. Templates are also given away free in a **gallery** (content marketing); the paid product is customising, hosting, domains, blogs and keeping the site up to date.

Business model (free-first launch, `docs/plans/free-first-launch-plan.md`): **Basic is free** (one live portfolio, blog, the Investigator); **Pro is $6/month or $60/year** (up to three live portfolios, own domain, no branding; changed from $2.50/$24 on 9 October 2026); **Custom** is a personal designer, started from a free call; free demo calls through Book a free call; no trial, no Premium (`lib/plans.ts`, `app/pricing`). AI is paid separately at cost + 5% with credits or the customer's own Anthropic key, the same on every plan; each account's first Investigator check is free. Domains are sold at the registrar's price + Stripe's card fee, which is shown as its own line (also for credits). “Need more?” and the done-for-you service go through **Book a free call** (Cal.com, `lib/booking.ts`). Legal pages: `/privacy`, `/terms` (`lib/legal.ts`).

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
| Real estate collection (Skyline, Manor, Front Door, Shoreline, Off Plan) and TikTok clips | `components/templates/studio/realestate/*` (`re-kit.tsx`), `scripts/samples/tiktok-clips.mjs`, photos `public/samples/re/` (Unsplash, not in downloads); see `docs/TEMPLATES.md` |
| Editor | `components/editor/studio/StudioEditor.tsx` (+ `fields.tsx`, `BlogPanel.tsx`, `SuggestionsPanel.tsx`), persistence `components/editor/usePortfolioPersistence.ts` |
| Content model and validation | `lib/portfolio/schema.ts`; storage `lib/portfolio/repository.ts` (plan's portfolio limit `roomFor`, moving content to another design `switchTemplate`) |
| Publishing and custom domains | `app/p/[slug]`, `app/sites/[host]` (via `proxy.ts`), `lib/domains/*`, `Caddyfile` |
| Blogs | Journal: `lib/content/journal.ts`, `/admin/journal`, `/blog`. Customer blogs (every plan): `lib/portfolio/posts.ts`, `lib/portfolio/blog-pages.tsx`. Media block (image, YouTube/Vimeo, sandboxed HTML): `lib/content/media.ts`, `components/blog/MediaField.tsx`, `PostMediaView.tsx` |
| Gallery, free downloads, submissions | `lib/gallery/*`, `lib/templates/export.ts`, `app/gallery/*`, `/admin/gallery`, clips in `public/gallery/` (`scripts/samples/template-clips.mjs`) |
| Ratings | `lib/templates/ratings.ts`, `lib/templates/rating-route.ts` |
| Plans, billing, credits, AI metering | `lib/plans.ts`, `lib/billing/*`, `lib/ai/*`, `app/api/webhooks/stripe` |
| Auto-updates (GitHub, research agent) | `lib/autoupdate/*`, hourly jobs `lib/jobs/scheduled.ts` (`POST /api/cron`) |
| The Investigator, “Inspector Iqbal” (checks the owner's own profiles on a schedule, updates the site; avatar `components/agents/InspectorAvatar.tsx`, page `/agents/investigator` with ratings and comments `lib/agents/comments.ts`) | `lib/investigator/*` (page reader `reader.ts` with optional Obscura headless browser, fact-check `verify.ts`), `/account/investigator`, `app/api/investigator/*`, `docs/INVESTIGATOR.md` |
| Imports' accuracy | `lib/import/grounding.ts` (drops AI-imported facts not in the source text), `lib/import/linkedin-export.ts`, `tests/e2e/accuracy.mts` |
| Community and support | `lib/community/*`, `lib/support/*`, `app/community/*` |
| Superadmin console (dashboard, users, visitor counts) | `app/console/*` behind `SUPERADMIN_PATH`, `components/console/*`, `lib/console/metrics.ts`, `lib/analytics/track.ts` (+ `/api/t`, `components/common/VisitBeacon.tsx`), `docs/CONSOLE.md` |
| Admin | `/admin` (go-live checklist `lib/setup-checks.ts`), moderators = `ADMIN_EMAILS` |

More: `docs/SECURITY.md` (security model, pre-launch review, launch checklist), `docs/PROJECT_STRUCTURE.md`, `docs/TEMPLATES.md`, `docs/GALLERY.md`, `docs/INVESTIGATOR.md`, `docs/CONSOLE.md`, `docs/CUSTOM_DOMAINS.md`, `docs/BUSINESS_PLAN.md`.

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
- **Security:** see `docs/SECURITY.md`. No secrets in the repo; wrap every API handler in `route()` (it also refuses cross-site writes); escape `<` in any JSON-LD; fetch customer-given addresses only through `lib/investigator/feeds.ts` (public addresses only); use `rateLimit()` from `lib/security/rate-limit.ts` on anything public that costs money or sends email; one-time tokens are stored hashed.
- **Money:** prices are calculated on the server; a domain is never bought before the customer has paid; renewals never happen without the customer paying.

## Open decisions (waiting on the owner)

- Brand name (currently Formora; “BrandMe” was considered but is taken by a London agency).
- Licence for the free templates (MIT chosen; owner may prefer credit-required).
- The owner's legal name and country for `/privacy` and `/terms` (`LEGAL_NAME`, `LEGAL_COUNTRY`), and a final read of both pages (drafted, not legal advice).
- ChatGPT/OpenAI as a second AI provider: agreed for after launch.
- The Journal's new-tab option for agents (asked for, parked for later).

## Next work, in order

**Built: `docs/plans/free-first-launch-plan.md` steps 1–7** (plans, money, navigation, Inspector Iqbal's page with ratings and comments, sources clean-up, blog media), plus Book a free call (Cal.com), privacy and terms. **Next: run every end-to-end suite on a fresh database, then launch on a VPS** (`docs/LAUNCH.md`). Later (plan step 8): email channel → ChatGPT/Claude connector → WhatsApp; ChatGPT/OpenAI as a second AI provider; uploaded video in posts (today: YouTube/Vimeo links).

See the PDF for detail. In short: configurable auto-update (done: the Investigator), analytics (owner side done: the console; still to do: views per portfolio for customers), a done-for-you order flow, blog link in template menus and blogs for the three original templates, production launch on a VPS, then growth work (SEO pages, the MCP/“update my site from Claude or ChatGPT” connector, more sources).
