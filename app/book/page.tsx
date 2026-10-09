import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { bookingUrl } from "@/lib/booking";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a free call",
  description: `A free 20-minute demo or design call with the ${brand.name} team: see the product, or talk through a custom website with your own designer, more than three sites, or having your site looked after for you.`,
  alternates: { canonical: "/book" },
};

/** The owner's Cal.com calendar, shown in the page, with a direct link in case the embed doesn't load. */
export default function BookPage() {
  const url = bookingUrl();
  if (!url) redirect("/contact");
  const embed = new URL(url);
  embed.searchParams.set("embed", "true");

  return <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
    <header className="max-w-[44rem]">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Book a free call</p>
      <h1 className="mt-4 font-display text-[clamp(2.4rem,5.5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">Twenty minutes, <em className="font-[300] text-signal">no obligation.</em></h1>
      <p className="mt-5 text-[1.05rem] leading-[1.7] text-ink-soft">Use it as a free demo (we’ll show you the editor, the designs for your job and the Investigator) or to talk through what you need: a custom design with your own designer, more than three sites, a team, or someone to build and look after your site for you. We’ll agree a price on the call before any work starts. Pick a time below; you’ll get a confirmation email with a calendar invite.</p>
      <p className="mt-4"><a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[0.95rem] text-ink underline underline-offset-4"><CalendarDays size={16} /> Open the calendar in a new tab <ArrowUpRight size={14} /></a></p>
    </header>
    <div className="mt-10 overflow-hidden rounded-2xl border border-rule bg-white">
      <iframe src={embed.toString()} title="Choose a time for your call" className="h-[760px] w-full" loading="lazy" />
    </div>
    <p className="mt-6 text-[0.9rem] text-ink-faint">Times are shown in your own time zone. Prefer email? <Link href="/contact" className="underline underline-offset-4">Write to us</Link> instead.</p>
  </div>;
}
