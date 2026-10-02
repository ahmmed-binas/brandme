import Link from "next/link";
import { brand } from "@/lib/brand";

const COLUMNS = [
  { title: "Product", links: [["Templates", "/templatechooser"], ["Find your job", "/for"], ["Pricing", "/pricing"], ["How it works", "/#how-it-works"], ["Your account", "/account"]] },
  { title: "Company", links: [["About", "/about"], ["Community", "/community"], ["Support", "/community/support"], ["Journal", "/blog"]] },
  { title: "Free tools", links: [["PDF editor", "/tools/pdf-editor"], ["Merge PDFs", "/tools/merge-pdf"], ["All tools", "/tools"]] },
] as const;

export default function Footer() {
  return <footer className="border-t border-rule bg-paper text-ink">
    <div className="mx-auto max-w-[1320px] px-5 pt-16 sm:px-8">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="max-w-[24ch] font-display text-[1.7rem] leading-[1.1] tracking-[-0.02em]">Portfolios that are easy to trust, at an address that’s yours.</p>
          <a href={`mailto:${brand.contactEmail}`} className="mt-6 inline-block font-mono text-[13px] text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink">{brand.contactEmail}</a>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className="md:col-span-2">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">{column.title}</h2>
            <ul className="mt-4 space-y-2.5 text-[0.95rem]">{column.links.map(([label, href]) => <li key={href}><Link href={href} className="text-ink-soft transition-colors hover:text-ink">{label}</Link></li>)}</ul>
          </nav>
        ))}
      </div>
      <p aria-hidden className="mt-20 select-none overflow-hidden whitespace-nowrap font-display text-[min(29.5vw,28.5rem)] font-[300] leading-[0.78] tracking-[-0.06em] text-ink [font-variation-settings:'opsz'_144]">{brand.name}</p>
      <div className="flex flex-col gap-2 border-t border-rule py-6 text-[0.85rem] text-ink-faint sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} {brand.name}</p>
        <p>Set in Fraunces and Hanken Grotesk.</p>
      </div>
    </div>
  </footer>;
}
