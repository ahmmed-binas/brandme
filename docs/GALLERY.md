# The gallery and free templates

The gallery (`/gallery`, in the main menu) is the free side of the business: every design can be downloaded and used for free, and people who'd rather not touch code customise it in the editor and pay for hosting, a domain and the rest. It's also how designers can share their own templates.

## What's in it

- **Studio originals:** every approved studio template (`lib/templates/studio-catalog.ts`). Unapproved ones stay hidden until you approve them at `/templates/review`.
- **Community templates:** designs people submit at `/gallery/submit`, once you approve them at `/admin/gallery`.

Each tile is square, plays a short clip of the site on hover (or when it's in the middle of the screen on a phone), and tilts towards the pointer. Search covers names, descriptions, tags, designers and job titles (searching "lawyer" finds the designs made for law). Each design has an article page at `/gallery/<slug>` with the story, the same star rating used everywhere else, a free download, setup steps, and an offer to customise it without code.

## Free downloads (studio originals)

`/api/templates/<id>/download` builds a ZIP on first request (cached in memory) from the template's own source: a Vite + React + Tailwind project with the component, the shared kit, the sample content as `src/content.json`, its images, a README with setup steps and an MIT licence. Nothing from the main app is needed to run it. Downloads are counted (`template_downloads`) and shown on tiles. Code: `lib/templates/export.ts`.

## Clips

`scripts/samples/template-clips.mjs` records each template (hold, then a slow scroll) into `public/gallery/<id>.webm` (VP9), `<id>.mp4` (H.264, for Safari) and `<id>.webp` (poster). Re-run it for a template after changing its design:

```bash
TEMPLATES_REQUIRE_APPROVAL=false npm run build && TEMPLATES_REQUIRE_APPROVAL=false npm start   # in one terminal
BASE=http://localhost:3000 node scripts/samples/template-clips.mjs residence,mise          # in another
```

Needs ffmpeg and Playwright's Chromium.

## Community submissions

1. **Accounts.** People sign up with Google, or with username, email, password and date of birth at `/signup` (16 or older). Password accounts confirm their email from a link before they can submit. Everyone picks a public @username on their account page. Code: `lib/accounts/passwords.ts`.
2. **Submitting** (`/gallery/submit`): name, one-line description, tags, optional live demo link; the story (the idea, how it was made or prompted, the inspiration, who it's for); a ZIP (≤ 20 MB), a cover image and an optional clip (≤ 12 MB); a licence (MIT, Apache 2.0 or CC BY 4.0); and confirmation that it's their own work. At most 3 waiting at once.
3. **Automatic checks on the ZIP:** it must be a real ZIP, under 120 MB unpacked and 3,000 files, with no unsafe paths, no `node_modules`, no programs or scripts (`.exe`, `.sh`, `.bat`, `.jar`…), and an `index.html` or `package.json` near the top. Images and videos are checked by their contents, not their names.
4. **Your review** at `/admin/gallery`: read the story, watch the clip, list the files, download and run the ZIP. Then approve, ask for changes (with a note), or decline (with a note). The designer is emailed either way and can edit and resubmit from the same page. Approved templates appear in the gallery immediately; you can take one down later from the Approved tab.

Nothing a person uploads is public, or downloadable by anyone but them and admins, until you approve it.

## Email

Verification and password-reset emails need SMTP in production (see the `/admin` checklist). Locally, with `DEV_LOGIN=true`, the full email, including its link, is printed in the terminal running the app.
