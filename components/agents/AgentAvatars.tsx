/**
 * Faces for the agents, drawn in the same style as Inspector Iqbal: pure SVG,
 * sharp at any size, no image files.
 */
type AvatarProps = { size?: number; className?: string; title?: string | null };

const frame = (size: number, className: string, title: string | null) => ({
  viewBox: "0 0 120 120",
  width: size,
  height: size,
  className,
  role: title ? "img" : undefined,
  "aria-hidden": title ? undefined : true,
  "aria-label": title ?? undefined,
});

/** Rowan, the Reviewer: round glasses, a cardigan and a red pen. */
export function RowanAvatar({ size = 96, className = "", title = "Rowan the Reviewer" }: AvatarProps) {
  return (
    <svg {...frame(size, className, title)}>
      {title && <title>{title}</title>}
      <circle cx="60" cy="60" r="58" fill="#d8ece6" />
      {/* Cardigan and shirt */}
      <path d="M22 118c3-22 18-33 38-33s35 11 38 33" fill="#2f6b5e" />
      <path d="M50 86l10 13 10-13" fill="#f4efe6" />
      <path d="M44 88l8 30M76 88l-8 30" stroke="#24564b" strokeWidth="2" />
      {/* Hair, back */}
      <path d="M34 66q-4-34 26-36q30 2 26 36q-4-10-6-14q-20 4-40 0q-2 4-6 14z" fill="#3b2b25" />
      {/* Face */}
      <ellipse cx="60" cy="63" rx="21" ry="23" fill="#e2b48d" />
      {/* Fringe */}
      <path d="M39 55q4-19 21-19q18 0 22 18q-12-9-26-7q-9 1-17 8z" fill="#3b2b25" />
      {/* Glasses */}
      <circle cx="51" cy="63" r="6.5" fill="#fff" fillOpacity="0.35" stroke="#1f2a33" strokeWidth="2.2" />
      <circle cx="69" cy="63" r="6.5" fill="#fff" fillOpacity="0.35" stroke="#1f2a33" strokeWidth="2.2" />
      <path d="M57.5 63h5" stroke="#1f2a33" strokeWidth="2.2" />
      <circle cx="51" cy="63.5" r="2.2" fill="#2b211b" />
      <circle cx="69" cy="63.5" r="2.2" fill="#2b211b" />
      {/* Smile */}
      <path d="M53 76q7 5 14 0" stroke="#8a4a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Red pen, tucked behind the ear */}
      <path d="M78 50l14-14" stroke="#c8352b" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M92 36l3-3" stroke="#2b211b" strokeWidth="4.5" strokeLinecap="round" />
      {/* A page with a tick */}
      <rect
        x="82"
        y="84"
        width="22"
        height="27"
        rx="2"
        fill="#fffdf8"
        stroke="#2f6b5e"
        strokeWidth="2"
        transform="rotate(8 93 97)"
      />
      <path
        d="M88 98l4 4 8-9"
        stroke="#c8352b"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Ellis, the Editor: a pencil behind the ear, headphones and a colour swatch. */
export function EllisAvatar({ size = 96, className = "", title = "Ellis the Editor" }: AvatarProps) {
  return (
    <svg {...frame(size, className, title)}>
      {title && <title>{title}</title>}
      <circle cx="60" cy="60" r="58" fill="#e6e1f6" />
      {/* Hoodie */}
      <path d="M22 118c3-22 18-33 38-33s35 11 38 33" fill="#4b3f8f" />
      <path d="M46 86q14 12 28 0" stroke="#3a3073" strokeWidth="3" fill="none" />
      <path d="M55 92v14M65 92v14" stroke="#e6e1f6" strokeWidth="1.6" strokeLinecap="round" />
      {/* Face */}
      <ellipse cx="60" cy="62" rx="21" ry="23" fill="#a8714e" />
      {/* Short hair */}
      <path d="M38 58q-1-24 22-25q23 1 22 25q-6-12-22-12q-16 0-22 12z" fill="#1d1a24" />
      {/* Headphones */}
      <path d="M35 64q0-32 25-32t25 32" stroke="#1d1a24" strokeWidth="4" fill="none" />
      <rect x="31" y="58" width="8" height="15" rx="4" fill="#f2b33d" />
      <rect x="81" y="58" width="8" height="15" rx="4" fill="#f2b33d" />
      {/* Eyes and smile */}
      <circle cx="52" cy="62" r="2.5" fill="#1d1a24" />
      <circle cx="68" cy="62" r="2.5" fill="#1d1a24" />
      <path
        d="M47.5 56q4.5-2.5 9 0M63.5 56q4.5-2.5 9 0"
        stroke="#1d1a24"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M52 73q8 6 16 0" stroke="#5e3420" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Pencil */}
      <path d="M80 46l16-8" stroke="#f2b33d" strokeWidth="4" strokeLinecap="round" />
      <path d="M96 38l4-2" stroke="#1d1a24" strokeWidth="4" strokeLinecap="round" />
      {/* Colour swatch fan */}
      <g transform="translate(86 96)">
        <rect x="-3" y="-14" width="8" height="22" rx="2" fill="#ef6f5e" transform="rotate(-22)" />
        <rect x="-3" y="-14" width="8" height="22" rx="2" fill="#f2b33d" transform="rotate(0)" />
        <rect x="-3" y="-14" width="8" height="22" rx="2" fill="#3cb5a4" transform="rotate(22)" />
        <circle cx="1" cy="6" r="1.6" fill="#1d1a24" />
      </g>
    </svg>
  );
}
