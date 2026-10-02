import type { StandardContent } from "@/lib/portfolio/schema";

/**
 * Proposed updates to a portfolio. Shared by the server (which creates them)
 * and the editor (which applies the ones the owner accepts). Nothing is ever
 * applied automatically: the owner sees each one and decides.
 */
export type SuggestionPayload =
  | { kind: "add_project"; project: NonNullable<StandardContent["projects"]>[number] }
  | { kind: "add_highlight"; highlight: NonNullable<StandardContent["highlights"]>[number] }
  | { kind: "add_experience"; experience: NonNullable<StandardContent["experience"]>[number] }
  | { kind: "set_field"; field: "professional_title" | "tagline" | "location" | "availability"; value: string }
  | { kind: "add_skills"; skills: string[] };

export interface Suggestion {
  id: string;
  source: "github" | "research";
  title: string;
  detail: string | null;
  sourceUrl: string | null;
  payload: SuggestionPayload;
  createdAt: string;
}

/** Returns new content with the suggestion applied. Additions go to the top, where recent work belongs. */
export function applySuggestion(content: StandardContent, payload: SuggestionPayload): StandardContent {
  switch (payload.kind) {
    case "add_project": return { ...content, projects: [payload.project, ...(content.projects ?? [])].slice(0, 30) };
    case "add_highlight": return { ...content, highlights: [payload.highlight, ...(content.highlights ?? [])].slice(0, 40) };
    case "add_experience": {
      // A new role usually ends the current one.
      const previous = (content.experience ?? []).map((role, index) => (index === 0 && /present|now|current/i.test(role.end_date ?? "") ? { ...role, end_date: payload.experience.start_date || role.end_date } : role));
      return { ...content, experience: [payload.experience, ...previous].slice(0, 30) };
    }
    case "set_field": return { ...content, [payload.field]: payload.value };
    case "add_skills": return { ...content, skills: [...new Set([...(content.skills ?? []), ...payload.skills])].slice(0, 40) };
  }
}
