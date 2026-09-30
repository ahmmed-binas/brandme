import { notFound } from "next/navigation";
import PortfolioTemplateView from "@/components/templates/PortfolioTemplateView";
import { getTemplate, templateCatalog } from "@/lib/templates/catalog";
import type { Metadata } from "next";
import TemplateFeedback from "@/components/templates/TemplateFeedback";

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const template = getTemplate(templateId);

  if (!template) notFound();

  return <><PortfolioTemplateView templateId={template.id} /></>;
}

export function generateStaticParams() {
  return templateCatalog.map(({ id }) => ({ templateId: id }));
}

export async function generateMetadata({ params }: { params: Promise<{ templateId: string }> }): Promise<Metadata> {
  const { templateId } = await params;
  const template = getTemplate(templateId);
  if (!template) return {};
  return {
    title: `${template.name} portfolio template`,
    description: template.description,
    alternates: { canonical: `/templates/${template.id}` },
  };
}
