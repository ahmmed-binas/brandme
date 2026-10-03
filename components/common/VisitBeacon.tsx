"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Counts a page view (no cookies; see lib/analytics/track.ts). Automated browsers aren't counted. */
export default function VisitBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof navigator === "undefined" || navigator.webdriver) return;
    const body = JSON.stringify({ path: window.location.pathname, referrer: document.referrer || null });
    try {
      if (!navigator.sendBeacon?.("/api/t", new Blob([body], { type: "text/plain" }))) void fetch("/api/t", { method: "POST", body, keepalive: true }).catch(() => undefined);
    } catch { /* counting never breaks a page */ }
  }, [pathname]);
  return null;
}
