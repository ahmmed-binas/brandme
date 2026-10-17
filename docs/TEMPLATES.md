# Templates

Formora has 49 templates: three originals (Editorial Developer, Midnight, Kinetic) and the 46-template **studio collection**, each drawn for a profession. Professions are grouped into fields (Tech, Creative, Business, Health & care, Trades & hospitality, Education, Public sector) in `lib/templates/types.ts`, and the gallery filters by field, then profession.

Customers only see a studio template once it is approved. The owner's decisions ship in `lib/templates/decisions.ts`, so a fresh deployment starts with them; a decision made at `/templates/review` (stored in the database) overrides it. Rejected templates are removed from the code.

## How a studio template is put together

| Piece | Where |
| --- | --- |
| Catalogue entry: name, professions, styles, light/dark, sections, palettes, font pairings, sample person | `lib/templates/studio-catalog.ts` |
| The design itself | `components/templates/studio/<profession>/<Name>.tsx` |
| Shared helpers (palette and font variables, section visibility, click-to-edit, images, reveal motion) | `components/templates/studio/kit.tsx`, `studio.css` |
| Lazy loading by id | `components/templates/studio/registry.tsx` |
| Sample people used in previews and as a starting point | `lib/templates/personas.ts`, `personas-more.ts` |
| Sample imagery (drawn in code, so it's ours to ship) | `scripts/samples/render-samples.mjs` and `scenes-more.mjs` → `public/samples/` |
| Real estate photos (Unsplash, previews only) | `public/samples/re/` with `CREDITS.md`; left out of free downloads by `lib/templates/export.ts` |
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
4. The owner approves it at `/templates/review`. Agents never approve their own templates or add them to `decisions.ts`.

Set `TEMPLATES_REQUIRE_APPROVAL=false` to skip approval entirely.

### Checklist before committing a template (agents: every item)

Another agent reviews each new template against this list, so it's quicker to get it right first time.

- **Sources:** if it's based on someone else's site or repo, check the licence (`api.github.com/repos/<owner>/<repo>/license`). No licence means copy nothing (code, images, drawings, text): rebuild the ideas yourself. Never use real people's or businesses' details without their consent; samples are invented.
- **Approval:** it starts pending. Not in `decisions.ts`.
- **Layout:** container queries (`@3xl:`, `cqw`) only, no viewport breakpoints, no `position: fixed` (use `sticky` or `absolute` inside the template). No sideways scroll at 390px wide.
- **Editing:** every visible piece of content has `{...ed("path")}`; every section is wrapped in `has("section")` and hides when empty; the name is in the `<h1>`.
- **Motion:** respects `motionOff()` / `prefers-reduced-motion` and `[data-static]` (captures). Nothing heavy (WebGL, video, 3D) without a still fallback.
- **Honesty:** no fake reviews or ratings shown as real; prices in samples are plausible; no AI features that cost money per visit; no pop-ups that block the page.
- **Content model:** uses the shared fields only (`standardContentSchema`); a new sample person goes in `lib/templates/personas*.ts`.
- **Checks:** `npx tsc --noEmit`, `npx eslint <files>`, `npx prettier --write <files>`, `npm run build`, tried in a browser on desktop and phone, thumbnails captured with `scripts/samples/template-thumbs.mjs`.
- **Commit:** one template per commit, saying what it's for and where ideas came from; no AI model names in commits or comments.

## Job titles (roles)

Below each profession sit real job titles — 156 of them, from Paediatrician and Registered Nurse to Account Executive, Operations Manager and Plumber — in `lib/templates/roles/`. Each role has sample content written for it (title, introduction, skills, services and fees, numbers, a testimonial, experience and qualifications), laid over the profession's sample person by `applyRole`.

- The gallery's "What do you do?" box finds a role (`rankRoles` in `roles/search.ts`, which runs in the browser on the small `RoleSummary` list) and orders the suggested templates first.
- `?role=<id>` on `/templates/<id>`, `/templatepreview` and `/editor/<id>` shows that role's sample. Samples are built on the server (`lib/templates/samples.ts`); the editor's "Show sample content for" picker fetches others from `/api/samples`.
- `/for` lists every role and `/for/<role>` is a landing page per job title, included in the sitemap.

To add a role, add an entry with `role(...)` in the matching file. Write prices in the base sample person's currency and keep stat values under 24 characters (the schema limit).

## Moving templates (Motion collection)

Residence, Margin Notes, Pulse, Counsel and Mise are built with `components/templates/studio/motion.tsx`: scroll progress written to CSS variables (no re-renders while scrolling), words that rise in, numbers that count up, a sideways track pinned to vertical scroll, magnetic buttons and rotating quotes. The same code works on the live site and inside the editor’s scrolling preview. In still captures (`data-static`) and for visitors who ask for reduced motion, every effect shows its finished state and pinned sections become ordinary lists. Filter for them in the gallery with the “Motion” style.

## Real estate collection

Skyline, Manor, Front Door, Shoreline and Off Plan are built for agents to win clients, each for a different kind of agent: luxury and investment (Skyline), country houses (Manor), buyer's agents (Front Door), coastal and holiday homes (Shoreline) and new developments (Off Plan). Shared pieces live in `components/templates/studio/realestate/re-kit.tsx`: prices read from text (“AED 12,500,000”, “£1.25m”), currency conversion at indicative rates, mortgage maths, status filters, a full-screen gallery (`<dialog>`, so no fixed positioning), and the ways agents are really contacted: a pre-written viewing request by WhatsApp (when there's a phone number) or email.

Listings are the content model's projects: title = address, `client` = price, `role` = beds/baths/size, `category` = status (“For sale”, “Sold”, “Under offer”…), `year` = when (in Off Plan, the floor: “Floor 21”), `live_url` = the portal listing. Off Plan's countdown reads a date from the availability line (“Launch weekend: 14 November 2026”). The valuation and viewing forms open the visitor's own email or WhatsApp with the message filled in; nothing is stored.

