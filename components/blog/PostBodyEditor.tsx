"use client";

import { useRef, useState } from "react";
import { Bold, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Quote } from "lucide-react";
import { Markdown } from "@/lib/content/markdown";
import { prepareImage } from "@/lib/images";

/**
 * The writing area for blog posts: a plain text box with a small toolbar
 * that inserts Markdown, and a preview. Images are uploaded and inserted
 * as ![caption](url) lines.
 */
export function PostBodyEditor({ value, onChange, rows = 18, className = "" }: { value: string; onChange: (value: string) => void; rows?: number; className?: string }) {
  const box = useRef<HTMLTextAreaElement | null>(null);
  const file = useRef<HTMLInputElement | null>(null);
  const [view, setView] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  /** Wraps the selection (or a placeholder) and keeps it selected. */
  const wrap = (before: string, after = before, placeholder = "text") => {
    const node = box.current;
    if (!node) return;
    const { selectionStart: start, selectionEnd: end } = node;
    const selected = value.slice(start, end) || placeholder;
    onChange(value.slice(0, start) + before + selected + after + value.slice(end));
    requestAnimationFrame(() => { node.focus(); node.setSelectionRange(start + before.length, start + before.length + selected.length); });
  };
  /** Prefixes every selected line, e.g. with "- " or "## ". */
  const prefix = (marker: string | ((index: number) => string)) => {
    const node = box.current;
    if (!node) return;
    const lineStart = value.lastIndexOf("\n", node.selectionStart - 1) + 1;
    const lineEnd = value.indexOf("\n", node.selectionEnd) === -1 ? value.length : value.indexOf("\n", node.selectionEnd);
    const lines = value.slice(lineStart, lineEnd).split("\n").map((line, index) => (typeof marker === "function" ? marker(index) : marker) + line.replace(/^(#{1,3}\s+|[-*]\s+|\d+[.)]\s+|>\s?)/, ""));
    const next = lines.join("\n");
    onChange(value.slice(0, lineStart) + next + value.slice(lineEnd));
    requestAnimationFrame(() => { node.focus(); node.setSelectionRange(lineStart, lineStart + next.length); });
  };
  const insertBlock = (text: string) => {
    const node = box.current;
    const at = node?.selectionEnd ?? value.length;
    const before = value.slice(0, at).replace(/\s*$/, "");
    onChange(`${before}${before ? "\n\n" : ""}${text}\n\n${value.slice(at).replace(/^\s*/, "")}`);
  };
  const addLink = () => {
    const url = window.prompt("Link to (https://…)");
    if (url) wrap("[", `](${url.trim()})`, "link text");
  };
  const addImage = async (picked: File | undefined) => {
    if (!picked) return;
    setUploading(true); setError("");
    try {
      const url = await prepareImage(picked, true);
      if (url.startsWith("data:")) throw new Error("Sign in to add images to posts.");
      insertBlock(`![${picked.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")}](${url})`);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "That image couldn’t be added.");
    } finally {
      setUploading(false);
      if (file.current) file.current.value = "";
    }
  };

  const tool = "rounded-md p-1.5 text-ink-soft hover:bg-ink/5 hover:text-ink disabled:opacity-40";
  return <div className={className}>
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 border-rule bg-white/60 px-1.5 py-1">
      <button type="button" className={tool} onClick={() => prefix("## ")} aria-label="Heading" title="Heading"><Heading2 size={16} /></button>
      <button type="button" className={tool} onClick={() => wrap("**")} aria-label="Bold" title="Bold"><Bold size={16} /></button>
      <button type="button" className={tool} onClick={() => wrap("*")} aria-label="Italic" title="Italic"><Italic size={16} /></button>
      <button type="button" className={tool} onClick={addLink} aria-label="Link" title="Link"><Link2 size={16} /></button>
      <button type="button" className={tool} onClick={() => prefix("- ")} aria-label="Bulleted list" title="Bulleted list"><List size={16} /></button>
      <button type="button" className={tool} onClick={() => prefix((index) => `${index + 1}. `)} aria-label="Numbered list" title="Numbered list"><ListOrdered size={16} /></button>
      <button type="button" className={tool} onClick={() => prefix("> ")} aria-label="Quote" title="Quote"><Quote size={16} /></button>
      <button type="button" className={tool} onClick={() => file.current?.click()} disabled={uploading} aria-label="Add an image" title="Add an image">{uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}</button>
      <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(event) => void addImage(event.target.files?.[0])} />
      <span className="ml-auto flex rounded-full border border-rule p-0.5 text-[12px]">{(["write", "preview"] as const).map((mode) => <button key={mode} type="button" onClick={() => setView(mode)} aria-pressed={view === mode} className={`rounded-full px-2.5 py-0.5 ${view === mode ? "bg-ink text-paper" : "text-ink-soft"}`}>{mode === "write" ? "Write" : "Preview"}</button>)}</span>
    </div>
    {view === "write"
      ? <textarea ref={box} value={value} rows={rows} onChange={(event) => onChange(event.target.value)} aria-label="Post" placeholder={"Start writing…\n\n## A heading\n\nA paragraph with **bold**, *italic* and [a link](https://example.com).\n\n- A list item"} className="block w-full resize-y rounded-b-lg border border-rule bg-white px-3.5 py-3 font-mono text-[13.5px] leading-relaxed text-ink outline-none focus:border-ink" />
      : <div className="min-h-[18rem] rounded-b-lg border border-rule bg-white px-5 py-4">{value.trim() ? <Markdown source={value} className="post-body text-[1rem] text-ink" /> : <p className="text-[13px] text-ink-faint">Nothing to preview yet.</p>}</div>}
    <p className="mt-1.5 text-[11px] text-ink-faint">{error ? <span className="text-[color:var(--destructive)]">{error}</span> : <>Blank line between paragraphs. <b>##</b> heading, <b>**bold**</b>, <b>*italic*</b>, <b>- </b>list, <b>&gt; </b>quote.</>}</p>
  </div>;
}
