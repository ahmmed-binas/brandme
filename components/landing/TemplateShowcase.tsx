"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { EditorialMock, KineticMock, MidnightMock } from "./TemplateMocks";

const SHOWCASE = [
  { id: "editorial-developer", name: "Editorial", for: "Developers and engineers who want case studies to lead", Mock: EditorialMock, className: "lg:col-span-7 lg:row-span-2", height: "h-[460px] lg:h-full lg:min-h-[640px]" },
  { id: "template-one", name: "Midnight", for: "Designers and front-end developers", Mock: MidnightMock, className: "lg:col-span-5", height: "h-[300px]" },
  { id: "kinetic-portfolio", name: "Kinetic", for: "Creative technologists and consultants", Mock: KineticMock, className: "lg:col-span-5", height: "h-[300px]" },
];

export default function TemplateShowcase() {
  const reduce = useReducedMotion();
  return <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:grid-rows-[auto_auto]">
    {SHOWCASE.map((item, index) => (
      <motion.div key={item.id} className={item.className} initial={reduce ? false : { opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.8, delay: index * 0.1, ease: [0.2, 0.7, 0.1, 1] }}>
        <Link href={`/templates/${item.id}?demo=true`} className="group flex h-full flex-col">
          <div className={`relative overflow-hidden rounded-xl border border-rule ${item.height}`}>
            <div className="absolute inset-0 origin-top transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.1,1)] group-hover:scale-[1.025]"><item.Mock name="Ada Lovelace" role="Product designer" featured={index === 0} /></div>
            <span className="absolute right-4 top-4 grid size-10 translate-y-1 place-items-center rounded-full bg-ink text-paper opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight size={17} /></span>
          </div>
          <div className="mt-4 flex items-baseline justify-between gap-4">
            <h3 className="font-display text-[1.6rem] leading-none tracking-[-0.02em] text-ink">{item.name}</h3>
            <p className="text-right text-[0.92rem] text-ink-soft">{item.for}</p>
          </div>
        </Link>
      </motion.div>
    ))}
  </div>;
}
