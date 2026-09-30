"use client";

import { motion } from "framer-motion";
import { useEditorialData } from "../EditorialDataContext";
import SectionHeading from "./SectionHeading";
import RevealOnScroll from "./RevealOnScroll";

export default function About() {
  const portfolioData = useEditorialData();
  const { about } = portfolioData;

  return (
    <section id="about" className="border-b border-line px-6 py-24 md:px-10">
      <div className="mx-auto max-w-content">
        <SectionHeading index="01" title="About" />

        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr] md:ml-10">
          <RevealOnScroll>
            <div className="space-y-6 text-lg leading-relaxed text-text">
              <p>{about.introduction}</p>
              <p className="text-muted">{about.philosophy}</p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1}>
            <div className="border border-line p-6">
              <p className="mb-4 font-mono text-xs text-muted">Currently exploring</p>
              <ul className="space-y-3">
                {about.currentlyExploring.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.5 }}
                    className="flex items-center justify-between border-b border-line pb-3 font-display text-lg"
                  >
                    <span>{item}</span>
                    <span className="font-mono text-xs text-muted">0{i + 1}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
