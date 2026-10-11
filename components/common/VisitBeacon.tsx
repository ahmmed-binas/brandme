"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Counts a page view (no cookies; see lib/analytics/track.ts). Automated browsers aren't counted. */
export default function VisitBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof navigator === "undefined" || navigator.webdriver) return;
    // The time zone (e.g. "Asia/Dubai") gives the console a rough location without looking up IPs.
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
    const body = JSON.stringify({
      path: window.location.pathname,
      referrer: document.referrer || null,
      timeZone,
    });
    try {
      if (!navigator.sendBeacon?.("/api/t", new Blob([body], { type: "text/plain" })))
        void fetch("/api/t", { method: "POST", body, keepalive: true }).catch(() => undefined);
    } catch {
      /* counting never breaks a page */
    }
  }, [pathname]);
  return null;
}
