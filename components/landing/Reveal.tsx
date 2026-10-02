"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Fades content up once as it scrolls into view. Content is server-rendered and visible without JavaScript. */
export default function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.8, delay, ease: [0.2, 0.7, 0.1, 1] }}>{children}</motion.div>;
}
