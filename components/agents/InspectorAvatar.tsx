/**
 * Inspector Iqbal, the Investigator's face: a friendly detective with a hat and
 * a magnifying glass. Pure SVG so it stays sharp at any size and needs no image file.
 */
export function InspectorAvatar({ size = 96, className = "", title = "Inspector Iqbal" }: { size?: number; className?: string; title?: string | null }) {
  return <svg viewBox="0 0 120 120" width={size} height={size} className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title ?? undefined}>
    {title && <title>{title}</title>}
    <circle cx="60" cy="60" r="58" fill="#f3e7cf" />
    {/* Coat and collar */}
    <path d="M22 118c3-22 18-33 38-33s35 11 38 33" fill="#8a5a3b" />
    <path d="M47 86l13 16 13-16" fill="#f7f1e6" />
    <path d="M60 102l-6 16h12z" fill="#2f4a6d" />
    {/* Face */}
    <ellipse cx="60" cy="62" rx="22" ry="24" fill="#c98e63" />
    <ellipse cx="38.5" cy="64" rx="3.5" ry="5" fill="#b97d54" />
    <ellipse cx="81.5" cy="64" rx="3.5" ry="5" fill="#b97d54" />
    {/* Eyes, brows, smile, moustache */}
    <circle cx="51.5" cy="62" r="2.6" fill="#2b211b" />
    <circle cx="68.5" cy="62" r="2.6" fill="#2b211b" />
    <circle cx="52.4" cy="61.1" r="0.8" fill="#fff" />
    <circle cx="69.4" cy="61.1" r="0.8" fill="#fff" />
    <path d="M46 55.5q5.5-3 11 0M63 55.5q5.5-3 11 0" stroke="#2b211b" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <path d="M50 73q10-5 20 0q-3 5-10 3.2Q53 78 50 73z" fill="#3a2a20" />
    <path d="M54 79q6 3.5 12 0" stroke="#7a4b31" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    {/* Hat */}
    <path d="M26 46q34-12 68 0q-2 5-34 5T26 46z" fill="#4f3a2c" />
    <path d="M37 45q1-19 23-21q22 2 23 21q-23 6-46 0z" fill="#6b4e3a" />
    <path d="M37.6 40q22.4 5 44.8 0l0.6 5q-23 6-46 0z" fill="#2f4a6d" />
    {/* Magnifying glass */}
    <path d="M92 99l12 12" stroke="#3a2a20" strokeWidth="6" strokeLinecap="round" />
    <circle cx="84" cy="90" r="12" fill="#dff1f7" fillOpacity="0.85" stroke="#d9a441" strokeWidth="4" />
    <path d="M78 85q3-4 8-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>;
}
