"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileArchive, ImageIcon, Loader2, Video } from "lucide-react";
import type { SubmissionSummary } from "@/lib/gallery/submissions";

const field = "mt-1.5 w-full rounded-xl border border-rule bg-paper px-3.5 py-2.5 text-[0.98rem] text-ink outline-none transition focus:border-ink";
const STATUS = { pending: ["Waiting for review", "bg-amber-100 text-amber-950"], approved: ["In the gallery", "bg-emerald-100 text-emerald-950"], changes: ["Changes requested", "bg-orange-100 text-orange-950"], rejected: ["Not accepted", "bg-red-100 text-red-950"] } as const;
const kb = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);

function Text({ name, label, hint, rows, max, value, onChange, error }: { name: string; label: string; hint: string; rows?: number; max: number; value: string; onChange: (value: string) => void; error?: string }) {
  return <label className="block">
    <span className="flex items-baseline justify-between gap-3 text-[0.95rem] font-medium text-ink"><span>{label}</span><span className="text-[0.78rem] font-normal text-ink-faint">{value.length}/{max}</span></span>
    <span className="mt-0.5 block text-[0.86rem] text-ink-soft">{hint}</span>
    {rows ? <textarea name={name} rows={rows} maxLength={max} value={value} onChange={(event) => onChange(event.target.value)} className={`${field} resize-y leading-relaxed`} />
      : <input name={name} maxLength={max} value={value} onChange={(event) => onChange(event.target.value)} className={field} />}
    {error && <span role="alert" className="mt-1 block text-[0.84rem] text-[color:var(--destructive)]">{error}</span>}
  </label>;
}

function FilePick({ name, label, hint, accept, icon: Icon, file, onFile, error, existing }: { name: string; label: string; hint: string; accept: string; icon: typeof ImageIcon; file: File | null; onFile: (file: File | null) => void; error?: string; existing?: string }) {
  return <label className="block cursor-pointer rounded-2xl border border-dashed border-ink/25 p-5 transition hover:border-ink">
    <span className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink/5"><Icon size={18} /></span>
      <span className="min-w-0"><span className="block text-[0.95rem] font-medium text-ink">{label}</span><span className="block text-[0.84rem] text-ink-soft">{file ? `${file.name} · ${kb(file.size)}` : existing ?? hint}</span></span></span>
    <input type="file" name={name} accept={accept} className="sr-only" onChange={(event) => onFile(event.target.files?.[0] ?? null)} />
    {error && <span role="alert" className="mt-2 block text-[0.84rem] text-[color:var(--destructive)]">{error}</span>}
  </label>;
}

const EMPTY = { title: "", summary: "", idea: "", process: "", inspiration: "", audience: "", tags: "", license: "MIT", liveUrl: "" };

