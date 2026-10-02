"use client";

import { useState } from "react";

/** The live preview in an iframe, with a loading state until the page inside has painted. */
export default function PreviewFrame({ src, title }: { src: string; title: string }) {
  const [loaded, setLoaded] = useState<string | null>(null);
  const ready = loaded === src;
  return <div className="relative h-[70vh] min-h-[480px] bg-white">
    {!ready && <div role="status" className="absolute inset-0 z-10 grid place-items-center bg-paper">
      <div className="flex flex-col items-center gap-4 text-ink-soft">
        <span className="size-9 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span className="text-[0.9rem]">Loading preview…</span>
      </div>
    </div>}
    <iframe key={src} src={src} title={title} onLoad={() => setLoaded(src)} className={`size-full border-0 bg-white transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`} />
  </div>;
}
