"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Eye, FileJson, Globe, Monitor, PanelRightOpen, Plus, RotateCcw, Trash2, Undo2 } from "lucide-react";
import type { TemplateDefinition } from "@/lib/templates/types";
import { portfolioData as defaultData, type PortfolioData } from "@/components/templates/editorial-developer/data";
import { isEditorialShape } from "@/lib/portfolio/schema";
import { usePortfolioPersistence } from "./usePortfolioPersistence";
import { useUndoableState } from "./useUndoableState";
import { AssistantPanel } from "./AssistantPanel";
import { ListField, PublishDialog, SaveStatus } from "./EditorControls";

type MobilePanel = "content" | "preview" | "ai";
type Contact = PortfolioData["contact"];

const inputClass = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100";
const parseEditorial = (raw: unknown): PortfolioData | null => (isEditorialShape(raw) ? (raw as unknown as PortfolioData) : null);
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

function Field({ label, value, onChange, type = "text" }: { label: string; value?: string; onChange: (value: string) => void; type?: string }) {
  return <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">{label}<input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label>;
}
function Text({ label, value, onChange, rows = 3 }: { label: string; value?: string; onChange: (value: string) => void; rows?: number }) {
  return <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">{label}<textarea value={value ?? ""} onChange={(event) => onChange(event.target.value)} rows={rows} className={`${inputClass} resize-y leading-6`} /></label>;
}

