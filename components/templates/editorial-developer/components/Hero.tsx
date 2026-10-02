"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useEditorialData } from "../EditorialDataContext";
import Terminal from "./Terminal";

export default function Hero() {
  const portfolioData = useEditorialData();
  const shouldReduceMotion = useReducedMotion();
  const { personal } = portfolioData;

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <section id="top" className="relative flex min-h-screen items-center border-b border-line px-6 pt-28 md:px-10">
      <div className="mx-auto grid w-full max-w-content items-center gap-14 md:grid-cols-[1.3fr_1fr]">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p variants={item} className="mb-6 font-mono text-xs uppercase text-muted">
            {personal.name} / {personal.title} / {personal.subtitle}
          </motion.p>

          <motion.h1
            variants={item}
            className="font-display text-4xl font-medium leading-[1.02] text-balance sm:text-5xl md:text-6xl lg:text-7xl"
          >
            I build the parts
            <br />
            people can count on.
          </motion.h1>

          <motion.p variants={item} className="mt-7 max-w-lg text-muted leading-relaxed">
            {personal.positioning}
          </motion.p>

          <motion.div variants={item} className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-muted">
            <span>{personal.location}</span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              {personal.availability}
            </span>
          </motion.div>

          <motion.div variants={item} className="mt-10 flex flex-wrap gap-4">
            <a
              href="#projects"
              data-cursor="interactive"
              className="border border-text bg-text px-6 py-3 font-mono text-xs tracking-wide text-bg transition-opacity hover:opacity-80"
            >
              Explore my work
            </a>
            <a
              href="#contact"
              data-cursor="interactive"
              className="border border-line px-6 py-3 font-mono text-xs tracking-wide text-text transition-colors hover:border-accent hover:text-accent"
            >
              Let&apos;s talk
            </a>
          </motion.div>
        </motion.div>

        <div className="flex justify-center md:justify-end">
          <Terminal />
        </div>
      </div>

      <motion.a
        href="#snapshot"
        aria-label="Scroll to next section"
        data-cursor="interactive"
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-muted md:block"
        animate={shouldReduceMotion ? {} : { y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowDown size={16} />
      </motion.a>
    </section>
  );
}
