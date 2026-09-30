export type TemplateId = "template-one" | "editorial-developer";

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
}
