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

/** A slow moving wall of the profession collection, each linking to its gallery filter. */
const COLLECTION: Array<[string, string, string]> = [
  ["darkroom", "Photographers", "photo"], ["salon", "Painters", "art"], ["plan-section", "Architects", "architecture"], ["seminar", "Researchers", "academic"],
  ["terminal", "Engineers", "developer"], ["broadsheet", "Journalists", "writing"], ["liner-notes", "Musicians", "music"], ["swiss", "Designers", "design"],
  ["credits", "Film-makers", "film"], ["practice", "Consultants", "consulting"], ["sanctuary", "Therapists", "wellness"], ["notebook", "Data scientists", "data"],
  ["brief", "Lawyers", "legal"], ["clinic", "Doctors", "healthcare"], ["site-board", "Electricians", "trades"], ["open-house", "Estate agents", "realestate"],
  ["exercise-book", "Teachers", "education"], ["carte", "Chefs", "food"], ["lookbook", "Hair stylists", "beauty"], ["prospectus", "Accountants", "finance"],
];

export function CollectionStrip() {
  const reduce = useReducedMotion();
  return <div className="relative -mx-5 mt-16 overflow-hidden sm:-mx-8 [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
    <ul className={`flex w-max gap-5 px-5 hover:[animation-play-state:paused] ${reduce ? "" : "[animation:studio-marquee_70s_linear_infinite]"}`}>
      {[...COLLECTION, ...COLLECTION].map(([id, label, filter], index) => <li key={`${id}-${index}`} aria-hidden={index >= COLLECTION.length} className="w-[18rem] shrink-0">
        <Link href={`/templatechooser?for=${filter}`} tabIndex={index >= COLLECTION.length ? -1 : undefined} className="group block">
          {/* eslint-disable-next-line @next/next/no-img-element -- static thumbnails */}
          <img src={`/templates/${id}.webp`} alt="" loading="lazy" className="aspect-[3/2] w-full rounded-lg border border-rule object-cover object-top transition-transform duration-500 group-hover:-translate-y-1" />
          <p className="mt-2 text-[0.92rem] text-ink-soft group-hover:text-ink">For {label.toLowerCase()} →</p>
        </Link>
      </li>)}
    </ul>
    <style>{"@keyframes studio-marquee { to { transform: translateX(-50%) } }"}</style>
  </div>;
}

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
