# Formora AI Portfolio Template Workflow

Use this guide when you want an AI to make a new portfolio design for a specific profession, such as photographer, architect, lawyer, developer, chef, model, or student. It is a **template plugin workflow**: each template is an independent React component that is registered in the existing library.

## What you can sell later

Start by offering a small set of polished free templates. Once people use the product, you can add premium templates, custom domains, downloadable portfolios, AI copy help, and a Google sign-in/account area. Do not add payments or authentication until the core portfolio flow is stable and people are using it.

## The important rule

Every generated template must accept the same `PortfolioData` object. This lets one CV import and one editor work with every design.

The shared fields are:

```ts
name, professional_title, tagline, summary, github, linkedin, instagram, email,
skills, projects, experience
```

Each project can have `title`, `description`, `technologies`, `github`, `live_url`, and `image`. Each experience can have `job_title`, `company`, `location`, `start_date`, `end_date`, `description`, `technologies`, and `website`.

## Copy this prompt into an AI

Replace the words in brackets before sending. Ask for one template at a time.

```text
You are a senior Next.js, React, TypeScript, and Tailwind CSS designer.

Create an ORIGINAL, production-ready portfolio template for a [PROFESSION], named [TEMPLATE NAME]. The visual direction is [STYLE: e.g. Swiss editorial / warm architectural / bold neo-brutalist / quiet luxury / playful creative]. It must feel premium, highly responsive, accessible, and different from a generic SaaS landing page.

This is a template inside an existing Next.js 16 project called Formora. Do not create a new app, do not add packages, do not use external image URLs, do not use a database, do not use an API, and do not use inline SVG artwork copied from another brand.

Write ONE complete TypeScript React component file. It must begin with "use client" and export a default component named [PascalCaseTemplateName]. Import this exact type:

import type { PortfolioData } from "@/components/templates/template-one/TemplateOne";

The component props must be exactly:

{ finalData?: PortfolioData; theme?: "midnight" | "classic" | "dark" | "light" }

Use `finalData` with safe fallbacks for every field. Never assume an array exists. Do not change the PortfolioData type. Do not use `any`.

Required sections, shown only when meaningful data exists:
1. A strong hero with name, professional title, tagline, email, and social links.
2. About / summary.
3. Skills.
4. Selected projects with image fallback, technologies, live link, and repository link where supplied.
5. Experience timeline.
6. A clear contact CTA and a small footer.

Technical requirements:
- Tailwind CSS only; no CSS files, no styled-components, no new dependencies.
- Use semantic `header`, `nav`, `main`, `section`, `article`, and `footer` elements.
- Use section ids and accessible navigation labels.
- Make mobile the default. No horizontal scrolling from 320px upward.
- Respect the `theme` prop with four visibly different but readable palettes.
- Use keyboard-visible focus states, good contrast, descriptive links, and buttons only for actions.
- Use `next/link` only for internal links. External links must have target="_blank" and rel="noreferrer".
- Avoid hydration errors: do not read window, localStorage, or document during render.
- Keep the component under 500 lines and format it cleanly.
- Use placeholder blocks or gradients for missing project images. Do not rely on remote images.

Before the code, write a short "Design intent" paragraph and a "Compatibility check" list confirming every PortfolioData field is handled. Then provide the complete file in one tsx code block. Do not omit any code.
```

## Install a generated template

For this example, imagine the AI created a file named `ArchitectGrid.tsx` and your chosen id is `architect-grid`.

1. Save the generated component in `components/templates/architect-grid/ArchitectGrid.tsx`.
2. Open `lib/templates/types.ts` and add `| "architect-grid"` to `TemplateId`.
3. Open `lib/templates/catalog.ts` and add the new card metadata to `templateCatalog`:

```ts
{
  id: "architect-grid",
  name: "Architect Grid",
  description: "A precise, image-led portfolio for architects and spatial designers.",
  category: "Creative",
  author: "Formora Studio",
  createdAt: "2026-09-20",
  style: "Modern",
  idealFor: ["Architects", "Interior designers", "Spatial designers"],
  tags: ["Grid", "Minimal", "Architecture"],
}
```

4. Open `components/templates/TemplateRenderer.tsx`, import the component, and register it:

```ts
import ArchitectGrid from "./architect-grid/ArchitectGrid";

const templateRenderers: Record<TemplateId, typeof TemplateOne> = {
  "template-one": TemplateOne,
  "architect-grid": ArchitectGrid,
};
```

If TypeScript says the two component types do not match, make sure the new component accepts exactly the same `finalData` and `theme` props specified in the prompt.

5. Run these checks from `frontend`:

```powershell
npx eslint components/templates/architect-grid/ArchitectGrid.tsx
npx tsc --noEmit
npm run dev
```

6. Open `/templatechooser`, select the new template, then use **Customize this template**. Also check `/templates/architect-grid?demo=true` on phone and desktop widths.

## Quality checklist before publishing

- Check that the template never displays `undefined`, empty bullets, or broken links.
- Paste a long name, a long project title, and five skills to test wrapping.
- Test with no project images and no social links.
- Test light, dark, classic, and midnight themes.
- Verify keyboard tab order and visible focus rings.
- Use only images you own or are licensed to use.
- Make sure the design is original; do not ask an AI to copy a named portfolio, agency, or designer.

## Google sign-in when you are ready

Google sign-in is useful only after you need to save portfolios across devices. At that point, add it as a separate, planned feature: choose an authentication provider, create a database for user-owned portfolios, write a privacy policy, configure Google OAuth consent, and protect the editor/save routes. Keep the current browser-local workflow as the free no-account starting point.

## A simple product path

1. Launch with 6–12 genuinely good templates across different professions.
2. Let visitors create and preview without an account.
3. Add Google sign-in to save, edit, and return to portfolios.
4. Offer paid value that costs you something to provide: premium templates, custom domains, hosting, export, or assisted setup.

Do not charge for features that do not work yet. A small reliable product is much easier to grow than a large unfinished one.
