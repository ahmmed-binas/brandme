"use client";

import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource-variable/figtree";
import { useState } from "react";
import { Reveal, StudioRoot, contactLinks, ed, external, firstName, paragraphs, useStudio, type StudioProps } from "../kit";

/** A slow breathing circle: four seconds in, four out. Pauses for reduced motion via the kit's CSS. */
function Breath() {
  const [paused, setPaused] = useState(false);
  return <button type="button" onClick={() => setPaused((value) => !value)} className="group relative mx-auto grid aspect-square w-[min(22rem,70cqw)] place-items-center" aria-label={paused ? "Resume breathing guide" : "Pause breathing guide"}>
    <span className="absolute inset-0 rounded-full bg-[color-mix(in_oklab,var(--t-accent)_22%,transparent)] [animation:sanctuary-breathe_8s_ease-in-out_infinite]" style={{ animationPlayState: paused ? "paused" : "running" }} />
    <span className="absolute inset-[18%] rounded-full bg-[color-mix(in_oklab,var(--t-accent)_38%,transparent)] [animation:sanctuary-breathe_8s_ease-in-out_infinite_.4s]" style={{ animationPlayState: paused ? "paused" : "running" }} />
    <span className="fd relative text-[1.4rem] italic"><span className="[animation:sanctuary-in_8s_ease-in-out_infinite]" style={{ animationPlayState: paused ? "paused" : "running" }}>breathe</span></span>
    <style>{`@keyframes sanctuary-breathe{0%,100%{transform:scale(.82)}50%{transform:scale(1)}}@keyframes sanctuary-in{0%,100%{opacity:.55}50%{opacity:1}}`}</style>
  </button>;
}

export default function Sanctuary({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const intro = c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Introduction")}` : "#contact";

  return <StudioRoot studio={studio} className="text-[17px] leading-[1.7]">
    <header className="mx-auto flex max-w-[66rem] items-center justify-between px-6 py-6 text-[15px]"><span className="fd text-[1.3rem]" {...ed("name")}>{c.name}</span><a href={intro} className="rounded-full bs px-5 py-2 transition-colors hover:bg-[var(--t-accent)] hover:text-[var(--t-bg)]">Get in touch</a></header>

    <section className="mx-auto grid max-w-[66rem] items-center gap-12 px-6 py-16 @4xl:grid-cols-[1.2fr_1fr]">
      <div>
        <p className="text-[15px] tm" {...ed("professional_title")}>{c.professional_title}</p>
        <h1 className="fd mt-4 text-[clamp(2.8rem,7cqw,5.4rem)] font-[350] leading-[1.02] tracking-[-0.02em] balance" {...ed("tagline")}>{c.tagline}</h1>
        <p className="mt-6 tm">{c.location}</p>
        {c.availability && <p className="mt-6 inline-flex items-center gap-2 rounded-full bs px-4 py-1.5 text-[15px]" {...ed("availability")}><span className="size-2 rounded-full ba" />{c.availability}</p>}
      </div>
      <Breath />
    </section>

    {has("about") && <section className="mx-auto max-w-[44rem] px-6 py-16 text-center">
      <h2 className="fd text-[2.2rem] italic">{label("about", `Hello, I’m ${firstName(c.name)}`)}</h2>
      <div className="mt-6 space-y-5 text-[1.15rem]">{paragraphs(c).map(({ text, index }) => <p key={index} className="pretty" {...ed(`summary.${index}`)}>{text}</p>)}</div>
    </section>}

    {has("services") && <section className="px-6 py-16"><div className="mx-auto max-w-[66rem]">
      <h2 className="fd text-center text-[2.2rem]">{label("services", "Ways we can work together")}</h2>
      <div className="mt-10 grid gap-5 @3xl:grid-cols-2">{(c.services ?? []).map((service, index) => <Reveal key={index} delay={(index % 2) * 100} className="rounded-[2rem] bs p-8"><div {...ed(`services.${index}`)}>
        <div className="flex items-baseline justify-between gap-4"><h3 className="fd text-[1.6rem]">{service.title}</h3>{service.price && <span className="fd shrink-0 text-[1.3rem] ta">{service.price}</span>}</div>
        <p className="mt-2 tm">{service.description}</p>
      </div></Reveal>)}</div>
      <p className="mt-6 text-center text-[15px] tm">Not sure which is right? <a href={intro} className="underline decoration-[var(--t-accent)] underline-offset-4">Ask me</a>, there’s no obligation.</p>
    </div></section>}

    {has("testimonials") && <section className="px-6 py-16"><div className="mx-auto grid max-w-[66rem] gap-6 @3xl:grid-cols-2">{(c.testimonials ?? []).map((item, index) => <figure key={index} className="rounded-[2rem] border rule p-8" {...ed(`testimonials.${index}`)}><blockquote className="fd text-[1.4rem] italic leading-snug">“{item.quote}”</blockquote><figcaption className="mt-4 text-[14px] tm">{item.name}, {item.role}</figcaption></figure>)}</div></section>}

    <section className="mx-auto grid max-w-[66rem] gap-12 px-6 py-16 @3xl:grid-cols-2">
      {has("education") && <div><h2 className="fd text-[1.7rem]">{label("education", "Training & registration")}</h2><ul className="mt-4 space-y-3">{(c.education ?? []).map((item, index) => <li key={index} {...ed(`education.${index}`)}><p>{item.school}</p><p className="text-[15px] tm">{item.degree}{item.end_date && `, ${item.end_date}`}</p></li>)}</ul></div>}
      {has("experience") && <div><h2 className="fd text-[1.7rem]">{label("experience", "Experience")}</h2><ul className="mt-4 space-y-3">{(c.experience ?? []).map((role, index) => <li key={index} {...ed(`experience.${index}`)}><p>{role.job_title}, {role.company}</p><p className="text-[15px] tm">{[role.start_date, role.end_date].filter(Boolean).join("–")}</p></li>)}</ul></div>}
      {has("highlights") && <div className="@3xl:col-span-2"><h2 className="fd text-[1.7rem]">{label("highlights", "Workshops")}</h2><ul className="mt-4 space-y-2">{(c.highlights ?? []).map((item, index) => <li key={index} {...ed(`highlights.${index}`)}>{item.title}<span className="tm"> · {item.detail} {item.year}</span></li>)}</ul></div>}
    </section>

    {has("contact") && <footer id="contact" className="px-6 pb-12"><div className="mx-auto max-w-[66rem] rounded-[2.5rem] ba px-8 py-16 text-center text-[var(--t-bg)]">
      <h2 className="fd mx-auto max-w-[30rem] text-[clamp(2rem,4.6cqw,3rem)] leading-tight">The first step can be a small one.</h2>
      <a href={intro} className="mt-8 inline-block rounded-full bg-[var(--t-bg)] px-7 py-3 font-medium text-[var(--t-fg)]" {...ed("email")}>Write to {firstName(c.name)}</a>
      <p className="mt-6 flex justify-center gap-6 text-[15px] opacity-85">{contactLinks(c).filter((link) => !link.url.startsWith("mailto:")).map((link) => <a key={link.url} href={link.url} {...external(link.url)} className="underline-offset-4 hover:underline">{link.label}</a>)}</p>
      <p className="mt-8 text-[13px] opacity-75">If you are in crisis, please contact your local emergency number or a crisis line right away.</p>
    </div></footer>}
  </StudioRoot>;
}
