# Formora project structure

## Page map

| URL | Purpose | Main file |
| --- | --- | --- |
| `/` | Product homepage | `app/page.tsx` |
| `/templatechooser` | Browse, filter, paginate, and select templates | `app/templatechooser/page.tsx` |
| `/templates/[templateId]` | Public portfolio preview | `app/templates/[templateId]/page.tsx` |
| `/editor/[templateId]` | Private portfolio editor; intentionally no-index | `app/editor/[templateId]/page.tsx` |
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

`templateCatalog` → Template chooser → `/editor/[templateId]` → `PortfolioEditor` → local/session storage → `/templates/[templateId]` → `TemplateRenderer` → template component.

To add a new portfolio design, follow `docs/AI_PORTFOLIO_TEMPLATE_WORKFLOW.md`.

## Document-tool flow

`/tools` is the directory. Each tool must be its own route and component. For privacy, tools that run fully in the browser should say so clearly. Do not market a visual whiteout as secure redaction, and do not promise an exact source-font rewrite unless the implementation truly parses and rewrites PDF text objects.

## Before adding authentication or payments

Keep browser-local creation working. When adding accounts, create server-side ownership for portfolios first, then add Google OAuth, data deletion, privacy policy, and protected save/publish actions. Payments should be added only for features that are complete and cost-effective to provide.
