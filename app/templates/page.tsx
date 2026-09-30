"use client";

import PortfolioTemplateView from "@/components/templates/PortfolioTemplateView";
import { DEFAULT_TEMPLATE_ID } from "@/lib/templates/catalog";

export default function TemplatesPage() {
  return <PortfolioTemplateView templateId={DEFAULT_TEMPLATE_ID} />;
}
