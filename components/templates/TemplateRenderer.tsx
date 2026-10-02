"use client";

import type { PortfolioData } from "./template-one/TemplateOne";
import type { PortfolioData as EditorialData } from "./editorial-developer/data";
import type { TemplateId } from "@/lib/templates/types";
import dynamic from "next/dynamic";
import { getTemplate } from "@/lib/templates/catalog";
import type { StandardContent } from "@/lib/portfolio/schema";

const StudioTemplate = dynamic(() => import("./studio/registry"));

const TemplateOne = dynamic(() => import("./template-one/TemplateOne"));
const EditorialDeveloperTemplate = dynamic(() => import("./editorial-developer/EditorialDeveloperTemplate"));
const KineticPortfolio = dynamic(() => import("./kinetic-portfolio/KineticPortfolio"));

export default function TemplateRenderer({
  templateId,
  portfolio,
  theme,
  editorialData,
  embedded,
  onEdit,
}: {
  templateId: TemplateId;
  portfolio: PortfolioData;
  theme?: "midnight" | "classic" | "dark" | "light";
  editorialData?: EditorialData;
  embedded?: boolean;
  onEdit?: (field: "name" | "professional-title" | "about-you" | "projects" | "experience" | "skills" | "email") => void;
}) {
  const definition = getTemplate(templateId);
  if (definition?.collection === "studio") return <StudioTemplate template={definition} content={portfolio as StandardContent} embedded={embedded} />;
  if (templateId === "editorial-developer") return <EditorialDeveloperTemplate data={editorialData} />;
  if (templateId === "kinetic-portfolio") return <div className={embedded ? "template-embedded" : undefined}>
    {!embedded && <nav aria-label="Kinetic Portfolio sections" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-black/20 bg-[#d9ddd3] text-[#15181a] md:inset-y-0 md:left-0 md:right-auto md:w-14 md:flex-col md:justify-center md:gap-10 md:border-r md:border-t-0 md:bg-transparent">
      {[["work", "Work"], ["path", "Path"], ["tools", "Tools"], ["contact", "Contact"]].map(([id, label]) => <a key={id} href={`#${id}`} className="flex min-h-12 flex-1 items-center justify-center text-base italic hover:text-[#2b33ff] md:min-h-0 md:flex-none md:rotate-180 md:[writing-mode:vertical-rl]">{label}</a>)}
    </nav>}
    <KineticPortfolio portfolio={portfolio} embedded={embedded} onEdit={onEdit} />
  </div>;
  return <TemplateOne finalData={portfolio} theme={theme} embedded={embedded} />;
}
