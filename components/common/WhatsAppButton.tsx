"use client";

import { usePathname } from "next/navigation";
import { brand } from "@/lib/brand";

/** The WhatsApp logo (simple-icons, CC0). */
function Logo({ size = 28 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.82 9.82 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.94L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41" /></svg>;
}

/**
 * A WhatsApp button that stays in the corner of every Formora page, so people
 * can ask a question in the app they already use. Not shown on customers'
 * sites, template previews or in the editor (see AppShell).
 */
export default function WhatsAppButton() {
  const path = usePathname();
  const text = `Hi! I have a question about ${brand.name}${path && path !== "/" ? ` (I was on ${path})` : ""}.`;
  const href = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(text)}`;
  return <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp"
    className="group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-[70] flex h-14 items-center overflow-hidden rounded-full bg-[#25d366] text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,.7),0_4px_12px_-4px_rgba(0,0,0,.25)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-10px_rgba(37,211,102,.8),0_6px_16px_-6px_rgba(0,0,0,.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#128c7e] sm:right-6">
    <span aria-hidden className="absolute inset-0 rounded-full bg-[#25d366] opacity-60 motion-safe:animate-[whatsapp-ping_2.6s_cubic-bezier(0,0,.2,1)_infinite] group-hover:hidden" />
    <span className="relative grid size-14 shrink-0 place-items-center"><Logo /></span>
    <span className="relative max-w-0 whitespace-nowrap pr-0 text-[0.95rem] font-semibold opacity-0 transition-[max-width,opacity,padding] duration-500 ease-[cubic-bezier(.2,.7,.1,1)] group-hover:max-w-[16rem] group-hover:pr-5 group-hover:opacity-100 group-focus-visible:max-w-[16rem] group-focus-visible:pr-5 group-focus-visible:opacity-100">Chat with us on WhatsApp</span>
    <style>{"@keyframes whatsapp-ping{0%{transform:scale(1);opacity:.5}80%,100%{transform:scale(1.55);opacity:0}}"}</style>
  </a>;
}
