"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// Desktop-only custom cursor. Disabled entirely on touch devices and when
// the user prefers reduced motion — it degrades to the normal system cursor.
export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [variant, setVariant] = useState<"default" | "interactive" | "view" | "external">("default");

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springConfig = { damping: 30, stiffness: 400, mass: 0.4 };
  const sx = useSpring(x, springConfig);
  const sy = useSpring(y, springConfig);

  useEffect(() => {
    const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isFinePointer || prefersReducedMotion) return;
    setEnabled(true);

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target as HTMLElement;
      const el = target.closest("[data-cursor]");
      if (el) {
        const kind = el.getAttribute("data-cursor");
        if (kind === "view") { setVariant("view"); setLabel("VIEW"); }
        else if (kind === "external") { setVariant("external"); setLabel("↗"); }
        else { setVariant("interactive"); setLabel(null); }
      } else {
        setVariant("default");
        setLabel(null);
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);

  if (!enabled) return null;

  const size = variant === "view" ? 64 : variant === "default" ? 10 : 40;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[999] flex items-center justify-center rounded-full mix-blend-difference"
      style={{
        x: sx,
        y: sy,
        translateX: "-50%",
        translateY: "-50%",
        width: size,
        height: size,
        backgroundColor: variant === "default" ? "#ECEBE1" : "transparent",
        border: variant === "default" ? "none" : "1px solid #ECEBE1",
      }}
      transition={{ type: "spring", ...springConfig }}
    >
      {label && (
        <span className="font-mono text-[10px] tracking-widest text-[#ECEBE1]">{label}</span>
      )}
    </motion.div>
  );
}
