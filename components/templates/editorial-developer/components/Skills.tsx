"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { type SkillEntry } from "../data";
import { useEditorialData } from "../EditorialDataContext";
import SectionHeading from "./SectionHeading";
import RevealOnScroll from "./RevealOnScroll";

const CATEGORY_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  devops: "DevOps",
  ai: "AI / ML",
  tools: "Tools",
};

export default function Skills() {
  const portfolioData = useEditorialData();
  const { skills, projects } = portfolioData;
  const [active, setActive] = useState<string | null>(null);

  const categories = Object.entries(skills).filter(([, list]) => (list as SkillEntry[]).length > 0);
  if (categories.length === 0) return null;

  const relatedProjects = (name: string) =>
    projects.filter((p) => p.technologies.includes(name)).map((p) => p.name);

  return (
    <section id="skills" className="border-b border-line px-6 py-24 md:px-10">
      <div className="mx-auto max-w-content">
        <SectionHeading
          index="04"
          title="Skills"
          description="Hover a technology to see where it's actually been used."
        />

        <div className="md:ml-10">
          {categories.map(([cat, list]) => (
            <RevealOnScroll key={cat}>
              <div className="border-t border-line py-6">
                <div className="grid gap-4 md:grid-cols-[140px_1fr]">
                  <p className="font-mono text-xs text-muted">{CATEGORY_LABELS[cat] ?? cat}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {(list as SkillEntry[]).map((skill) => {
                      const uses = relatedProjects(skill.name);
                      return (
                        <div
                          key={skill.name}
                          className="relative"
                          onMouseEnter={() => setActive(skill.name)}
                          onMouseLeave={() => setActive(null)}
                        >
                          <span
                            data-cursor="interactive"
                            className={`font-display text-lg transition-colors ${
                              active === skill.name ? "text-accent" : "text-text"
                            }`}
                          >
                            {skill.name}
                          </span>
                          {active === skill.name && uses.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className="absolute left-0 top-full z-10 mt-2 w-max max-w-[220px] border border-line bg-surface px-3 py-2 font-mono text-[11px] text-muted"
                            >
                              Used in: {uses.join(", ")}
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
