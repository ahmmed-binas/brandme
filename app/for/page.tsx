import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ROLES, rolesByProfession } from "@/lib/templates/roles";
import { FIELDS } from "@/lib/templates/types";

export const metadata: Metadata = {
  title: "Portfolio websites for every job title",
  description: `Find your job among ${ROLES.length} titles — doctors, nurses, lawyers, salespeople, managers, teachers, tradespeople and more — and see a portfolio written for it.`,
  alternates: { canonical: "/for" },
};

/** Every job title we have sample content for, grouped by field and profession. */
export default function JobTitles() {
  const groups = rolesByProfession();
  return <div className="mx-auto max-w-[1320px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">{ROLES.length} job titles</p>
    <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.6rem,6vw,4.8rem)] font-[400] leading-[0.95] tracking-[-0.03em] text-ink [font-variation-settings:'opsz'_48]">Find your job. <em className="font-[300] text-signal">See your portfolio.</em></h1>
    <p className="mt-6 max-w-[38rem] text-[1.08rem] leading-[1.7] text-ink-soft">Pick what you do and every template previews with a portfolio written for that job: the right services, credentials and wording. Then make it yours.</p>
    <div className="mt-16 space-y-16">{FIELDS.map((field) => {
      const inField = groups.filter((group) => group.profession.field === field.id);
      if (!inField.length) return null;
      return <section key={field.id} aria-labelledby={`field-${field.id}`}>
        <h2 id={`field-${field.id}`} className="border-b border-ink pb-3 font-display text-[2rem] tracking-[-0.02em] text-ink">{field.label}</h2>
        <div className="mt-8 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{inField.map(({ profession, roles }) => <div key={profession.id}>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">{profession.label}</h3>
          <ul className="mt-3 space-y-1.5">{roles.map((role) => <li key={role.id}><Link href={`/for/${role.id}`} className="group inline-flex items-center gap-1.5 text-[1rem] text-ink hover:text-signal">{role.label}<ArrowRight size={13} className="opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" /></Link></li>)}</ul>
        </div>)}</div>
      </section>;
    })}</div>
  </div>;
}
