"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Globe, ImagePlus, Monitor, Palette, PanelLeftClose, PanelLeftOpen, PanelRightOpen, Plus, Trash2, Undo2 } from "lucide-react";
import type { PortfolioData, PortfolioExperience, PortfolioProject } from "@/components/templates/template-one/TemplateOne";
import TemplateRenderer from "@/components/templates/TemplateRenderer";
import type { TemplateDefinition } from "@/lib/templates/types";
import { COLOR_THEMES, isColorTheme, standardContentSchema, type ColorTheme } from "@/lib/portfolio/schema";
import { compressImage } from "@/lib/images";
import { mergeIntoStandard } from "@/lib/import/profile";
import { usePortfolioPersistence } from "./usePortfolioPersistence";
import { useUndoableState } from "./useUndoableState";
import { AssistantPanel } from "./AssistantPanel";
import { ConflictBanner, SwitchDesignBanner, ListField, PublishDialog, SaveStatus } from "./EditorControls";

type EditField = "name" | "professional-title" | "about-you" | "projects" | "experience" | "skills" | "email";
type MobilePanel = "content" | "preview" | "ai";

const starter: PortfolioData = {
  name: "Maya Chen", professional_title: "Product Designer & Front-end Developer", tagline: "I turn complex ideas into calm, useful digital products.",
  summary: ["I’m a product-minded designer and developer who turns early ideas into polished, accessible digital experiences. I care about the small details that make useful products feel human."],
  email: "maya@example.com", github: "https://github.com", linkedin: "https://linkedin.com", instagram: "https://instagram.com",
  skills: ["Figma", "React", "TypeScript", "Design systems"],
  projects: [
    { title: "Northstar Finance", description: "A clear, approachable dashboard that helps growing teams understand their cash flow.", technologies: ["Next.js", "Figma"] },
    { title: "Field Notes", description: "A collaborative workspace for research teams to turn evidence into insight.", technologies: ["React", "Supabase"] },
  ],
  experience: [
    { job_title: "Senior Product Designer", company: "Lumen Labs", location: "San Francisco, CA", start_date: "2022", end_date: "Present", description: "Leading end-to-end product design for a B2B analytics platform, from discovery interviews to a scalable design system used by three product teams.", technologies: ["Figma", "Design systems", "User research"] },
    { job_title: "Front-end Developer", company: "Cedar Studio", location: "Remote", start_date: "2020", end_date: "2022", description: "Built responsive marketing sites and product interfaces for early-stage companies, partnering closely with founders and brand designers.", technologies: ["React", "TypeScript", "Accessibility"] },
  ],
};
const themeOptions: Record<ColorTheme, { name: string; swatch: string }> = {
  midnight: { name: "Midnight", swatch: "bg-[#0a192f]" }, classic: { name: "Classic", swatch: "bg-[#172554]" },
  dark: { name: "Ink", swatch: "bg-black" }, light: { name: "Paper", swatch: "bg-slate-100" },
};
const newProject = (): PortfolioProject => ({ title: "New project", description: "Describe the problem, what you did, and the result.", technologies: [] });
const newRole = (): PortfolioExperience => ({ job_title: "New role", company: "Company", location: "Remote", start_date: "", end_date: "Present", description: "Describe your impact in this role.", technologies: [] });

