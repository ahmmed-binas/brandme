import "server-only";
import type { StandardContent } from "@/lib/portfolio/schema";
import { PERSONAS, personaFor } from "./personas";
import { applyRole, basePersonaFor, roleById } from "./roles";
import type { TemplateDefinition } from "./types";

/**
 * The sample portfolio a template previews with: the template’s own sample
 * person, or, when a job title is chosen, content written for that role.
 * Computed on the server so the browser never downloads every sample.
 */
export function sampleFor(template: Pick<TemplateDefinition, "persona">, roleId?: string | null): StandardContent {
  const role = roleById(roleId);
  if (role) return applyRole(structuredClone(PERSONAS[basePersonaFor(role)] ?? personaFor(template.persona)), role);
  return personaFor(template.persona);
}
