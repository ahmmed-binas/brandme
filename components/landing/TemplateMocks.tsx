/**
 * Miniature, CSS-only renderings of each template's art direction. Used by the
 * hero specimen and the template showcase; they echo the real templates'
 * palettes and type, not their full layouts.
 */

export interface MockProps { name: string; role: string; /** Taller frames show a featured case study. */ featured?: boolean }

const PROJECTS = [
  { title: "Northstar", note: "Cash-flow dashboard", year: "2026" },
  { title: "Field Notes", note: "Research workspace", year: "2025" },
  { title: "Tidewater", note: "Booking for small harbours", year: "2024" },
];

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "YN";

// Sizes use container units (cqw) so each mock scales with its frame, not the page.
export function MidnightMock({ name, role }: MockProps) {
  return <div className="@container h-full"><div className="flex h-full flex-col bg-[#0a192f] p-[6cqw] text-[#8892b0]" style={{ fontFamily: "var(--ff-text), system-ui, sans-serif" }}>
    <p className="font-mono text-[11px] text-[#64ffda]">Hi, my name is</p>
    <p className="mt-2 break-words text-[clamp(1.5rem,8.5cqw,3rem)] font-bold leading-[1.02] tracking-tight text-[#ccd6f6]">{name}.</p>
    <p className="mt-1 text-[clamp(0.95rem,4.6cqw,1.6rem)] font-bold leading-tight text-[#8892b0]">I work as a {role.toLowerCase()}.</p>
    <div className="mt-auto space-y-2.5">
      <p className="flex items-center gap-3 font-mono text-[11px] text-[#ccd6f6]"><span className="text-[#64ffda]">02.</span> Selected work <span className="h-px flex-1 bg-[#233554]" /></p>
      {PROJECTS.map((project) => <div key={project.title} className="flex items-baseline justify-between rounded border border-[#233554] bg-[#112240] px-3 py-2 text-[12px]"><span className="text-[#ccd6f6]">{project.title}</span><span className="font-mono text-[10px] text-[#64ffda]">{project.year}</span></div>)}
    </div>
  </div></div>;
}

export function EditorialMock({ name, role, featured }: MockProps) {
  return <div className="@container h-full"><div className="flex h-full flex-col bg-[#f2f0e7] p-[6cqw] text-[#20251f]">
    <div className="flex items-center justify-between border-b border-[#d2cfc3] pb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#62685f]"><span>{initials(name)} — Index</span><span>Work · About · Contact</span></div>
    <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-[#b94f38]">{role}</p>
    <p className="mt-2 break-words font-display text-[clamp(1.7rem,9.5cqw,3.6rem)] leading-[0.98] tracking-[-0.02em]" style={{ fontVariationSettings: "'opsz' 96" }}>{name}</p>
    <p className="mt-3 max-w-[30ch] text-[13px] leading-snug text-[#62685f]">I build the parts people can count on, and I write about how they work.</p>
    {featured && <div className="mt-6 grid flex-1 grid-cols-[1fr_1.25fr] gap-5 border-t border-[#d2cfc3] pt-5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b94f38]">Case study</p>
        <p className="mt-2 font-display text-[clamp(1.2rem,4.4cqw,1.9rem)] leading-[1.05]">Northstar: cash flow, in plain sight</p>
        <p className="mt-2 text-[12px] leading-snug text-[#62685f]">How a forecasting view cut month-end close from four days to one.</p>
      </div>
      <svg viewBox="0 0 200 120" className="h-full max-h-40 w-full self-center" aria-hidden>
        {[20, 50, 80, 110].map((y) => <line key={y} x1="0" x2="200" y1={y} y2={y} stroke="#d2cfc3" strokeWidth="0.6" />)}
        <polyline points="0,96 25,90 50,92 75,74 100,78 125,58 150,52 175,34 200,26" fill="none" stroke="#20251f" strokeWidth="1.4" />
        <polyline points="0,104 25,101 50,99 75,95 100,90 125,86 150,80 175,76 200,70" fill="none" stroke="#b94f38" strokeWidth="1.2" strokeDasharray="3 3" />
        <circle cx="175" cy="34" r="3" fill="#b94f38" />
      </svg>
    </div>}
    <ol className="mt-auto divide-y divide-[#d2cfc3] border-y border-[#d2cfc3]">
      {PROJECTS.map((project, index) => <li key={project.title} className="grid grid-cols-[2rem_1fr_auto] items-baseline gap-2 py-2 text-[12px]"><span className="font-mono text-[10px] text-[#62685f]">0{index + 1}</span><span><span className="font-display text-[15px]">{project.title}</span> <span className="text-[#62685f]">— {project.note}</span></span><span className="font-mono text-[10px] text-[#62685f]">{project.year}</span></li>)}
    </ol>
  </div></div>;
}

export function KineticMock({ name, role }: MockProps) {
  const [first, ...rest] = name.split(" ");
  return <div className="@container h-full"><div className="relative flex h-full flex-col overflow-hidden bg-[#d9ddd3] p-[6cqw] text-[#15181a]" style={{ fontFamily: "Georgia, serif" }}>
    <p className="text-[13px] italic text-[#2b33ff]">{role}, available for work</p>
    <p className="mt-3 break-words text-[clamp(1.9rem,12.5cqw,5rem)] font-bold uppercase leading-[0.86] tracking-[-0.045em]" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>{first || "Your"}<br />{rest.join(" ") || "Name"}</p>
    <div className="mt-auto">
      <p className="mb-1 text-[12px] italic text-[#2b33ff]">Work</p>
      {PROJECTS.map((project) => <p key={project.title} className="flex items-baseline justify-between border-t border-[#15181a]/30 py-1.5 text-[clamp(0.85rem,4.2cqw,1.4rem)] font-bold uppercase tracking-[-0.02em]" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>{project.title}<span className="text-[10px] font-normal normal-case italic tracking-normal" style={{ fontFamily: "Georgia, serif" }}>{project.year}</span></p>)}
    </div>
  </div></div>;
}

export const TEMPLATE_MOCKS = [
  { id: "editorial-developer", label: "Editorial", swatch: "#f2f0e7", ink: "#b94f38", Mock: EditorialMock },
  { id: "template-one", label: "Midnight", swatch: "#0a192f", ink: "#64ffda", Mock: MidnightMock },
  { id: "kinetic-portfolio", label: "Kinetic", swatch: "#d9ddd3", ink: "#2b33ff", Mock: KineticMock },
] as const;
