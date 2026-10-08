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
4. Sign in as an admin and approve it at `/templates/review`, or add it to `decisions.ts`.

Set `TEMPLATES_REQUIRE_APPROVAL=false` to skip approval entirely.

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
