"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TemplateRenderer from "./TemplateRenderer";
import type { PortfolioData } from "./template-one/TemplateOne";
import type { TemplateId } from "@/lib/templates/types";
import EditorialDeveloperTemplate from "./editorial-developer/EditorialDeveloperTemplate";
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (new URLSearchParams(window.location.search).get("demo") === "true") {
        setPortfolio(DEMO_PORTFOLIO);
        return;
      }
      try {
        const editorialSaved = localStorage.getItem(`template:${templateId}:data`) ?? sessionStorage.getItem(`template:${templateId}:data`);
        if (templateId === "editorial-developer" && editorialSaved) setEditorialData(JSON.parse(editorialSaved) as EditorialData);
        const saved = localStorage.getItem("portfolioData") ?? sessionStorage.getItem("portfolioData");
        const requestedTheme = new URLSearchParams(window.location.search).get("theme");
        const savedTheme = localStorage.getItem("portfolioTheme") ?? sessionStorage.getItem("portfolioTheme");
        const activeTheme = requestedTheme || savedTheme;
        if (activeTheme === "classic" || activeTheme === "dark" || activeTheme === "light" || activeTheme === "midnight") setTheme(activeTheme);
        if (!saved) return;
        const parsed: unknown = JSON.parse(saved);
        if (parsed && typeof parsed === "object") setPortfolio({ ...EMPTY_PORTFOLIO, ...(parsed as PortfolioData) });
      } catch {
        // Invalid browser data should never stop a template from rendering.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (templateId !== "editorial-developer") return;
    const receiveEditorMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const message = event.data as { type?: string; data?: unknown } | null;
      if (message?.type === "editorial-template-data" && message.data && typeof message.data === "object") {
        setEditorialData(message.data as EditorialData);
      }
    };
    window.addEventListener("message", receiveEditorMessage);
    return () => window.removeEventListener("message", receiveEditorMessage);
  }, [templateId]);

  return (
    <>
      <Link
        href="/templatechooser"
        className="fixed left-5 top-5 z-[1000] rounded-full border border-white/20 bg-slate-950/85 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        ← Browse templates
      </Link>
      {templateId === "editorial-developer" ? <EditorialDeveloperTemplate data={editorialData} /> : <TemplateRenderer templateId={templateId} portfolio={portfolio} theme={theme} />}
    </>
  );
}