/** Saved content is used exactly as saved: a field the user cleared stays cleared. */
function parseStandard(raw: unknown): PortfolioData | null {
  const parsed = standardContentSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

const limitWords = (value: string, maxWords: number) => value.trimStart().split(/\s+/).slice(0, maxWords).join(" ");
const wordCount = (value?: string) => value?.trim() ? value.trim().split(/\s+/).length : 0;
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function Field({ label, value, onChange, maxWords, editorField, type = "text" }: { label: string; value?: string; onChange: (value: string) => void; maxWords?: number; editorField?: EditField; type?: string }) {
  return <label className="block">
    <span className="mb-1.5 flex justify-between gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><span>{label}</span>{maxWords && <span className="font-medium normal-case tracking-normal text-slate-400">{wordCount(value)}/{maxWords} words</span>}</span>
    <input type={type} data-editor-field={editorField} value={value ?? ""} onChange={(event) => onChange(maxWords ? limitWords(event.target.value, maxWords) : event.target.value)} className={inputClass} />
  </label>;
}

function TextArea({ label, value, onChange, maxWords, editorField, rows = 3 }: { label: string; value?: string; onChange: (value: string) => void; maxWords?: number; editorField?: EditField; rows?: number }) {
  return <label className="block">
    <span className="mb-1.5 flex justify-between gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><span>{label}</span>{maxWords && <span className="font-medium normal-case tracking-normal text-slate-400">{wordCount(value)}/{maxWords} words</span>}</span>
    <textarea data-editor-field={editorField} value={value ?? ""} onChange={(event) => onChange(maxWords ? limitWords(event.target.value, maxWords) : event.target.value)} rows={rows} className={`${inputClass} resize-y`} />
  </label>;
}

function SectionHeader({ title, action, onAction, field }: { title: string; action?: string; onAction?: () => void; field?: EditField }) {
  return <div className="mb-3 flex items-center justify-between" data-editor-field={field}>
    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">{title}</h2>
    {action && <button onClick={onAction} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"><Plus size={14} /> {action}</button>}
  </div>;
}

export default function PortfolioEditor({ template }: { template: TemplateDefinition }) {
  const { state: data, update, reset, undo, canUndo } = useUndoableState<PortfolioData>(starter);
  const [theme, setTheme] = useState<ColorTheme>("midnight");
  const [contentOpen, setContentOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("preview");
  const [publishOpen, setPublishOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const imageInputs = useRef<Array<HTMLInputElement | null>>([]);

  const apply = useCallback((content: PortfolioData, savedTheme: string | null) => { reset(content); if (isColorTheme(savedTheme)) setTheme(savedTheme); }, [reset]);
  const persistence = usePortfolioPersistence({ templateId: template.id, content: data, theme, apply, parse: parseStandard });

  // Returning from domain checkout: reopen the publish dialog so the domain's progress is visible.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("domainOrder")) return;
    const timer = window.setTimeout(() => {
      setPublishOpen(true);
      params.delete("domainOrder");
      window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const set = (patch: Partial<PortfolioData>, checkpoint = false) => update((current) => ({ ...current, ...patch }), { checkpoint });
  const updateProject = (index: number, patch: Partial<PortfolioProject>) => update((current) => ({ ...current, projects: (current.projects ?? []).map((item, i) => i === index ? { ...item, ...patch } : item) }));
  const updateExperience = (index: number, patch: Partial<PortfolioExperience>) => update((current) => ({ ...current, experience: (current.experience ?? []).map((item, i) => i === index ? { ...item, ...patch } : item) }));

  const focusEditorField = (field: EditField) => {
    setContentOpen(true);
    setMobilePanel("content");
    window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(`[data-editor-field="${field}"]`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      (target?.matches("input, textarea") ? target : target?.parentElement?.querySelector<HTMLElement>("input, textarea"))?.focus({ preventScroll: true });
    }, 120);
  };

  const preview = () => { persistence.flushLocal(); window.open(`/templates/${template.id}?theme=${theme}`, "_blank", "noopener,noreferrer"); };

  const replaceImage = async (index: number, file?: File) => {
    if (!file) return;
    try { const image = await compressImage(file); update((current) => ({ ...current, projects: (current.projects ?? []).map((item, i) => i === index ? { ...item, image } : item) }), { checkpoint: true }); setNotice(null); }
    catch (error) { setNotice((error as Error).message); }
  };

  const quickAction = (request: string): string | null => {
    const lower = request.toLowerCase();
    if (lower.includes("shorten") && (lower.includes("headline") || lower.includes("title"))) {
      set({ professional_title: data.professional_title?.split(/\s*[&|/]\s*/)[0] || data.professional_title }, true);
      return "Done — I shortened the professional title.";
    }
    if (lower.includes("add") && lower.includes("project")) { set({ projects: [...(data.projects ?? []), newProject()] }, true); return "Added a new project card. Fill in its details in the Content panel."; }
    if (lower.includes("add") && (lower.includes("experience") || lower.includes("role") || lower.includes("job"))) { set({ experience: [...(data.experience ?? []), newRole()] }, true); return "Added an experience entry for you to complete."; }
    if (lower.includes("add") && lower.includes("skill")) { set({ skills: [...(data.skills ?? []), "New skill"] }, true); return "Added a new skill. Rename it in the Content panel."; }
    return null;
  };

  const panelClass = (panel: MobilePanel, open: boolean) => `${mobilePanel === panel ? "flex" : "hidden"} ${open ? "xl:flex" : "xl:hidden"} min-h-0 flex-col`;
  const columns = contentOpen ? (aiOpen ? "xl:grid-cols-[370px_minmax(0,1fr)_340px]" : "xl:grid-cols-[370px_minmax(0,1fr)]") : (aiOpen ? "xl:grid-cols-[minmax(0,1fr)_340px]" : "xl:grid-cols-[minmax(0,1fr)]");

  return <div className="flex h-dvh flex-col overflow-hidden bg-slate-100 text-slate-900">
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Link href="/templatechooser" className="rounded-lg p-2 hover:bg-slate-100" aria-label="Back to templates"><ArrowLeft size={20} /></Link>
        <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Portfolio Studio</p><p className="truncate text-sm font-semibold">{template.name}</p></div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <SaveStatus save={persistence.save} signedIn={persistence.signedIn} />
        <button onClick={undo} disabled={!canUndo} className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40" aria-label="Undo" title="Undo"><Undo2 size={16} /></button>
        <button onClick={preview} className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50 sm:inline-flex"><Monitor size={16} /> Preview</button>
        <button onClick={() => setPublishOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 sm:px-4"><Globe size={16} /> <span>{persistence.publishInfo.publishedAt ? "Live" : "Publish"}</span>{persistence.publishInfo.hasUnpublishedChanges && <span className="size-2 rounded-full bg-amber-300" aria-label="Unpublished changes" />}</button>
      </div>
    </header>
    {persistence.save.kind === "error" && <p className="shrink-0 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800" role="alert">{persistence.save.message}</p>}
    {persistence.save.kind === "conflict" && <ConflictBanner onLoadOther={persistence.loadOtherVersion} onKeepMine={() => void persistence.keepThisVersion()} />}
    {persistence.save.kind === "full" && persistence.room && <SwitchDesignBanner room={persistence.room} moveHere={persistence.moveHere} templateName={template.name} />}
    {notice && <p className="flex shrink-0 justify-between gap-3 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700" role="alert">{notice}<button onClick={() => setNotice(null)} className="underline">Dismiss</button></p>}

    <nav className="grid shrink-0 grid-cols-3 border-b border-slate-200 bg-white text-sm font-bold xl:hidden" aria-label="Editor panels">
      {(["content", "preview", "ai"] as const).map((panel) => <button key={panel} onClick={() => setMobilePanel(panel)} aria-pressed={mobilePanel === panel} className={`py-2.5 ${mobilePanel === panel ? "border-b-2 border-blue-600 text-blue-700" : "text-slate-500"}`}>{panel === "ai" ? "AI" : panel[0].toUpperCase() + panel.slice(1)}</button>)}
    </nav>

    <div className={`grid min-h-0 flex-1 grid-cols-1 ${columns}`}>
      <aside id="portfolio-content-panel" className={`${panelClass("content", contentOpen)} overflow-y-auto border-slate-200 bg-white p-5 xl:border-r`}>
        <div className="mb-3 hidden justify-end xl:flex"><button onClick={() => setContentOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close content panel"><PanelLeftClose size={18} /></button></div>
        <div className="rounded-2xl bg-slate-950 p-4 text-white"><p className="text-sm font-bold">Your content, the original design.</p><p className="mt-1 text-xs leading-5 text-slate-300">The layout, sections, navigation and footer are protected. Changes save automatically.</p></div>

        <section className="mt-7 space-y-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Identity</h2>
          <Field label="Name" maxWords={6} editorField="name" value={data.name} onChange={(name) => set({ name })} />
          <Field label="Professional title" maxWords={12} editorField="professional-title" value={data.professional_title} onChange={(professional_title) => set({ professional_title })} />
          <TextArea label="Short introduction" maxWords={24} value={data.tagline} onChange={(tagline) => set({ tagline })} />
        </section>

        <section className="mt-7 space-y-4 border-t border-slate-100 pt-6">
          <SectionHeader title="About & skills" action="Add paragraph" onAction={() => set({ summary: [...(data.summary ?? []), ""] }, true)} />
          {(data.summary ?? []).map((paragraph, index) => <div key={index} className="rounded-xl border border-slate-100 p-3">
            <TextArea label={`About you ${index + 1}`} maxWords={100} rows={4} editorField={index === 0 ? "about-you" : undefined} value={paragraph} onChange={(value) => set({ summary: (data.summary ?? []).map((item, i) => i === index ? value : item) })} />
            <button type="button" onClick={() => set({ summary: data.summary?.filter((_, i) => i !== index) }, true)} className="mt-2 text-xs font-semibold text-red-600">Remove paragraph</button>
          </div>)}
          <div data-editor-field="skills"><ListField label="Skills" max={40} value={data.skills} onChange={(skills) => set({ skills })} /></div>
        </section>

        <section className="mt-7 space-y-3 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Social & contact</h2>
          <Field label="Email" type="email" editorField="email" value={data.email} onChange={(email) => set({ email })} />
          <Field label="GitHub URL" type="url" value={data.github} onChange={(github) => set({ github })} />
          <Field label="LinkedIn URL" type="url" value={data.linkedin} onChange={(linkedin) => set({ linkedin })} />
          <Field label="Instagram URL" type="url" value={data.instagram} onChange={(instagram) => set({ instagram })} />
        </section>

        <section className="mt-7 border-t border-slate-100 pt-6">
          <SectionHeader title="Projects" field="projects" action="Add" onAction={() => set({ projects: [...(data.projects ?? []), newProject()] }, true)} />
          <div className="space-y-5">{(data.projects ?? []).map((project, index) => <div key={index} className="rounded-xl border border-slate-200 p-3">
            <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-slate-500">PROJECT {index + 1}</p><button onClick={() => set({ projects: data.projects?.filter((_, i) => i !== index) }, true)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove project ${index + 1}`}><Trash2 size={15} /></button></div>
            <div className="space-y-3">
              <Field label="Project name" value={project.title} onChange={(title) => updateProject(index, { title })} />
              <TextArea label="Description" value={project.description} onChange={(description) => updateProject(index, { description })} />
              <ListField label="Tools" value={project.technologies} onChange={(technologies) => updateProject(index, { technologies })} />
              <Field label="Live URL" type="url" value={project.live_url} onChange={(live_url) => updateProject(index, { live_url })} />
              <Field label="Source code URL" type="url" value={project.github} onChange={(github) => updateProject(index, { github })} />
              <div className="flex items-center gap-4">
                <button onClick={() => imageInputs.current[index]?.click()} className="inline-flex items-center gap-2 text-xs font-bold text-blue-700"><ImagePlus size={15} /> {project.image ? "Replace image" : "Add image"}</button>
                {project.image && <button onClick={() => updateProject(index, { image: "" })} className="text-xs font-semibold text-red-600">Remove image</button>}
              </div>
              <input ref={(element) => { imageInputs.current[index] = element; }} onChange={(event) => { void replaceImage(index, event.target.files?.[0]); event.target.value = ""; }} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" />
            </div>
          </div>)}</div>
        </section>

        <section className="mt-7 border-t border-slate-100 pt-6">
          <SectionHeader title="Experience" field="experience" action="Add" onAction={() => set({ experience: [...(data.experience ?? []), newRole()] }, true)} />
          <div className="space-y-5">{(data.experience ?? []).map((item, index) => <div key={index} className="rounded-xl border border-slate-200 p-3">
            <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-slate-500">ROLE {index + 1}</p><button onClick={() => set({ experience: data.experience?.filter((_, i) => i !== index) }, true)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove role ${index + 1}`}><Trash2 size={15} /></button></div>
            <div className="space-y-3">
              <Field label="Job title" value={item.job_title} onChange={(job_title) => updateExperience(index, { job_title })} />
              <Field label="Company" value={item.company} onChange={(company) => updateExperience(index, { company })} />
              <Field label="Location" value={item.location} onChange={(location) => updateExperience(index, { location })} />
              <div className="grid grid-cols-2 gap-3"><Field label="Start" value={item.start_date} onChange={(start_date) => updateExperience(index, { start_date })} /><Field label="End" value={item.end_date} onChange={(end_date) => updateExperience(index, { end_date })} /></div>
              <TextArea label="What you did" value={item.description} onChange={(description) => updateExperience(index, { description })} />
              <ListField label="Tools" value={item.technologies} onChange={(technologies) => updateExperience(index, { technologies })} />
            </div>
          </div>)}</div>
        </section>

        {template.colorThemes && <section className="mt-7 border-t border-slate-100 pt-6">
          <div className="mb-3 flex items-center gap-2"><Palette size={16} className="text-blue-700" /><h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Color theme</h2></div>
          <div className="grid grid-cols-2 gap-2">{COLOR_THEMES.map((id) => <button key={id} onClick={() => setTheme(id)} aria-pressed={theme === id} className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-sm font-semibold transition ${theme === id ? "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`}><span className={`h-5 w-5 rounded-full ring-1 ring-black/10 ${themeOptions[id].swatch}`} />{themeOptions[id].name}</button>)}</div>
        </section>}
      </aside>

      <main className={`${mobilePanel === "preview" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col bg-slate-200 p-3 sm:p-6 xl:flex`}>
        <div className="mb-3 flex items-center justify-between px-1 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1">{!contentOpen && <button onClick={() => setContentOpen(true)} className="hidden rounded p-1.5 hover:bg-slate-300 xl:block" aria-label="Open content panel"><PanelLeftOpen size={16} /></button>}<span>Live preview — click highlighted content to edit it</span></div>
          <div className="flex items-center gap-1">{!aiOpen && <button onClick={() => setAiOpen(true)} className="hidden rounded p-1.5 hover:bg-slate-300 xl:block" aria-label="Open AI panel"><PanelRightOpen size={16} /></button>}<button onClick={preview} className="inline-flex items-center gap-1 text-blue-700 hover:underline">Full screen <ExternalLink size={13} /></button></div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-300 bg-[#0a192f] shadow-2xl">
          {persistence.loaded ? <TemplateRenderer templateId={template.id} portfolio={data} theme={theme} embedded onEdit={focusEditorField} /> : <div className="grid h-full place-items-center text-sm text-slate-300">Loading your portfolio…</div>}
        </div>
      </main>

      <aside className={`${panelClass("ai", aiOpen)} border-slate-200 bg-white xl:border-l`}>
        <AssistantPanel templateId={template.id} content={data} signedIn={persistence.signedIn} onContent={(content) => update(() => content, { checkpoint: true })} quickAction={quickAction} onImport={(profile) => update((current) => mergeIntoStandard(current, profile), { checkpoint: true })} onClose={() => setAiOpen(false)} intro="Import your details above, or ask me to rewrite your bio, tighten project descriptions, or adjust the tone." />
      </aside>
    </div>

    {publishOpen && <PublishDialog open onClose={() => setPublishOpen(false)} signedIn={persistence.signedIn} templateId={template.id} info={persistence.publishInfo} suggestedSlug={data.name ?? ""} publish={persistence.publish} unpublish={persistence.unpublish} />}
  </div>;
}
