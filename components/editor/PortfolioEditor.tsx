"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, ExternalLink, FileUp, ImagePlus, Monitor, Palette, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Plus, Save, Send, Settings2, Sparkles, Trash2 } from "lucide-react";
import type { PortfolioData, PortfolioProject } from "@/components/templates/template-one/TemplateOne";
import TemplateRenderer from "@/components/templates/TemplateRenderer";
import type { TemplateDefinition } from "@/lib/templates/types";

type Theme = "midnight" | "classic" | "dark" | "light";

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
const themes: Array<{ id: Theme; name: string; swatch: string }> = [
  { id: "midnight", name: "Midnight", swatch: "bg-[#0a192f]" }, { id: "classic", name: "Classic", swatch: "bg-[#172554]" },
  { id: "dark", name: "Ink", swatch: "bg-black" }, { id: "light", name: "Paper", swatch: "bg-slate-100" },
];

function limitWords(value: string, maxWords: number) {
  return value.trimStart().split(/\s+/).slice(0, maxWords).join(" ");
}

function wordCount(value?: string) {
  return value?.trim() ? value.trim().split(/\s+/).length : 0;
}

function withSampleFallback(saved: Partial<PortfolioData>): PortfolioData {
  const text = <K extends keyof PortfolioData>(key: K) => typeof saved[key] === "string" && saved[key]?.trim() ? saved[key] : starter[key];
  return {
    ...starter,
    name: text("name"), professional_title: text("professional_title"), tagline: text("tagline"), email: text("email"), github: text("github"), linkedin: text("linkedin"), instagram: text("instagram"),
    summary: saved.summary?.filter((item) => item.trim()).length ? saved.summary : starter.summary,
    skills: saved.skills?.filter((item) => item.trim()).length ? saved.skills : starter.skills,
    projects: saved.projects?.length ? saved.projects : starter.projects,
    experience: saved.experience?.length ? saved.experience : starter.experience,
  };
}

