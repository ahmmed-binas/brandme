import localFont from "next/font/local";

/** Bricolage Grotesque, self-hosted, only for the wordmark. */
const wordmark = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2",
      weight: "200 800",
    },
  ],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

/** The mark: two squares, one turned 45°, the eight-point star of Gulf geometric patterns. */
export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className={className}>
      <rect x="12" y="12" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect
        x="12"
        y="12"
        width="24"
        height="24"
        fill="none"
        stroke="var(--logo-accent, #c4851c)"
        strokeWidth="3"
        transform="rotate(45 24 24)"
      />
      <circle cx="24" cy="24" r="3" fill="currentColor" />
    </svg>
  );
}

/** Mark and wordmark, as used in the header. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={30} className="transition-transform duration-500 group-hover:rotate-45" />
      <span className={`${wordmark.className} text-[1.45rem] font-medium leading-none tracking-[-0.035em]`}>
        fuccura
      </span>
    </span>
  );
}
