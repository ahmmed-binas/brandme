import type { PortfolioData as EditorialData } from "@/components/templates/editorial-developer/data";
import { EDITORIAL_SKILL_CATEGORIES, type StandardContent } from "@/lib/portfolio/schema";

/**
 * The common result of every import source (GitHub, LinkedIn export, CV, AI).
 * It uses the standard template's content shape; dedicated templates map it
 * into their own model below. Empty values mean "not found" and never
 * overwrite what the user already has.
 */
export type ImportedProfile = StandardContent & { location?: string };

const filled = (value?: string) => Boolean(value?.trim());
const nonEmpty = <T,>(items?: T[]) => (items?.length ? items : undefined);

/** Drops empty fields so a merge only touches what the source actually provided. */
export function compactProfile(profile: ImportedProfile): ImportedProfile {
  const output: ImportedProfile = {};
  for (const key of ["name", "professional_title", "tagline", "email", "github", "linkedin", "instagram", "location"] as const) {
    if (filled(profile[key])) output[key] = profile[key]!.trim();
  }
  const summary = profile.summary?.map((item) => item.trim()).filter(Boolean);
  if (summary?.length) output.summary = summary;
  const skills = [...new Set(profile.skills?.map((item) => item.trim()).filter(Boolean))];
  if (skills.length) output.skills = skills.slice(0, 40);
  const projects = profile.projects?.filter((project) => filled(project.title));
  if (projects?.length) output.projects = projects.slice(0, 30);
  const experience = profile.experience?.filter((item) => filled(item.job_title) || filled(item.company));
  if (experience?.length) output.experience = experience.slice(0, 30);
  return output;
}

/** Lists the parts of a profile that were found, for a short confirmation message. */
export function describeProfile(profile: ImportedProfile): string {
  const parts = [
    profile.name && "name",
    profile.professional_title && "title",
    profile.summary?.length && "bio",
    profile.skills?.length && `${profile.skills.length} skills`,
    profile.projects?.length && `${profile.projects.length} projects`,
    profile.experience?.length && `${profile.experience.length} roles`,
    (profile.github || profile.linkedin || profile.email) && "contact links",
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "nothing usable";
}

/** Standard templates: imported values replace the matching fields; everything else is kept. */
export function mergeIntoStandard(current: StandardContent, imported: ImportedProfile): StandardContent {
  const profile = compactProfile(imported);
  return {
    ...current,
    name: profile.name ?? current.name,
    professional_title: profile.professional_title ?? current.professional_title,
    tagline: profile.tagline ?? current.tagline,
    email: profile.email ?? current.email,
    github: profile.github ?? current.github,
    linkedin: profile.linkedin ?? current.linkedin,
    instagram: profile.instagram ?? current.instagram,
    summary: nonEmpty(profile.summary) ?? current.summary,
    skills: nonEmpty(profile.skills) ?? current.skills,
    // Imported projects keep any image the user already added to a project of the same name.
    projects: nonEmpty(profile.projects)?.map((project) => ({ ...project, image: project.image || current.projects?.find((existing) => existing.title === project.title)?.image })) ?? current.projects,
    experience: nonEmpty(profile.experience) ?? current.experience,
  };
}

/** Matches whole technology names, including ones that start or end with symbols such as "C#" or ".NET". */
const terms = (pattern: string) => new RegExp(`(?:^|[^a-z0-9])(?:${pattern})(?![a-z0-9])`, "i");
const SKILL_GROUPS: Array<[typeof EDITORIAL_SKILL_CATEGORIES[number], RegExp]> = [
  ["ai", terms("ai|ml|machine learning|llms?|nlp|pytorch|tensorflow|openai|claude|langchain|computer vision|data science")],
  ["database", terms("sql|mysql|postgres(?:ql)?|mongo(?:db)?|redis|sqlite|firebase|supabase|dynamodb|oracle|mariadb|elasticsearch")],
  ["devops", terms("docker|kubernetes|k8s|aws|azure|gcp|google cloud|terraform|ansible|ci/?cd|github actions|jenkins|linux|nginx|vercel|netlify")],
  ["frontend", terms("react|vue|angular|svelte|next(?:\\.js)?|nuxt|html5?|css3?|sass|tailwind(?: css)?|javascript|typescript|redux|figma|ui|ux")],
  ["backend", terms("node(?:\\.js)?|express|nest(?:js)?|c#|\\.net|asp\\.net(?: core)?|java|spring|kotlin|python|django|flask|fastapi|go(?:lang)?|rust|php|laravel|ruby|rails|graphql|rest")],
];
const categoriseSkill = (skill: string) => SKILL_GROUPS.find(([, pattern]) => pattern.test(skill))?.[0] ?? "tools";
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "project";

/** Editorial Developer: maps the common profile into its richer model, keeping sections imports don't cover. */
export function mergeIntoEditorial(current: EditorialData, imported: ImportedProfile): EditorialData {
  const profile = compactProfile(imported);
  const stamp = Date.now().toString(36);
  const skills = profile.skills
    ? Object.fromEntries(EDITORIAL_SKILL_CATEGORIES.map((category) => [category, profile.skills!.filter((skill) => categoriseSkill(skill) === category).map((name) => ({ name }))])) as EditorialData["skills"]
    : current.skills;
  return {
    ...current,
    personal: {
      ...current.personal,
      name: profile.name ?? current.personal.name,
      title: profile.professional_title ?? current.personal.title,
      positioning: profile.tagline ?? current.personal.positioning,
      location: profile.location ?? current.personal.location,
      email: profile.email ?? current.personal.email,
    },
    about: profile.summary ? { ...current.about, introduction: profile.summary[0], philosophy: profile.summary.slice(1).join("\n\n") || current.about.philosophy } : current.about,
    social: { ...current.social, github: profile.github ?? current.social.github, linkedin: profile.linkedin ?? current.social.linkedin },
    contact: profile.email ? { ...current.contact, email: profile.email } : current.contact,
    skills,
    projects: profile.projects ? profile.projects.map((project, index) => ({
      id: `project-${stamp}-${index}`,
      slug: `${slugify(project.title ?? "project")}-${index}`,
      name: project.title ?? "Project",
      tagline: project.description?.split(/(?<=[.!?])\s/)[0] ?? "",
      description: project.description ?? "",
      problem: "",
      approach: "",
      role: "Developer",
      featured: index < 2,
      status: "shipped" as const,
      technologies: project.technologies ?? [],
      keyFeatures: [],
      github: project.github,
      liveUrl: project.live_url,
      date: "",
    })) : current.projects,
    experience: profile.experience ? profile.experience.map((item, index) => ({
      id: `experience-${stamp}-${index}`,
      company: item.company ?? "",
      role: item.job_title ?? "",
      location: item.location ?? "",
      startDate: item.start_date ?? "",
      endDate: item.end_date ?? "",
      summary: item.description ?? "",
      responsibilities: [],
      technologies: item.technologies ?? [],
      achievements: [],
    })) : current.experience,
  };
}
