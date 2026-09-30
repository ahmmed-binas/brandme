"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-6">

      <div className="max-w-4xl text-center">

        <motion.h1
          initial={{ opacity:0, y:30 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.7 }}
          className="text-6xl md:text-8xl font-bold tracking-tight"
        >
          Build your
          <br />

          <span className="text-neutral-500">
            digital identity
          </span>

          <br />

          with AI
        </motion.h1>


        <motion.p
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay:0.3 }}
          className="mt-8 text-lg text-neutral-600 dark:text-neutral-400"
        >
          Shape a considered portfolio that presents your work with clarity.
        </motion.p>


        <div className="mt-10 flex justify-center gap-4">

          <Link
            href="/templatechooser"
            className="rounded-full bg-black text-white dark:bg-white dark:text-black px-8 py-4 font-medium"
          >
            Start your portfolio
          </Link>


          <Link
            href="/templatechooser"
            className="rounded-full border px-8 py-4"
          >
            Explore portfolios
          </Link>

        </div>

      </div>

    </section>
  );
}
