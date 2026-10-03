import type { ImportedProfile } from "./profile";

/**
 * Keeps an AI-structured profile honest: every fact must be traceable to the
 * text the person gave us. The model is told never to invent, but this check
 * doesn't rely on that. Anything that can't be found in the source (a link, an
 * email, an employer, a school, a project, a skill, a year) is removed and
 * reported. Written text (tagline, summary, descriptions) is the model's own
 * wording and isn't checked word by word.
 */

const normalise = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9@.+#/:-]+/g, " ").replace(/\s+/g, " ").trim();
const STOP = new Set(["and", "the", "for", "with", "inc", "ltd", "llc", "plc", "gmbh", "co", "of", "at", "in", "on", "a", "an", "to"]);
const tokens = (value: string) => normalise(value).replace(/[./:-]+/g, " ").split(" ").filter((token) => token.length >= 2 && !STOP.has(token));

export interface Grounded { profile: ImportedProfile; removed: string[] }

export function groundProfile(profile: ImportedProfile, source: string): Grounded {
  const text = normalise(source);
  const words = new Set(tokens(source));
  const removed: string[] = [];

  // A value is grounded when most of its meaningful words appear in the source (allows "Sr." vs "Senior", reordering).
  const grounded = (value: string | undefined, share = 0.7) => {
    if (!value?.trim()) return true;
    if (text.includes(normalise(value))) return true;
    const list = tokens(value);
    if (!list.length) return true;
    return list.filter((token) => words.has(token)).length / list.length >= share;
  };
  const linkGrounded = (url: string | undefined) => {
    if (!url?.trim()) return true;
    const bare = normalise(url).replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
    return Boolean(bare) && text.includes(bare);
  };
  const year = (value: string | undefined) => value?.match(/(19|20)\d{2}/)?.[0];
  const dateGrounded = (value: string | undefined) => !year(value) || text.includes(year(value)!);
  const keep = <T,>(label: string, items: T[] | undefined, test: (item: T) => boolean, name: (item: T) => string) => {
    if (!items) return items;
    return items.filter((item) => { const ok = test(item); if (!ok) removed.push(`${label}: ${name(item)}`); return ok; });
  };

  const out: ImportedProfile = { ...profile };
  for (const key of ["github", "linkedin", "instagram"] as const) {
    if (out[key] && !linkGrounded(out[key])) { removed.push(`${key} link: ${out[key]}`); out[key] = ""; }
  }
  if (out.email && !text.includes(normalise(out.email))) { removed.push(`email: ${out.email}`); out.email = ""; }
  if (out.name && !grounded(out.name, 0.5)) { removed.push(`name: ${out.name}`); out.name = ""; }
  if (out.location && !grounded(out.location, 0.5)) { removed.push(`location: ${out.location}`); out.location = ""; }

  out.skills = keep("skill", out.skills, (skill) => grounded(skill, 0.99), (skill) => skill);
  out.experience = keep("role", out.experience, (item) => grounded(item.company) && grounded(item.job_title, 0.5), (item) => `${item.job_title ?? ""} at ${item.company ?? ""}`)
    ?.map((item) => ({
      ...item,
      start_date: dateGrounded(item.start_date) ? item.start_date : "",
      end_date: dateGrounded(item.end_date) ? item.end_date : "",
      technologies: item.technologies?.filter((tech) => grounded(tech, 0.99)),
    }));
  out.projects = keep("project", out.projects, (item) => grounded(item.title), (item) => item.title ?? "")
    ?.map((item) => ({ ...item, live_url: linkGrounded(item.live_url) ? item.live_url : "", github: linkGrounded(item.github) ? item.github : "", technologies: item.technologies?.filter((tech) => grounded(tech, 0.99)) }));
  out.education = keep("education", out.education, (item) => grounded(item.school), (item) => item.school ?? "")
    ?.map((item) => ({ ...item, start_date: dateGrounded(item.start_date) ? item.start_date : "", end_date: dateGrounded(item.end_date) ? item.end_date : "" }));
  out.highlights = keep("highlight", out.highlights, (item) => grounded(item.title, 0.6) && dateGrounded(item.year), (item) => item.title ?? "")
    ?.map((item) => ({ ...item, url: linkGrounded(item.url) ? item.url : "" }));
  out.links = keep("link", out.links, (item) => linkGrounded(item.url), (item) => item.url ?? "");
  return { profile: out, removed };
}
