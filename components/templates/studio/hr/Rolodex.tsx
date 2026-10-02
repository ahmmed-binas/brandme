"use client";

import "@fontsource/young-serif/400.css";
import "@fontsource-variable/dm-sans";
import "@fontsource/courier-prime/400.css";
import "@fontsource/courier-prime/700.css";
import { Fragment, useState } from "react";
import { Picture, Reveal, StudioRoot, contactLinks, ed, external, paragraphs, useStudio, type StudioProps } from "../kit";

const tel = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#");
const type = "font-[family-name:var(--t-mono)]";

/** An index card: red header rule, blue feint lines, a tab on top. */
function Card({ tab, tabAt = "left", children, className = "", ...rest }: { tab?: string; tabAt?: "left" | "right"; children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`relative ${tab ? "mt-7" : ""} ${className}`} {...rest}>
    {tab && <span className={`absolute -top-7 ${tabAt === "left" ? "left-6" : "right-6"} rounded-t-[6px] bs px-4 pb-1 pt-1.5 ${type} text-[12px] font-bold uppercase tracking-[0.1em] shadow-[0_-1px_0_var(--t-rule)]`}>{tab}</span>}
    <div className="relative h-full rounded-[6px] bs p-6 shadow-[0_1px_0_var(--t-rule),0_18px_30px_-22px_rgba(0,0,0,.55)] [background-image:linear-gradient(transparent_3.1rem,var(--t-accent)_3.1rem,var(--t-accent)_calc(3.1rem+1.5px),transparent_calc(3.1rem+1.5px)),repeating-linear-gradient(transparent_0_calc(1.6rem-1px),color-mix(in_oklab,#5b8bd9_30%,transparent)_calc(1.6rem-1px)_1.6rem)] [background-position:0_0,0_3.15rem] @3xl:p-8">{children}</div>
  </div>;
}

