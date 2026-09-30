import type { TemplateDefinition, TemplateId } from "./types";

// Add each new template here. The route, chooser, and renderer use this as
// their single source of truth, so no existing screens need editing.
export const templateCatalog: TemplateDefinition[] = [
  {
    id: "editorial-developer",
    name: "Editorial Developer",
    description: "A detailed, dark editorial portfolio for developers who want to show their craft, systems, and case studies.",
    category: "Developer",
    author: "CV Gen Studio",
    createdAt: "2026-09-27",
    style: "Editorial",
    idealFor: ["Software developers", "Full-stack developers", "Backend engineers"],
    tags: ["Dark", "Editorial", "Case studies"],
  },
  {
    id: "template-one",
    name: "Midnight Portfolio",
    description:
      "A bold, editorial portfolio for designers and developers who want their work and story to lead.",
    category: "Developer",
    author: "CV Gen Studio",
    createdAt: "2026-09-20",
    style: "Editorial",
    idealFor: ["Developers", "Product designers", "Creative technologists"],
    tags: ["Dark", "Editorial", "Portfolio"],
  },
];

export const DEFAULT_TEMPLATE_ID: TemplateId = "template-one";

export function getTemplate(templateId: string): TemplateDefinition | undefined {
  return templateCatalog.find((template) => template.id === templateId);
}

export function isTemplateId(templateId: string): templateId is TemplateId {
  return Boolean(getTemplate(templateId));
}
