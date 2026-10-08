"use client";

import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "@fontsource-variable/familjen-grotesk";
import { useState } from "react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";
import { CountUp, Magnetic, Scrub } from "../motion";
import { Lightbox, Slider, StatusTabs, isSold, mail, money, monthlyPayment, parsePrice, statuses, tel, useLightbox, viewingLink, whatsapp } from "./re-kit";

/**
 * Front Door: for buyer's agents and first-time buyers. The front door opens
 * as you scroll, a mortgage calculator shows the monthly cost of every listing
 * live, visitors heart the homes they like and send the list in one tap.
 */
export default function FrontDoor({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const listings = c.projects ?? [];
  const gallery = (c.gallery ?? []).filter((item) => item.image);
  const box = useLightbox(gallery.length, embedded);
  const prices = listings.map((item) => parsePrice(item.client));
  const currency = prices.find(Boolean)?.currency ?? "USD";
  const typical = prices.filter(Boolean).map((p) => p!.amount).sort((a, b) => a - b)[Math.floor(prices.filter(Boolean).length / 2)] ?? 500_000;
  const [price, setPrice] = useState(Math.round(typical / 5000) * 5000);
  const [deposit, setDeposit] = useState(10);
  const [rate, setRate] = useState(6.5);
  const [years, setYears] = useState(30);
  const [status, setStatus] = useState<string | null>(null);
  const [saved, setSaved] = useState<number[]>([]);
  const perMonth = (amount: number) => monthlyPayment(amount * (1 - deposit / 100), rate, years);
  const monthly = perMonth(price);
  const totalInterest = monthly * years * 12 - price * (1 - deposit / 100);
  const loan = price * (1 - deposit / 100);
  const inBudget = listings.filter((_, index) => prices[index] && !isSold(listings[index]!.category) && prices[index]!.amount <= price).length;
  const shown = listings.map((item, index) => ({ item, index })).filter(({ item }) => !status || item.category === status);
  const toggle = (index: number) => setSaved((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index]);
  const savedText = `Hi ${c.name?.split(" ")[0] ?? ""}! I’d love to see these:\n${saved.map((index) => `• ${listings[index]?.title} (${listings[index]?.client})`).join("\n")}`;
  const sendSaved = whatsapp(c.phone, savedText) ?? mail(c.email, "Homes I’d like to see", savedText);
  const runNumbers = (index: number) => { const value = prices[index]?.amount; if (value) setPrice(value); document.getElementById("afford")?.scrollIntoView({ behavior: "smooth", block: "center" }); };

  return <StudioRoot studio={studio} className="text-[16px] leading-relaxed">
    <header className="flex items-center justify-between gap-4 px-5 py-5 @3xl:px-10">
      <span className="flex items-center gap-2 font-semibold" {...ed("name")}><span aria-hidden className="grid size-8 place-items-center rounded-lg ba text-[var(--t-bg)]">⌂</span>{c.name}</span>
      <nav className="flex items-center gap-2 text-[14px]">
        <a href="#homes" className="hidden rounded-full px-3 py-2 hover:bg-[var(--t-surface)] @2xl:inline">Homes</a>
        <a href="#afford" className="hidden rounded-full px-3 py-2 hover:bg-[var(--t-surface)] @2xl:inline">What can I afford?</a>
        <a href="#homes" className="flex items-center gap-1.5 rounded-full border-2 border-[var(--t-fg)] px-3.5 py-1.5 font-semibold"><span className={saved.length ? "ta" : ""}>♥</span><span className="tabular-nums">{saved.length}</span></a>
      </nav>
    </header>

    {/* Hero: a front door that swings open as you scroll, with the home behind it. */}
    <Scrub as="section" resting={1} className="grid items-center gap-10 px-5 pb-16 pt-6 @3xl:px-10 @4xl:grid-cols-[1.1fr_1fr]">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full bg-[var(--t-surface)] px-3 py-1.5 text-[13px] font-semibold" {...ed("availability")}><span className="size-2 animate-pulse rounded-full bg-[#2fbf71]" />{c.availability || c.professional_title}</p>
        <h1 className="fd mt-6 text-[clamp(1.2rem,2.4cqw,1.5rem)] font-semibold tm" {...ed("professional_title")}>{c.name}<span className="font-normal"> · {c.professional_title}</span></h1>
        <p className="fd mt-3 text-[clamp(3rem,9cqw,6.6rem)] font-[750] leading-[0.92] tracking-[-0.035em]" {...ed("tagline")}>{c.tagline}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a href="#afford" className="rounded-full ba px-6 py-3.5 font-semibold text-[var(--t-bg)] shadow-[0_6px_0_0_var(--t-fg)] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_3px_0_0_var(--t-fg)]">See what I can afford</a>
          <a href="#homes" className="rounded-full border-2 border-[var(--t-fg)] px-6 py-3.5 font-semibold hover:bg-[var(--t-fg)] hover:text-[var(--t-bg)]">Browse homes</a>
        </div>
      </div>
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[26rem] [perspective:1400px]">
        <div className="absolute inset-0 overflow-hidden rounded-t-[12rem] border-[10px] border-[var(--t-fg)] bg-[var(--t-surface)]"><Picture src={c.cover || listings[0]?.image} alt="" embedded={embedded} className="size-full" edit={c.cover ? "cover" : undefined} /></div>
        <div aria-hidden className="absolute inset-[10px] origin-left overflow-hidden rounded-t-[11.4rem] ba shadow-[inset_0_0_0_2px_rgba(0,0,0,.15)] [backface-visibility:hidden]" style={{ transform: "rotateY(clamp(-150deg, calc(-22deg + (var(--p) - .45) * -520deg), -22deg))" }}>
          <div className="absolute inset-x-8 top-16 h-[34%] rounded-t-[8rem] border-4 border-black/15" /><div className="absolute inset-x-8 bottom-10 h-[34%] rounded-lg border-4 border-black/15" />
          <span className="absolute right-6 top-1/2 size-5 rounded-full bg-[#f6c453] shadow-[0_2px_0_#9a7420]" />
        </div>
      </div>
    </Scrub>

    {has("stats") && <section className="mx-5 grid gap-3 @3xl:mx-10 @3xl:grid-cols-3">{(c.stats ?? []).map((stat, index) => <div key={index} className={`rounded-3xl p-7 ${index === 1 ? "ba text-[var(--t-bg)]" : "bg-[var(--t-surface)]"}`} {...ed(`stats.${index}`)}>
      <p className="fd text-[clamp(2.6rem,6cqw,4.4rem)] font-[750] leading-none tracking-[-0.03em]"><CountUp value={stat.value} /></p>
      <p className="mt-2 font-medium opacity-80">{stat.label}</p>
    </div>)}</section>}

    {/* The calculator every listing reads from. */}
    <section id="afford" className="px-5 py-20 @3xl:px-10 @3xl:py-24">
      <div className="overflow-hidden rounded-[2rem] border-2 border-[var(--t-fg)] bg-[var(--t-bg)] shadow-[10px_10px_0_0_var(--t-fg)]">
        <div className="grid @4xl:grid-cols-[1.1fr_1fr]">
          <div className="p-7 @3xl:p-10">
            <h2 className="fd text-[clamp(2.2rem,5cqw,3.6rem)] font-[750] leading-[0.98] tracking-[-0.03em]">What can I afford?</h2>
            <p className="mt-3 max-w-[30rem] tm">Slide to your numbers. Every home below updates to show its monthly cost.</p>
            <div className="mt-8 space-y-6">
              <Slider label="Home price" value={price} min={100_000} max={Math.max(2_000_000, price)} step={5000} onChange={setPrice} format={(value) => money(value, currency)} />
              <Slider label="Deposit" value={deposit} min={3} max={50} step={1} onChange={setDeposit} format={(value) => `${value}% · ${money(price * value / 100, currency, true)}`} />
              <Slider label="Interest rate" value={rate} min={1} max={10} step={0.05} onChange={setRate} format={(value) => `${value.toFixed(2)}%`} />
              <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]"><span className="opacity-75">Term</span><div className="flex gap-1.5">{[15, 20, 25, 30].map((term) => <button key={term} type="button" onClick={() => setYears(term)} aria-pressed={years === term} className={`whitespace-nowrap rounded-full px-3 py-1.5 font-semibold ${years === term ? "bg-[var(--t-fg)] text-[var(--t-bg)]" : "bg-[var(--t-surface)]"}`}>{term} yrs</button>)}</div></div>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-8 ba p-7 text-[var(--t-bg)] @3xl:p-10">
            <div>
              <p className="font-semibold opacity-80">Your monthly payment</p>
              <p className="fd mt-2 text-[clamp(3.2rem,9cqw,6rem)] font-[800] leading-none tracking-[-0.04em] tabular-nums" aria-live="polite">{money(monthly, currency)}</p>
              <p className="mt-2 text-[14px] opacity-80">Loan {money(loan, currency)} · {money(totalInterest, currency, true)} interest over {years} years</p>
              <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-black/20" aria-hidden><span className="bg-[var(--t-bg)] transition-[width] duration-500" style={{ width: `${(loan / (loan + Math.max(0, totalInterest))) * 100}%` }} /></div>
              <p className="mt-2 flex justify-between text-[12px] opacity-80"><span>Loan</span><span>Interest</span></p>
            </div>
            <div className="rounded-2xl bg-[var(--t-bg)] p-5 text-[var(--t-fg)]">
              <p className="fd text-[1.5rem] font-[750] leading-tight">{inBudget} {inBudget === 1 ? "home" : "homes"} in your budget</p>
              <p className="mt-1 text-[13px] tm">Before taxes and insurance. Ask me for a lender’s pre-approval.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {has("projects") && <section id="homes" className="px-5 pb-20 @3xl:px-10 @3xl:pb-24">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <h2 className="fd text-[clamp(2.2rem,5cqw,3.6rem)] font-[750] leading-none tracking-[-0.03em]">{label("projects", "Homes I love right now")}</h2>
        <StatusTabs options={statuses(listings)} value={status} onChange={setStatus} tab={(active) => `rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${active ? "bg-[var(--t-fg)] text-[var(--t-bg)]" : "bg-[var(--t-surface)] hover:bg-[var(--t-rule)]"}`} />
      </div>
      <ul className="mt-10 grid gap-6 @3xl:grid-cols-2 @5xl:grid-cols-3">{shown.map(({ item, index }) => {
        const amount = prices[index]?.amount;
        const liked = saved.includes(index);
        return <Reveal as="li" key={index} delay={(index % 3) * 90}><article className="group flex h-full flex-col overflow-hidden rounded-3xl border-2 border-[var(--t-fg)] bg-[var(--t-bg)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--t-fg)]" {...ed(`projects.${index}`)}>
          <div className="relative overflow-hidden">
            <Picture src={item.image} alt={item.title ?? ""} embedded={embedded} className="aspect-[4/3] w-full transition-transform duration-700 group-hover:scale-[1.05]" />
            {item.category && <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[12px] font-bold ${isSold(item.category) ? "bg-[var(--t-fg)] text-[var(--t-bg)]" : "bg-[var(--t-bg)]"}`}>{item.category}</span>}
            <button type="button" onClick={(event) => { event.stopPropagation(); toggle(index); }} aria-pressed={liked} aria-label={liked ? `Remove ${item.title} from saved homes` : `Save ${item.title}`} className={`absolute right-3 top-3 grid size-11 place-items-center rounded-full text-[1.3rem] transition-transform active:scale-125 ${liked ? "ba text-[var(--t-bg)]" : "bg-[var(--t-bg)] hover:scale-110"}`}>♥</button>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <p className="fd text-[1.8rem] font-[750] leading-none tracking-[-0.02em]">{item.client}</p>
            {amount && !isSold(item.category) && <p className="mt-1 text-[14px] font-semibold ta tabular-nums">≈ {money(perMonth(amount), currency)}/mo</p>}
            <h3 className="mt-3 font-semibold">{item.title}</h3>
            <p className="text-[14px] tm">{item.role}</p>
            <p className="mt-3 text-[14px] tm pretty">{item.description}</p>
            {!isSold(item.category) && <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <a href={viewingLink(c, item)} {...external(viewingLink(c, item))} className="rounded-full bg-[var(--t-fg)] px-4 py-2 text-[13px] font-semibold text-[var(--t-bg)] hover:opacity-85">Book a tour</a>
              {amount && <button type="button" onClick={() => runNumbers(index)} className="rounded-full bg-[var(--t-surface)] px-4 py-2 text-[13px] font-semibold hover:bg-[var(--t-rule)]">Run the numbers</button>}
            </div>}
          </div>
        </article></Reveal>;
      })}</ul>
      {saved.length > 0 && <div className="sticky bottom-4 z-10 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-full bg-[var(--t-fg)] py-2.5 pl-6 pr-2.5 text-[var(--t-bg)] shadow-2xl">
        <span className="font-semibold"><span className="ta">♥</span> {saved.length} saved {saved.length === 1 ? "home" : "homes"}</span>
        <a href={sendSaved} {...external(sendSaved)} className="rounded-full ba px-5 py-2.5 text-[14px] font-bold text-[var(--t-bg)]">Send them to {c.name?.split(" ")[0] || "me"}</a>
      </div>}
    </section>}

    {has("skills") && <section className="bg-[var(--t-surface)] px-5 py-16 @3xl:px-10" {...ed("skills")}>
      <h2 className="fd text-[clamp(1.8rem,4cqw,2.8rem)] font-[750] tracking-[-0.03em]">{label("skills", "Towns I know inside out")}</h2>
      <ul className="mt-6 flex flex-wrap gap-3">{(c.skills ?? []).map((town, index) => <li key={town} className="rounded-full border-2 border-[var(--t-fg)] bg-[var(--t-bg)] px-5 py-2.5 text-[1.05rem] font-semibold transition-transform hover:-rotate-3 hover:scale-105" style={{ rotate: `${(index % 3) - 1}deg` }}>{town}</li>)}</ul>
    </section>}

    {has("about") && <section className="grid items-center gap-12 px-5 py-20 @3xl:px-10 @3xl:py-24 @4xl:grid-cols-[0.8fr_1.2fr]">
      <div className="relative mx-auto w-full max-w-[22rem]">
        <span aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] ba" />
        <Picture src={c.avatar} alt={c.name ?? ""} embedded={embedded} prompt="Add your photo" className="relative aspect-square w-full -rotate-2 rounded-[2rem] border-2 border-[var(--t-fg)]" edit="avatar" />
      </div>
      <div>
        <h2 className="fd text-[clamp(2.2rem,5cqw,3.6rem)] font-[750] leading-none tracking-[-0.03em]">{label("about", `Hi, I’m ${c.name?.split(" ")[0] ?? ""}`)}</h2>
        <div className="mt-6 space-y-4 text-[1.08rem] leading-[1.75]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
        {has("highlights") && <ul className="mt-8 flex flex-wrap gap-2">{(c.highlights ?? []).map((item, index) => <li key={index} className="rounded-full bg-[var(--t-surface)] px-4 py-2 text-[14px] font-semibold" {...ed(`highlights.${index}`)}>★ {item.title}</li>)}</ul>}
      </div>
    </section>}

    {has("services") && <section className="px-5 pb-20 @3xl:px-10">
      <h2 className="fd text-[clamp(2.2rem,5cqw,3.6rem)] font-[750] leading-none tracking-[-0.03em]">{label("services", "How it works with me")}</h2>
      <ol className="mt-10 grid gap-4 @3xl:grid-cols-3">{(c.services ?? []).map((service, index) => <li key={index} className="rounded-3xl bg-[var(--t-surface)] p-7" {...ed(`services.${index}`)}>
        <span className="fd grid size-12 place-items-center rounded-full ba text-[1.3rem] font-[800] text-[var(--t-bg)]">{index + 1}</span>
        <h3 className="fd mt-5 text-[1.5rem] font-[750] leading-tight">{service.title}</h3>
        <p className="mt-2 tm">{service.description}</p>
        <p className="mt-4 text-[14px] font-bold">{service.price}</p>
      </li>)}</ol>
    </section>}

    {has("testimonials") && <section className="overflow-hidden py-16">
      <ul className="flex snap-x gap-5 overflow-x-auto px-5 pb-6 [scrollbar-width:none] @3xl:px-10">{(c.testimonials ?? []).map((item, index) => <li key={index} className="w-[min(85%,24rem)] shrink-0 snap-start rounded-3xl border-2 border-[var(--t-fg)] p-7" style={{ background: index % 2 ? "var(--t-surface)" : "var(--t-bg)", rotate: `${index % 2 ? 1.5 : -1.5}deg` }} {...ed(`testimonials.${index}`)}>
        <p className="ta">★★★★★</p>
        <blockquote className="fd mt-3 text-[1.35rem] font-semibold leading-snug">“{item.quote}”</blockquote>
        <p className="mt-5 text-[14px] font-semibold">{item.name} <span className="font-normal tm">· {item.role}</span></p>
      </li>)}</ul>
    </section>}

    {has("gallery") && gallery.length > 0 && <section className="px-5 pb-20 @3xl:px-10">
      <h2 className="fd text-[clamp(2rem,4cqw,3rem)] font-[750] tracking-[-0.03em]">{label("gallery", "Inside the homes")}</h2>
      <div className="mt-8 grid grid-cols-2 gap-3 @3xl:grid-cols-3">{gallery.map((item, index) => <button key={index} type="button" onClick={() => box.open(index)} className="group overflow-hidden rounded-2xl" {...ed(`gallery.${index}`)}><Picture src={item.image} alt={item.caption ?? ""} className="aspect-square w-full transition-transform duration-700 group-hover:scale-110" /></button>)}</div>
      <Lightbox items={gallery} box={box} accent={studio.accent} />
    </section>}

    {has("contact") && <footer id="contact" className="m-3 rounded-[2.5rem] ba px-6 py-20 text-center text-[var(--t-bg)] @3xl:m-5 @3xl:py-28">
      <h2 className="fd mx-auto max-w-[14ch] text-[clamp(2.8rem,8cqw,6rem)] font-[800] leading-[0.92] tracking-[-0.04em]">Let’s get you your keys.</h2>
      <p className="mx-auto mt-5 max-w-[30rem] text-[1.1rem] opacity-90">A free, no-pressure call about your budget, your towns and your timeline.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Magnetic><a href={mail(c.email, "Free buyer consultation")} className="inline-block rounded-full bg-[var(--t-bg)] px-7 py-4 font-bold text-[var(--t-fg)]" {...ed("email")}>Book my free consult</a></Magnetic>
        {c.phone && <a href={tel(c.phone)} className="rounded-full border-2 border-current px-7 py-4 font-bold" {...ed("phone")}>Call {c.phone}</a>}
      </div>
      <p className="mt-12 flex flex-wrap justify-center gap-5 text-[14px] font-semibold opacity-85">{contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="hover:underline">{link.label}</a>)}</p>
      {(c.education ?? [])[0] && <p className="mt-6 text-[12px] opacity-70" {...ed("education.0")}>{c.education![0]!.degree}</p>}
    </footer>}
  </StudioRoot>;
}
