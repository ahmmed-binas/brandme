import { notFound } from "next/navigation";
import PortfolioTemplateView from "@/components/templates/PortfolioTemplateView";
import { getTemplate } from "@/lib/templates/catalog";
import type { Metadata } from "next";
import { sampleFor } from "@/lib/templates/samples";

export default async function TemplatePage({ params, searchParams }: { params: Promise<{ templateId: string }>; searchParams: Promise<{ role?: string }> }) {
  const { templateId } = await params;
  const template = getTemplate(templateId);
  if (!template) notFound();
  // Studio templates preview with sample content, written for a job title when one is chosen.
  const sample = template.collection === "studio" ? sampleFor(template, (await searchParams).role) : undefined;
  return <PortfolioTemplateView templateId={template.id} sample={sample} />;
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
