"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { useEditorialData } from "../EditorialDataContext";

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    let frame: number;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);
  return value;
}

function Stat({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const count = useCountUp(value, inView);
  return (
    <div ref={ref} className="border-t border-line py-6">
      <div className="font-display text-4xl md:text-5xl font-medium">
        {count}
        {suffix}
      </div>
      <div className="mt-2 font-mono text-xs text-muted">{label}</div>
    </div>
  );
}

export default function DeveloperSnapshot() {
  const portfolioData = useEditorialData();
  const { snapshot, personal, projects, skills } = portfolioData;
  const yearsNum = Number.parseInt(snapshot.yearsBuilding, 10);
  const technologyCount = new Set([
    ...skills.frontend,
    ...skills.backend,
    ...skills.database,
    ...skills.devops,
    ...skills.ai,
    ...skills.tools,
  ].map((skill) => skill.name.trim()).filter(Boolean)).size;
  const stats = [
    Number.isFinite(yearsNum) ? { value: yearsNum, suffix: "+", label: "Years building" } : null,
    projects.length ? { value: projects.length, suffix: "+", label: "Projects" } : null,
    technologyCount ? { value: technologyCount, suffix: "", label: "Core technologies" } : null,
  ].filter((stat): stat is { value: number; suffix: string; label: string } => stat !== null);

  return (
    <section id="snapshot" className="border-b border-line px-6 py-20 md:px-10">
      <div className="mx-auto grid max-w-content grid-cols-2 gap-x-8 lg:grid-cols-4">
        {stats.map((stat) => <Stat key={stat.label} {...stat} />)}
        <div className="border-t border-line py-6">
          <div className="font-display text-xl font-medium leading-tight md:text-2xl">
            {personal.availability}
          </div>
          <div className="mt-2 font-mono text-xs text-muted">Availability</div>
        </div>
      </div>
    </section>
  );
}
