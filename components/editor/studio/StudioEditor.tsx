"use client";

import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Globe, Laptop, Monitor, Redo2, Smartphone, Sparkles, Tablet, Undo2 } from "lucide-react";
import TemplateRenderer from "@/components/templates/TemplateRenderer";
import type { TemplateDefinition } from "@/lib/templates/types";
import { SECTION_KEYS, standardContentSchema, type DesignSettings, type SectionKey, type StandardContent } from "@/lib/portfolio/schema";
import { prepareImage } from "@/lib/images";
import { mergeIntoStandard } from "@/lib/import/profile";
import { usePortfolioPersistence } from "../usePortfolioPersistence";
import { useUndoableState } from "../useUndoableState";
import { AssistantPanel } from "../AssistantPanel";
import { ConflictBanner, PublishDialog, SaveStatus } from "../EditorControls";
import { Field, ImageField, ListEditor, Section, TagsField, TextArea, type ListSpec } from "./fields";
import { TrialBanner } from "./TrialBanner";
import { SuggestionsPanel } from "./SuggestionsPanel";
import { BlogPanel } from "./BlogPanel";

type Content = StandardContent;
type Item<K extends keyof Content> = NonNullable<Content[K]> extends Array<infer T> ? T : never;
type Tab = "content" | "design" | "blog" | "ai";
type Device = "desktop" | "tablet" | "phone";

const DEVICE_WIDTH: Record<Device, string> = { desktop: "100%", tablet: "820px", phone: "390px" };
const SECTION_TITLES: Record<SectionKey, string> = { about: "About", projects: "Projects", experience: "Experience", skills: "Skills", education: "Education", services: "Services", testimonials: "Testimonials", highlights: "Highlights", gallery: "Gallery", stats: "Numbers", contact: "Contact & links" };

