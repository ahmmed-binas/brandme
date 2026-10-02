"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { compressImage } from "@/lib/images";
import { KIND_LABELS, LIMITS, POST_KINDS, type PostKind } from "@/lib/community/rules";

export interface EditablePost { id: string; kind: PostKind; title: string; body: string; rating: number | null; link: string | null }

const HINTS: Record<PostKind, { title: string; body: string }> = {
  suggestion: { title: "e.g. Let me reorder projects by dragging", body: "What would you like, and what would it help you do?" },
  review: { title: "e.g. Published in an evening", body: "What worked, what didn’t, and who you’d recommend Formora to." },
  design: { title: "e.g. Studio — a template for architects", body: "Who it’s for, the idea behind it, and anything you’d like feedback on." },
};

function StarInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [hover, setHover] = useState(0);
  const name = useId();
  return <fieldset className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
    <legend className="sr-only">Rating</legend>
    {[1, 2, 3, 4, 5].map((star) => (
      <label key={star} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(star)}>
        <input type="radio" name={name} value={star} checked={value === star} onChange={() => onChange(star)} className="peer sr-only" />
        <Star size={24} strokeWidth={1.4} className={`transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-signal ${(hover || value) >= star ? "fill-ink text-ink" : "text-ink-faint"}`} />
        <span className="sr-only">{star} star{star > 1 ? "s" : ""}</span>
      </label>
    ))}
  </fieldset>;
}

