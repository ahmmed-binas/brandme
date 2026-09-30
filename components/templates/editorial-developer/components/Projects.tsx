"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Code2 as Github } from "lucide-react";
import { useEditorialData } from "../EditorialDataContext";
import SectionHeading from "./SectionHeading";
import RevealOnScroll from "./RevealOnScroll";

export default function Projects() {
  const portfolioData = useEditorialData();
  const { projects } = portfolioData;
  if (projects.length === 0) return null;

  const featured = projects.filter((p) => p.featured);
  const secondary = projects.filter((p) => !p.featured);

  return (
    <section id="projects" className="border-b border-line px-6 py-24 md:px-10">
      <div className="mx-auto max-w-content">
        <SectionHeading
          index="03"
          title="Projects"
          description="What I've actually built — including the tool I'm building right now."
        />

        <div className="md:ml-10 space-y-16">
          {featured.map((p, i) => (
            <RevealOnScroll key={p.id}>
              <Link
                href={`/templates/editorial-developer/projects/${p.slug}`}
                data-cursor="view"
                className="group grid gap-6 border-t border-line pt-8 md:grid-cols-[auto_1fr_auto] md:items-start"
              >
                <span className="font-mono text-sm text-muted">0{i + 1}</span>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-3xl md:text-4xl font-medium transition-colors group-hover:text-accent">
                      {p.name}
                    </h3>
                    <span className="border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                      {p.status.replace("-", " ")}
                    </span>
                  </div>
                  <p className="mt-3 max-w-xl text-muted leading-relaxed">{p.tagline}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.technologies.map((t) => (
                      <span key={t} className="font-mono text-xs text-muted">
                        {t}
                        {t !== p.technologies[p.technologies.length - 1] ? " ·" : ""}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-accent md:justify-end">
                  View case study <ArrowUpRight size={14} />
                </div>
              </Link>
            </RevealOnScroll>
          ))}

          {secondary.length > 0 && (
            <div className="border-t border-line pt-8">
              <p className="mb-6 font-mono text-xs text-muted">Other work</p>
              <div className="grid gap-6 sm:grid-cols-2">
                {secondary.map((p) => (
                  <RevealOnScroll key={p.id}>
                    <Link
                      href={`/templates/editorial-developer/projects/${p.slug}`}
                      data-cursor="view"
                      className="group block h-full border border-line p-6 transition-colors hover:border-accent"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-display text-xl font-medium">{p.name}</h4>
                        {p.github && !p.github.startsWith("[ADD") && (
                          <Github size={16} className="text-muted" />
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted leading-relaxed">{p.tagline}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {p.technologies.map((t) => (
                          <span key={t} className="font-mono text-[11px] text-muted">
                            {t}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </RevealOnScroll>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