export default function Rolodex({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const files = c.projects ?? [];
  const [open, setOpen] = useState(0);
  const current = files[Math.min(open, Math.max(files.length - 1, 0))];
  const letter = (text?: string) => (text ?? "").replace(/^the\s+/i, "").trim().charAt(0).toUpperCase() || "•";

  return <StudioRoot studio={studio} className="text-[16px] leading-[1.6rem]">
    <div className="mx-auto max-w-[72rem] px-5 pb-16 @3xl:px-10">
      <header className="flex items-center justify-between py-6"><span className="fd text-[1.3rem]">{c.name}</span><a href={c.email ? `mailto:${c.email}` : "#contact"} className={`${type} text-[14px] font-bold uppercase hover-a`}>Get in touch</a></header>

      {/* The top card of the file, with others peeking out behind it. */}
      <section className="relative mt-8 grid gap-10 @4xl:grid-cols-[1.25fr_1fr]">
        <div className="relative">
          <div aria-hidden className="absolute inset-x-6 -top-3 h-full -rotate-[2.2deg] rounded-[6px] bs opacity-70 shadow-[0_1px_0_var(--t-rule)]" />
          <div aria-hidden className="absolute inset-x-3 -top-1.5 h-full rotate-[1.4deg] rounded-[6px] bs opacity-85 shadow-[0_1px_0_var(--t-rule)]" />
          <Card tab={letter(c.name?.split(" ").slice(-1)[0])}>
            <p className={`${type} text-[13px] uppercase tracking-[0.1em] tm`} {...ed("location")}>{c.location}</p>
            <h1 className="fd mt-6 text-[clamp(2.4rem,6cqw,4.2rem)] [line-height:1.05]" {...ed("name")}>{c.name}</h1>
            <p className={`${type} mt-3 text-[15px] font-bold`} {...ed("professional_title")}>{c.professional_title}</p>
            <p className="fd mt-6 text-[1.45rem] [line-height:1.25] balance" {...ed("tagline")}>{c.tagline}</p>
            {c.availability && <p className={`${type} mt-6 inline-block -rotate-1 border-2 border-[var(--t-accent)] px-3 py-1 text-[13px] font-bold uppercase ta`} {...ed("availability")}>{c.availability}</p>}
            <div aria-hidden className="mt-8 flex justify-center gap-16"><span className="h-3 w-10 rounded-full bg-[var(--t-bg)] shadow-[inset_0_1px_2px_rgba(0,0,0,.35)]" /><span className="h-3 w-10 rounded-full bg-[var(--t-bg)] shadow-[inset_0_1px_2px_rgba(0,0,0,.35)]" /></div>
          </Card>
        </div>
        {has("stats") && <dl className="grid content-end gap-4">{(c.stats ?? []).map((stat, index) => <Card key={index} tab={stat.label} tabAt="right" {...ed(`stats.${index}`)}><dd className="fd text-[clamp(2.4rem,5cqw,3.6rem)] leading-none tabular-nums">{stat.value}</dd><dt className="sr-only">{stat.label}</dt></Card>)}</dl>}
      </section>

      {has("projects") && current && <section className="mt-24">
        <h2 className="fd text-[clamp(2rem,4cqw,2.8rem)]">{label("projects", "On file")}</h2>
        <div className="mt-6 flex flex-wrap gap-1.5" role="tablist" aria-label="Files">{files.map((item, index) => <button key={index} type="button" role="tab" aria-selected={open === index} onClick={() => setOpen(index)} className={`rounded-t-[6px] px-4 py-2 ${type} text-[13px] font-bold uppercase transition-colors ${open === index ? "bs" : "bg-[color-mix(in_oklab,var(--t-fg)_8%,transparent)] tm hover:text-[var(--t-fg)]"}`}>{letter(item.title)} · {item.year}</button>)}</div>
        <div key={open} className="[animation:rolodex-flip_.45s_cubic-bezier(.2,.7,.1,1)] motion-reduce:animate-none">
          <Card className="!mt-0" {...ed(`projects.${open}`)}>
            <div className={`grid gap-8 ${current.image ? "@3xl:grid-cols-[1.4fr_1fr]" : ""}`}>
              <div>
                <p className={`${type} text-[13px] uppercase tm`}>{[current.category, current.client].filter(Boolean).join(" · ")}</p>
                <h3 className="fd mt-6 text-[clamp(1.6rem,3.4cqw,2.3rem)] [line-height:1.1]">{current.title}</h3>
                {current.role && <p className={`${type} mt-2 text-[14px] font-bold`}>{current.role}</p>}
                <p className={`${type} mt-4 max-w-[38rem] text-[15px] leading-[1.6rem]`}>{current.description}</p>
              </div>
              {current.image && <Picture src={current.image} alt="" embedded={embedded} className="aspect-[4/3] w-full rounded-[4px]" />}
            </div>
          </Card>
        </div>
        <style>{"@keyframes rolodex-flip{from{transform:perspective(900px) rotateX(-14deg) translateY(-10px);opacity:.3}}"}</style>
      </section>}

      {has("services") && <section className="mt-24">
        <h2 className="fd text-[clamp(2rem,4cqw,2.8rem)]">{label("services", "Working together")}</h2>
        <div className="mt-4 grid gap-5 @3xl:grid-cols-3">{(c.services ?? []).map((service, index) => <Reveal key={index} delay={index * 70}><Card tab={service.price} tabAt="right" className="h-full" {...ed(`services.${index}`)}>
          <h3 className="fd text-[1.4rem] [line-height:1.15]">{service.title}</h3>
          <p className={`${type} mt-6 text-[15px]`}>{service.description}</p>
        </Card></Reveal>)}</div>
      </section>}

      {(has("about") || has("skills")) && <section className="mt-24 grid gap-10 @4xl:grid-cols-[1fr_1.4fr]">
        <h2 className="fd text-[clamp(2rem,4cqw,2.8rem)]">{label("about", "About me")}</h2>
        <div>
          <div className="space-y-4 text-[1.08rem] leading-relaxed">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
          {has("skills") && <ul className="mt-6 flex flex-wrap gap-2" {...ed("skills")}>{(c.skills ?? []).map((skill) => <li key={skill} className={`rounded-[4px] bs px-3 py-1 ${type} text-[13px] shadow-[0_1px_0_var(--t-rule)]`}>{skill}</li>)}</ul>}
        </div>
      </section>}

      {has("experience") && <section className="mt-24">
        <h2 className="fd text-[clamp(2rem,4cqw,2.8rem)]">{label("experience", "Career")}</h2>
        <ul className="mt-6 divide-y divide-[var(--t-rule-strong)] border-y border-[var(--t-rule-strong)]">{(c.experience ?? []).map((role, index) => <li key={index} className="grid gap-1 py-4 @3xl:grid-cols-[10rem_1fr_1fr] @3xl:gap-6" {...ed(`experience.${index}`)}><span className={`${type} text-[14px] tm`}>{[role.start_date, role.end_date].filter(Boolean).join(" – ")}</span><b className="font-semibold">{role.job_title}</b><span className="tm">{role.company}</span></li>)}
          {(c.education ?? []).map((item, index) => <li key={`e${index}`} className="grid gap-1 py-4 @3xl:grid-cols-[10rem_1fr_1fr] @3xl:gap-6" {...ed(`education.${index}`)}><span className={`${type} text-[14px] tm`}>{item.end_date}</span><span>{item.degree}</span><span className="tm">{item.school}</span></li>)}</ul>
      </section>}

      {has("testimonials") && <section className="mt-24 grid gap-6 @3xl:grid-cols-2">{(c.testimonials ?? []).map((item, index) => <Card key={index} tab={`Ref. ${index + 1}`} {...ed(`testimonials.${index}`)}>
        <blockquote className="fd text-[1.35rem] [line-height:1.3]">“{item.quote}”</blockquote>
        <p className={`${type} mt-6 text-[13px] uppercase`}>{item.name} — {item.role}</p>
      </Card>)}</section>}

      {has("highlights") && <section className="mt-24"><h2 className="fd text-[clamp(2rem,4cqw,2.8rem)]">{label("highlights", "Talks & tools")}</h2>
        <ul className="mt-6 space-y-2">{(c.highlights ?? []).map((item, index) => <li key={index} className="flex flex-wrap justify-between gap-x-6" {...ed(`highlights.${index}`)}><span>{item.url ? <a href={item.url} {...external(item.url)} className="underline underline-offset-4 hover-a">{item.title}</a> : item.title}{item.detail && <span className="tm"> · {item.detail}</span>}</span><span className={`${type} text-[14px] tm`}>{item.year}</span></li>)}</ul>
      </section>}

      {has("contact") && <footer id="contact" className="mt-24">
        <Card tab="Add to your file">
          <div className="grid gap-6 @3xl:grid-cols-[1fr_1.3fr]">
            <h2 className="fd text-[clamp(2rem,4.4cqw,3rem)] [line-height:1.05]">{c.name}</h2>
            <dl className={`${type} grid grid-cols-[6rem_1fr] gap-y-[0.1rem] text-[15px]`}>
              <dt className="tm">Email</dt><dd className="break-all"><a href={c.email ? `mailto:${c.email}` : "#"} className="font-bold hover-a" {...ed("email")}>{c.email}</a></dd>
              {c.phone && <><dt className="tm">Phone</dt><dd><a href={tel(c.phone)} className="hover-a" {...ed("phone")}>{c.phone}</a></dd></>}
              {contactLinks(c).filter((link) => !/^(mailto|tel):/.test(link.url)).map((link) => <Fragment key={link.url}><dt className="tm">{link.label}</dt><dd className="truncate"><a href={link.url} {...external(link.url)} className="hover-a">{link.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a></dd></Fragment>)}
            </dl>
          </div>
        </Card>
      </footer>}
    </div>
  </StudioRoot>;
}
