# Templates

Formora has 38 templates: three originals (Editorial Developer, Midnight, Kinetic) and the 35-template **studio collection**, each drawn for a profession. Customers only see a studio template after an admin approves it at `/templates/review`.

## How a studio template is put together

| Piece | Where |
| --- | --- |
| Catalogue entry: name, professions, styles, light/dark, sections, palettes, font pairings, sample person | `lib/templates/studio-catalog.ts` |
| The design itself | `components/templates/studio/<profession>/<Name>.tsx` |
| Shared helpers (palette and font variables, section visibility, click-to-edit, images, reveal motion) | `components/templates/studio/kit.tsx`, `studio.css` |
| Lazy loading by id | `components/templates/studio/registry.tsx` |
| Sample people used in previews and as a starting point | `lib/templates/personas.ts` |
| Sample imagery (all drawn in code, so it's ours to ship) | `scripts/samples/render-samples.mjs` → `public/samples/` |
| Gallery thumbnails | `scripts/samples/template-thumbs.mjs` → `public/templates/` |

Every studio template reads the same content (`standardContentSchema` in `lib/portfolio/schema.ts`), so a customer can switch templates without retyping, and the one editor (`components/editor/studio/StudioEditor.tsx`) works for all of them. The editor only shows the sections the template declares.

Rules for designs, so they work in the editor, on phones and on the live site:
- Size with **container queries** (`@3xl:`, `cqw` units), never viewport breakpoints or `position: fixed`.
- Use the palette variables (`var(--t-bg)`, `--t-fg`, `--t-accent`, `--t-muted`, `--t-surface`) and fonts (`.fd`, `.ft`, `.fm`), so customers' colour and type choices apply.
- Wrap each section in `has("section")` and put `{...ed("path")}` on editable things, so empty sections disappear and clicks open the right field.

## Adding a template

1. Add an entry to `SPECS` in `lib/templates/studio-catalog.ts` (two or three palettes and font pairings).
2. Write the component and register it in `registry.tsx`.
3. Run the app and capture thumbnails: `BASE=http://localhost:3000 node scripts/samples/template-thumbs.mjs <id>`.
4. Sign in as an admin and approve it at `/templates/review`.

Set `TEMPLATES_REQUIRE_APPROVAL=false` to skip approval entirely.
