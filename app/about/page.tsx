import type { Metadata } from "next";
import Link from "next/link";
import { about } from "@/lib/about";
import { brand } from "@/lib/brand";
import { getViewer } from "@/lib/community/viewer";

export const metadata: Metadata = { title: `About ${brand.name}`, description: about.headline, alternates: { canonical: "/about" } };

// Depends on who is signed in; never pre-render at build time.
export const dynamic = "force-dynamic";

const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

export default async function AboutPage() {
  const viewer = await getViewer().catch(() => null);
  const { founder } = about;
  return <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
    {about.placeholder && viewer?.isModerator && <p className="mb-8 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[0.92rem] text-amber-950">This page still has placeholder text. Edit <code className="font-mono">lib/about.ts</code> with your story and set <code className="font-mono">placeholder: false</code>. Only admins see this note.</p>}
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">About</p>
    <h1 className="mt-4 max-w-[22ch] font-display text-[clamp(2.4rem,5.4vw,4.4rem)] leading-[1] tracking-[-0.02em]">{about.headline}</h1>

    <section className="mt-16 grid gap-12 lg:grid-cols-[18rem_1fr]">
      <aside>
        <div className="grid aspect-[4/5] w-full max-w-[18rem] place-items-center overflow-hidden rounded-2xl bg-ink/5 font-display text-[4rem] text-ink-soft">
          {/* eslint-disable-next-line @next/next/no-img-element -- a single local portrait */}
          {founder.portrait ? <img src={founder.portrait} alt={founder.name} className="size-full object-cover" /> : initials(founder.name)}
        </div>
        <p className="mt-5 font-display text-[1.5rem] leading-none">{founder.name}</p>
        <p className="mt-1 text-ink-soft">{founder.role}, {brand.name} · {founder.location}</p>
        <ul className="mt-4 space-y-1 text-[0.95rem]"><li><a href={`mailto:${founder.email}`} className="underline underline-offset-4">{founder.email}</a></li>{founder.links.map((link) => <li key={link.url}><a href={link.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{link.label}</a></li>)}</ul>
      </aside>
      <div className="max-w-[40rem] space-y-5 text-[1.12rem] leading-[1.75]">{about.letter.map((paragraph, index) => <p key={index} className={index === 0 ? "first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-display first-letter:text-[4.4rem] first-letter:leading-[0.8]" : ""}>{paragraph}</p>)}
        <p className="font-display text-[1.6rem] italic">— {founder.name.split(" ")[0]}</p></div>
    </section>

    <section className="mt-24 border-t border-rule pt-12">
      <h2 className="font-display text-[2.2rem]">What we believe</h2>
      <ul className="mt-8 grid gap-8 sm:grid-cols-2">{about.principles.map((item, index) => <li key={item.title} className="border-t border-ink pt-4"><p className="font-mono text-[12px] text-ink-faint">0{index + 1}</p><h3 className="mt-2 font-display text-[1.5rem]">{item.title}</h3><p className="mt-2 text-ink-soft">{item.body}</p></li>)}</ul>
    </section>

    <section className="mt-24 grid gap-10 border-t border-rule pt-12 lg:grid-cols-[1fr_1.4fr]">
      <h2 className="font-display text-[2.2rem]">So far</h2>
      <ol>{about.timeline.map((item) => <li key={item.year} className="grid grid-cols-[5rem_1fr] border-b border-rule py-4"><span className="font-mono text-ink-soft">{item.year}</span><span>{item.text}</span></li>)}</ol>
    </section>

    <section className="mt-24 rounded-2xl bg-ink px-8 py-14 text-center text-paper">
      <h2 className="font-display text-[clamp(2rem,4.4vw,3rem)] leading-tight">Make yours in an evening.</h2>
      <div className="mt-8 flex flex-wrap justify-center gap-4"><Link href="/templatechooser" className="rounded-full bg-paper px-6 py-3 text-ink hover:bg-signal hover:text-signal-ink">Browse templates</Link><Link href="/community/support" className="rounded-full border border-paper/30 px-6 py-3 hover:border-paper">Say hello</Link></div>
    </section>
  </div>;
}
