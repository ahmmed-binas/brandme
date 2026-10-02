"use client";

import { ArrowDownRight, ArrowUpRight, Code2, ExternalLink } from "lucide-react";
import { useEditorialData } from "../EditorialDataContext";
import SectionHeading from "./SectionHeading";
import RevealOnScroll from "./RevealOnScroll";

function hasRealContent(value?: string) {
  return Boolean(value?.trim() && !value.trim().startsWith("[ADD"));
}

export default function Projects() {
  const portfolioData = useEditorialData();
  const { projects } = portfolioData;
  if (projects.length === 0) return null;

  return (
    <section id="projects" className="border-b border-line px-6 py-24 md:px-10">
      <div className="mx-auto max-w-content">
        <SectionHeading
          index="03"
          title="Projects"
          description="What I've actually built — including the tool I'm building right now."
        />

        <div className="grid gap-5 md:ml-10 md:grid-cols-2">
          {projects.map((project, index) => {
            const notes = [
              ["Overview", project.description],
              ["The problem", project.problem],
              ["Approach", project.approach],
              ["Architecture", project.architecture],
              ["Challenges", project.challenges],
              ["Results", project.results],
            ] as const;
            const features = project.keyFeatures.filter(hasRealContent);

            return (
              <RevealOnScroll key={project.id}>
                <details className={`group h-full border border-line bg-surface/50 ${project.featured ? "md:col-span-2" : ""}`}>
                  <summary className="list-none cursor-pointer p-5 outline-none transition-colors hover:border-accent focus-visible:ring-2 focus-visible:ring-accent sm:p-7">
                    <div className="flex items-center justify-between gap-4 font-mono text-[11px] uppercase text-muted">
                      <span>Project note / {String(index + 1).padStart(2, "0")}</span>
                      <span className="border border-line px-2 py-1">{project.status.replace("-", " ")}</span>
                    </div>
                    <div className="mt-7 flex items-start justify-between gap-6">
                      <div>
                        <h3 className="font-display text-3xl font-medium leading-tight sm:text-4xl">{project.name}</h3>
                        <p className="mt-3 max-w-2xl leading-relaxed text-muted">{project.tagline}</p>
                      </div>
                      <ArrowDownRight className="mt-1 shrink-0 text-accent transition-transform group-open:rotate-[-90deg]" aria-hidden="true" />
                    </div>
                    <div className="mt-6 flex flex-wrap gap-x-3 gap-y-2 font-mono text-xs text-muted">
                      {project.technologies.map((technology) => <span key={technology}>{technology}</span>)}
                    </div>
                    <span className="sr-only">Expand project details for {project.name}</span>
                  </summary>

                  <div className="border-t border-line px-5 py-6 sm:px-7">
                    <div className="grid gap-6 sm:grid-cols-2">
                      {notes.filter(([, value]) => hasRealContent(value)).map(([label, value]) => (
                        <div key={label}>
                          <h4 className="font-mono text-[11px] uppercase text-accent">{label}</h4>
                          <p className="mt-2 leading-relaxed text-text">{value}</p>
                        </div>
                      ))}
                    </div>
                    {features.length > 0 && <div className="mt-6 border-t border-line pt-5"><h4 className="font-mono text-[11px] uppercase text-accent">Built into it</h4><ul className="mt-3 grid gap-2 sm:grid-cols-2">{features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-text"><span className="text-accent">/</span>{feature}</li>)}</ul></div>}
                    <div className="mt-6 flex flex-wrap gap-4 border-t border-line pt-5">
                      {hasRealContent(project.github) && <a href={project.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-mono text-xs text-accent hover:underline"><Code2 size={14} /> Source code <ArrowUpRight size={13} /></a>}
                      {hasRealContent(project.liveUrl) && <a href={project.liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-mono text-xs text-accent hover:underline"><ExternalLink size={14} /> Live project <ArrowUpRight size={13} /></a>}
                      {notes.every(([, value]) => !hasRealContent(value)) && features.length === 0 && <p className="text-sm text-muted">More project notes will be added as the work develops.</p>}
                    </div>
                  </div>
                </details>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
