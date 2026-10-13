import type { TemplateDefinition } from "@/lib/templates/types";
import type { Role } from "@/lib/templates/roles";

/**
 * Where a link to a template goes. Every studio template has one page that
 * search engines index: /gallery/<id>, or /for/<job>/<id> when a job is chosen
 * (the story, a live preview, the jobs it suits and an FAQ). The three original templates, and studio templates still
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
  return role ? `/for/${encodeURIComponent(role)}/${templateId}` : `/gallery/${templateId}`;
}

/** The studio designs that suit a job: its preferred ones first, then the rest of its profession. */
export function designsForRole<T extends TemplateDefinition>(role: Role, available: T[], limit = 6): T[] {
  const preferred = role.templates ?? [];
  const rank = (id: string) => (preferred.includes(id) ? preferred.indexOf(id) : 99);
  return available
    .filter(
      (template) =>
        template.collection === "studio" &&
        (preferred.includes(template.id) || template.professions?.includes(role.profession)),
    )
    .sort((a, b) => rank(a.id) - rank(b.id))
    .slice(0, limit);
}
