"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Reloads the page's data every few seconds, so live activity keeps itself up to date. */
export default function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(timer);
  }, [router, seconds]);
  return null;
}