/** Writing (or editing) a post. Refusals are shown inline and the author's text is kept. */
export default function Composer({ open, onClose, editing, initialKind = "suggestion" }: { open: boolean; onClose: () => void; editing?: EditablePost; initialKind?: PostKind }) {
  const router = useRouter();
  const [kind, setKind] = useState<PostKind>(editing?.kind ?? initialKind);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [rating, setRating] = useState(editing?.rating ?? 0);
  const [link, setLink] = useState(editing?.link ?? "");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const titleInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => titleInput.current?.focus(), 60);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.clearTimeout(timer); window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, busy, onClose]);

  const addImages = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    try {
      const room = LIMITS.images.max - images.length;
      const compressed = await Promise.all([...files].slice(0, room).map((file) => compressImage(file)));
      setImages((current) => [...current, ...compressed].slice(0, LIMITS.images.max));
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(null);
    try {
      const payload = { kind, title, body, rating: kind === "review" ? rating : null, link: kind === "design" ? link : null, images: kind === "design" ? images : [] };
      const response = await fetch(editing ? `/api/community/posts/${editing.id}` : "/api/community/posts", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) { setError("Your session ended. Sign in again to post; your text is still here."); return; }
      if (!response.ok) { setError(result.error ?? "That couldn’t be posted. Please try again."); return; }
      setDone(result.held ?? (editing ? "Saved. Your post is live." : "Posted. Thanks for taking part."));
      router.refresh();
    } catch {
      setError("You seem to be offline. Your text is still here; try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const close = () => { if (busy) return; onClose(); setDone(null); setError(null); if (done && !editing) { setTitle(""); setBody(""); setRating(0); setLink(""); setImages([]); } };

  return <AnimatePresence>
    {open && <motion.div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="composer-title" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className="max-h-[94dvh] w-full max-w-[38rem] overflow-y-auto rounded-t-2xl border border-rule bg-paper p-6 text-ink shadow-2xl sm:rounded-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id="composer-title" className="font-display text-[1.9rem] leading-none tracking-[-0.02em]">{editing ? "Edit your post" : "Write a post"}</h2>
          <button type="button" onClick={close} className="-mr-2 -mt-1 rounded-full p-2 text-ink-soft hover:bg-ink/5 hover:text-ink" aria-label="Close"><X size={18} /></button>
        </div>

        {done ? <div className="mt-8" role="status">
          <p className="text-[1.05rem] leading-relaxed text-ink">{done}</p>
          <button type="button" onClick={close} className="mt-8 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper">Done</button>
        </div> : <form onSubmit={submit} className="mt-7 space-y-6" noValidate>
          {!editing && <div role="radiogroup" aria-label="What are you posting?" className="grid grid-cols-3 gap-1 rounded-full border border-rule p-1">
            {POST_KINDS.map((option) => <button key={option} type="button" role="radio" aria-checked={kind === option} onClick={() => { setKind(option); setError(null); }} className={`rounded-full px-3 py-2 text-sm transition-colors duration-200 ${kind === option ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}>
              {KIND_LABELS[option].singular}
            </button>)}
          </div>}

          {/* Templates now go to the gallery, with their files and story; older design posts stay editable here. */}
          {kind === "design" && !editing && <div className="rounded-2xl border border-rule bg-card p-6">
            <p className="font-display text-[1.5rem] leading-tight text-ink">Share it in the Gallery</p>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">Designs and templates now live in the Gallery, where people can see a clip of your site, read the story behind it and download it for free. Every submission is reviewed by hand.</p>
            <Link href="/gallery/submit" className="mt-5 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-signal hover:text-signal-ink">Submit a template</Link>
          </div>}

          <div className={kind === "design" && !editing ? "hidden" : "space-y-6"}>
          {kind === "review" && <div><p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Your rating</p><StarInput value={rating} onChange={setRating} /></div>}

          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Title</span>
            <input ref={titleInput} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={LIMITS.title.max} placeholder={HINTS[kind].title} className="mt-2 w-full border-b border-ink/25 bg-transparent pb-2 font-display text-[1.45rem] leading-snug outline-none placeholder:text-ink-faint/70 focus:border-ink" />
          </label>

          <label className="block">
            <span className="flex justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint"><span>Details</span><span className={body.length > LIMITS.body.max ? "text-[color:var(--destructive)]" : ""}>{body.length.toLocaleString("en")} / {LIMITS.body.max.toLocaleString("en")}</span></span>
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={6} placeholder={HINTS[kind].body} className="mt-2 w-full resize-y rounded-lg border border-rule bg-card px-3.5 py-3 text-[1rem] leading-relaxed outline-none placeholder:text-ink-faint focus:border-ink" />
          </label>

          {kind === "design" && <div className="space-y-4">
            {!editing && <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Images · up to {LIMITS.images.max}</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {images.map((image, index) => <div key={index} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-rule">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
                  <img src={image} alt={`Upload ${index + 1}`} className="size-full object-cover" />
                  <button type="button" onClick={() => setImages((current) => current.filter((_, i) => i !== index))} className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-ink/80 text-paper" aria-label={`Remove image ${index + 1}`}><X size={12} /></button>
                </div>)}
                {images.length < LIMITS.images.max && <button type="button" onClick={() => fileInput.current?.click()} className="grid aspect-[4/3] place-items-center rounded-lg border border-dashed border-ink/30 text-ink-soft transition hover:border-ink hover:text-ink"><span className="flex flex-col items-center gap-1 text-xs"><ImagePlus size={18} /> Add image</span></button>}
              </div>
              <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple className="hidden" onChange={(event) => { void addImages(event.target.files); event.target.value = ""; }} />
            </div>}
            <label className="block">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Link (optional) · Figma, Dribbble, a live site</span>
              <input value={link} onChange={(event) => setLink(event.target.value)} type="url" inputMode="url" placeholder="https://" className="mt-2 w-full rounded-lg border border-rule bg-card px-3.5 py-2.5 text-[0.95rem] outline-none focus:border-ink" />
            </label>
          </div>}

          <div aria-live="assertive">{error && <p role="alert" className="rounded-lg border border-[color:var(--destructive)]/30 bg-[color:var(--destructive)]/[0.06] px-4 py-3 text-[0.95rem] leading-relaxed text-[color:var(--destructive)]">{error}</p>}</div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <p className="max-w-[22rem] text-[0.82rem] leading-relaxed text-ink-faint">{kind === "design" ? "Designs are checked by a moderator before they appear." : "Be kind and specific. Spam and shouting are refused automatically."}</p>
            <button disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[0.95rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink disabled:opacity-60">{busy && <Loader2 size={15} className="animate-spin" />}{editing ? "Save and resubmit" : kind === "design" ? "Submit for review" : "Post"}</button>
          </div>
        </div>
        </form>}
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
}
