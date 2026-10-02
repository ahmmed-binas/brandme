import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { getTemplate, DEFAULT_TEMPLATE_ID } from "@/lib/templates/catalog";
import { ROLES, roleById } from "@/lib/templates/roles";
import PreviewFrame from "@/components/templates/PreviewFrame";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ template?: string }> }): Promise<Metadata> {
  const selected = getTemplate((await searchParams).template ?? "") ?? getTemplate(DEFAULT_TEMPLATE_ID)!;
  return { title: `${selected.name} template`, description: selected.description, alternates: { canonical: `/templates/${selected.id}` } };
}

export default async function TemplatePreviewPage({ searchParams }: { searchParams: Promise<{ template?: string; role?: string }> }) {
  const { template, role: roleId } = await searchParams;
  const selected = getTemplate(template ?? "") ?? getTemplate(DEFAULT_TEMPLATE_ID)!;
  const role = selected.collection === "studio" ? roleById(roleId) : undefined;
  const withRole = role ? `&role=${role.id}` : "";
  // Job titles this design suits, so a visitor can see it with content like theirs.
  const suggested = selected.collection === "studio" ? ROLES.filter((item) => selected.professions?.includes(item.profession) && (item.templates?.includes(selected.id) || item.profession === selected.professions?.[0])).slice(0, 12) : [];
  return <div className="mx-auto max-w-[1320px] px-5 pb-20 pt-10 sm:px-8">
    <Link href="/templatechooser" className="inline-flex items-center gap-2 text-[0.92rem] text-ink-soft hover:text-ink"><ArrowLeft size={15} /> All templates</Link>
    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
      <div className="lg:col-span-4 lg:pt-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">{selected.style} · {selected.category}</p>
        <h1 className="mt-4 font-display text-[clamp(2.4rem,4.4vw,3.6rem)] font-[400] leading-[0.98] tracking-[-0.03em] text-ink [font-variation-settings:'opsz'_48]">{selected.name}</h1>
        <p className="mt-5 text-[1.05rem] leading-[1.7] text-ink-soft">{selected.description}</p>
        <ul className="mt-6 space-y-2 text-[0.95rem] text-ink-soft">{selected.idealFor.map((role) => <li key={role} className="flex gap-3"><span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-ink" />{role}</li>)}</ul>
        <div className="mt-9 flex flex-wrap items-center gap-5">
          <Link href={`/editor/${selected.id}${role ? `?role=${role.id}` : ""}`} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[0.95rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink">Use this template <ArrowRight size={16} /></Link>
          <Link href={`/templates/${selected.id}?sample=1&demo=true${withRole}`} target="_blank" className="inline-flex items-center gap-1 text-[0.95rem] text-ink underline decoration-rule underline-offset-[5px] hover:decoration-ink">Full screen <ArrowUpRight size={14} /></Link>
        </div>
        {suggested.length > 0 && <div className="mt-10 border-t border-rule pt-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Preview it as</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">{suggested.map((item) => <li key={item.id}><Link href={`/templatepreview?template=${selected.id}&role=${item.id}`} scroll={false} aria-current={item.id === role?.id ? "true" : undefined} className={`inline-block rounded-full border px-3 py-1.5 text-[0.85rem] transition-colors ${item.id === role?.id ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft hover:border-ink hover:text-ink"}`}>{item.label}</Link></li>)}</ul>
          {role && <Link href={`/templatepreview?template=${selected.id}`} scroll={false} className="mt-3 inline-block text-[0.85rem] text-ink-soft underline underline-offset-4 hover:text-ink">Show the original sample</Link>}
        </div>}
      </div>
      <div className="lg:col-span-8">
        <div className="overflow-hidden rounded-xl border border-rule bg-card shadow-[0_40px_80px_-40px_rgb(21_20_15/0.4)]">
          <div className="flex items-center gap-3 border-b border-rule px-4 py-2.5"><span aria-hidden className="flex gap-1.5">{[0, 1, 2].map((dot) => <span key={dot} className="size-2.5 rounded-full border border-rule" />)}</span><span className="flex-1 truncate rounded-md bg-paper-deep px-3 py-1.5 font-mono text-[12px] text-ink-faint">{role ? `Sample portfolio for a ${role.label.toLowerCase()}` : "Live preview with sample content"}</span></div>
          <PreviewFrame src={`/templates/${selected.id}?sample=1&demo=true${withRole}`} title={`${selected.name} live preview`} />
        </div>
      </div>
    </div>
  </div>;
}
