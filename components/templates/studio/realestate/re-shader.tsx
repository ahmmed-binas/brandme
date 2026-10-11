"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Shader } from "shaders/react";
import { motionOff } from "../motion";

/**
 * A live GPU background (the MIT `shaders` package, WebGPU) behind a section,
 * with a CSS fallback that is always painted first. The shader only starts
 * when the browser has WebGPU, motion is on (not a still capture or reduced
 * motion) and the section is near the screen; it stops again when scrolled
 * well away, so a long page never runs more than one or two at once.
 * Cursor effects still work through `pointer-events: none`: the library
 * listens on the window.
 *
 * Telemetry to shaders.com is always off: visitors to customers' sites are
 * not reported anywhere.
 */
export function ShaderStage({
  fallback,
  className = "",
  children,
  opacity = 1,
}: {
  fallback: string;
  className?: string;
  children: ReactNode;
  opacity?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [near, setNear] = useState(false);
  const [able, setAble] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || motionOff() || !("gpu" in navigator)) return;
    const frame = requestAnimationFrame(() => setAble(true));
    const observer = new IntersectionObserver(([entry]) => setNear(Boolean(entry?.isIntersecting)), {
      rootMargin: "300px 0px",
    });
    observer.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const live = able && near && !failed;
  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ background: fallback }}
    >
      {live && (
        <Shader
          disableTelemetry
          onReady={() => setReady(true)}
          onUnavailable={() => setFailed(true)}
          className="absolute inset-0 size-full transition-opacity duration-[1400ms]"
          style={{ opacity: ready ? opacity : 0 }}
        >
          {children}
        </Shader>
      )}
    </div>
  );
}
