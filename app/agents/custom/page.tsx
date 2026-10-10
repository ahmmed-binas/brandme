import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { CustomAgentHero } from "@/components/agents/CustomAgentHero";
import { CustomAgentBuilder } from "@/components/agents/CustomAgentBuilder";
import { SearchGrowthChart } from "@/components/agents/SearchGrowthChart";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Build your own AI agent: SEO, AEO and marketing, from $10",
  description: `Custom AI agents built by ${brand.name} for your business: an SEO and AEO agent that gets your WordPress, Next.js or custom site found on Google and in AI answers, and a marketing agent for social posts, email and leads. From $10.`,
  alternates: { canonical: "/agents/custom" },
};

const wa = (text: string) => `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(text)}`;

const AGENTS = [
  {
    name: "Kestrel", role: "SEO & AEO agent", colour: "#e0a43a",
    pitch: "Gets your website found: on Google, and in the answers ChatGPT, Claude, Perplexity and Google’s AI Overviews give.",
    does: ["Audits every page: titles, speed, broken links, missing schema", "Finds the questions your customers search for, and the pages you’re missing", "Writes and fixes pages so AI answers can quote you", "Watches Search Console and reports what moved, every week"],
    works: "WordPress, Next.js, Shopify, Webflow, Wix or a custom site",
    message: "Hi! I’m interested in Kestrel, the SEO & AEO agent. My website is: ",
  },
  {
    name: "Juno", role: "Marketing agent", colour: "#9b7bd4",
    pitch: "Keeps your business visible every week, without you living on your phone: posts, emails, reviews and replies to new leads.",
    does: ["Plans a month of posts and writes the captions in your voice", "Sends newsletters and follow-up emails on schedule", "Drafts replies to Google and portal reviews for you to approve", "Answers new enquiries quickly and passes hot leads to you"],
    works: "Instagram, TikTok, LinkedIn, Google Business, email and WhatsApp",
    message: "Hi! I’m interested in Juno, the marketing agent. My business is: ",
  },
] as const;

const STEPS: Array<[string, string]> = [
  ["A free call", "Twenty minutes on WhatsApp or video. You tell us about your business and what eats your week."],
  ["A fixed price", "We say exactly what your agent will do and what it costs, from $10. No work starts until you agree."],
  ["We build and connect it", "Set up on your website and accounts, tuned to your voice, your market and your customers."],
  ["You stay in charge", "It drafts, you approve, or it acts within the rules you set. A report lands every week."],
];

const FAQ: Array<[string, string]> = [
  ["What do I get for $10?", "Small jobs start at $10, like an SEO health check of your site with a fix list, or a month of social captions. Bigger agents that run every week cost more. We agree a fixed price on the free call before anything starts."],
  ["Will you guarantee I rank first on Google?", "No, and be wary of anyone who does. Nobody controls Google or AI answers. What Kestrel does is the work that moves rankings: fixing pages, filling gaps and measuring the results, so you can see what changed."],
  ["What’s AEO?", "Answer Engine Optimisation: making your site easy for AI assistants such as ChatGPT, Claude and Perplexity to understand and quote, so you’re the business they mention when someone asks."],
  ["Do I need a Fuccura website?", "No. Agents work with WordPress, Next.js, Shopify, Webflow, Wix and custom-built sites."],
  ["Who builds the agent?", "Our team designs and sets up each agent for you, using Claude and other AI models where they do the job best. You always have a person to talk to."],
  ["Can it post without asking me?", "Only if you want it to. Most people start with “draft and ask me”, then let it act on its own once they trust it."],
];

