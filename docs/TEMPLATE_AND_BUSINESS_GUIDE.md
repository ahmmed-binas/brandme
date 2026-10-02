# Formora template and business guide

## The product you are building

Formora is a portfolio builder. A visitor chooses a template, previews the real portfolio, edits content safely, saves it, and publishes or shares it. The durable value is not a collection of static themes: it is a reliable system where one person can create many credible portfolios without breaking a design.

## Adding a Claude-generated template

1. Choose one profession and a visual direction. For example: "architect / warm editorial" or "developer / dark technical". Do not ask Claude to copy a named designer or live site.
2. Give Claude the prompt and compatibility contract in `docs/AI_PORTFOLIO_TEMPLATE_WORKFLOW.md`. It must use the common portfolio data shape, safe fallbacks, accessible markup, and local template styles.
3. Create `components/templates/<template-id>/`. Put the template component, its components, optional data adapter, and template-local CSS/tokens there. Never import styles from another template.
4. Add the template id to `lib/templates/types.ts` and its metadata to `lib/templates/catalog.ts` (including `colorThemes`). If the template has its own content model, add its shape check to `validateContent` in `lib/portfolio/schema.ts`, or saving and publishing will reject it. The chooser uses that catalog, so this creates the card automatically.
5. Register the renderer in `components/templates/TemplateRenderer.tsx`. A simple template can share the common PortfolioData object. A complex template should have its own adapter and editor, like `editorial-developer`.
6. Use `/templates/<template-id>` for the full preview and `/editor/<template-id>` for editing. Verify chooser -> preview -> customize -> editor -> save -> full-page preview.
7. Keep design rules out of editable data. Users may edit text, lists, links, images, and content order. Only the template controls CSS tokens, layout, section structure, transitions, and navigation.
8. Test on mobile, desktop, empty arrays, long names, long project descriptions, missing images, keyboard navigation, and all links. Run `npm run build` after every template.

## Claude prompt checklist

Ask for one complete TSX template. Require: original art direction; responsive, accessible semantic sections; no `any`; all fields use fallbacks; no global CSS or global selectors; no credentials; no external image dependency unless optional; and a concise list of which content fields the template supports. For a complex design, also ask for a template-specific data adapter and structured editor field specification.

## Scalable rules

- One catalog entry per template; no hand-written chooser cards.
- One directory per template; no cross-template CSS imports.
- Template id prefixes browser storage keys and database records.
- Preview uses the same renderer as the published page.
- A rendered portfolio preview is a destination, never a template-library surface: do not render “Browse templates”, chooser links, template switchers, or any other route back into the product UI inside it.
- Editor content is validated before saving. Never let a user paste CSS, scripts, or arbitrary component names into portfolio content.
- A complex template may have a special editor, but it must use the same save, preview, and publish contract as every other template.

## Monetization plan

> The current plan, pricing, and roadmap are in `docs/BUSINESS_PLAN.md`. The notes below are the original thinking and are kept for context.

Start with a free tier that proves the core value: one published portfolio, a small set of free templates, Formora branding, and browser-local editing. Charge only for useful outcomes:

1. Pro tier: premium templates, no Formora branding, more portfolios, custom colours where the template permits them, PDF or ZIP export, and analytics. A simple monthly plan plus an annual discount is easier to understand than many small plans.
2. One-time template packs: niche templates for architects, developers, designers, students, recruiters, and freelancers. This works well before subscriptions have enough ongoing value.
3. Custom domain: charge a margin for managed connection, SSL, and domain instructions; do not sell it until publishing and DNS support are dependable.
4. AI credits: sell only when AI features produce a clear result—CV-to-portfolio copy, project case-study rewrites, or image generation. Set visible credit limits and never promise unlimited expensive AI.
5. Later: team review, recruiter analytics, agency workspaces, and white-label portfolios.

Avoid paywalling basic editing at launch. First measure activation: template chosen, editor completed, portfolio saved, preview shared, and portfolio published. Talk to early users before pricing. A sensible first test is free + one premium template pack, then a Pro subscription once users return to update portfolios.

## Google sign-in and saved users

Google OAuth identifies a user; the database stores the Formora profile. This project upserts Google users into the `app_users` PostgreSQL table on sign-in. Keep `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `DATABASE_URL` in `.env.local` locally and in encrypted hosting environment variables in production. Never commit them.

In Google Cloud Console create a Web OAuth client and add exactly these redirect URLs:

- `http://localhost:3000/api/auth/callback/google`
- `https://YOUR-DOMAIN/api/auth/callback/google`

Before launch, add a privacy policy, terms, account deletion path, and an authenticated `portfolios` table with an owner user id. Do not put Google client secrets in browser code.

## Release checklist

1. Add privacy policy and terms.
2. Test a new Google account sign-in and confirm its row exists in `app_users`.
3. Test save and full-page preview in every template.
4. Deploy with production OAuth redirect URI and environment variables.
5. Add error monitoring and analytics that avoid storing portfolio content unnecessarily.
6. Publish only after the portfolio flow is stable, then start with a small paid offer.
