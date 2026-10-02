export type TemplateId = "template-one" | "editorial-developer" | "kinetic-portfolio";

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  category: "Developer" | "Creative" | "Professional";
  author: string;
  createdAt: string;
  style: "Editorial" | "Minimal" | "Modern" | "Classic";
  idealFor: string[];
  tags: string[];
  editor: "standard" | "dedicated";
  /** Whether the template responds to the editor's colour-theme picker. */
  colorThemes: boolean;
}
