"use client";

import { useEffect, useRef, useState } from "react";
import type { StandardContent } from "@/lib/portfolio/schema";
import type { TemplateDefinition } from "@/lib/templates/types";
import StudioTemplate from "@/components/templates/studio/registry";

/** The width the template is laid out at before being scaled into the frame, so it shows its desktop design. */
const LAYOUT_WIDTH = 1280;

/**
 * A real template, live, scaled down into the hero's browser frame, with the
 * visitor's name in it. It drifts slowly down the page and back so it reads as
 * a working website; still for reduced motion. Clicks pass to the frame, not
 * the template.
 */
export function LiveTemplatePreview({
  template,
  content,
}: {
  template: TemplateDefinition;
  content: StandardContent;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.4);
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const measure = () => setScale(node.clientWidth / LAYOUT_WIDTH);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={box} className="absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="pointer-events-none origin-top-left select-none"
        style={{ width: LAYOUT_WIDTH, transform: `scale(${scale})` }}
        inert
      >
        <div className="[animation:hero-pan_26s_ease-in-out_infinite_alternate] motion-reduce:animate-none">
          <StudioTemplate template={template} content={content} />
        </div>
      </div>
      <style>
        {"@keyframes hero-pan{0%,12%{transform:translateY(0)}88%,100%{transform:translateY(-1100px)}}"}
      </style>
    </div>
  );
}
