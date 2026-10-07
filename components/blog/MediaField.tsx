"use client";

import { useState } from "react";
import { Code2, ImagePlus, Loader2, Video, X } from "lucide-react";
import { MAX_MEDIA_HTML, MEDIA_HEIGHT, parseVideoUrl, type PostMedia } from "@/lib/content/media";
import { PostMediaView } from "./PostMediaView";

type Draft = PostMedia | { type: "video"; url: string } | null;

/**
 * Chooses the media block at the top of a post: none, an image (uploaded),
 * a YouTube or Vimeo video (by link), or custom HTML and CSS.
 * `upload` turns a picked file into a URL (the editors' existing image upload).
 */
export function MediaField({ value, onChange, upload }: { value: PostMedia | null; onChange: (media: PostMedia | null) => void; upload: (file: File) => Promise<string> }) {
  const [videoUrl, setVideoUrl] = useState(value?.type === "video" ? (value.provider === "youtube" ? `https://www.youtube.com/watch?v=${value.id}` : `https://vimeo.com/${value.id}`) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"image" | "video" | "html" | null>(value?.type ?? null);

  const pick = (next: typeof mode) => { setMode(next); setError(""); if (next === null) onChange(null); };
  const setVideo = (url: string) => {
    setVideoUrl(url);
    const video = parseVideoUrl(url);
    setError(url.trim() && !video ? "Paste a YouTube or Vimeo link." : "");
    if (video) onChange({ type: "video", ...video, title: "" });
  };
  const uploadImage = async (file?: File) => {
    if (!file) return;
    setBusy(true); setError("");
    try { onChange({ type: "image", src: await upload(file), alt: value?.type === "image" ? value.alt : "" }); }
    catch (caught) { setError((caught as Error).message || "That image couldn’t be uploaded."); }
    finally { setBusy(false); }
  };
  const tab = (id: Exclude<typeof mode, null>, icon: React.ReactNode, label: string) => <button type="button" role="radio" aria-checked={mode === id} onClick={() => pick(id)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] ${mode === id ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft hover:border-ink"}`}>{icon}{label}</button>;
  const draft: Draft = value;

  return <div className="space-y-3 text-[13px]">
    <p className="font-medium text-ink">Media at the top of the post (optional)</p>
    <div role="radiogroup" aria-label="Media type" className="flex flex-wrap gap-2">
      {tab("image", <ImagePlus size={13} />, "Image")}
      {tab("video", <Video size={13} />, "Video")}
      {tab("html", <Code2 size={13} />, "Custom HTML")}
      {mode && <button type="button" onClick={() => pick(null)} className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-[12px] text-ink-faint hover:text-ink"><X size={13} /> None</button>}
    </div>

    {mode === "image" && <div className="space-y-2">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-ink/30 px-3 py-2 hover:border-ink">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}{value?.type === "image" ? "Replace image" : "Upload an image"}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(event) => { void uploadImage(event.target.files?.[0]); event.target.value = ""; }} />
      </label>
      {value?.type === "image" && <input value={value.alt} onChange={(event) => onChange({ ...value, alt: event.target.value })} placeholder="Caption, also read aloud to people using screen readers" aria-label="Image caption" className="w-full rounded-lg border border-rule bg-white px-3 py-2 outline-none focus:border-ink" />}
    </div>}

    {mode === "video" && <input value={videoUrl} onChange={(event) => setVideo(event.target.value)} placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…" aria-label="Video link" className="w-full rounded-lg border border-rule bg-white px-3 py-2 outline-none focus:border-ink" />}

    {mode === "html" && <div className="space-y-2">
      <textarea value={value?.type === "html" ? value.html : ""} onChange={(event) => onChange({ type: "html", html: event.target.value.slice(0, MAX_MEDIA_HTML), height: value?.type === "html" ? value.height : MEDIA_HEIGHT.default })} rows={8} spellCheck={false} placeholder={"<style>h1 { color: tomato }</style>\n<h1>Hello</h1>"} aria-label="Custom HTML and CSS" className="w-full resize-y rounded-lg border border-rule bg-white p-2.5 font-mono text-[12px] outline-none focus:border-ink" />
      <label className="flex items-center gap-2 text-ink-soft">Height
        <input type="number" min={MEDIA_HEIGHT.min} max={MEDIA_HEIGHT.max} step={10} value={value?.type === "html" ? value.height : MEDIA_HEIGHT.default} onChange={(event) => value?.type === "html" && onChange({ ...value, height: Number(event.target.value) || MEDIA_HEIGHT.default })} className="w-24 rounded-lg border border-rule bg-white px-2 py-1.5 outline-none focus:border-ink" /> px</label>
      <p className="text-[12px] text-ink-faint">Shown in a sealed frame: it can use its own styles and scripts, but can’t read or change anything else on the site.</p>
    </div>}

    {error && <p role="alert" className="text-[12px] text-[color:var(--destructive)]">{error}</p>}
    {draft && <PostMediaView media={draft as PostMedia} className="rounded-lg border border-rule p-2" />}
  </div>;
}
