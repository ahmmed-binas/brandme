"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useEditorialData } from "../EditorialDataContext";
import SectionHeading from "./SectionHeading";
import RevealOnScroll from "./RevealOnScroll";

function formatRange(start: string, end: string) {
  return `${start} — ${end}`;
}

export default function Experience() {
  const portfolioData = useEditorialData();
  const { experience } = portfolioData;
  const [openId, setOpenId] = useState<string | null>(experience[0]?.id ?? null);

  if (experience.length === 0) return null;

  return (
    <section id="experience" className="border-b border-line px-6 py-24 md:px-10">
      <div className="mx-auto max-w-content">
        <SectionHeading index="02" title="Experience" />

        <div className="md:ml-10">
          {experience.map((exp) => {
            const isOpen = openId === exp.id;
            return (
              <RevealOnScroll key={exp.id}>
                <div className="border-t border-line">
                  <button
                    onClick={() => setOpenId(isOpen ? null : exp.id)}
                    data-cursor="interactive"
                    className="flex w-full items-start justify-between gap-6 py-6 text-left"
                    aria-expanded={isOpen}
                  >
                    <div className="flex flex-1 flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="font-display text-xl md:text-2xl">{exp.role}</span>
                      <span className="font-mono text-sm text-muted">{exp.company}</span>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted">
                      {formatRange(exp.startDate, exp.endDate)}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="grid gap-8 pb-8 md:grid-cols-[1fr_1fr]">
                          <div>
                            <p className="text-muted leading-relaxed">{exp.summary}</p>
                            {exp.responsibilities.length > 0 && (
                              <ul className="mt-5 space-y-2">
                                {exp.responsibilities.map((r) => (
                                  <li key={r} className="flex gap-3 text-sm text-text">
                                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div>
                            <p className="mb-3 font-mono text-xs text-muted">Technologies</p>
                            <div className="flex flex-wrap gap-2">
                              {exp.technologies.map((t) => (
                                <span
                                  key={t}
                                  className="border border-line px-3 py-1 font-mono text-xs text-text"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                            {exp.link && (
                              <a
                                href={exp.link}
                                data-cursor="external"
                                className="mt-5 inline-flex items-center gap-1.5 font-mono text-xs text-accent underline-hover"
                              >
                                Company site <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </RevealOnScroll>
            );
          })}
          <div className="border-t border-line" />
        </div>
      </div>
    </section>
  );
}
