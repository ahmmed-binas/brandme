/**
 * Where a link to a template goes. Every studio template has one page that
 * search engines index: /gallery/<id> (the story, a live preview, the jobs it
 * suits and an FAQ). The three original templates, and studio templates still
 * waiting for the owner's review, use the plain preview page instead.
 */

/** The first three templates, built before the studio collection; they have no gallery article. */
const ORIGINAL_TEMPLATES = new Set(["editorial-developer", "template-one", "kinetic-portfolio"]);

export function templatePageHref(
  templateId: string,
  options: { role?: string | null; approved?: boolean } = {},
): string {
  const { role, approved = true } = options;
  if (ORIGINAL_TEMPLATES.has(templateId) || !approved) {
    return `/templatepreview?template=${templateId}${role ? `&role=${encodeURIComponent(role)}` : ""}`;
  }
  return `/gallery/${templateId}${role ? `?role=${encodeURIComponent(role)}` : ""}`;
}
