"use client";

import { useMemo, useState } from "react";
import { Check, MessageCircle } from "lucide-react";

const JOBS = [
  { id: "seo", label: "Rank higher on Google", detail: "Keywords, page fixes, internal links, new pages" },
  { id: "aeo", label: "Get cited by AI answers", detail: "ChatGPT, Claude, Perplexity, Google AI Overviews" },
  { id: "social", label: "Post to social media", detail: "Instagram, TikTok, LinkedIn captions and a calendar" },
  { id: "email", label: "Send email campaigns", detail: "Newsletters and follow-ups written and scheduled" },
  { id: "reviews", label: "Answer reviews", detail: "Google and portal reviews, replied to in your voice" },
  { id: "leads", label: "Follow up with leads", detail: "WhatsApp and email replies to new enquiries" },
  { id: "reports", label: "Weekly reports", detail: "What changed, what worked, what to do next" },
  { id: "content", label: "Write blog posts", detail: "Researched articles your customers search for" },
] as const;

const PLATFORMS = ["WordPress", "Next.js", "Shopify", "Webflow", "Wix", "Fuccura", "Custom-built", "Not sure"] as const;
const HOW_OFTEN = ["Every day", "Every week", "Every month"] as const;

/**
 * “Build your own agent”: the visitor picks what they want done, where their
 * site runs and how often, and gets a WhatsApp message that already says it,
 * so the first conversation starts with a brief instead of “hi”.
 */
export function CustomAgentBuilder({ whatsapp }: { whatsapp: string }) {
  const [jobs, setJobs] = useState<Set<string>>(() => new Set(["seo", "aeo"]));
  const [platform, setPlatform] = useState<string>("WordPress");
  const [often, setOften] = useState<string>("Every week");
  const [business, setBusiness] = useState("");

  const toggle = (id: string) => setJobs((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const chosen = JOBS.filter((job) => jobs.has(job.id));
  const message = useMemo(() => [
    "Hi! I’d like a custom AI agent from Fuccura.",
    business.trim() ? `My business: ${business.trim()}` : "",
    chosen.length ? `I want it to: ${chosen.map((job) => job.label.charAt(0).toLowerCase() + job.label.slice(1)).join(", ")}.` : "",
    `My website runs on: ${platform}.`,
    `How often: ${often.toLowerCase()}.`,
    "Can we book the free call?",
  ].filter(Boolean).join("\n"), [business, chosen, platform, often]);
  const link = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;

  return <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
    <div className="space-y-8">
      <fieldset>
        <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">1 · What should it do?</legend>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">{JOBS.map((job) => {
          const on = jobs.has(job.id);
          return <button key={job.id} type="button" aria-pressed={on} onClick={() => toggle(job.id)} className={`group flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-300 ${on ? "border-[#e0a43a] bg-[#e0a43a]/10" : "border-white/12 bg-white/[0.03] hover:border-white/30"}`}>
            <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors ${on ? "border-[#e0a43a] bg-[#e0a43a] text-[#15140f]" : "border-white/30"}`}>{on && <Check size={13} strokeWidth={3} />}</span>
            <span><span className="block font-medium">{job.label}</span><span className="mt-0.5 block text-[13px] text-white/55">{job.detail}</span></span>
          </button>;
        })}</div>
      </fieldset>
      <fieldset>
        <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">2 · Where does your website live?</legend>
        <div className="mt-4 flex flex-wrap gap-2">{PLATFORMS.map((name) => <button key={name} type="button" aria-pressed={platform === name} onClick={() => setPlatform(name)} className={`rounded-full border px-4 py-2 text-[14px] transition-colors ${platform === name ? "border-white bg-white text-[#15140f]" : "border-white/15 hover:border-white/40"}`}>{name}</button>)}</div>
      </fieldset>
      <fieldset>
        <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">3 · How often should it work?</legend>
        <div className="mt-4 inline-flex rounded-full border border-white/15 p-1">{HOW_OFTEN.map((value) => <button key={value} type="button" aria-pressed={often === value} onClick={() => setOften(value)} className={`rounded-full px-4 py-1.5 text-[14px] transition-colors ${often === value ? "bg-white text-[#15140f]" : "text-white/70 hover:text-white"}`}>{value}</button>)}</div>
      </fieldset>
      <label className="block">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">4 · Your business, in a few words (optional)</span>
        <input value={business} onChange={(event) => setBusiness(event.target.value.slice(0, 160))} placeholder="A real estate agency in Dubai Marina" className="mt-3 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-[15px] text-white placeholder:text-white/35 focus:border-[#e0a43a] focus:outline-none" />
      </label>
    </div>

    <aside className="relative self-start overflow-hidden rounded-3xl border border-white/12 bg-[#0d0c0a] p-6 lg:sticky lg:top-24">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Your agent</p>
      <p className="mt-3 font-display text-[2rem] leading-[1.05]">{chosen.length ? `${chosen.length} job${chosen.length === 1 ? "" : "s"}, ${often.toLowerCase()}` : "Pick at least one job"}</p>
      <ul className="mt-5 space-y-2 text-[14px]">{chosen.map((job) => <li key={job.id} className="flex gap-2.5"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#e0a43a]" />{job.label}</li>)}</ul>
      <p className="mt-5 text-[13px] text-white/55">On {platform}. We set it up, you approve what it does, and you get a {often === "Every month" ? "monthly" : "weekly"} report.</p>
      <div className="mt-6 flex items-baseline gap-2 border-t border-white/10 pt-5"><span className="text-white/55">From</span><span className="font-display text-[3rem] leading-none">$10</span></div>
      <p className="mt-1 text-[12px] text-white/45">A fixed price agreed on the free call, before any work starts.</p>
      <a href={chosen.length ? link : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!chosen.length} className={`mt-6 flex items-center justify-center gap-2 rounded-full px-5 py-3.5 font-medium transition-transform ${chosen.length ? "bg-[#25d366] text-[#0b1f12] hover:-translate-y-0.5" : "pointer-events-none bg-white/10 text-white/40"}`}><MessageCircle size={18} /> Send this on WhatsApp</a>
      <details className="mt-4 text-[12px] text-white/50"><summary className="cursor-pointer hover:text-white/80">See the message</summary><pre className="mt-2 whitespace-pre-wrap font-sans">{message}</pre></details>
    </aside>
  </div>;
}
