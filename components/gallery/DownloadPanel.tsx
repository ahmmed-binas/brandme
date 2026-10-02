"use client";

import { useState } from "react";
import { CheckCircle2, Download } from "lucide-react";

/** The free download button. After clicking, it points to the setup steps right below. */
export function DownloadButton({ href, label = "Download free" }: { href: string; label?: string }) {
  const [started, setStarted] = useState(false);
  return <div>
    <a href={href} download onClick={() => { setStarted(true); window.setTimeout(() => document.getElementById("setup")?.scrollIntoView({ behavior: "smooth", block: "start" }), 400); }}
      className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[0.98rem] font-medium text-paper transition-colors hover:bg-signal hover:text-signal-ink"><Download size={17} /> {label}</a>
    {started && <p role="status" className="mt-3 inline-flex items-center gap-2 text-[0.9rem] text-emerald-800"><CheckCircle2 size={16} /> Downloading. The setup steps are below.</p>}
  </div>;
}

/** Plays the design's clip on a loop, or shows the still frame for people who prefer less motion. */
export function ClipPlayer({ clips, poster, title }: { clips: { src: string; type: string }[]; poster: string; title: string }) {
  if (!clips.length) {
    // eslint-disable-next-line @next/next/no-img-element -- cover from the designer
    return <img src={poster} alt={`${title}, cover image`} className="size-full object-cover object-top" />;
  }
  return <>
    <video poster={poster} autoPlay muted loop playsInline className="size-full object-cover object-top motion-reduce:hidden" aria-label={`${title}, a short clip scrolling through the design`}>{clips.map((clip) => <source key={clip.src} src={clip.src} type={clip.type} />)}</video>
    {/* eslint-disable-next-line @next/next/no-img-element -- still frame for reduced motion */}
    <img src={poster} alt={`${title}, still`} className="hidden size-full object-cover object-top motion-reduce:block" />
  </>;
}
