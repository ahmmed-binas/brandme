import { FAQ } from "./faq";

/** Native <details> keeps the answers in the HTML for search engines and works without JavaScript. */
export default function Faq() {
  return <div className="divide-y divide-rule border-y border-rule">
    {FAQ.map((item) => (
      <details key={item.q} className="group py-1 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-display text-[clamp(1.25rem,2vw,1.55rem)] leading-snug tracking-[-0.01em] text-ink outline-none focus-visible:underline">
          {item.q}
          <span aria-hidden className="relative size-4 shrink-0"><span className="absolute left-0 top-1/2 h-px w-4 bg-ink" /><span className="absolute left-1/2 top-0 h-4 w-px bg-ink transition-transform duration-300 group-open:rotate-90" /></span>
        </summary>
        <p className="max-w-[44rem] pb-6 text-[1.02rem] leading-[1.7] text-ink-soft">{item.a}</p>
      </details>
    ))}
  </div>;
}
