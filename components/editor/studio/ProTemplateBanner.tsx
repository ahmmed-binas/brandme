import Link from "next/link";
import { whatsappLink } from "@/lib/offers";
import { PRO_TEMPLATE_MESSAGE } from "@/lib/templates/pro-message";

/**
 * Shown in the editor when someone on a free plan opens a 3D Pro template.
 * They can try everything; saving and publishing ask for Pro.
 */
export function ProTemplateBanner() {
  return (
    <div
      role="status"
      className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 bg-ink px-4 py-2.5 text-[13px] text-paper"
    >
      <span className="min-w-0 flex-1">{PRO_TEMPLATE_MESSAGE}</span>
      <Link
        href="/pricing"
        className="rounded-full bg-signal px-3.5 py-1 font-medium text-paper hover:opacity-90"
      >
        Go Pro
      </Link>
      <a
        href={whatsappLink("Hi! I’d like Pro for a 3D template.")}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-4"
      >
        Ask on WhatsApp
      </a>
    </div>
  );
}
