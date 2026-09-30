"use client";

import type { PortfolioData } from "./template-one/TemplateOne";
import TemplateOne from "./template-one/TemplateOne";
import EditorialDeveloperTemplate from "./editorial-developer/EditorialDeveloperTemplate";
import type { PortfolioData as EditorialData } from "./editorial-developer/data";
import type { TemplateId } from "@/lib/templates/types";

export default function TemplateRenderer({
  templateId,
  portfolio,
  theme,
  editorialData,
}: {
  templateId: TemplateId;
  portfolio: PortfolioData;
  theme?: "midnight" | "classic" | "dark" | "light";
  editorialData?: EditorialData;
}) {
  if (templateId === "editorial-developer") return <EditorialDeveloperTemplate data={editorialData} />;
  return <TemplateOne finalData={portfolio} theme={theme} />;
}
