import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { availableTemplates } from "@/lib/templates/approval";
import { ROLES, roleById } from "@/lib/templates/roles";
import { PROFESSIONS } from "@/lib/templates/types";

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const role = roleById((await params).role);
  if (!role) return {};
  return {
    title: `Portfolio website for ${role.plural}`,
    description: `A personal website for ${role.plural}: ${role.starter.services.map((service) => service[0].toLowerCase()).slice(0, 3).join(", ")}, credentials and reviews in one place. Your own domain, kept up to date for you.`,
    alternates: { canonical: `/for/${role.id}` },
  };
}

/** A landing page per job title: what the portfolio says, and the designs that suit it. */
export default async function RolePage({ params }: { params: Promise<{ role: string }> }) {
  const role = roleById((await params).role);
  if (!role) notFound();
  const s = role.starter;
  const available = await availableTemplates();
  const preferred = role.templates ?? [];
  const designs = available.filter((template) => template.collection === "studio" && (preferred.includes(template.id) || template.professions?.includes(role.profession)))
    .sort((a, b) => (preferred.indexOf(a.id) < 0 ? 99 : preferred.indexOf(a.id)) - (preferred.indexOf(b.id) < 0 ? 99 : preferred.indexOf(b.id))).slice(0, 6);
  const profession = PROFESSIONS.find((item) => item.id === role.profession);
  const related = ROLES.filter((item) => item.profession === role.profession && item.id !== role.id).slice(0, 12);

  return <div className="mx-auto max-w-[1320px] px-5 pb-24 pt-10 sm:px-8 lg:pt-16">
    <nav className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft"><Link href="/for" className="hover:text-ink">Job titles</Link> / {profession?.label}</nav>
    <header className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
      <h1 className="font-display text-[clamp(2.6rem,6vw,4.8rem)] font-[400] leading-[0.95] tracking-[-0.03em] text-ink [font-variation-settings:'opsz'_48]">A portfolio website <em className="font-[300] text-signal">for {role.plural}.</em></h1>
      <div>
        <p className="text-[1.08rem] leading-[1.7] text-ink-soft">One place for your services, fees, credentials and reviews, on your own domain. Every design below previews with a {role.label.toLowerCase()}’s sample portfolio, so you can see exactly how yours will read.</p>
        {designs[0] && <Link href={`/editor/${designs[0].id}?role=${role.id}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[0.95rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink">Start with {designs[0].name} <ArrowRight size={16} /></Link>}
      </div>
    </header>

    <section className="mt-16 grid gap-px overflow-hidden rounded-xl border border-rule bg-rule md:grid-cols-3" aria-label="What the sample portfolio includes">
      <div className="bg-card p-7"><p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">The headline</p><p className="mt-3 font-display text-[1.5rem] leading-snug text-ink">“{s.tagline}”</p></div>
      <div className="bg-card p-7"><p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Services & fees</p><ul className="mt-3 space-y-2 text-[0.98rem] text-ink">{s.services.map(([title, , price]) => <li key={title} className="flex justify-between gap-4"><span>{title}</span><span className="shrink-0 text-ink-soft">{price}</span></li>)}</ul></div>
      <div className="bg-card p-7"><p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Skills & credentials</p><p className="mt-3 text-[0.98rem] leading-relaxed text-ink">{s.skills.split(" · ").slice(0, 6).join(" · ")}</p><p className="mt-3 text-[0.9rem] text-ink-soft">{s.education.map((item) => item[0]).join(" · ")}</p></div>
    </section>

    {designs.length > 0 && <section className="mt-20" aria-labelledby="designs">
      <h2 id="designs" className="font-display text-[2.2rem] tracking-[-0.02em] text-ink">Designs that suit {role.plural}</h2>
      <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-3">{designs.map((template) => <li key={template.id}>
        <Link href={`/templatepreview?template=${template.id}&role=${role.id}`} className="group block overflow-hidden rounded-xl border border-rule" aria-label={`Preview ${template.name} for ${role.plural}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static thumbnails, already sized */}
          <img src={`/templates/${template.id}.webp`} alt="" loading="lazy" className="aspect-[3/2] w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]" />
        </Link>
        <div className="mt-4 flex items-baseline justify-between gap-4"><h3 className="font-display text-[1.6rem] leading-none text-ink">{template.name}</h3><Link href={`/templatepreview?template=${template.id}&role=${role.id}`} className="inline-flex items-center gap-1 text-[0.9rem] text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">Preview <ArrowUpRight size={13} /></Link></div>
        <p className="mt-2 text-[0.96rem] leading-relaxed text-ink-soft">{template.description}</p>
      </li>)}</ul>
    </section>}

    {related.length > 0 && <section className="mt-20 border-t border-rule pt-8"><h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Other {profession?.label.toLowerCase()} roles</h2>
      <ul className="mt-4 flex flex-wrap gap-2">{related.map((item) => <li key={item.id}><Link href={`/for/${item.id}`} className="inline-block rounded-full border border-rule px-3.5 py-1.5 text-[0.9rem] text-ink-soft hover:border-ink hover:text-ink">{item.label}</Link></li>)}</ul>
    </section>}
  </div>;
}