function Field({ label, value, onChange, maxWords = 20 }: { label: string; value?: string; onChange: (value: string) => void; maxWords?: number }) {
  const fieldId = label.toLowerCase().replace(/\s*\(.*/, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return <label className="block"><span className="mb-1.5 flex justify-between gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><span>{label}</span><span className="font-medium normal-case tracking-normal text-slate-400">{wordCount(value)}/{maxWords} words</span></span><input data-editor-field={fieldId} value={value ?? ""} onChange={(event) => onChange(limitWords(event.target.value, maxWords))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>;
}

export default function PortfolioEditor({ template }: { template: TemplateDefinition }) {
  const [data, setData] = useState<PortfolioData>(starter);
  const [theme, setTheme] = useState<Theme>("midnight");
  const [readyToPersist, setReadyToPersist] = useState(false);
  const [contentOpen, setContentOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; text: string }>>([{ role: "assistant", text: "I can apply quick content changes locally. Upload a CV to populate the portfolio, or ask me to shorten a headline, add a project, or improve your bio." }]);
  const imageInputs = useRef<Array<HTMLInputElement | null>>([]);
  const cvInput = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = sessionStorage.getItem("portfolioData");
        const savedTheme = sessionStorage.getItem("portfolioTheme") as Theme | null;
        if (saved) setData(withSampleFallback(JSON.parse(saved) as PortfolioData));
        if (savedTheme && themes.some((item) => item.id === savedTheme)) setTheme(savedTheme);
      } catch { /* A fresh portfolio is a safe fallback. */ }
    }, 0);
    const readyTimer = window.setTimeout(() => setReadyToPersist(true), 1);
    return () => { window.clearTimeout(timer); window.clearTimeout(readyTimer); };
  }, []);
  const update = (patch: Partial<PortfolioData>) => setData((current) => ({ ...current, ...patch }));
  const focusEditorField = (field: "name" | "professional-title" | "about-you" | "projects" | "experience" | "skills" | "email") => {
    const panel = document.getElementById("portfolio-content-panel");
    panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      const exact = document.querySelector<HTMLElement>(`[data-editor-field="${field}"]`);
      const labelMatch = [...document.querySelectorAll("label")].find((label) => label.textContent?.toLowerCase().includes(field.replace("-", " ")));
      (exact ?? labelMatch?.querySelector<HTMLElement>("input, textarea") ?? document.querySelector<HTMLElement>("textarea"))?.focus();
    }, 250);
  };
  const updateProject = (index: number, patch: Partial<PortfolioProject>) => update({ projects: (data.projects ?? []).map((project, itemIndex) => itemIndex === index ? { ...project, ...patch } : project) });
  const updateExperience = (index: number, patch: Partial<NonNullable<PortfolioData["experience"]>[number]>) => update({ experience: (data.experience ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  const save = () => {
    const serialized = JSON.stringify(data);
    sessionStorage.setItem("portfolioData", serialized);
    sessionStorage.setItem("portfolioTheme", theme);
    localStorage.setItem("portfolioData", serialized);
    localStorage.setItem("portfolioTheme", theme);
  };
  useEffect(() => {
    if (!readyToPersist) return;
    const serialized = JSON.stringify(data);
    sessionStorage.setItem("portfolioData", serialized);
    sessionStorage.setItem("portfolioTheme", theme);
    localStorage.setItem("portfolioData", serialized);
    localStorage.setItem("portfolioTheme", theme);
  }, [data, theme, readyToPersist]);
  const preview = () => { save(); window.open(`/templates/${template.id}?theme=${theme}`, "_blank", "noopener,noreferrer"); };
  const replaceImage = (index: number, file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => updateProject(index, { image: String(reader.result) }); reader.readAsDataURL(file); };
  const sendPrompt = () => {
    const request = prompt.trim();
    if (!request) return;
    setMessages((current) => [...current, { role: "user", text: request }]);
    setPrompt("");
    const lower = request.toLowerCase();
    if (lower.includes("shorten") && (lower.includes("headline") || lower.includes("title"))) {
      update({ professional_title: data.professional_title?.split(" & ")[0] || data.professional_title });
      setMessages((current) => [...current, { role: "assistant", text: "Done — I shortened the professional title in the live portfolio." }]);
    } else if (lower.includes("add") && lower.includes("project")) {
      update({ projects: [...(data.projects ?? []), { title: "New featured project", description: "Add the problem, your contribution, and the result.", technologies: [] }] });
      setMessages((current) => [...current, { role: "assistant", text: "Added a new project card. Fill in its details from the Content panel." }]);
    } else if (lower.includes("add") && (lower.includes("experience") || lower.includes("role"))) {
      update({ experience: [...(data.experience ?? []), { job_title: "New role", company: "Company", location: "Remote", start_date: "", end_date: "Present", description: "Describe your impact in this role.", technologies: [] }] });
      setMessages((current) => [...current, { role: "assistant", text: "Added an experience entry for you to complete." }]);
    } else if (lower.includes("add") && lower.includes("skill")) {
      update({ skills: [...(data.skills ?? []), "New skill"] });
      setMessages((current) => [...current, { role: "assistant", text: "Added a new skill. Rename it in the Content panel." }]);
    } else if (lower.includes("bio") || lower.includes("about")) {
      update({ summary: [`${data.summary?.[0] ?? ""} I create thoughtful digital work with a focus on clarity, craft, and measurable outcomes.`.trim()] });
      setMessages((current) => [...current, { role: "assistant", text: "I strengthened the About copy in your live preview." }]);
    } else {
      setMessages((current) => [...current, { role: "assistant", text: "This local assistant can currently apply headline, bio, and project changes. Configure an AI provider below for broader conversational edits." }]);
    }
  };
  const importCv = async (file?: File) => {
    if (!file) return;
    setMessages((current) => [...current, { role: "assistant", text: `Reading ${file.name}…` }]);
    try {
      const extraction = await import("@/utils/FileExtraction");
      const raw = await extraction.extractFileContent(file);
      const parsed = extraction.extractOCRJSON(typeof raw === "string" ? raw : JSON.stringify(raw));
      update({ name: parsed.name || data.name, email: parsed.email || data.email, github: parsed.github || data.github, linkedin: parsed.linkedin || data.linkedin, skills: typeof parsed.skills === "string" ? parsed.skills.split(/[,\n•]/).map((item) => item.trim()).filter(Boolean).slice(0, 12) : data.skills, summary: [typeof raw === "string" ? raw.replace(/\s+/g, " ").slice(0, 420) : data.summary?.[0] ?? ""] });
      setMessages((current) => [...current, { role: "assistant", text: "CV imported. I filled the details I could reliably identify; review the Content panel before publishing." }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "I couldn’t read that file. Try a PDF, DOCX, image, or plain-text CV under 25 MB." }]);
    }
  };
  const editorGrid = contentOpen ? (aiOpen ? "xl:grid-cols-[370px_minmax(0,1fr)_340px]" : "xl:grid-cols-[370px_minmax(0,1fr)]") : (aiOpen ? "xl:grid-cols-[minmax(0,1fr)_340px]" : "xl:grid-cols-[minmax(0,1fr)]");

  return <div className="h-screen overflow-hidden bg-slate-100 text-slate-900">
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6"><div className="flex min-w-0 items-center gap-3"><Link href="/templatechooser" className="rounded-lg p-2 hover:bg-slate-100" aria-label="Back to templates"><ArrowLeft size={20} /></Link><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Portfolio Studio</p><p className="truncate text-sm font-semibold">{template.name}</p></div></div><div className="flex items-center gap-2"><button onClick={save} className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50 sm:inline-flex"><Save size={16} /> Save</button><button onClick={preview} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 sm:px-4"><Monitor size={16} /> <span className="hidden sm:inline">Open portfolio</span></button></div></header>
    <div className={`grid h-[calc(100vh-64px)] ${editorGrid}`}>
      <aside id="portfolio-content-panel" className={`${contentOpen ? "order-2 overflow-y-auto border-t border-slate-200 bg-white p-5 xl:order-1 xl:border-r xl:border-t-0" : "hidden"}`}>
        <div className="mb-3 flex justify-end"><button onClick={() => setContentOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close content panel"><PanelLeftClose size={18} /></button></div>
        <div className="rounded-2xl bg-slate-950 p-4 text-white"><p className="text-sm font-bold">Your content, the original design.</p><p className="mt-1 text-xs leading-5 text-slate-300">The template layout, sections, navigation and footer are protected. Update only the portfolio content below.</p></div>
        <section className="mt-7 space-y-3"><h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Identity</h2><Field label="Name" maxWords={6} value={data.name} onChange={(name) => update({ name })} /><Field label="Professional title" maxWords={12} value={data.professional_title} onChange={(professional_title) => update({ professional_title })} /><label className="block"><span className="mb-1.5 flex justify-between gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><span>Short introduction</span><span className="font-medium normal-case tracking-normal text-slate-400">{wordCount(data.tagline)}/24 words</span></span><textarea value={data.tagline ?? ""} onChange={(event) => update({ tagline: limitWords(event.target.value, 24) })} rows={3} className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label></section>
        <section className="mt-7 space-y-4 border-t border-slate-100 pt-6"><div className="flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-wider text-slate-900">About & skills</h2><button onClick={() => update({ summary: [...(data.summary ?? []), "Add another short paragraph about your work, process, or results."] })} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"><Plus size={14} /> Add bio paragraph</button></div>{(data.summary ?? []).map((paragraph, index) => <label key={index} className="block rounded-xl border border-slate-100 p-3"><span className="mb-1.5 flex justify-between gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><span>About you {index + 1}</span>{(data.summary?.length ?? 0) > 1 && <button type="button" onClick={() => update({ summary: data.summary?.filter((_, itemIndex) => itemIndex !== index) })} className="normal-case tracking-normal text-red-500">Remove</button>}</span><textarea data-editor-field="about-you" value={paragraph} onChange={(event) => update({ summary: (data.summary ?? []).map((item, itemIndex) => itemIndex === index ? limitWords(event.target.value, 100) : item) })} rows={4} className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>)}<Field label="Skills (comma separated)" maxWords={30} value={(data.skills ?? []).join(", ")} onChange={(value) => update({ skills: value.split(",").map((skill) => skill.trim().slice(0, 28)).filter(Boolean).slice(0, 12) })} /><button onClick={() => update({ skills: [...(data.skills ?? []), "New skill"] })} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"><Plus size={14} /> Add skill</button></section>
        <section className="mt-7 space-y-3 border-t border-slate-100 pt-6"><h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Social & contact</h2><Field label="Email" value={data.email} onChange={(email) => update({ email })} /><Field label="GitHub URL" value={data.github} onChange={(github) => update({ github })} /><Field label="LinkedIn URL" value={data.linkedin} onChange={(linkedin) => update({ linkedin })} /><Field label="Instagram URL" value={data.instagram} onChange={(instagram) => update({ instagram })} /></section>
        <section className="mt-7 border-t border-slate-100 pt-6"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Projects</h2><button onClick={() => update({ projects: [...(data.projects ?? []), { title: "New project", description: "Describe what you made and why it matters.", technologies: [] }] })} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"><Plus size={14} /> Add</button></div><div className="space-y-5">{(data.projects ?? []).map((project, index) => <div key={index} className="rounded-xl border border-slate-200 p-3"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-slate-500">PROJECT {index + 1}</p><button onClick={() => update({ projects: data.projects?.filter((_, itemIndex) => itemIndex !== index) })} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove project"><Trash2 size={15} /></button></div><div className="space-y-3"><Field label="Project name" value={project.title} onChange={(title) => updateProject(index, { title })} /><label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Description</span><textarea value={project.description ?? ""} onChange={(event) => updateProject(index, { description: event.target.value })} rows={3} className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" /></label><Field label="Tools (comma separated)" value={(project.technologies ?? []).join(", ")} onChange={(value) => updateProject(index, { technologies: value.split(",").map((item) => item.trim()).filter(Boolean) })} /><button onClick={() => imageInputs.current[index]?.click()} className="inline-flex items-center gap-2 text-xs font-bold text-blue-700"><ImagePlus size={15} /> {project.image ? "Replace image" : "Add image"}</button><input ref={(element) => { imageInputs.current[index] = element; }} onChange={(event) => replaceImage(index, event.target.files?.[0])} type="file" accept="image/*" className="hidden" /></div></div>)}</div></section>
        <section className="mt-7 border-t border-slate-100 pt-6"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Experience</h2><button onClick={() => update({ experience: [...(data.experience ?? []), { job_title: "New role", company: "Company", location: "Remote", start_date: "", end_date: "Present", description: "Describe your impact in this role.", technologies: [] }] })} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"><Plus size={14} /> Add</button></div><div className="space-y-5">{(data.experience ?? []).map((item, index) => <div key={index} className="rounded-xl border border-slate-200 p-3"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-slate-500">ROLE {index + 1}</p><button onClick={() => update({ experience: data.experience?.filter((_, itemIndex) => itemIndex !== index) })} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove experience"><Trash2 size={15} /></button></div><div className="space-y-3"><Field label="Job title" value={item.job_title} onChange={(job_title) => updateExperience(index, { job_title })} /><Field label="Company" value={item.company} onChange={(company) => updateExperience(index, { company })} /><Field label="Location" value={item.location} onChange={(location) => updateExperience(index, { location })} /><div className="grid grid-cols-2 gap-3"><Field label="Start" value={item.start_date} onChange={(start_date) => updateExperience(index, { start_date })} /><Field label="End" value={item.end_date} onChange={(end_date) => updateExperience(index, { end_date })} /></div><label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">What you did</span><textarea value={item.description ?? ""} onChange={(event) => updateExperience(index, { description: event.target.value })} rows={3} className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" /></label><Field label="Tools (comma separated)" value={(item.technologies ?? []).join(", ")} onChange={(value) => updateExperience(index, { technologies: value.split(",").map((tool) => tool.trim()).filter(Boolean) })} /></div></div>)}</div></section>
        <section className="mt-7 border-t border-slate-100 pt-6"><div className="mb-3 flex items-center gap-2"><Palette size={16} className="text-blue-700" /><h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Color theme</h2></div><div className="grid grid-cols-2 gap-2">{themes.map((item) => <button key={item.id} onClick={() => setTheme(item.id)} className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-sm font-semibold transition ${theme === item.id ? "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`}><span className={`h-5 w-5 rounded-full ring-1 ring-black/10 ${item.swatch}`} />{item.name}</button>)}</div></section>
      </aside>
      <main className="order-1 min-w-0 overflow-hidden bg-slate-200 p-3 sm:p-6 xl:order-2"><div className="mb-3 flex items-center justify-between px-1 text-xs font-semibold text-slate-600"><div className="flex items-center gap-1">{!contentOpen && <button onClick={() => setContentOpen(true)} className="rounded p-1.5 hover:bg-slate-300" aria-label="Open content panel"><PanelLeftOpen size={16} /></button>}<span>Live template preview — click highlighted content to edit it</span></div><div className="flex items-center gap-1">{!aiOpen && <button onClick={() => setAiOpen(true)} className="rounded p-1.5 hover:bg-slate-300" aria-label="Open AI panel"><PanelRightOpen size={16} /></button>}<button onClick={preview} className="inline-flex items-center gap-1 text-blue-700 hover:underline">Open full screen <ExternalLink size={13} /></button></div></div><div className="h-[calc(100vh-116px)] overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-300 bg-[#0a192f] shadow-2xl sm:h-[calc(100vh-140px)]"><TemplateRenderer templateId={template.id} portfolio={data} theme={theme} embedded onEdit={focusEditorField} /></div></main>
      <aside className={`${aiOpen ? "order-3 flex min-h-0 flex-col border-t border-slate-200 bg-white xl:border-l xl:border-t-0" : "hidden"}`}><div className="flex items-center justify-between border-b border-slate-200 p-4"><div className="flex items-center gap-2"><span className="rounded-lg bg-violet-100 p-2 text-violet-700"><Bot size={18} /></span><div><p className="text-sm font-black">Portfolio AI</p><p className="text-xs text-slate-500">Content & import workspace</p></div></div><button onClick={() => setAiOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close AI panel"><PanelRightClose size={18} /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-4"><button onClick={() => cvInput.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50 px-3 py-3 text-sm font-bold text-violet-800 hover:bg-violet-100"><FileUp size={16} /> Upload CV and fill portfolio</button><input ref={cvInput} onChange={(event) => importCv(event.target.files?.[0])} type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg" className="hidden" /><button onClick={() => setShowConfig((open) => !open)} className="mt-3 flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><span className="flex items-center gap-2"><Settings2 size={16} /> AI connection</span><span className="text-xs text-slate-400">Configure</span></button>{showConfig && <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">Connect your own AI provider through a secure server-side API route or OAuth flow. This editor intentionally does not store API keys in the browser. The local assistant and CV import work without a connection.</div>}<div className="mt-5 space-y-3">{messages.map((message, index) => <div key={index} className={`rounded-2xl px-3 py-2.5 text-sm leading-6 ${message.role === "user" ? "ml-6 bg-violet-600 text-white" : "mr-3 bg-slate-100 text-slate-700"}`}>{message.text}</div>)}</div></div><form onSubmit={(event) => { event.preventDefault(); sendPrompt(); }} className="border-t border-slate-200 p-3"><div className="flex items-center rounded-xl border border-slate-200 p-1 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-100"><input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask for a content change…" className="min-w-0 flex-1 px-2 py-2 text-sm outline-none" /><button className="rounded-lg bg-violet-600 p-2 text-white hover:bg-violet-700" aria-label="Send"><Send size={16} /></button></div><p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400"><Sparkles size={11} /> Local quick actions are enabled</p></form></aside>
    </div>
  </div>;
}
