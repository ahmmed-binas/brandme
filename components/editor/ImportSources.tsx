"use client";

import { useRef, useState } from "react";
import { ChevronDown, ClipboardPaste, FileUp, Loader2 } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import type { ImportedProfile } from "@/lib/import/profile";

type Source = "github" | "linkedin" | "paste" | null;

/**
 * Ways to fill a portfolio from existing information. Each source produces an
 * ImportedProfile; the editor decides how it maps onto its template.
 */
export function ImportSources({ aiReady, signInHref, busy, setBusy, onImport, onMessage }: {
  /** Server AI is configured and the user is signed in. */
  aiReady: boolean;
  signInHref: string;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  onImport: (profile: ImportedProfile, source: string) => void;
  onMessage: (text: string) => void;
}) {
  const [open, setOpen] = useState<Source>(null);
  const [username, setUsername] = useState("");
  const [pasted, setPasted] = useState("");
  const cvInput = useRef<HTMLInputElement | null>(null);
  const linkedinInput = useRef<HTMLInputElement | null>(null);

  const run = async (label: string, task: () => Promise<ImportedProfile | null>) => {
    setBusy(true);
    try { const profile = await task(); if (profile) onImport(profile, label); }
    catch (error) { onMessage((error as Error).message || `The ${label} import didn’t work. Please try again.`); }
    finally { setBusy(false); }
  };

  const structureWithAi = async (text: string) => {
    const response = await fetch("/api/ai/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "The AI import didn’t work.");
    return body.profile as ImportedProfile;
  };

  const importGitHub = () => run("GitHub", async () => {
    const response = await fetch(`/api/import/github?username=${encodeURIComponent(username)}`);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "GitHub import didn’t work.");
    setOpen(null);
    return body.profile as ImportedProfile;
  });

  const importLinkedIn = (file?: File) => file && run("LinkedIn", async () => {
    onMessage(`Reading ${file.name} on your device…`);
    const { readLinkedInExport } = await import("@/lib/import/linkedin-export");
    const profile = await readLinkedInExport(file);
    setOpen(null);
    return profile;
  });

  const importCv = (file?: File) => file && run("CV", async () => {
    onMessage(`Reading ${file.name}…`);
    const extraction = await import("@/utils/FileExtraction");
    const raw = await extraction.extractFileContent(file);
    const text = typeof raw === "string" ? raw : JSON.stringify(raw);
    if (aiReady) { onMessage("Organising your CV with AI…"); return structureWithAi(text.slice(0, 40_000)); }
    const parsed = extraction.extractOCRJSON(text);
    return {
      name: parsed.name ?? undefined, email: parsed.email ?? undefined, github: parsed.github ?? undefined, linkedin: parsed.linkedin ?? undefined,
      skills: typeof parsed.skills === "string" ? parsed.skills.split(/[,\n•]/).map((item: string) => item.trim()).filter(Boolean).slice(0, 20) : undefined,
    };
  });

  const importPasted = () => run("pasted text", async () => { const profile = await structureWithAi(pasted); setPasted(""); setOpen(null); return profile; });

  const option = (source: Exclude<Source, null>, icon: React.ReactNode, title: string, hint: string) => <button type="button" disabled={busy} onClick={() => setOpen(open === source ? null : source)} aria-expanded={open === source} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left hover:border-violet-300 hover:bg-violet-50 disabled:opacity-60">
    <span className="text-violet-700">{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{title}</span><span className="block text-xs text-slate-500">{hint}</span></span><ChevronDown size={15} className={`text-slate-400 transition ${open === source ? "rotate-180" : ""}`} />
  </button>;

  return <section aria-label="Import your details" className="space-y-2">
    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Import your details</p>

    <button type="button" disabled={busy} onClick={() => cvInput.current?.click()} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-violet-300 bg-violet-50 px-3 py-2.5 text-left hover:bg-violet-100 disabled:opacity-60">
      <FileUp size={18} className="text-violet-700" /><span><span className="block text-sm font-bold text-violet-900">Upload your CV</span><span className="block text-xs text-violet-800/80">{aiReady ? "PDF, Word, image or text. AI fills every section." : "PDF, Word, image or text"}</span></span>
    </button>
    <input ref={cvInput} onChange={(event) => { void importCv(event.target.files?.[0]); event.target.value = ""; }} type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg" className="hidden" />

    {option("github", <FaGithub size={18} />, "GitHub", "Projects, languages and bio from your public profile")}
    {open === "github" && <form onSubmit={(event) => { event.preventDefault(); void importGitHub(); }} className="flex gap-2 rounded-xl bg-slate-50 p-2">
      <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="username or profile link" aria-label="GitHub username" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-violet-500" />
      <button disabled={busy || !username.trim()} className="rounded-lg bg-slate-900 px-3 text-sm font-bold text-white disabled:opacity-50">{busy ? <Loader2 size={15} className="animate-spin" /> : "Import"}</button>
    </form>}

    {option("linkedin", <FaLinkedin size={18} />, "LinkedIn", "Experience, skills and headline from your data export")}
    {open === "linkedin" && <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
      <p>LinkedIn doesn’t let apps read your work history directly, but it lets you download it:</p>
      <ol className="list-decimal space-y-0.5 pl-4">
        <li>Open <a href="https://www.linkedin.com/mypreferences/d/download-my-data" target="_blank" rel="noreferrer" className="font-bold text-violet-700 underline">LinkedIn → Get a copy of your data</a>.</li>
        <li>Choose <b>Want something in particular?</b> and tick <b>Profile</b>, <b>Positions</b> and <b>Skills</b>.</li>
        <li>LinkedIn emails you a ZIP within about 10 minutes. Upload it here; it’s read on your device.</li>
      </ol>
      <button type="button" disabled={busy} onClick={() => linkedinInput.current?.click()} className="w-full rounded-lg bg-[#0a66c2] px-3 py-2 text-sm font-bold text-white disabled:opacity-60">Upload LinkedIn ZIP</button>
      <input ref={linkedinInput} onChange={(event) => { void importLinkedIn(event.target.files?.[0]); event.target.value = ""; }} type="file" accept=".zip,.csv" className="hidden" />
      <p>In a hurry? Open your profile, choose <b>More → Save to PDF</b>, and upload that PDF as your CV.</p>
    </div>}

    {option("paste", <ClipboardPaste size={18} />, "Paste anything", "A bio, your LinkedIn About, notes. Claude organises it")}
    {open === "paste" && <div className="space-y-2 rounded-xl bg-slate-50 p-2">
      {aiReady ? <>
        <textarea value={pasted} onChange={(event) => setPasted(event.target.value)} rows={6} maxLength={40_000} placeholder="Paste your LinkedIn About and experience, an old bio, or a few notes about your work…" className="w-full resize-y rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none focus:border-violet-500" />
        <button type="button" disabled={busy || pasted.trim().length < 40} onClick={() => void importPasted()} className="w-full rounded-lg bg-violet-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? "Organising…" : "Fill my portfolio"}</button>
      </> : <p className="p-1 text-xs leading-5 text-slate-600"><a href={signInHref} className="font-bold text-violet-700 underline">Sign in</a> to let Claude turn pasted text into portfolio content.</p>}
    </div>}

    <p className="px-1 pt-1 text-[11px] leading-4 text-slate-400">Instagram and Facebook don’t let apps read personal profiles, so add those as links in Social &amp; contact. Imports replace matching sections; use Undo to go back.</p>
  </section>;
}
