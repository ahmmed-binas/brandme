# Formora

A portfolio builder: choose a designed template, fill it with your content (by hand, from a CV, or with AI help), and publish it at your own address. It also includes free, browser-only document tools.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000.

- **Without any environment variables**, the template chooser, editor, and document tools work, and drafts are saved in the browser.
- **`DATABASE_URL` + Google sign-in** (`AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`) enable accounts, saving to the account, and publishing to `/p/<address>`. Tables are created automatically. See `docs/GOOGLE_AUTH_SETUP.md`.
- **`ANTHROPIC_API_KEY`** turns on the AI assistant in the editor.

## Before committing

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Docs

- `docs/PROJECT_STRUCTURE.md`: where things live and how a portfolio flows from editor to published page
- `docs/BUSINESS_PLAN.md`: positioning, pricing, unit economics, and roadmap
- `docs/AI_PORTFOLIO_TEMPLATE_WORKFLOW.md`: how to add a new template
- `docs/GOOGLE_AUTH_SETUP.md`: sign-in and database setup
