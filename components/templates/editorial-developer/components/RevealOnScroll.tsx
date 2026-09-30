"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

// Shared scroll-reveal wrapper. Respects prefers-reduced-motion by skipping
// the transform entirely (only opacity changes) rather than disabling the
// reveal outright, so content still becomes visible without motion.
export default function RevealOnScroll({
  children,
  delay = 0,
  className = "",
  y = 24,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
