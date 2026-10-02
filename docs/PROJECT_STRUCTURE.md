# Formora project structure

## Page map

| URL | Purpose | Main file |
| --- | --- | --- |
| `/` | Product homepage | `app/page.tsx` |
| `/templatechooser` | Browse, filter, paginate, and select templates | `app/templatechooser/page.tsx` |
| `/templates/[templateId]` | Public portfolio preview | `app/templates/[templateId]/page.tsx` |
| `/editor/[templateId]` | Private portfolio editor; intentionally no-index | `app/editor/[templateId]/page.tsx` |
| `/p/[slug]` | A user's published portfolio (server-rendered from the database) | `app/p/[slug]/page.tsx` |
| `/account` | Signed-in user's portfolios, live status, and plan | `app/account/page.tsx` |
| `/community` | Suggestions, reviews and design submissions (public; posting needs sign-in) | `app/community/page.tsx` |
| `/community/moderation` | Moderation queue for `ADMIN_EMAILS` | `app/community/moderation/page.tsx` |
| any custom domain | A published portfolio on its owner's domain (see `docs/CUSTOM_DOMAINS.md`) | `app/sites/[host]/page.tsx` |
| `/DetailExtractorPage` | CV/document detail extraction | `app/DetailExtractorPage/page.tsx` |
| `/tools` | Free document tools directory | `app/tools/page.tsx` |
| `/tools/pdf-editor` | Browser-local PDF visual editor | `app/tools/pdf-editor/page.tsx` |
| `/blog` | Journal page one | `app/blog/page.tsx` |
| `/blog/page/[page]` | SEO-friendly journal pagination | `app/blog/page/[page]/page.tsx` |
| `/blog/[slug]` | SEO-friendly individual article | `app/blog/[slug]/page.tsx` |
| `/contact` | Contact page | `app/contact/page.tsx` |

## Directory responsibilities

```text
app/                 Routes, route-specific metadata, and global styles.
components/common/   Header, footer, theme provider, application shell.
components/templates/Template renderers and portfolio template components.
components/editor/   The portfolio editing experience.
components/tools/    Browser-only document-tool interfaces.
lib/brand.ts         Product name, contact email, and primary navigation.
lib/templates/       Template catalog, IDs, and template metadata types.
lib/portfolio/       Content validation (schema.ts), database access (repository.ts), browser drafts.
lib/ai/              Server-side AI copy editing (Claude). Never imported by client code.
lib/plans.ts         Plans, prices, terms, trial and grace rules. The only place pricing lives.
lib/billing/         Stripe checkout for plans and credits, renewals, the credit ledger.
lib/ai/metering.ts   The gate every AI request goes through: own key or credits, caps, daily budget.
lib/autoupdate/      GitHub sync, the research agent, and suggestions the owner approves.
lib/email/           SMTP mailer (sent once per key) and the lifecycle email texts.
lib/jobs/            The hourly scheduled jobs (/api/cron).
lib/support/         Private support tickets.
lib/assets/          Uploaded images, served from /media/<id>.<ext>.
lib/templates/       Catalogue, studio collection, sample people, approval.
app/api/portfolios/  Save, load, publish, and unpublish portfolios (owner only).
app/api/ai/assist/   AI copy-editing endpoint, metered per plan.
app/api/ai/import/   Free text → structured portfolio content (Claude).
app/api/import/      GitHub profile import.
lib/import/          Import sources (GitHub, LinkedIn export) and mapping into each template.
lib/domains/         Custom domains: name rules, Vercel API client, purchase/connect business rules.
app/api/domains/     Search, buy (Stripe checkout), connect, and disconnect domains.
app/sites/[host]/    A portfolio served on its custom domain (reached via proxy.ts).
proxy.ts             Routes custom-domain requests to /sites/<host>.
lib/community/       Community rules (rules.ts: every refusal and hold), data access, viewer.
db/migrations.mjs    Versioned database migrations (run on start and by `npm run db:migrate`).
lib/content/         Editorial content and pagination data.
utils/               File extraction and legacy helper code.
public/              Static images and assets served from the site root.
docs/                Developer documentation for this project.
```

## Safe ways to add a feature

1. Add the page in `app/` using a readable URL such as `app/tools/word-to-pdf/page.tsx`.
2. Put reusable interactive code in `components/`, not directly in a very large route file.
3. Add route metadata (title, description, canonical URL). Private editors should use `robots: { index: false }`.
4. Add the navigation link in `lib/brand.ts` only when the feature is genuinely usable.
5. Run `npx tsc --noEmit` and focused ESLint before committing.

## Template flow

`templateCatalog` → Template chooser → `/editor/[templateId]` → `PortfolioEditor` (or a dedicated editor) → `usePortfolioPersistence` autosaves to the browser and, when signed in, to `PUT /api/portfolios/[templateId]` → Publish snapshots the draft → `/p/[slug]` renders the snapshot with `TemplateRenderer`.

`/templates/[templateId]` is the template's own preview. It shows the visitor's browser draft or demo content, and is never the published page.

Every save (including AI output) goes through `validateContent` in `lib/portfolio/schema.ts`. A new template with its own content model must add its shape check there.

To add a new portfolio design, follow `docs/AI_PORTFOLIO_TEMPLATE_WORKFLOW.md`.

## Document-tool flow

`/tools` is the directory. Each tool must be its own route and component. For privacy, tools that run fully in the browser should say so clearly. Do not market a visual whiteout as secure redaction, and do not promise an exact source-font rewrite unless the implementation truly parses and rewrites PDF text objects.

## Accounts, saving, and payments

Browser-local editing works without an account; signing in adds account saving and publishing. The schema is created and upgraded automatically by the versioned migrations in `db/migrations.mjs`. Owners are identified by their Google account id, carried in the session by `auth.ts`.

Plans, the 14-day trial and grace period live in `lib/plans.ts`. Payments go through Stripe Checkout (`lib/billing/service.ts`); the webhook at `app/api/webhooks/stripe/route.ts` fulfils plan, credit and domain orders, and the hourly job in `lib/jobs/scheduled.ts` handles renewals and reminder emails. See `docs/BUSINESS_PLAN.md` for pricing and unit economics.

## Community moderation

Posting rules live in `lib/community/rules.ts`:

- **Refused immediately** (nothing stored, the author keeps their text and sees why): too short or long, spam terms (`COMMUNITY_BLOCKED_TERMS` adds more), all capitals, more than 3 links, non-https links, missing rating or images, duplicate text within 7 days, more than 5 posts an hour or 20 a day, a second review.
- **Held for a moderator:** every design submission, and posts with links from members with nothing published yet.
- **Moderators** (`ADMIN_EMAILS`) use `/community/moderation` or the controls on each post: approve, refuse (a reason is required and shown to the author), remove a published post (reason required), or restore. Refused authors can edit and resubmit.
- Images of unpublished posts are only served to their author and moderators.