function parse(raw: unknown): Content | null {
  const parsed = standardContentSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

interface RoleOption { id: string; label: string; suggested: boolean }

export default function StudioEditor({ template, sample: initialSample, role: initialRole, roles }: { template: TemplateDefinition; sample: Content; role: string; roles: RoleOption[] }) {
  const [sample, setSample] = useState(initialSample);
  const [role, setRole] = useState(initialRole);
  const [switching, setSwitching] = useState(false);
  const { state: data, update, reset, undo, redo, canUndo, canRedo } = useUndoableState<Content>(initialSample);
  const preview = useDeferredValue(data);
  const [tab, setTab] = useState<Tab>("content");
  const [device, setDevice] = useState<Device>("desktop");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [openSection, setOpenSection] = useState<string>("identity");
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const panel = useRef<HTMLDivElement | null>(null);

  const apply = useCallback((content: Content) => reset(content), [reset]);
  const persistence = usePortfolioPersistence({ templateId: template.id, content: data, theme: null, apply, parse });
  const isSample = data.name === sample.name;

  /** Swap the sample for one written for another job title, keeping the design choices. */
  const switchRole = async (next: string) => {
    setSwitching(true);
    try {
      const response = await fetch(`/api/samples?template=${encodeURIComponent(template.id)}${next ? `&role=${encodeURIComponent(next)}` : ""}`);
      const body = await response.json() as { content?: Content };
      if (!response.ok || !body.content) return;
      setSample(body.content);
      setRole(next);
      reset({ ...body.content, design: data.design });
      const url = new URL(window.location.href);
      if (next) url.searchParams.set("role", next); else url.searchParams.delete("role");
      window.history.replaceState(null, "", url);
    } finally {
      setSwitching(false);
    }
  };

  const set = (patch: Partial<Content>, checkpoint = false) => update((current) => ({ ...current, ...patch }), { checkpoint });
  const setDesign = (patch: Partial<DesignSettings>) => update((current) => ({ ...current, design: { ...current.design, ...patch } }), { checkpoint: true });
  const setList = <K extends keyof Content>(key: K) => (items: Content[K], checkpoint?: boolean) => update((current) => ({ ...current, [key]: items }), { checkpoint });
  const upload = (file: File) => prepareImage(file, persistence.signedIn);
  const hidden = new Set(data.design?.hidden ?? []);
  const toggleHidden = (section: SectionKey) => (value: boolean) => setDesign({ hidden: value ? [...hidden, section] : [...hidden].filter((item) => item !== section) });
  const sectionLabel = (section: SectionKey) => data.design?.labels?.[section];
  const setLabel = (section: SectionKey) => (value: string) => update((current) => ({ ...current, design: { ...current.design, labels: { ...current.design?.labels, [section]: value } } }));

  // Keyboard: ⌘Z / ⌘⇧Z, outside text fields so native field undo still works.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") return;
      if ((event.target as HTMLElement).closest("input, textarea")) return;
      event.preventDefault();
      if (event.shiftKey) redo(); else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  /** Click in the preview → open the matching section and focus its field. */
  const focusPath = (path: string) => {
    const [root, index] = path.split(".");
    const section = root === "summary" ? "about" : ["name", "professional_title", "tagline", "location", "availability", "avatar", "cover"].includes(root!) ? "identity" : root === "email" || root === "phone" ? "contact" : root!;
    setTab("content"); setMobileView("edit"); setOpenSection(section);
    if (index !== undefined && root !== "summary") setOpenItem(`${root}.${index}`);
    window.setTimeout(() => {
      const target = panel.current?.querySelector<HTMLElement>(`[data-field="${path}"]`) ?? panel.current?.querySelector<HTMLElement>(`[data-section="${section}"]`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      // Prefer a text box; an image-only item focuses its upload button (the file input itself is hidden).
      const typeable = "input:not([type=file]):not([type=hidden]), textarea, select";
      (target?.matches(typeable) ? target : target?.querySelector<HTMLElement>(typeable) ?? target?.querySelector<HTMLElement>("[data-field] button, button:not([aria-label^='Move']):not([aria-label^='Delete']):not([aria-label^='Duplicate'])"))?.focus({ preventScroll: true });
    }, 80);
  };
  const onPreviewClick = (event: React.MouseEvent) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-edit]");
    if (!target) return;
    event.preventDefault();
    focusPath(target.dataset.edit!);
  };

  const sections = (template.sections ?? SECTION_KEYS.slice()) as SectionKey[];
  const sectionProps = (id: SectionKey, count?: number) => ({ id, title: SECTION_TITLES[id], open: openSection === id, onToggle: () => setOpenSection(openSection === id ? "" : id), hidden: hidden.has(id), onHidden: toggleHidden(id), label: sectionLabel(id), onLabel: setLabel(id), count });

  const lists: { [K in "projects" | "experience" | "education" | "services" | "testimonials" | "highlights" | "gallery" | "stats" | "links"]: ListSpec<Item<K>> } = {
    projects: { noun: "project", max: 30, blank: () => ({ title: "", description: "" }), title: (item) => item.title ?? "", render: (item, change, path) => <>
      <Field label="Title" value={item.title} onChange={(title) => change({ title })} path={`${path}.title`} />
      <div className="grid grid-cols-2 gap-3"><Field label="Client or context" value={item.client} onChange={(client) => change({ client })} /><Field label="Year" value={item.year} onChange={(year) => change({ year })} /></div>
      <div className="grid grid-cols-2 gap-3"><Field label="Your role" value={item.role} onChange={(role) => change({ role })} /><Field label="Category" value={item.category} onChange={(category) => change({ category })} /></div>
      <TextArea label="Description" value={item.description} onChange={(description) => change({ description })} rows={4} placeholder="What it was, what you did, and what happened." />
      <ImageField label="Image" value={item.image} onChange={(image) => change({ image })} upload={upload} />
      <TagsField label="Tools or materials" value={item.technologies} onChange={(technologies) => change({ technologies })} />
      <div className="grid grid-cols-2 gap-3"><Field label="Live link" type="url" value={item.live_url} onChange={(live_url) => change({ live_url })} placeholder="https://" /><Field label="Source link" type="url" value={item.github} onChange={(github) => change({ github })} placeholder="https://" /></div>
    </> },
    experience: { noun: "role", max: 30, blank: () => ({ job_title: "", company: "", end_date: "Present" }), title: (item) => [item.job_title, item.company].filter(Boolean).join(" · "), render: (item, change) => <>
      <div className="grid grid-cols-2 gap-3"><Field label="Title" value={item.job_title} onChange={(job_title) => change({ job_title })} /><Field label="Organisation" value={item.company} onChange={(company) => change({ company })} /></div>
      <div className="grid grid-cols-3 gap-3"><Field label="Start" value={item.start_date} onChange={(start_date) => change({ start_date })} placeholder="2021" /><Field label="End" value={item.end_date} onChange={(end_date) => change({ end_date })} placeholder="Present" /><Field label="Location" value={item.location} onChange={(location) => change({ location })} /></div>
      <TextArea label="What you did" value={item.description} onChange={(description) => change({ description })} rows={3} />
      <TagsField label="Tools" value={item.technologies} onChange={(technologies) => change({ technologies })} />
    </> },
    education: { noun: "entry", max: 12, blank: () => ({ school: "" }), title: (item) => [item.degree, item.school].filter(Boolean).join(" · "), render: (item, change) => <>
      <Field label="School" value={item.school} onChange={(school) => change({ school })} /><Field label="Qualification" value={item.degree} onChange={(degree) => change({ degree })} />
      <div className="grid grid-cols-2 gap-3"><Field label="Start" value={item.start_date} onChange={(start_date) => change({ start_date })} /><Field label="End" value={item.end_date} onChange={(end_date) => change({ end_date })} /></div>
      <TextArea label="Notes" value={item.description} onChange={(description) => change({ description })} rows={2} />
    </> },
    services: { noun: "service", max: 12, blank: () => ({ title: "" }), title: (item) => item.title ?? "", render: (item, change) => <>
      <div className="grid grid-cols-[1fr_8rem] gap-3"><Field label="Service" value={item.title} onChange={(title) => change({ title })} /><Field label="Price" value={item.price} onChange={(price) => change({ price })} placeholder="From $500" /></div>
      <TextArea label="Description" value={item.description} onChange={(description) => change({ description })} rows={3} />
    </> },
    testimonials: { noun: "testimonial", max: 12, blank: () => ({ quote: "" }), title: (item) => item.name || (item.quote ?? "").slice(0, 40), render: (item, change) => <>
      <TextArea label="Quote" value={item.quote} onChange={(quote) => change({ quote })} rows={3} />
      <div className="grid grid-cols-2 gap-3"><Field label="Name" value={item.name} onChange={(name) => change({ name })} /><Field label="Role" value={item.role} onChange={(role) => change({ role })} /></div>
    </> },
    highlights: { noun: "highlight", max: 40, blank: () => ({ title: "" }), title: (item) => item.title ?? "", render: (item, change) => <>
      <Field label="Title" value={item.title} onChange={(title) => change({ title })} />
      <div className="grid grid-cols-[1fr_6rem] gap-3"><Field label="Detail (where, who, what)" value={item.detail} onChange={(detail) => change({ detail })} /><Field label="Year or date" value={item.year} onChange={(year) => change({ year })} /></div>
      <Field label="Link" type="url" value={item.url} onChange={(url) => change({ url })} placeholder="https://" />
    </> },
    gallery: { noun: "image", max: 36, blank: () => ({ caption: "" }), title: (item, index) => item.caption || `Image ${index + 1}`, render: (item, change) => <>
      <ImageField label="Image" value={item.image} onChange={(image) => change({ image })} upload={upload} />
      <div className="grid grid-cols-[1fr_6rem] gap-3"><Field label="Caption" value={item.caption} onChange={(caption) => change({ caption })} placeholder="Title, medium, size" /><Field label="Year" value={item.year} onChange={(year) => change({ year })} /></div>
    </> },
    stats: { noun: "number", max: 6, blank: () => ({ value: "", label: "" }), title: (item) => [item.value, item.label].filter(Boolean).join(" "), render: (item, change) => <div className="grid grid-cols-[7rem_1fr] gap-3"><Field label="Value" value={item.value} onChange={(value) => change({ value })} placeholder="40+" /><Field label="Label" value={item.label} onChange={(label) => change({ label })} placeholder="projects shipped" /></div> },
    links: { noun: "link", max: 12, blank: () => ({ label: "", url: "" }), title: (item) => item.label ?? "", render: (item, change) => <div className="grid grid-cols-[8rem_1fr] gap-3"><Field label="Label" value={item.label} onChange={(label) => change({ label })} placeholder="Dribbble" /><Field label="URL" type="url" value={item.url} onChange={(url) => change({ url })} placeholder="https://" /></div> },
  };
  const list = <K extends keyof typeof lists>(key: K) => <ListEditor items={(data[key] ?? []) as Item<K>[]} onChange={setList(key) as (items: Item<K>[], checkpoint?: boolean) => void} spec={lists[key]} path={key} openItem={openItem} setOpenItem={setOpenItem} />;

  const renderSection = (section: SectionKey) => {
    switch (section) {
      case "about": return <Section key={section} {...sectionProps("about")}>{(data.summary ?? []).map((paragraph, index) => <div key={index} className="relative"><TextArea label={`Paragraph ${index + 1}`} value={paragraph} path={`summary.${index}`} rows={4} onChange={(value) => set({ summary: (data.summary ?? []).map((item, i) => (i === index ? value : item)) })} />
        {(data.summary ?? []).length > 1 && <button type="button" onClick={() => set({ summary: data.summary?.filter((_, i) => i !== index) }, true)} className="absolute right-0 top-0 text-[11px] text-ink-faint hover:text-[color:var(--destructive)]">Remove</button>}</div>)}
        {(data.summary ?? []).length < 10 && <button type="button" onClick={() => set({ summary: [...(data.summary ?? []), ""] }, true)} className="text-[13px] font-medium text-ink underline decoration-rule underline-offset-4">Add a paragraph</button>}</Section>;
      case "skills": return <Section key={section} {...sectionProps("skills", data.skills?.length)}><TagsField label="Skills, tools or specialisms" value={data.skills} onChange={(skills) => set({ skills })} path="skills" /></Section>;
      case "contact": return <Section key={section} {...sectionProps("contact")}>
        <div className="grid grid-cols-2 gap-3"><Field label="Email" type="email" value={data.email} onChange={(email) => set({ email })} path="email" /><Field label="Phone" type="tel" value={data.phone} onChange={(phone) => set({ phone })} path="phone" placeholder="+44 7700 900123" /></div>
        <Field label="Website" type="url" value={data.website} onChange={(website) => set({ website })} placeholder="https://" />
        <div className="grid grid-cols-3 gap-3"><Field label="GitHub" type="url" value={data.github} onChange={(github) => set({ github })} /><Field label="LinkedIn" type="url" value={data.linkedin} onChange={(linkedin) => set({ linkedin })} /><Field label="Instagram" type="url" value={data.instagram} onChange={(instagram) => set({ instagram })} /></div>
        <p className="text-[12px] font-medium text-ink-soft">Other links</p>{list("links")}
      </Section>;
      default: return <Section key={section} {...sectionProps(section, (data[section as "projects"] ?? []).length)}>{list(section as keyof typeof lists)}</Section>;
    }
  };

  const palettes = template.palettes ?? [];
  const fonts = template.fonts ?? [];
  const accent = data.design?.accent ?? "";

  return <div className="flex h-dvh flex-col overflow-hidden bg-[#ebe6dc] text-ink">
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-rule bg-paper px-3 @container sm:px-4">
      <Link href="/templatechooser" className="rounded-lg p-2 text-ink-soft hover:bg-ink/5 hover:text-ink" aria-label="Back to templates"><ArrowLeft size={18} /></Link>
      <div className="min-w-0"><p className="truncate font-display text-[1.05rem] leading-none">{template.name}</p><p className="mt-0.5 hidden truncate text-[11px] text-ink-faint sm:block">{data.name || "Untitled portfolio"}</p></div>
      <div className="ml-3 hidden items-center rounded-full border border-rule p-0.5 lg:flex">{(["desktop", "tablet", "phone"] as Device[]).map((value) => { const Icon = { desktop: Monitor, tablet: Tablet, phone: Smartphone }[value]; return <button key={value} type="button" onClick={() => setDevice(value)} aria-pressed={device === value} aria-label={`Preview on ${value}`} className={`rounded-full p-1.5 transition ${device === value ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}><Icon size={14} /></button>; })}</div>
      <div className="ml-auto flex items-center gap-1.5">
        <SaveStatus save={persistence.save} signedIn={persistence.signedIn} />
        <button type="button" onClick={undo} disabled={!canUndo} className="rounded-lg p-2 text-ink-soft hover:bg-ink/5 disabled:opacity-30" aria-label="Undo" title="Undo (⌘Z)"><Undo2 size={16} /></button>
        <button type="button" onClick={redo} disabled={!canRedo} className="hidden rounded-lg p-2 text-ink-soft hover:bg-ink/5 disabled:opacity-30 sm:block" aria-label="Redo" title="Redo (⌘⇧Z)"><Redo2 size={16} /></button>
        <button type="button" onClick={() => { persistence.flushLocal(); window.open(`/templates/${template.id}`, "_blank", "noopener,noreferrer"); }} className="hidden items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 text-[13px] hover:border-ink sm:inline-flex"><Laptop size={14} /> Preview</button>
        <button type="button" onClick={() => setPublishOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-[13px] font-medium text-paper hover:bg-signal"><Globe size={14} /> {persistence.publishInfo.publishedAt ? "Live" : "Publish"}{persistence.publishInfo.hasUnpublishedChanges && <span className="size-1.5 rounded-full bg-amber-300" aria-label="Unpublished changes" />}</button>
      </div>
    </header>
    <TrialBanner signedIn={persistence.signedIn} />
    {persistence.save.kind === "error" && <p className="shrink-0 bg-amber-50 px-4 py-2 text-[12px] text-amber-900" role="alert">{persistence.save.message}</p>}
    {persistence.save.kind === "conflict" && <ConflictBanner onLoadOther={persistence.loadOtherVersion} onKeepMine={() => void persistence.keepThisVersion()} />}

    <nav className="grid shrink-0 grid-cols-2 border-b border-rule bg-paper text-[13px] lg:hidden" aria-label="Editor view">{(["edit", "preview"] as const).map((view) => <button key={view} type="button" onClick={() => setMobileView(view)} aria-pressed={mobileView === view} className={`py-2.5 ${mobileView === view ? "border-b-2 border-ink font-semibold" : "text-ink-soft"}`}>{view === "edit" ? "Edit" : "Preview"}</button>)}</nav>

    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)]">
      <aside className={`${mobileView === "edit" ? "flex" : "hidden"} min-h-0 flex-col border-r border-rule bg-paper lg:flex`}>
        <div role="tablist" aria-label="Editor panels" className="grid shrink-0 grid-cols-4 border-b border-rule text-[13px]">{(["content", "design", "blog", "ai"] as Tab[]).map((value) => <button key={value} role="tab" type="button" aria-selected={tab === value} onClick={() => setTab(value)} className={`flex items-center justify-center gap-1.5 py-3 ${tab === value ? "border-b-2 border-ink font-semibold text-ink" : "text-ink-soft hover:text-ink"}`}>{value === "ai" && <Sparkles size={13} />}{value === "ai" ? "AI" : value[0]!.toUpperCase() + value.slice(1)}</button>)}</div>
        <div ref={panel} className="min-h-0 flex-1 overflow-y-auto">
          {tab === "content" && <>
            {isSample && <div className="m-4 rounded-xl border border-dashed border-ink/30 bg-white/60 p-4 text-[13px] leading-relaxed">
              <p><b className="font-semibold">This is sample content</b> so you can see the design. Import your details in the <button type="button" onClick={() => setTab("ai")} className="underline">AI tab</button>, or start from blank.</p>
              <label className="mt-3 block"><span className="text-[12px] font-medium text-ink-soft">Show sample content for</span>
                <select value={role} disabled={switching} onChange={(event) => void switchRole(event.target.value)} aria-label="Job title for the sample content" className="mt-1 w-full rounded-lg border border-rule bg-white px-2.5 py-2 text-[13px] outline-none focus:border-ink disabled:opacity-60">
                  <option value="">This design’s own sample</option>
                  <optgroup label="Suits this design">{roles.filter((item) => item.suggested).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</optgroup>
                  <optgroup label="Every job title">{roles.filter((item) => !item.suggested).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</optgroup>
                </select></label>
              <button type="button" onClick={() => reset({ name: "", professional_title: "", tagline: "", summary: [""], design: data.design })} className="mt-3 rounded-full border border-ink/30 px-3 py-1 text-[12px] font-medium hover:border-ink">Start from blank</button>
            </div>}
            <Section id="identity" title="Name & introduction" open={openSection === "identity"} onToggle={() => setOpenSection(openSection === "identity" ? "" : "identity")}>
              <Field label="Name" value={data.name} onChange={(name) => set({ name })} path="name" />
              <Field label="What you do" value={data.professional_title} onChange={(professional_title) => set({ professional_title })} path="professional_title" placeholder="Landscape photographer" />
              <TextArea label="One-line introduction" value={data.tagline} onChange={(tagline) => set({ tagline })} path="tagline" rows={2} />
              <div className="grid grid-cols-2 gap-3"><Field label="Location" value={data.location} onChange={(location) => set({ location })} path="location" /><Field label="Availability" value={data.availability} onChange={(availability) => set({ availability })} path="availability" placeholder="Open to new work" /></div>
              <div className="grid grid-cols-2 gap-3"><ImageField label="Portrait" value={data.avatar} onChange={(avatar) => set({ avatar }, true)} upload={upload} path="avatar" /><ImageField label="Cover image" value={data.cover} onChange={(cover) => set({ cover }, true)} upload={upload} path="cover" /></div>
            </Section>
            {sections.map(renderSection)}
            <p className="px-5 py-6 text-[12px] leading-relaxed text-ink-faint">Changes save as you type. Sections without content stay hidden on your site.</p>
          </>}

          {tab === "design" && <div className="space-y-8 p-5">
            {palettes.length > 0 && <div><h3 className="text-[13px] font-semibold">Colours</h3><div className="mt-3 grid grid-cols-1 gap-2">{palettes.map((palette, index) => { const active = (data.design?.palette ?? palettes[0]!.id) === palette.id; return <button key={palette.id} type="button" onClick={() => setDesign({ palette: palette.id })} aria-pressed={active} className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition ${active ? "border-ink bg-white" : "border-rule hover:border-ink/40"}`}>
              <span className="flex overflow-hidden rounded-md border border-black/10">{[palette.bg, palette.surface, palette.fg, palette.accent].map((colour, k) => <span key={k} className="h-8 w-6" style={{ background: colour }} />)}</span>
              <span className="flex-1 text-[13px]">{palette.name}{index === 0 && <span className="ml-1.5 text-ink-faint">default</span>}</span>{active && <Check size={15} />}
            </button>; })}</div></div>}
            {fonts.length > 0 && <div><h3 className="text-[13px] font-semibold">Type</h3><div className="mt-3 space-y-2">{fonts.map((font) => { const active = (data.design?.font ?? fonts[0]!.id) === font.id; return <button key={font.id} type="button" onClick={() => setDesign({ font: font.id })} aria-pressed={active} className={`block w-full rounded-xl border p-3 text-left transition ${active ? "border-ink bg-white" : "border-rule hover:border-ink/40"}`}>
              <span className="block truncate text-[1.5rem] leading-tight" style={{ fontFamily: font.display }}>{data.name || "Your name"}</span><span className="mt-1 block text-[12px] text-ink-soft" style={{ fontFamily: font.text }}>{font.name}</span>
            </button>; })}</div><p className="mt-2 text-[11px] text-ink-faint">Fonts load once you pick them in the preview.</p></div>}
            <div><h3 className="text-[13px] font-semibold">Accent colour</h3><div className="mt-3 flex items-center gap-3">
              <input type="color" value={accent || palettes.find((palette) => palette.id === data.design?.palette)?.accent || palettes[0]?.accent || "#2338e0"} onChange={(event) => update((current) => ({ ...current, design: { ...current.design, accent: event.target.value } }))} className="h-10 w-14 cursor-pointer rounded-lg border border-rule bg-white" aria-label="Accent colour" />
              <span className="text-[13px] text-ink-soft">{accent ? accent : "From the palette"}</span>{accent && <button type="button" onClick={() => setDesign({ accent: undefined })} className="text-[12px] underline">Reset</button>}
            </div></div>
            <div><h3 className="text-[13px] font-semibold">Sections</h3><p className="mt-1 text-[12px] text-ink-soft">Hide sections you don’t need. Empty sections are hidden automatically.</p>
              <ul className="mt-3 divide-y divide-rule rounded-xl border border-rule bg-white/60">{sections.map((section) => <li key={section} className="flex items-center justify-between px-3 py-2 text-[13px]"><span className={hidden.has(section) ? "text-ink-faint line-through" : ""}>{sectionLabel(section) || SECTION_TITLES[section]}</span>
                <button type="button" role="switch" aria-checked={!hidden.has(section)} aria-label={`Show ${SECTION_TITLES[section]}`} onClick={() => toggleHidden(section)(!hidden.has(section))} className={`relative h-5 w-9 rounded-full transition ${hidden.has(section) ? "bg-ink/15" : "bg-ink"}`}><span className={`absolute top-0.5 size-4 rounded-full bg-paper transition-all ${hidden.has(section) ? "left-0.5" : "left-[18px]"}`} /></button></li>)}</ul></div>
          </div>}

          {tab === "blog" && <BlogPanel templateId={template.id} signedIn={persistence.signedIn} liveUrl={persistence.publishInfo.publishedAt && persistence.publishInfo.slug ? `${typeof window === "undefined" ? "" : window.location.origin}/p/${persistence.publishInfo.slug}` : null} />}

          {tab === "ai" && <div className="flex min-h-full flex-col">
            <SuggestionsPanel signedIn={persistence.signedIn} templateId={template.id} content={data} onApply={(next) => update(() => next, { checkpoint: true })} />
            <div className="min-h-[34rem] flex-1"><AssistantPanel templateId={template.id} content={data} signedIn={persistence.signedIn} onContent={(content) => update(() => content as Content, { checkpoint: true })} quickAction={() => null} onImport={(profile) => update((current) => mergeIntoStandard(current, profile), { checkpoint: true })} intro="Import your details from a CV, LinkedIn or GitHub, or ask me to tighten your bio, rewrite a project, or change the tone." /></div>
          </div>}
        </div>
      </aside>

      <main className={`${mobileView === "preview" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col lg:flex`}>
        <div className="min-h-0 flex-1 overflow-auto p-0 lg:p-5">
          <div className={`mx-auto min-h-full overflow-hidden bg-white transition-[width] duration-300 lg:rounded-xl lg:shadow-[0_30px_80px_-40px_rgba(0,0,0,.45),0_0_0_1px_rgba(0,0,0,.06)] ${device === "phone" ? "lg:rounded-[2rem] lg:ring-[10px] lg:ring-ink" : ""}`} style={{ width: DEVICE_WIDTH[device], maxWidth: "100%" }} onClickCapture={onPreviewClick}>
            {persistence.loaded ? <TemplateRenderer templateId={template.id} portfolio={preview} embedded /> : <div className="grid h-[60vh] place-items-center text-[13px] text-ink-soft">Loading your portfolio…</div>}
          </div>
        </div>
      </main>
    </div>

    {publishOpen && <PublishDialog open onClose={() => setPublishOpen(false)} signedIn={persistence.signedIn} templateId={template.id} info={persistence.publishInfo} suggestedSlug={data.name ?? ""} publish={persistence.publish} unpublish={persistence.unpublish} warning={isSample ? "Your portfolio still shows the sample person. Replace it with your own details before publishing." : undefined} />}
  </div>;
}