Sample agents are in `lib/templates/personas-realestate.ts`. Their photos are from Unsplash (`public/samples/re/CREDITS.md`): fine to show on the site, the gallery and in marketing, but the licence doesn't allow handing them out as a collection, so downloads replace them with empty slots. Don't add Unsplash+ (paid) photos; the download route refuses them anyway.

### Marketing clips (TikTok, Reels, Shorts)

`node scripts/samples/tiktok-clips.mjs [id,id]` records a 1080×1920 silent clip of each template on a phone-sized screen, scrolling and using its interactive parts (scripts per template at the top of the file), into `marketing/clips/` (not committed). Needs the app running with `TEMPLATES_REQUIRE_APPROVAL=false`, ffmpeg, and a Chromium browser (`BROWSER_CHANNEL=msedge` or `chrome`, or `CHROMIUM_PATH`). Add music and captions in the app you post from.

## UAE collection (live GPU backgrounds)

Mirage (prime Dubai), Yield (off-plan investors), Majlis (bilingual English/Arabic, right to left), Keys (rentals, paid in cheques) and Debut (new agents, short-video style) are built for UAE agents. Sample agents are in `lib/templates/personas-uae.ts`. They start **pending**: approve them at `/templates/review`.

### Profession templates with live shaders (October 2026)

Dispatch (trades and AC engineers), Atelier (beauty), Roadmap (product managers), Radar (recruiters) and Duet (translators, English and Arabic) fill the jobs that had the fewest designs. Each draws a WebGL background with `components/templates/studio/shader.tsx`: pass a fragment shader and three hex colours (usually the palette's bg, the accent and fg). It draws one still frame for captures and reduced motion, pauses off screen, and falls back to the plain background without WebGL. Sample people are in `lib/templates/personas-pro.ts`; their photos are Unsplash (`public/samples/pro/CREDITS.md`, fetched by `scripts/samples/pro-photos.py`) and, like the real estate set, are left out of free downloads. They start **pending**.

Their moving backgrounds use the [`shaders`](https://www.npmjs.com/package/shaders) package (WebGPU), through `ShaderStage` in `realestate/re-shader.tsx`:

- **Licence:** version 4 and later is MIT. Version 3 and earlier needed a paid commercial licence, so don't downgrade. It's pinned to an exact version in `package.json`. Presets copied from shaders.com are under that site's own terms, so compose effects from the package's components instead.
- **Privacy:** the package can send performance reports to shaders.com. `ShaderStage` always passes `disableTelemetry`. Don't use its `Text` effect, because it loads Google Fonts.
- **Fallback:** every stage paints a CSS background first. The shader only starts with WebGPU, with motion on (not in still captures or reduced motion) and near the screen.

Calculators in these templates (DLD 4% fee, Golden Visa threshold of AED 2M, Ejari, DEWA deposits, rent cheques) are labelled as guides, with typical 2026 figures. Check them yearly.

## 3D Pro templates (October 2026)

Control Room (operations managers) and Studio Desk (content marketers) are drawn with three.js in `components/templates/studio/objects3d.tsx`. Every project becomes a 3D object chosen from its **category** (`objectFor`): typing “Video”, “Logistics” or an object's own name (“rocket”, “globe”…) swaps the object, and the editor shows the list. Objects only: no 3D people or faces (owner's rule). They are `proOnly` in the catalogue: anyone can try them in the editor, but saving and publishing need a paid plan (`lib/templates/pro.ts`, checked in the save and publish routes), and their code is not in the free downloads. The instructor templates Lane and Altitude use `vehicle3d.tsx` the same way.

## Premium 3D agent templates: Monolith, Tide, Arc, Dune, Atlas (October 2026)

Designed as standalone pages in a separate session and converted into studio templates (pending the owner's approval, Pro and 3D like the other 3D templates). Code: `components/templates/studio/realestate/premium/`.

- `stage.js` is the shared three.js stage (drag to orbit, bloom, pause off screen, still frames when motion is off) with `destroy()`, so scenes clean up when the editor unmounts them. `realism.js` holds the sky, glass facades, mirror water and HDRI loader.
- `scenes/*.js` are each page's original 3D code, extracted almost verbatim into `mount<Name>(canvas, options)`. Where the page drives the scene (Dune's sun clock, Arc's build slider and Drawing/Render switch, Atlas's district selection), the controller returns methods for it.
- `pieces.tsx` has the shared listings grid, UAE mortgage calculator, enquiry form (opens WhatsApp or email with the message; nothing is stored), contact cards and the floating WhatsApp button. They keep the original class names, so each template styles them in its own CSS.
- `<name>.css` was generated from each page by `scripts/samples/scope-css.py` (selectors scoped to `.pm-<name>`, @media → @container, vw → cqw), with hand adjustments at the end of each file. `premium.css` turns the fixed nav and WhatsApp button into sticky ones.
- Content mapping (see `lib/templates/personas-premium.ts`): listings are `projects` (client = price, role = specs, category = status, technologies = area and type); the credentials strip is `highlights`; community, launch or district tables are `services` (Atlas and Tide read their figures from the price text); words in the tagline between asterisks take the accent colour.
- Skies: two CC0 Poly Haven HDRIs halved to 1k in `public/samples/re/sky/`.
- Arc is the off-plan design drawn as “Blueprint” (renamed because a developer template already uses that name).
- **Owner decision pending:** Monolith shows a recognisable Burj Khalifa and Tide a recognisable Burj Al Arab, both drawn in code. Their outlines are trademarks of Emaar and Jumeirah; ask before approving those two for sale.
