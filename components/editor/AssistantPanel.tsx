"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, FileUp, Loader2, PanelRightClose, Send, Sparkles } from "lucide-react";

type Message = { role: "assistant" | "user"; text: string };

/**
 * The editor's assistant. With an AI provider configured and the user signed in,
 * requests go to the server-side assistant (metered per plan). Otherwise a small
 * set of local quick actions still works, so the panel is never a dead end.
 */
export function AssistantPanel<T>({ templateId, content, onContent, quickAction, onImportCv, onClose, intro, signedIn }: {
  templateId: string;
  content: T;
  onContent: (content: T) => void;
  /** Local fallback: applies a change and returns a reply, or null if it doesn't understand. */
  quickAction: (request: string) => string | null;
  onImportCv: (file: File) => Promise<string>;
  onClose?: () => void;
  intro: string;
  signedIn: boolean;
}) {
  const [available, setAvailable] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: intro }]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const cvInput = useRef<HTMLInputElement | null>(null);
  const log = useRef<HTMLDivElement | null>(null);
  const say = (message: Message) => setMessages((current) => [...current, message]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/assist").then((response) => response.json()).then((body: { available?: boolean }) => { if (!cancelled) setAvailable(Boolean(body.available)); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const request = prompt.trim();
    if (!request || busy) return;
    say({ role: "user", text: request });
    setPrompt("");
    if (available && signedIn) {
      setBusy(true);
      try {
        const response = await fetch("/api/ai/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId, content, instruction: request }) });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error ?? "The assistant could not complete that request.");
        if (body.changed) onContent(body.content as T);
        if (typeof body.remaining === "number") setRemaining(body.remaining);
        say({ role: "assistant", text: body.reply || (body.changed ? "Done." : "I didn’t change anything.") });
      } catch (error) {
        say({ role: "assistant", text: (error as Error).message });
      } finally {
        setBusy(false);
      }
      return;
    }
    say({ role: "assistant", text: quickAction(request) ?? (available ? "Sign in to use the full AI assistant. Without an account I can shorten your title, add a project or role, and add a skill." : "I can shorten your title, add a project or role, and add a skill. Everything else is editable in the Content panel.") });
  };

  const importCv = async (file?: File) => {
    if (!file) return;
    say({ role: "assistant", text: `Reading ${file.name}…` });
    setBusy(true);
    try { say({ role: "assistant", text: await onImportCv(file) }); } catch { say({ role: "assistant", text: "I couldn’t read that file. Try a PDF, DOCX, image, or plain-text CV under 25 MB." }); } finally { setBusy(false); }
  };

  return <>
    <div className="flex items-center justify-between border-b border-slate-200 p-4">
      <div className="flex items-center gap-2"><span className="rounded-lg bg-violet-100 p-2 text-violet-700"><Bot size={18} /></span><div><p className="text-sm font-black">Portfolio AI</p><p className="text-xs text-slate-500">{available && signedIn ? "Rewrites your copy — never your facts" : "Content & import workspace"}</p></div></div>
      {onClose && <button onClick={onClose} className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 xl:block" aria-label="Close AI panel"><PanelRightClose size={18} /></button>}
    </div>
    <div ref={log} className="min-h-0 flex-1 overflow-y-auto p-4">
      <button disabled={busy} onClick={() => cvInput.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50 px-3 py-3 text-sm font-bold text-violet-800 hover:bg-violet-100 disabled:opacity-60"><FileUp size={16} /> Upload CV and fill portfolio</button>
      <input ref={cvInput} onChange={(event) => { void importCv(event.target.files?.[0]); event.target.value = ""; }} type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg" className="hidden" />
      {available && !signedIn && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><Link href={`/login?callbackUrl=${encodeURIComponent(`/editor/${templateId}`)}`} className="font-bold text-violet-700 hover:underline">Sign in</Link> to let the AI rewrite your bio, projects, and experience.</p>}
      <div className="mt-5 space-y-3" aria-live="polite">
        {messages.map((message, index) => <div key={index} className={`rounded-2xl px-3 py-2.5 text-sm leading-6 ${message.role === "user" ? "ml-6 bg-violet-600 text-white" : "mr-3 bg-slate-100 text-slate-700"}`}>{message.text}</div>)}
        {busy && <div className="mr-3 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2.5 text-sm text-slate-500"><Loader2 size={14} className="animate-spin" /> Working…</div>}
      </div>
    </div>
    <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="border-t border-slate-200 p-3">
      <div className="flex items-center rounded-xl border border-slate-200 p-1 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-100">
        <input value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={1000} placeholder={available && signedIn ? "e.g. Make my bio warmer and shorter" : "Ask for a content change…"} className="min-w-0 flex-1 px-2 py-2 text-sm outline-none" />
        <button disabled={busy} className="rounded-lg bg-violet-600 p-2 text-white hover:bg-violet-700 disabled:opacity-50" aria-label="Send"><Send size={16} /></button>
      </div>
      <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400"><Sparkles size={11} /> {available && signedIn ? (remaining === null ? "AI edits are included in your plan" : `${remaining} AI edits left today`) : "Local quick actions are enabled"}</p>
    </form>
  </>;
}