/** Where a visitor's contact-form message is delivered. */
function ContactDelivery({ contact, onChange }: { contact: Contact; onChange: (contact: Contact) => void }) {
  const [open, setOpen] = useState(false);
  const isWhatsApp = contact.channel === "whatsapp";
  const test = () => {
    if (isWhatsApp) { const number = contact.whatsappNumber.replace(/\D/g, ""); if (number) window.open(`https://wa.me/${number}?text=${encodeURIComponent("Formora test message")}`, "_blank", "noopener,noreferrer"); }
    else if (contact.email) window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent("Formora contact test")}&body=${encodeURIComponent("Your portfolio email connection is ready.")}`;
  };
  return <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-slate-700">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center justify-between text-sm font-bold text-violet-900"><span>Contact delivery</span><span>{open ? "Hide" : "Configure"}</span></button>
    {open && <div className="mt-3 space-y-3">
      <p className="text-xs leading-5 text-slate-600">Choose where a visitor’s message goes. Email opens their mail app; WhatsApp opens a prefilled chat.</p>
      <div className="grid grid-cols-2 gap-2">{(["email", "whatsapp"] as const).map((channel) => <button key={channel} type="button" onClick={() => onChange({ ...contact, channel })} aria-pressed={contact.channel === channel} className={`rounded-lg border px-2 py-2 text-xs font-bold ${contact.channel === channel ? "border-violet-600 bg-violet-600 text-white" : "border-violet-200 bg-white"}`}>{channel === "email" ? "Email" : "WhatsApp"}</button>)}</div>
      {isWhatsApp ? <Field label="WhatsApp number" value={contact.whatsappNumber} onChange={(whatsappNumber) => onChange({ ...contact, whatsappNumber })} /> : <Field label="Delivery email" type="email" value={contact.email} onChange={(email) => onChange({ ...contact, email })} />}
      <Field label="Subject prefix" value={contact.subjectPrefix} onChange={(subjectPrefix) => onChange({ ...contact, subjectPrefix })} />
      <button type="button" onClick={test} className="w-full rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm font-bold text-violet-800">Test {isWhatsApp ? "WhatsApp" : "email"} connection</button>
    </div>}
  </div>;
}

export default function EditorialDeveloperEditor({ template }: { template: TemplateDefinition }) {
  const { state: data, update, reset, undo, canUndo } = useUndoableState<PortfolioData>(defaultData);
  const [advanced, setAdvanced] = useState(false);
  const [json, setJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("preview");
  const [publishOpen, setPublishOpen] = useState(false);
  const previewFrame = useRef<HTMLIFrameElement | null>(null);

  const apply = useCallback((content: PortfolioData) => reset(content), [reset]);
  const persistence = usePortfolioPersistence({ templateId: template.id, content: data, apply, parse: parseEditorial });

  // The preview is an isolated iframe (the template's styles must not leak into the editor); keep it in step.
  const syncPreview = useCallback(() => previewFrame.current?.contentWindow?.postMessage({ type: "editorial-template-data", data }, window.location.origin), [data]);
  useEffect(() => { syncPreview(); }, [syncPreview]);
  useEffect(() => {
    const selectEditorSection = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "editorial-preview-ready") { syncPreview(); return; }
      if (event.data?.type !== "editorial-select-section") return;
      setMobilePanel("content");
      window.setTimeout(() => document.querySelector(`[data-editor-section="${event.data.section}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    };
    window.addEventListener("message", selectEditorSection);
    return () => window.removeEventListener("message", selectEditorSection);
  }, [syncPreview]);

  const jsonValid = useMemo(() => { try { return isEditorialShape(JSON.parse(json)); } catch { return false; } }, [json]);
  const set = (change: (current: PortfolioData) => PortfolioData, checkpoint = false) => update(change, { checkpoint });
  const updateProject = (index: number, patch: Partial<PortfolioData["projects"][number]>) => set((current) => ({ ...current, projects: current.projects.map((item, i) => i === index ? { ...item, ...patch } : item) }));
  const updateExperience = (index: number, patch: Partial<PortfolioData["experience"][number]>) => set((current) => ({ ...current, experience: current.experience.map((item, i) => i === index ? { ...item, ...patch } : item) }));
  const addProject = () => set((current) => ({ ...current, projects: [...current.projects, { id: uid("project"), slug: uid("new-project"), name: "New project", tagline: "A concise description of the work.", description: "Describe the project, your contribution, and the result.", problem: "", approach: "", role: "Developer", featured: false, status: "in-progress", technologies: [], keyFeatures: [], date: new Date().getFullYear().toString() }] }), true);
  const addExperience = () => set((current) => ({ ...current, experience: [...current.experience, { id: uid("experience"), company: "Company", role: "Role", location: "Remote", startDate: "", endDate: "Present", summary: "Describe your impact.", responsibilities: [], technologies: [], achievements: [] }] }), true);
  const restoreSample = () => { if (window.confirm("Replace your content with the template’s sample content? You can undo this.")) set(() => defaultData, true); };
  const applyJson = () => {
    try { const parsed = JSON.parse(json); if (!isEditorialShape(parsed)) throw new Error(); set(() => parsed as unknown as PortfolioData, true); setJsonError(null); }
    catch { setJsonError("Required template sections are missing. Fix the JSON before applying."); }
  };
  const preview = () => { persistence.flushLocal(); window.open(`/templates/${template.id}`, "_blank", "noopener,noreferrer"); };

  const quickAction = (request: string): string | null => {
    const text = request.toLowerCase();
    if (text.includes("shorten") && text.includes("title")) { set((current) => ({ ...current, personal: { ...current.personal, title: current.personal.title.split(/[|/&]/)[0].trim() } }), true); return "I shortened the professional title."; }
    if (text.includes("add") && text.includes("project")) { addProject(); return "A new project card is ready in the Content panel."; }
    if (text.includes("add") && (text.includes("experience") || text.includes("role"))) { addExperience(); return "A new role is ready in the Content panel."; }
    return null;
  };
  const importCv = async (file: File) => {
    const extraction = await import("@/utils/FileExtraction");
    const raw = await extraction.extractFileContent(file);
    const parsed = extraction.extractOCRJSON(typeof raw === "string" ? raw : JSON.stringify(raw));
    const tools = typeof parsed.skills === "string" ? parsed.skills.split(/[,\n•]/).map((item: string) => item.trim()).filter(Boolean).slice(0, 20) : [];
    set((current) => ({ ...current, personal: { ...current.personal, name: parsed.name || current.personal.name, email: parsed.email || current.personal.email }, social: { ...current.social, github: parsed.github || current.social.github, linkedin: parsed.linkedin || current.social.linkedin }, skills: tools.length ? { ...current.skills, tools: tools.map((name: string) => ({ name })) } : current.skills }), true);
    return "Imported the contact details and skills I could identify. Review them in the Content panel — you can undo this from the toolbar.";
  };

  const panel = (name: MobilePanel) => (mobilePanel === name ? "flex" : "hidden");

  return <div className="flex h-dvh flex-col overflow-hidden bg-slate-100 text-slate-900">
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3"><Link href="/templatechooser" className="rounded-lg p-2 hover:bg-slate-100" aria-label="Back to templates"><ArrowLeft size={20} /></Link><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-violet-700">Portfolio studio</p><p className="truncate text-sm font-semibold">{template.name}</p></div></div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <SaveStatus save={persistence.save} signedIn={persistence.signedIn} />
        <button onClick={undo} disabled={!canUndo} className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40" aria-label="Undo" title="Undo"><Undo2 size={16} /></button>
        <button onClick={restoreSample} className="hidden items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold sm:inline-flex" title="Restore sample content"><RotateCcw size={16} /> Sample</button>
        <button onClick={preview} className="hidden items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold sm:inline-flex"><Monitor size={16} /> Preview</button>
        <button onClick={() => setPublishOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-3 py-2 text-sm font-bold text-white"><Globe size={16} /> {persistence.publishInfo.publishedAt ? "Live" : "Publish"}{persistence.publishInfo.hasUnpublishedChanges && <span className="size-2 rounded-full bg-amber-300" aria-label="Unpublished changes" />}</button>
      </div>
    </header>
    {persistence.save.kind === "error" && <p className="shrink-0 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800" role="alert">{persistence.save.message}</p>}
    <nav className="grid shrink-0 grid-cols-3 border-b border-slate-200 bg-white text-sm font-bold xl:hidden" aria-label="Editor panels">
      {(["content", "preview", "ai"] as const).map((name) => <button key={name} onClick={() => setMobilePanel(name)} aria-pressed={mobilePanel === name} className={`py-2.5 ${mobilePanel === name ? "border-b-2 border-violet-600 text-violet-700" : "text-slate-500"}`}>{name === "ai" ? "AI" : name[0].toUpperCase() + name.slice(1)}</button>)}
    </nav>

    <div className={`grid min-h-0 flex-1 grid-cols-1 ${aiOpen ? "xl:grid-cols-[390px_minmax(0,1fr)_330px]" : "xl:grid-cols-[390px_minmax(0,1fr)]"}`}>
      <aside className={`${panel("content")} min-h-0 flex-col overflow-y-auto border-r border-slate-200 bg-white p-5 xl:flex`}>
        <div className="rounded-2xl bg-slate-950 p-4 text-white"><p className="font-bold">Content without broken design.</p><p className="mt-1 text-xs leading-5 text-slate-300">Layout, colours, navigation, and animation are protected. Changes save automatically.</p></div>
        <section data-editor-section="identity" className="mt-6 space-y-3"><h2 className="text-sm font-black uppercase tracking-wider">Identity</h2>
          <Field label="Name" value={data.personal.name} onChange={(name) => set((current) => ({ ...current, personal: { ...current.personal, name } }))} />
          <Field label="Professional title" value={data.personal.title} onChange={(title) => set((current) => ({ ...current, personal: { ...current.personal, title } }))} />
          <Field label="Specialisation" value={data.personal.subtitle} onChange={(subtitle) => set((current) => ({ ...current, personal: { ...current.personal, subtitle } }))} />
          <Field label="Location" value={data.personal.location} onChange={(location) => set((current) => ({ ...current, personal: { ...current.personal, location } }))} />
          <Field label="Email" type="email" value={data.personal.email} onChange={(email) => set((current) => ({ ...current, personal: { ...current.personal, email } }))} />
          <ContactDelivery contact={data.contact} onChange={(contact) => set((current) => ({ ...current, contact }))} />
          <Text label="Hero statement" value={data.personal.positioning} onChange={(positioning) => set((current) => ({ ...current, personal: { ...current.personal, positioning } }))} />
        </section>
        <section data-editor-section="about" className="mt-7 space-y-3 border-t pt-6"><h2 className="text-sm font-black uppercase tracking-wider">About & links</h2>
          <Text label="Introduction" rows={5} value={data.about.introduction} onChange={(introduction) => set((current) => ({ ...current, about: { ...current.about, introduction } }))} />
          <Text label="Philosophy" rows={5} value={data.about.philosophy} onChange={(philosophy) => set((current) => ({ ...current, about: { ...current.about, philosophy } }))} />
          <ListField label="Currently exploring" value={data.about.currentlyExploring} onChange={(currentlyExploring) => set((current) => ({ ...current, about: { ...current.about, currentlyExploring } }))} />
          <Field label="GitHub URL" type="url" value={data.social.github} onChange={(github) => set((current) => ({ ...current, social: { ...current.social, github } }))} />
          <Field label="LinkedIn URL" type="url" value={data.social.linkedin} onChange={(linkedin) => set((current) => ({ ...current, social: { ...current.social, linkedin } }))} />
        </section>
        <section data-editor-section="projects" className="mt-7 border-t pt-6"><div className="mb-3 flex justify-between"><h2 className="text-sm font-black uppercase tracking-wider">Projects</h2><button onClick={addProject} className="inline-flex items-center gap-1 text-xs font-bold text-violet-700"><Plus size={14} /> Add</button></div>
          <div className="space-y-4">{data.projects.map((project, index) => <div key={project.id} className="rounded-xl border p-3">
            <div className="mb-3 flex justify-between"><b className="text-xs text-slate-500">PROJECT {index + 1}</b><button onClick={() => set((current) => ({ ...current, projects: current.projects.filter((_, i) => i !== index) }), true)} aria-label={`Remove project ${index + 1}`} className="text-slate-400 hover:text-red-600"><Trash2 size={15} /></button></div>
            <div className="space-y-3">
              <Field label="Name" value={project.name} onChange={(name) => updateProject(index, { name })} />
              <Field label="Role" value={project.role} onChange={(role) => updateProject(index, { role })} />
              <Text label="Tagline" value={project.tagline} onChange={(tagline) => updateProject(index, { tagline })} />
              <Text label="Description" value={project.description} onChange={(description) => updateProject(index, { description })} />
              <ListField label="Technologies" value={project.technologies} onChange={(technologies) => updateProject(index, { technologies })} />
              <Field label="Live URL" type="url" value={project.liveUrl} onChange={(liveUrl) => updateProject(index, { liveUrl })} />
              <Field label="Source code URL" type="url" value={project.github} onChange={(github) => updateProject(index, { github })} />
            </div>
          </div>)}</div>
        </section>
        <section data-editor-section="experience" className="mt-7 border-t pt-6"><div className="mb-3 flex justify-between"><h2 className="text-sm font-black uppercase tracking-wider">Experience</h2><button onClick={addExperience} className="inline-flex items-center gap-1 text-xs font-bold text-violet-700"><Plus size={14} /> Add</button></div>
          <div className="space-y-4">{data.experience.map((item, index) => <div key={item.id} className="rounded-xl border p-3">
            <div className="mb-3 flex justify-between"><b className="text-xs text-slate-500">ROLE {index + 1}</b><button onClick={() => set((current) => ({ ...current, experience: current.experience.filter((_, i) => i !== index) }), true)} aria-label={`Remove role ${index + 1}`} className="text-slate-400 hover:text-red-600"><Trash2 size={15} /></button></div>
            <div className="space-y-3">
              <Field label="Role" value={item.role} onChange={(role) => updateExperience(index, { role })} />
              <Field label="Company" value={item.company} onChange={(company) => updateExperience(index, { company })} />
              <div className="grid grid-cols-2 gap-3"><Field label="Start" value={item.startDate} onChange={(startDate) => updateExperience(index, { startDate })} /><Field label="End" value={item.endDate} onChange={(endDate) => updateExperience(index, { endDate })} /></div>
              <Text label="Summary" value={item.summary} onChange={(summary) => updateExperience(index, { summary })} />
              <ListField label="Technologies" value={item.technologies} onChange={(technologies) => updateExperience(index, { technologies })} />
            </div>
          </div>)}</div>
        </section>
        <section data-editor-section="skills" className="mt-7 space-y-3 border-t pt-6"><h2 className="text-sm font-black uppercase tracking-wider">Skills</h2>
          {Object.entries(data.skills).map(([category, skills]) => <ListField key={category} label={category} value={skills.map((skill) => skill.name)} onChange={(names) => set((current) => ({ ...current, skills: { ...current.skills, [category]: names.map((name) => ({ name })) } }))} />)}
        </section>
        <section className="mt-7 border-t pt-6">
          <button onClick={() => { setAdvanced((open) => !open); setJson(JSON.stringify(data, null, 2)); setJsonError(null); }} aria-expanded={advanced} className="flex w-full justify-between text-sm font-black uppercase tracking-wider"><span className="flex items-center gap-2"><FileJson size={16} /> Advanced content</span><span>{advanced ? "Hide" : "Show"}</span></button>
          {advanced && <div className="mt-3"><p className="text-xs text-slate-500">For education, certifications, services, testimonials, detailed case studies, and any remaining content.</p><textarea value={json} onChange={(event) => setJson(event.target.value)} spellCheck={false} className="mt-3 h-72 w-full rounded-xl bg-slate-950 p-3 font-mono text-xs text-emerald-200" />{jsonError && <p className="mt-2 text-xs text-red-600">{jsonError}</p>}<button disabled={!jsonValid} onClick={applyJson} className="mt-3 rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white disabled:opacity-40">Apply advanced content</button></div>}
        </section>
      </aside>

      <main className={`${panel("preview")} min-h-0 min-w-0 flex-col bg-slate-200 p-3 sm:p-6 xl:flex`}>
        <div className="mb-3 flex justify-between text-xs font-semibold text-slate-600"><span className="flex items-center gap-1"><Monitor size={15} /> Live preview — click a section to edit it</span><div className="flex gap-3">{!aiOpen && <button onClick={() => setAiOpen(true)} className="hidden items-center gap-1 text-violet-700 xl:inline-flex"><PanelRightOpen size={15} /> AI</button>}<button onClick={preview} className="inline-flex items-center gap-1 text-violet-700">Full screen <Eye size={14} /></button></div></div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border bg-white shadow-2xl">{persistence.loaded && <iframe ref={previewFrame} src={`/templates/${template.id}`} title={`${template.name} live preview`} className="size-full border-0" />}</div>
      </main>

      <aside className={`${panel("ai")} ${aiOpen ? "xl:flex" : "xl:hidden"} min-h-0 flex-col border-l border-slate-200 bg-white`}>
        <AssistantPanel templateId={template.id} content={data} signedIn={persistence.signedIn} onContent={(content) => set(() => content, true)} quickAction={quickAction} onImportCv={importCv} onClose={() => setAiOpen(false)} intro="I can rewrite your hero statement, about section, projects, and experience, or fill details from your CV." />
      </aside>
    </div>

    {publishOpen && <PublishDialog open onClose={() => setPublishOpen(false)} signedIn={persistence.signedIn} templateId={template.id} info={persistence.publishInfo} suggestedSlug={data.personal.name} publish={persistence.publish} unpublish={persistence.unpublish} />}
  </div>;
}
