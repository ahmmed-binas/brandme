"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEditorialData } from "../EditorialDataContext";
import SectionHeading from "./SectionHeading";
import RevealOnScroll from "./RevealOnScroll";

export default function EngineeringApproach() {
  const portfolioData = useEditorialData();
  const { engineeringApproach } = portfolioData;
  const [openId, setOpenId] = useState<string | null>(null);
  if (engineeringApproach.length === 0) return null;

  return (
    <section className="border-b border-line px-6 py-24 md:px-10">
      <div className="mx-auto max-w-content">
        <SectionHeading index="05" title="How I work" />

        <div className="md:ml-10">
          {engineeringApproach.map((stage, i) => {
            const isOpen = openId === stage.id;
            return (
              <RevealOnScroll key={stage.id} delay={i * 0.03}>
                <button
                  onClick={() => setOpenId(isOpen ? null : stage.id)}
                  data-cursor="interactive"
                  className="flex w-full items-center gap-6 border-t border-line py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="w-8 font-mono text-xs text-muted">0{i + 1}</span>
                  <span className="font-display text-xl md:text-2xl">{stage.stage}</span>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden whitespace-nowrap text-sm text-muted"
                      >
                        — {stage.description}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </RevealOnScroll>
            );
          })}
          <div className="border-t border-line" />
        </div>
      </div>
    </section>
  );
}
