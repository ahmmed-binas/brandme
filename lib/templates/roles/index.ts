import type { StandardContent } from "@/lib/portfolio/schema";
import { PROFESSIONS } from "../types";
import { rankRoles, type RoleSummary } from "./search";
import { BUSINESS_ROLES } from "./business";
import { HEALTH_ROLES } from "./health";
import { MANAGEMENT_ROLES } from "./management";
import { SALES_ROLES } from "./sales";
import type { Role } from "./types";
import { WORK_ROLES } from "./work";

export type { Role } from "./types";
export type { RoleSummary } from "./search";

/**
 * Real job titles under each profession, with sample content written for each,
 * so a paediatrician previews a template with a paediatrician’s portfolio.
 */
export const ROLES: Role[] = [...SALES_ROLES, ...HEALTH_ROLES, ...MANAGEMENT_ROLES, ...BUSINESS_ROLES, ...WORK_ROLES];

const BY_ID = new Map(ROLES.map((role) => [role.id, role]));
export const roleById = (id?: string | null) => (id ? BY_ID.get(id) : undefined);

/** The sample person a role is laid over. */
export const basePersonaFor = (role: Role) => role.starter.base ?? role.profession;

/** The small version of a role, for search in the browser. */
export const summarise = (role: Role): RoleSummary => ({ id: role.id, label: role.label, plural: role.plural, title: role.starter.title, profession: role.profession, aliases: role.aliases, templates: role.templates ?? [] });
export const ROLE_SUMMARIES: RoleSummary[] = ROLES.map(summarise);

/** Roles matching what someone typed, best first. */
export const searchRoles = (query: string, limit = 8): Role[] => rankRoles(ROLE_SUMMARIES, query, limit).map((summary) => BY_ID.get(summary.id)!);

/** Lays a role’s sample content over a profession’s sample person. */
export function applyRole(base: StandardContent, role: Role): StandardContent {
  const s = role.starter;
  return {
    ...base,
    name: s.name ?? base.name,
    professional_title: s.title,
    tagline: s.tagline,
    summary: s.bio,
    availability: s.availability ?? base.availability,
    skills: s.skills.split(" · "),
    services: s.services.map(([title, description, price]) => ({ title, description, price: price || undefined })),
    stats: s.stats.map(([value, label]) => ({ value, label })),
    testimonials: [{ quote: s.quote[0], name: s.quote[1], role: s.quote[2] }],
    experience: s.experience.map(([job_title, company, start_date, end_date]) => ({ job_title, company, start_date, end_date })),
    education: s.education.map(([degree, school, year]) => ({ degree, school, end_date: year || undefined })),
    projects: s.keepWork ? base.projects : [],
    gallery: s.keepWork ? base.gallery : [],
    highlights: s.keepWork ? base.highlights : [],
    cover: s.keepWork ? base.cover : undefined,
  };
}

/** Roles grouped by profession, in the professions’ order. */
export const rolesByProfession = () => PROFESSIONS.map((profession) => ({ profession, roles: ROLES.filter((role) => role.profession === profession.id) })).filter((group) => group.roles.length);
