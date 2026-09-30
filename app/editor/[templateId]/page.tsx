import { notFound } from "next/navigation";
import PortfolioEditor from "@/components/editor/PortfolioEditor";
import EditorialDeveloperEditor from "@/components/editor/EditorialDeveloperEditor";
import { getTemplate } from "@/lib/templates/catalog";

export default async function EditorPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const template = getTemplate(templateId);
  if (!template) notFound();

  return template.id === "editorial-developer" ? <EditorialDeveloperEditor template={template} /> : <PortfolioEditor template={template} />;
}
