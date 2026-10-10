"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { CursorRipples, FlowingGradient } from "shaders/react";
import { ShaderStage } from "@/components/templates/studio/realestate/re-shader";

const LOOKS = {
  dark: { base: "#100f0d", silk: ["#100f0d", "#17121f", "#2a1f3d", "#4a3415"], fallback: "radial-gradient(60% 60% at 78% 20%, rgba(196,133,28,.28), transparent 70%), radial-gradient(50% 50% at 10% 90%, rgba(91,58,143,.3), transparent 70%)" },
  light: { base: "#f4f0e8", silk: ["#f4f0e8", "#f0e6d4", "#e8e0f0", "#efd9ad"], fallback: "radial-gradient(60% 60% at 78% 20%, rgba(224,164,58,.25), transparent 70%), radial-gradient(50% 50% at 10% 90%, rgba(150,120,210,.2), transparent 70%)" },
} as const;

/**
 * Behind the homepage hero: slow silk in the brand's gold and violet that
 * ripples where the cursor moves. Kept quiet so the headline and the live
 * template stay the focus. Follows light and dark mode.
 */
export function HeroBackdrop() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const frame = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(frame); }, []);
  const look = LOOKS[mounted && resolvedTheme === "light" ? "light" : "dark"];
  return <ShaderStage key={mounted ? resolvedTheme : "initial"} fallback={look.fallback} opacity={0.9}>
    <CursorRipples intensity={6} decay={10} radius={0.4} chromaticSplit={0.3}>
      <FlowingGradient colorA={look.silk[0]} colorB={look.silk[1]} colorC={look.silk[2]} colorD={look.silk[3]} speed={0.3} distortion={0.6} />
    </CursorRipples>
  </ShaderStage>;
}
