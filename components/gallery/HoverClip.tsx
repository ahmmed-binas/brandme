"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A design's thumbnail that plays its short preview video while the pointer is
 * over it (the gallery clips in public/gallery). The video only loads on the
 * first hover, so a page full of designs stays light. Touch screens and reduced
 * motion just show the picture.
 */
export function HoverClip({ id, alt }: { id: string; alt: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);

  const [hovering, setHovering] = useState(false);

  const start = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setArmed(true);
    setHovering(true);
  };
  // Play once the <video> exists (it's only added on the first hover).
  useEffect(() => {
    const node = video.current;
    if (!node || !hovering) return;
    node.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, [armed, hovering]);
  const stop = () => {
    setHovering(false);
    video.current?.pause();
    setPlaying(false);
  };

  return (
    <div className="relative" onMouseEnter={start} onMouseLeave={stop}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static thumbnails, already sized */}
      <img
        src={`/templates/${id}.webp`}
        alt={alt}
        loading="lazy"
        className="aspect-[3/2] w-full object-cover object-top"
      />
      {armed && (
        <video
          ref={video}
          muted
          loop
          playsInline
          preload="auto"
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${playing ? "opacity-100" : "opacity-0"}`}
        >
          <source src={`/gallery/${id}.webm`} type="video/webm" />
          <source src={`/gallery/${id}.mp4`} type="video/mp4" />
        </video>
      )}
      <span
        className={`pointer-events-none absolute bottom-3 left-3 rounded-full [@media(hover:none)]:hidden bg-black/60 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-white backdrop-blur transition-opacity duration-300 ${playing ? "opacity-0" : "opacity-100"}`}
      >
        ▶ Hover to play
      </span>
    </div>
  );
}
