"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/brand";

/**
 * Counts page views, and clicks on Fuccura's own WhatsApp and email buttons
 * as leads (no cookies; see lib/analytics/track.ts and lib/analytics/leads.ts).
 * Automated browsers aren't counted.
 */
export default function VisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof navigator === "undefined" || navigator.webdriver) return;
    // The time zone (e.g. "Asia/Dubai") gives the console a rough location without looking up IPs.
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
    send({ path: window.location.pathname, referrer: document.referrer || null, timeZone });
  }, [pathname]);

  // One listener for the whole page catches every WhatsApp or email link, wherever it is.
  useEffect(() => {
    if (typeof navigator === "undefined" || navigator.webdriver) return;
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      const lead = link ? leadKind(link.getAttribute("href") ?? "") : null;
      if (lead) send({ path: window.location.pathname, lead });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}

/** "whatsapp" or "email" when a link goes to Fuccura itself (not a customer's own number). */
function leadKind(href: string): "whatsapp" | "email" | null {
  const number = brand.whatsapp.replace(/\D/g, "");
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href) && href.replace(/\D/g, "").includes(number))
    return "whatsapp";
  if (href.toLowerCase().startsWith(`mailto:${brand.contactEmail.toLowerCase()}`)) return "email";
  return null;
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  try {
    if (!navigator.sendBeacon?.("/api/t", new Blob([body], { type: "text/plain" })))
      void fetch("/api/t", { method: "POST", body, keepalive: true }).catch(() => undefined);
  } catch {
    /* counting never breaks a page */
  }
}