/** Submit a template to the gallery, or edit one that’s waiting or needs changes. */
export default function SubmitForm({ blocked }: { blocked: string | null }) {
  const [mine, setMine] = useState<SubmissionSummary[] | null>(null);
  const [editing, setEditing] = useState<SubmissionSummary | null>(null);
  const [values, setValues] = useState(EMPTY);
  const [files, setFiles] = useState<{ cover: File | null; clip: File | null; zip: File | null }>({ cover: null, clip: null, zip: null });
  const [owns, setOwns] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");

  const load = () => fetch("/api/gallery/submissions").then((response) => response.ok ? response.json() : { submissions: [] }).then((body) => setMine(body.submissions)).catch(() => setMine([]));
  useEffect(() => { void load(); }, []);
  const set = (key: keyof typeof EMPTY) => (value: string) => setValues((current) => ({ ...current, [key]: value }));
  const edit = (submission: SubmissionSummary) => {
    setEditing(submission); setDone(""); setErrors({});
    setValues({ title: submission.title, summary: submission.summary, idea: submission.idea, process: submission.process, inspiration: submission.inspiration, audience: submission.audience, tags: submission.tags.join(", "), license: submission.license, liveUrl: submission.liveUrl ?? "" });
    setFiles({ cover: null, clip: null, zip: null });
    document.getElementById("submit-form")?.scrollIntoView({ behavior: "smooth" });
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setErrors({}); setDone("");
    const form = new FormData();
    Object.entries(values).forEach(([key, value]) => form.set(key, value));
    form.set("owns", owns ? "yes" : "no");
    if (files.cover) form.set("cover", files.cover);
    if (files.clip) form.set("clip", files.clip);
    if (files.zip) form.set("zip", files.zip);
    const response = await fetch(editing ? `/api/gallery/submissions/${editing.id}` : "/api/gallery/submissions", { method: editing ? "PUT" : "POST", body: form }).catch(() => null);
    const body = await response?.json().catch(() => null);
    setBusy(false);
    if (!response?.ok) { setErrors({ [body?.field ?? "form"]: body?.error ?? "The upload didn’t go through. Check your connection and try again." }); return; }
    setDone(editing ? "Updated. It’s back in the review queue." : "Thank you! Your template is in the review queue. We’ll email you when it’s been looked at.");
    setEditing(null); setValues(EMPTY); setFiles({ cover: null, clip: null, zip: null }); setOwns(false);
    void load();
  }
  async function withdraw(submission: SubmissionSummary) {
    if (!window.confirm(`Withdraw “${submission.title}”? This deletes the submission.`)) return;
    await fetch(`/api/gallery/submissions/${submission.id}`, { method: "DELETE" });
    void load();
  }

  return <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
    <form id="submit-form" onSubmit={(event) => void submit(event)} className="space-y-8" noValidate>
      {blocked && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950">{blocked} <Link href="/account#profile" className="font-medium underline">Go to your account</Link></p>}
      {done && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-950">{done}</p>}
      {editing && <p className="rounded-xl bg-ink/5 px-4 py-3 text-[0.95rem]">Editing <b>{editing.title}</b>. Files you don’t replace are kept. <button type="button" onClick={() => { setEditing(null); setValues(EMPTY); }} className="underline">Cancel</button></p>}
      <fieldset className="space-y-5" disabled={Boolean(blocked) || busy}>
        <legend className="font-display text-[1.6rem] text-ink">The template</legend>
        <Text name="title" label="Name" hint="Short and memorable, like ‘Harbour’ or ‘Field Notes’." max={60} value={values.title} onChange={set("title")} error={errors.title} />
        <Text name="summary" label="One-line description" hint="What it is, in a sentence. Shown on the gallery tile and in search results." max={200} value={values.summary} onChange={set("summary")} error={errors.summary} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Text name="tags" label="Tags" hint="Comma-separated: profession, style, ‘motion’ if it animates." max={200} value={values.tags} onChange={set("tags")} error={errors.tags} />
          <Text name="liveUrl" label="Live demo (optional)" hint="An https:// link where people can see it running." max={300} value={values.liveUrl} onChange={set("liveUrl")} error={errors.liveUrl} />
        </div>
      </fieldset>
      <fieldset className="space-y-5" disabled={Boolean(blocked) || busy}>
        <legend className="font-display text-[1.6rem] text-ink">The story</legend>
        <p className="-mt-2 text-[0.92rem] text-ink-soft">This becomes the article people read when they open your template. Write it like you’d explain it to a friend.</p>
        <Text name="idea" label="The idea" hint="What were you trying to make, and why?" rows={4} max={4000} value={values.idea} onChange={set("idea")} error={errors.idea} />
        <Text name="process" label="How you made it" hint="Your tools and steps. If you used AI, share how you prompted it and what you changed by hand." rows={5} max={4000} value={values.process} onChange={set("process")} error={errors.process} />
        <Text name="inspiration" label="Inspired by" hint="Places, print, art, other work, a feeling. Credit people you learned from." rows={3} max={4000} value={values.inspiration} onChange={set("inspiration")} error={errors.inspiration} />
        <Text name="audience" label="Who it’s for" hint="Which jobs or kinds of people would this suit?" rows={3} max={2000} value={values.audience} onChange={set("audience")} error={errors.audience} />
      </fieldset>
      <fieldset className="space-y-4" disabled={Boolean(blocked) || busy}>
        <legend className="font-display text-[1.6rem] text-ink">Files</legend>
        <FilePick name="zip" label="The template as a ZIP" hint="Up to 20 MB. Include a README; leave out node_modules." accept=".zip,application/zip" icon={FileArchive} file={files.zip} onFile={(zip) => setFiles((current) => ({ ...current, zip }))} error={errors.zip} existing={editing ? `Current: ${editing.zip.files} files · ${kb(editing.zipBytes)}. Choose a file to replace it.` : undefined} />
        <FilePick name="cover" label="Cover image" hint="Square works best, at least 1200 × 1200. PNG, JPG or WebP, up to 4 MB." accept="image/png,image/jpeg,image/webp" icon={ImageIcon} file={files.cover} onFile={(cover) => setFiles((current) => ({ ...current, cover }))} error={errors.cover} existing={editing ? "Current cover kept unless you choose a new one." : undefined} />
        <FilePick name="clip" label="Short clip (optional, recommended)" hint="About 8–10 seconds scrolling through your design, square if you can. MP4 or WebM, up to 12 MB. It plays on the gallery tile." accept="video/mp4,video/webm" icon={Video} file={files.clip} onFile={(clip) => setFiles((current) => ({ ...current, clip }))} error={errors.clip} />
        <label className="block text-[0.95rem] font-medium text-ink">Licence
          <select name="license" value={values.license} onChange={(event) => set("license")(event.target.value)} className={field}><option value="MIT">MIT: anyone can use and change it (recommended)</option><option value="Apache-2.0">Apache 2.0</option><option value="CC-BY-4.0">Creative Commons BY 4.0: use freely with credit</option></select></label>
        <label className="flex items-start gap-3 text-[0.95rem] text-ink"><input type="checkbox" checked={owns} onChange={(event) => setOwns(event.target.checked)} className="mt-1 size-4" /><span>This is my own work (or I have the right to share everything in it), and I’m happy for it to be downloaded for free under the licence above.</span></label>
        {errors.owns && <p role="alert" className="text-[0.84rem] text-[color:var(--destructive)]">{errors.owns}</p>}
      </fieldset>
      {errors.form && <p role="alert" className="text-[0.92rem] text-[color:var(--destructive)]">{errors.form}</p>}
      <button disabled={Boolean(blocked) || busy} className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[1rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink disabled:opacity-50">{busy && <Loader2 size={16} className="animate-spin" />}{busy ? "Uploading…" : editing ? "Save and send for review" : "Submit for review"}</button>
    </form>

    <aside className="h-fit space-y-6 lg:sticky lg:top-24">
      <div className="rounded-2xl border border-rule bg-card p-6">
        <h2 className="font-display text-[1.4rem] text-ink">Your submissions</h2>
        {mine === null ? <p className="mt-3 text-[0.9rem] text-ink-soft">Loading…</p> : mine.length === 0 ? <p className="mt-3 text-[0.9rem] text-ink-soft">None yet.</p>
          : <ul className="mt-4 space-y-4">{mine.map((submission) => <li key={submission.id} className="border-t border-rule pt-4 first:border-0 first:pt-0">
            <p className="font-medium text-ink">{submission.title}</p>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[0.78rem] ${STATUS[submission.status][1]}`}>{STATUS[submission.status][0]}</span>
            {submission.reviewNote && <p className="mt-2 text-[0.88rem] text-ink-soft">“{submission.reviewNote}”</p>}
            <p className="mt-2 flex flex-wrap gap-3 text-[0.86rem]">
              {submission.status === "approved" && <Link href={`/gallery/${submission.slug}`} className="underline">View in gallery</Link>}
              {(submission.status === "pending" || submission.status === "changes") && <button type="button" onClick={() => edit(submission)} className="underline">Edit</button>}
              {submission.status !== "approved" && <button type="button" onClick={() => void withdraw(submission)} className="text-ink-soft underline">Withdraw</button>}
            </p>
          </li>)}</ul>}
      </div>
      <div className="rounded-2xl border border-rule p-6 text-[0.9rem] leading-relaxed text-ink-soft">
        <h2 className="font-display text-[1.2rem] text-ink">What we look for</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5"><li>Original work that looks finished on phones and computers.</li><li>A ZIP that runs with the README’s steps.</li><li>Readable text and good contrast.</li><li>No trackers, ads or code that phones home.</li><li>A clear story: it helps people pick it.</li></ul>
      </div>
    </aside>
  </div>;
}
