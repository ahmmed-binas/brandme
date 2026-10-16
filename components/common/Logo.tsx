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

/**
 * The mark: a diamond kite in four panels (ink, gold, pale gold), a centre
 * knot and a curling tail with three bows. Ink follows the text colour, so it
 * works on light and dark. On hover (of the mark or a link around it, class
 * "group") the kite sways and its tail waves; see .kite-mark in globals.css.
 */
export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  const gold = "var(--logo-accent, #c4851c)";
  const pale = "var(--logo-soft, #e8c27a)";
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden
      className={`kite-mark overflow-visible ${className}`}
    >
      <g className="kite-body">
        <path
          d="M24 1.6 L37.6 15 L24 33.4 L10.4 15 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path d="M23.2 4.4 L13.2 14.2 L23.2 14.2 Z" fill={gold} />
        <path d="M24.8 4.4 L34.8 14.2 L24.8 14.2 Z" fill="currentColor" />
        <path d="M13.2 15.8 L23.2 15.8 L23.2 30 Z" fill="currentColor" />
        <path d="M24.8 15.8 L34.8 15.8 L24.8 30 Z" fill={pale} />
        <circle cx="24" cy="15" r="1.5" fill={gold} />
      </g>
      <g className="kite-tail">
        <path
          d="M24 33.4 C 20.6 36.4, 27.6 38.6, 24.2 41.6 S 27 45, 25.4 47.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path d="M20.8 35.6 L23.3 36.9 L20.8 38.2 Z M25.8 35.6 L23.3 36.9 L25.8 38.2 Z" fill={gold} />
        <path d="M22.1 39.9 L24.6 41.2 L22.1 42.5 Z M27.1 39.9 L24.6 41.2 L27.1 42.5 Z" fill={pale} />
        <path d="M23.7 43.9 L26.1 45.1 L23.7 46.3 Z M28.5 43.9 L26.1 45.1 L28.5 46.3 Z" fill={gold} />
      </g>
    </svg>
  );
}

/** Mark and wordmark, as used in the header. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={32} />
      <span className={`${wordmark.className} text-[1.45rem] font-medium leading-none tracking-[-0.035em]`}>
        kitefolio
      </span>
    </span>
  );
}