/** Build your own agent: the custom-agents service page. */
export default function CustomAgentsPage() {
  return <div className="bg-[#0b0a09] text-[#f4f0e8]">
    <section className="relative isolate overflow-hidden px-5 pb-24 pt-28 sm:px-8 lg:pb-32 lg:pt-36">
      <CustomAgentHero />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-[#0b0a09]" />
      <div className="mx-auto max-w-[1180px]">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60"><Link href="/agents" className="hover:text-white">Agents</Link> / Build your own</p>
        <h1 className="mt-6 max-w-[15ch] font-display text-[clamp(3rem,8vw,7rem)] leading-[0.92] tracking-[-0.035em]">An AI agent that works <em className="font-[300] text-[#e0a43a]">for your business.</em></h1>
        <p className="mt-7 max-w-[38rem] text-[clamp(1.05rem,1.6vw,1.25rem)] leading-[1.6] text-white/75">Tell us the jobs you never get to: getting found on Google, showing up in AI answers, posting, emailing, following up. We build an agent that does them, on your website and your accounts.</p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a href="#build" className="inline-flex items-center gap-2 rounded-full bg-[#f4f0e8] px-6 py-3.5 font-medium text-[#15140f] transition-transform hover:-translate-y-0.5">Build your agent <ArrowRight size={17} /></a>
          <a href={wa("Hi! I’d like to talk about a custom AI agent for my business.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 backdrop-blur hover:border-white/60"><MessageCircle size={17} /> Ask on WhatsApp</a>
          <p className="text-white/60"><span className="text-white/45">From</span> <span className="font-display text-[1.8rem] text-white">$10</span></p>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-[1180px] px-5 sm:px-8">
      <ul className="grid gap-5 lg:grid-cols-2">{AGENTS.map((agent) => <li key={agent.name} className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 transition-colors hover:border-white/25 lg:p-10">
        <span aria-hidden className="absolute -right-24 -top-24 size-72 rounded-full opacity-25 blur-3xl transition-opacity duration-700 group-hover:opacity-45" style={{ background: agent.colour }} />
        <div className="relative">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl" style={{ background: `${agent.colour}22`, color: agent.colour }}>
              {agent.name === "Kestrel"
                ? <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden><circle cx="14" cy="14" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.4" /><path d="M20.5 20.5l7 7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" /><path d="M10 16l3-4 2.5 2.5L19 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                : <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden><path d="M5 13v6l4 .5 3 6h3l-1.8-5.6L26 24V8L9 12.5z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /><path d="M28.5 13.5v5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>}
            </span>
            <div><p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/55">{agent.role}</p><h2 className="font-display text-[2.4rem] leading-none">{agent.name}</h2></div>
          </div>
          <p className="mt-6 text-[1.1rem] leading-relaxed text-white/80">{agent.pitch}</p>
          <ul className="mt-6 space-y-2.5 text-[15px]">{agent.does.map((line) => <li key={line} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: agent.colour }} />{line}</li>)}</ul>
          <p className="mt-6 text-[13px] text-white/50">Works with {agent.works}.</p>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
            <p><span className="text-white/50">From</span> <span className="font-display text-[2rem]">$10</span></p>
            <a href={wa(agent.message)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full px-5 py-3 font-medium text-[#15140f] transition-transform hover:-translate-y-0.5" style={{ background: agent.colour }}>Get {agent.name} <ArrowRight size={16} /></a>
          </div>
        </div>
      </li>)}</ul>
    </section>

    <section className="mx-auto mt-28 grid max-w-[1180px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#e0a43a]">What Kestrel reports</p>
        <h2 className="mt-4 font-display text-[clamp(2.2rem,4.4vw,3.6rem)] leading-[1] tracking-[-0.02em]">See every week what changed, <em className="font-[300]">and why.</em></h2>
        <p className="mt-5 max-w-[30rem] leading-relaxed text-white/70">Clicks, impressions, the searches you appear for and the pages that moved, straight from your Google Search Console, with what Kestrel did and what it plans next. Plain words, not jargon.</p>
      </div>
      <SearchGrowthChart />
    </section>

    <section id="build" className="mx-auto mt-28 max-w-[1180px] scroll-mt-24 px-5 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#e0a43a]">Build your own</p>
      <h2 className="mt-4 max-w-[18ch] font-display text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.025em]">Pick the jobs. We’ll build the agent.</h2>
      <p className="mt-5 max-w-[36rem] leading-relaxed text-white/70">Choose what it should do, where your site lives and how often it works. Your choices go into a WhatsApp message, so our first conversation starts with your brief.</p>
      <div className="mt-12"><CustomAgentBuilder whatsapp={brand.whatsapp} /></div>
    </section>

    <section className="mx-auto mt-28 max-w-[1180px] px-5 sm:px-8">
      <h2 className="font-display text-[clamp(2.2rem,4.4vw,3.4rem)] leading-none">How it works</h2>
      <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{STEPS.map(([title, body], index) => <li key={title} className="rounded-3xl border border-white/10 p-6">
        <p className="font-display text-[3rem] leading-none text-[#e0a43a]/80">{index + 1}</p>
        <h3 className="mt-4 text-[1.15rem] font-medium">{title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-white/65">{body}</p>
      </li>)}</ol>
    </section>

    <section className="mx-auto mt-28 max-w-[52rem] px-5 sm:px-8">
      <h2 className="font-display text-[clamp(2.2rem,4.4vw,3.4rem)] leading-none">Questions</h2>
      <dl className="mt-8 divide-y divide-white/10 border-y border-white/10">{FAQ.map(([question, answer]) => <div key={question} className="py-6"><dt className="font-medium">{question}</dt><dd className="mt-2 leading-relaxed text-white/65">{answer}</dd></div>)}</dl>
    </section>

    <section className="mx-auto max-w-[1180px] px-5 pb-28 pt-28 text-center sm:px-8">
      <h2 className="mx-auto max-w-[16ch] font-display text-[clamp(2.6rem,6vw,5rem)] leading-[0.95] tracking-[-0.03em]">Your first call is free. <em className="font-[300] text-[#e0a43a]">So is the advice.</em></h2>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <a href={wa("Hi! I’d like to book the free call about a custom AI agent.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3.5 font-medium text-[#0b1f12]"><MessageCircle size={17} /> WhatsApp us</a>
        <Link href="/book" className="rounded-full border border-white/25 px-6 py-3.5 hover:border-white/60">Book a call</Link>
      </div>
    </section>
  </div>;
}
