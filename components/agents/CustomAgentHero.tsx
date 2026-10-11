"use client";

import { DotGrid, FlowingGradient, Godrays } from "shaders/react";
import { ShaderStage } from "@/components/templates/studio/realestate/re-shader";

/** The moving background behind the custom-agents hero: slow silk colour, a light from above and a field of points. */
export function CustomAgentHero() {
  return (
    <ShaderStage
      fallback="radial-gradient(70% 60% at 70% 10%, rgba(224,164,58,.35), transparent 70%), radial-gradient(60% 60% at 10% 90%, rgba(94,53,177,.35), transparent 70%), #0b0a09"
      className="-z-10"
      opacity={0.95}
    >
      <FlowingGradient
        colorA="#0b0a09"
        colorB="#2a1a4a"
        colorC="#6b3fa0"
        colorD="#e0a43a"
        speed={0.35}
        distortion={0.7}
      />
      <Godrays
        center={{ x: 0.72, y: -0.1 }}
        rayColor="#f3d29a"
        density={0.18}
        intensity={0.35}
        spotty={0.5}
        speed={0.2}
      />
      <DotGrid color="#ffffff" density={70} dotSize={0.06} twinkle={0.7} speed={0.3} opacity={0.25} />
    </ShaderStage>
  );
}
