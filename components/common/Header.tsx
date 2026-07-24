"use client";

import Image from "next/image";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-white/80 backdrop-blur-md dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

         
       {/* <Link href="/" className="flex items-center gap-3">*/}
          <Image
            src="/favicon.ico"
            alt="CV Gen Logo"
            width={42}
            height={42}
            className="rounded-lg"
          />

          <span className="text-xl font-bold tracking-tight">
            CV Gen
          </span>
        {/*</Link>*/}


        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">

          <Link 
            href="/templates"
            className="hover:text-blue-600 transition"
          >
            Templates
          </Link>

          <Link 
            href="/features"
            className="hover:text-blue-600 transition"
          >
            Features
          </Link>

          <Link 
            href="/pricing"
            className="hover:text-blue-600 transition"
          >
            Pricing
          </Link>


            <Link 
    href="/DetailExtractorPage"
    className="hover:text-blue-600 transition"
  >
    Detail Extractor
  </Link>

        </nav>


        {/* Right side */}
        <div className="flex items-center gap-3">

          {/* Theme */}
          {mounted && (
            <button
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
              className="rounded-full border p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === "dark" ? (
                <Sun size={18}/>
              ) : (
                <Moon size={18}/>
              )}
            </button>
          )}


          <Link
            href="/login"
            className="hidden sm:block text-sm hover:text-blue-600"
          >
            Login
          </Link>


          <Link
            href="/signup"
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Get Started
          </Link>

        </div>

      </div>
    </header>
  );
}