import type { ProfessionId } from "../types";

/** Sample content written for one job title, laid over the profession's sample person. */
export interface RoleStarter {
  /** Overrides the sample person's name, e.g. no “Dr.” for a nurse. */
  name?: string;
  /** Use another sample person as the base (contact details, photos). */
  base?: string;
  title: string;
  tagline: string;
  bio: string[];
  /** Skills separated by “ · ”. */
  skills: string;
  services: Array<[title: string, description: string, price: string]>;
  stats: Array<[value: string, label: string]>;
  quote: [quote: string, name: string, role: string];
  experience: Array<[title: string, company: string, start: string, end: string]>;
  education: Array<[degree: string, school: string, year: string]>;
  availability?: string;
  /** Keep the sample person’s pictures and projects (homes, dishes, hair). */
  keepWork?: boolean;
}

export interface Role {
  id: string;
  /** Singular, as a person would write it: “Paediatrician”. */
  label: string;
  /** For headings: “paediatricians”. */
  plural: string;
  profession: ProfessionId;
  /** Other names people search for: “pediatrician”, “children’s doctor”. */
  aliases: string[];
  /** Templates to suggest first, best fit first. */
  templates?: string[];
  starter: RoleStarter;
}

export const role = (id: string, label: string, plural: string, profession: ProfessionId, aliases: string[], starter: RoleStarter, templates?: string[]): Role =>
  ({ id, label, plural, profession, aliases, starter, templates });
