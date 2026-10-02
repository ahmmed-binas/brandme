"use client";

import Link from "next/link";
import TemplateRenderer from "./TemplateRenderer";
import type { PortfolioData } from "./template-one/TemplateOne";
import type { PortfolioData as EditorialData } from "./editorial-developer/data";
import type { TemplateId } from "@/lib/templates/types";
import type { ColorTheme } from "@/lib/portfolio/schema";

/** Renders a published snapshot. Content comes from the server; nothing is read from the visitor's browser. */
export default function PublishedPortfolioView({ templateId, content, theme, showsBranding }: { templateId: TemplateId; content: Record<string, unknown>; theme: ColorTheme | null; showsBranding: boolean }) {
  const isEditorial = templateId === "editorial-developer";
  return <>
    <TemplateRenderer
      templateId={templateId}
      portfolio={isEditorial ? {} : (content as PortfolioData)}
      editorialData={isEditorial ? (content as unknown as EditorialData) : undefined}
      theme={theme ?? undefined}
    />
    {showsBranding && <Link href="/" className="fixed bottom-4 right-4 z-[60] rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-lg ring-1 ring-black/10 backdrop-blur transition hover:bg-white">Made with Formora</Link>}
  </>;
}
