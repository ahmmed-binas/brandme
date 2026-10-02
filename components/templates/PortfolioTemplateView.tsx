"use client";

import { useEffect, useRef, useState } from "react";
import TemplateRenderer from "./TemplateRenderer";
import type { PortfolioData } from "./template-one/TemplateOne";
import type { TemplateId } from "@/lib/templates/types";
import { readPreviewDraft } from "@/lib/portfolio/browser-storage";
import { getTemplate } from "@/lib/templates/catalog";
import { personaFor } from "@/lib/templates/personas";
import { isColorTheme, isEditorialShape, standardContentSchema } from "@/lib/portfolio/schema";
import { portfolioData as editorialDefaultData, type PortfolioData as EditorialData } from "./editorial-developer/data";

const EMPTY_PORTFOLIO: PortfolioData = {
  name: "Your Name",
  professional_title: "Your Professional Title",
  tagline: "Generate your portfolio from the Detail Extractor to see your information here.",
  summary: [],
  skills: [],
  projects: [],
  experience: [],
};

const DEMO_PORTFOLIO: PortfolioData = {
  name: "Maya Chen",
  professional_title: "Product Designer & Front-end Developer",
  tagline: "I turn complex ideas into calm, useful digital products.",
  summary: [
    "I'm a product-minded designer and developer with six years of experience creating thoughtful web experiences for ambitious teams.",
    "I enjoy working from the first sketch through a polished, accessible interface—balancing user needs, business goals, and the small details that make a product feel memorable.",
  ],
  github: "https://github.com",
  linkedin: "https://www.linkedin.com",
  email: "maya@example.com",
  skills: ["Figma", "React", "TypeScript", "Design systems", "User research"],
  projects: [
    {
      title: "Northstar Finance",
      description: "A clear, approachable dashboard that helps growing teams understand their cash flow and make confident decisions.",
      technologies: ["Next.js", "TypeScript", "Figma"],
      github: "https://github.com",
      live_url: "https://example.com",
    },
    {
      title: "Field Notes",
      description: "A collaborative workspace for research teams to collect insights, organize evidence, and share the story behind their work.",
      technologies: ["React", "Tailwind CSS", "Supabase"],
      live_url: "https://example.com",
    },
  ],
  experience: [
    {
      job_title: "Senior Product Designer",
      company: "Lumen Labs",
      location: "San Francisco, CA",
      start_date: "2022",
      end_date: "Present",
      description: "Leading end-to-end product design for a B2B analytics platform, from discovery interviews to a scalable design system used by three product teams.",
      technologies: ["Figma", "Design systems", "User research"],
    },
    {
      job_title: "Front-end Developer",
      company: "Cedar Studio",
      location: "Remote",
      start_date: "2020",
      end_date: "2022",
      description: "Built responsive marketing sites and product interfaces for early-stage companies, partnering closely with founders and brand designers.",
      technologies: ["React", "TypeScript", "Accessibility"],
    },
  ],
};

export default function PortfolioTemplateView({ templateId }: { templateId: TemplateId }) {
  const [portfolio, setPortfolio] = useState<PortfolioData>(EMPTY_PORTFOLIO);
  const [theme, setTheme] = useState<"midnight" | "classic" | "dark" | "light">("midnight");
  const [editorialData, setEditorialData] = useState<EditorialData>(editorialDefaultData);
  /** Content sent by the editor is newer than anything in storage. */
  const receivedFromEditor = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const definition = getTemplate(templateId);
      const params = new URLSearchParams(window.location.search);
      // Studio templates preview with their sample person until the visitor has a draft of their own.
      if (definition?.collection === "studio" && (params.has("sample") || !readPreviewDraft(templateId))) {
        setPortfolio(personaFor(definition.persona));
        return;
      }
      if (params.get("demo") === "true") {
        setPortfolio(DEMO_PORTFOLIO);
        return;
      }
      try {
        const saved = readPreviewDraft(templateId);
        const requestedTheme = new URLSearchParams(window.location.search).get("theme") ?? saved?.theme;
        if (isColorTheme(requestedTheme)) setTheme(requestedTheme);
        if (templateId === "editorial-developer") {
          if (isEditorialShape(saved?.content) && !receivedFromEditor.current) setEditorialData(saved.content as unknown as EditorialData);
          return;
        }
        const parsed = standardContentSchema.safeParse(saved?.content);
        if (parsed.success) setPortfolio({ ...EMPTY_PORTFOLIO, ...parsed.data });
        // A public template should look finished before a customer adds their own content.
        else if (templateId === "kinetic-portfolio") setPortfolio(DEMO_PORTFOLIO);
      } catch {
        // Invalid browser data should never stop a template from rendering.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [templateId]);

  useEffect(() => {
    if (templateId !== "editorial-developer") return;
    const receiveEditorMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const message = event.data as { type?: string; data?: unknown } | null;
      if (message?.type === "editorial-template-data" && isEditorialShape(message.data)) {
        receivedFromEditor.current = true;
        setEditorialData(message.data as EditorialData);
      }
    };
    window.addEventListener("message", receiveEditorMessage);
    // Inside the editor's preview frame: ask for the current draft now that we can receive it.
    if (window.parent !== window) window.parent.postMessage({ type: "editorial-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", receiveEditorMessage);
  }, [templateId]);

  return (
    <>
      <TemplateRenderer templateId={templateId} portfolio={portfolio} theme={theme} editorialData={editorialData} />
    </>
  );
}
