import { PROFESSIONS, type ProfessionId } from "../types";

/** What the browser needs to find a role: no sample text, so it stays small. */
export interface RoleSummary {
  id: string;
  label: string;
  plural: string;
  title: string;
  profession: ProfessionId;
  aliases: string[];
  templates: string[];
}

const normalise = (text: string) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "").trim();

/** Roles matching what someone typed, best first: “doctor” finds the GP first, “pediatrician” finds paediatrician. */
export function rankRoles<T extends RoleSummary>(roles: T[], query: string, limit = 8): T[] {
  const needle = normalise(query);
  if (!needle) return [];
  const words = needle.split(/\s+/);
  const wordStart = (name: string) => name.split(/[\s&,/-]+/).some((word) => word.startsWith(needle));
  return roles.map((role) => {
    const label = normalise(role.label);
    const names = [label, normalise(role.title), ...role.aliases.map(normalise)];
    let score = 0;
    if (names.some((name) => name === needle)) score = 100;
    else if (label.startsWith(needle)) score = 85;
    else if (names.some((name) => name.startsWith(needle))) score = 75;
    else if (wordStart(label)) score = 70;
    else if (names.some(wordStart)) score = 55;
    else if (words.every((word) => names.some((name) => name.includes(word)))) score = 40;
    else if (normalise(PROFESSIONS.find((item) => item.id === role.profession)?.label ?? "").includes(needle)) score = 20;
    return { role, score: score ? score - label.length / 100 : 0 };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((item) => item.role);
}
