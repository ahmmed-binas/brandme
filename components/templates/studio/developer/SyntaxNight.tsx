"use client";

import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource-variable/jetbrains-mono";
import { useEffect, useMemo, useState } from "react";
import {
  Atom,
  Award,
  BarChart3,
  Brain,
  Briefcase,
  Code2,
  Download,
  Eye,
  GraduationCap,
  Layers,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Rocket,
  Send,
  Server,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Trophy,
  User,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { Reveal, StudioRoot, ed, external, firstName, useStudio, type StudioProps } from "../kit";
import { motionOff } from "../motion";

/**
 * Syntax Night: a dark developer portfolio. Design by Chandan G
 * (chandan-g.vercel.app), used with his permission (confirmed by the owner,
 * 17 October 2026); rebuilt for Kitefolio from the owner's "Syntax" page.
 *
 * Slate background with drifting particles, one blue → violet → green
 * gradient for titles, tags and buttons; a typed-and-erased title; a code
 * terminal that writes the profile with floating tech tiles; an info bar;
 * skill cards; projects with Live/Code links; a timeline; education and
 * certificates; contact cards and a form that opens the visitor's email; a
 * small robot that comments on each section; and a chat bubble with quick
 * answers from the content. Nothing is stored and nothing is fixed to the
 * screen (sticky only); the custom cursor of the original is left out.
 *
 * Content: skills written "Group: a, b, c" become skill cards; highlights
 * with a year are certificates, without one they're activities; a link
 * labelled "CV" (or "Resume") turns on the View/Download pair.
 */

const GRADIENT = "linear-gradient(135deg,var(--t-accent),#8b5cf6,#10b981)";
const TEXT2 = "color-mix(in oklab, var(--t-fg) 78%, var(--t-bg))";
const LINE = "color-mix(in oklab, var(--t-fg) 10%, transparent)";
const GLASS = "color-mix(in oklab, var(--t-surface) 70%, transparent)";
const SECTIONS = ["home", "skills", "projects", "experience", "education", "contact"] as const;
type Section = (typeof SECTIONS)[number];

/** Floating tiles round the terminal: gradients like the original's brand colours. */
const TILES: Array<{ icon: LucideIcon; from: string; to: string; place: string }> = [
  { icon: Atom, from: "#61dafb", to: "#2186c4", place: "left-[-25px] top-[10%]" },
  { icon: Code2, from: "#3776ab", to: "#ffd343", place: "right-[-25px] top-[40%] [animation-delay:.5s]" },
  { icon: Server, from: "#339933", to: "#006400", place: "bottom-[20%] left-[-25px] [animation-delay:1s]" },
  { icon: Brain, from: "#ff6b6b", to: "#ee5a24", place: "bottom-[40%] right-[-25px] [animation-delay:1.5s]" },
];
/** Project art until a screenshot is added: icon and gradient by position. */
const PROJECT_ART: Array<{ icon: LucideIcon; from: string; to: string }> = [
  { icon: User, from: "#667eea", to: "#764ba2" },
  { icon: Stethoscope, from: "#4facfe", to: "#00f2fe" },
  { icon: ShoppingBag, from: "#fa709a", to: "#fee140" },
  { icon: BarChart3, from: "#d299c2", to: "#fef9d7" },
];
const SKILL_ICONS = [Code2, Layers, Wrench, MessageCircle];

/** "Programming: TypeScript, Python" → a card; plain skills share one "Skills" card. */
function skillGroups(skills: string[]) {
  const groups: Array<{ title: string; items: string[] }> = [];
  const loose: string[] = [];
  for (const skill of skills) {
    const match = skill.match(/^([^:]{2,30}):\s*(.+)$/);
    if (match) groups.push({ title: match[1]!.trim(), items: match[2]!.split(/\s*,\s*/).filter(Boolean) });
    else loose.push(skill);
  }
  if (loose.length) groups.push({ title: "Skills", items: loose });
  return groups;
}

/** Types each word, waits, erases it and moves to the next. Shows the first word when motion is off. */
function useTyped(words: string[]) {
  const [text, setText] = useState(words[0] ?? "");
  useEffect(() => {
    if (motionOff() || words.length === 0) return;
    let word = 0;
    let shown = 0;
    let deleting = false;
    let timer = 0;
    const step = () => {
      const current = words[word] ?? "";
      shown += deleting ? -1 : 1;
      setText(current.slice(0, shown));
      let wait = deleting ? 45 : 95;
      if (!deleting && shown >= current.length) {
        deleting = true;
        wait = 1800;
      } else if (deleting && shown <= 0) {
        deleting = false;
        word = (word + 1) % words.length;
        wait = 400;
      }
      timer = window.setTimeout(step, wait);
    };
    timer = window.setTimeout(step, 600);
    return () => window.clearTimeout(timer);
  }, [words]);
  return text;
}

/** The section in view, for the nav underline and the robot's comments. */
function useActiveSection(prefix: string) {
  const [active, setActive] = useState<Section>("home");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible[0]) setActive(visible[0].target.id.replace(`${prefix}-`, "") as Section);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const id of SECTIONS) {
      const node = document.getElementById(`${prefix}-${id}`);
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, [prefix]);
  return active;
}

function GradientIcon({ icon: Icon, size = 35 }: { icon: LucideIcon; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full text-white"
      style={{ width: size, height: size, background: GRADIENT }}
    >
      <Icon size={size * 0.45} />
    </span>
  );
}

export default function SyntaxNight({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const prefix = "syn";
  const active = useActiveSection(prefix);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const first = firstName(c.name) || "me";

  const words = useMemo(
    () => [c.name ?? "", ...(c.professional_title ?? "").split(/\s*&\s*/)].filter(Boolean),
    [c.name, c.professional_title],
  );
  const typed = useTyped(words);
  const groups = skillGroups(c.skills ?? []);
  const expertise = groups[0]?.items.slice(0, 3) ?? [];
  const links = c.links ?? [];
  const cv = links.find((link) => /\b(cv|resume|résumé)\b/i.test(link.label ?? ""));
  const otherLinks = links.filter((link) => link !== cv && link.url);
  const certificates = (c.highlights ?? []).filter((item) => item.year);
  const activities = (c.highlights ?? []).filter((item) => !item.year);

  const mono = "font-['JetBrains_Mono_Variable',ui-monospace,monospace]";
  const card = `rounded-[20px] border p-8 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[var(--t-accent)] hover:shadow-[0_15px_30px_rgba(59,130,246,.2)]`;
  const cardStyle = { background: GLASS, borderColor: LINE };
  const btn =
    "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-[0.95rem] font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(59,130,246,.3)]";
  const outline =
    "inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--t-accent)] px-7 py-3 text-[0.95rem] font-semibold text-[var(--t-accent)] transition hover:bg-[var(--t-accent)] hover:text-white";
  const sectionTitle = `${mono} mb-12 text-center text-[clamp(1.9rem,4.4cqw,2.5rem)] font-bold`;
  const sectionId = (id: Section) => `${prefix}-${id}`;

  // The robot's lines for each section.
  const robotSays: Record<Section, string> = {
    home: `Hi! I'm ${first}'s assistant! 👋`,
    skills: "Look at all these technologies! ⚡",
    projects: "Check out these projects! 🛠️",
    experience: "Real-world experience! 📚",
    education: "Always learning! 🎓",
    contact: `Say hello to ${first}! ✉️`,
  };
  const quickAnswers: Array<[string, string]> = [
    [
      `Who is ${first}?`,
      `${c.name} is a ${c.professional_title?.toLowerCase() ?? "developer"}${c.location ? ` based in ${c.location}` : ""}.`,
    ],
    [
      "Skills",
      groups
        .flatMap((group) => group.items)
        .slice(0, 10)
        .join(", ") || "See the skills section.",
    ],
    [
      "Projects",
      (c.projects ?? [])
        .map((project) => project.title)
        .filter(Boolean)
        .join(", ") || "See the projects section.",
    ],
    ["Contact", [c.email, c.phone].filter(Boolean).join(" · ") || "Use the contact section."],
  ];

  /** The contact form opens the visitor's own email app with the message; nothing is sent from here. */
  const sendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!c.email) return;
    const form = new FormData(event.currentTarget);
    const body = `${form.get("message") ?? ""}\n\n${form.get("name") ?? ""} (${form.get("email") ?? ""})`;
    window.location.href = `mailto:${c.email}?subject=${encodeURIComponent(String(form.get("subject") ?? "Hello"))}&body=${encodeURIComponent(body)}`;
  };

  const navLinks: Array<[Section, string, boolean]> = [
    ["home", "Home", true],
    ["skills", "Skills", has("skills")],
    ["projects", "Projects", has("projects")],
    ["experience", "Experience", has("experience")],
    ["education", "Education", has("education") || has("highlights")],
    ["contact", "Contact", has("contact")],
  ];

  return (
    <StudioRoot
      studio={studio}
      className="font-['Poppins','Segoe_UI',system-ui,sans-serif] leading-[1.6] [color-scheme:dark]"
    >
      <style>{`
        .syn-grad-text { background: ${GRADIENT}; -webkit-background-clip: text; background-clip: text; color: transparent; }
        .syn-particles { background-image: radial-gradient(circle, color-mix(in oklab, var(--t-accent) 70%, transparent) 1px, transparent 1.6px), radial-gradient(circle, rgba(139,92,246,.6) 1px, transparent 1.6px); background-size: 140px 140px, 220px 220px; background-position: 0 0, 60px 90px; }
        @media (prefers-reduced-motion: no-preference) {
          .syn-particles { animation: syn-drift 60s linear infinite; }
          .syn-float { animation: syn-float 3s ease-in-out infinite; }
          .syn-caret { animation: syn-blink 1s steps(1) infinite; }
          .syn-line { opacity: 0; transform: translateX(-20px); animation: syn-in .5s forwards; }
          .syn-wave { animation: syn-wave 2s infinite; transform-origin: 50% 10%; }
        }
        @keyframes syn-drift { to { background-position: 140px -700px, 280px -1100px; } }
        @keyframes syn-float { 50% { transform: translateY(-10px); } }
        @keyframes syn-blink { 50% { opacity: 0; } }
        @keyframes syn-in { to { opacity: 1; transform: none; } }
        @keyframes syn-wave { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-25deg); } 75% { transform: rotate(25deg); } }
        [data-static] .syn-particles, [data-static] .syn-float, [data-static] .syn-caret, [data-static] .syn-wave { animation: none; }
        [data-static] .syn-line { opacity: 1; transform: none; animation: none; }
      `}</style>

      {/* Drifting particles behind everything */}
      <div aria-hidden className="syn-particles pointer-events-none absolute inset-0 -z-10 opacity-40" />

      {/* ——— Nav (sticky) ——— */}
      <nav
        className="sticky top-0 z-40 border-b px-5 py-4 backdrop-blur-xl @3xl:px-8"
        style={{ background: "color-mix(in oklab, var(--t-bg) 95%, transparent)", borderColor: LINE }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <a href={`#${sectionId("home")}`} className={`${mono} syn-grad-text text-[1.8rem] font-bold`}>
            {(c.name ?? "D").charAt(0)}/&gt;
          </a>
          <ul className="hidden gap-10 @4xl:flex">
            {navLinks
              .filter(([, , shown]) => shown)
              .map(([id, name]) => (
                <li key={id}>
                  <a
                    href={`#${sectionId(id)}`}
                    className="relative py-2 font-medium transition-colors hover:text-[var(--t-fg)]"
                    style={{ color: active === id ? "var(--t-accent)" : TEXT2 }}
                  >
                    {name}
                    <span
                      aria-hidden
                      className="absolute bottom-0 left-0 h-0.5 transition-all"
                      style={{ width: active === id ? "100%" : 0, background: GRADIENT }}
                    />
                  </a>
                </li>
              ))}
          </ul>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label="Menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="grid size-11 place-items-center text-[1.5rem] @4xl:hidden"
          >
            {menuOpen ? <X /> : "☰"}
          </button>
        </div>
        {menuOpen && (
          <ul className="mx-auto mt-3 grid max-w-[1200px] gap-1 @4xl:hidden">
            {navLinks
              .filter(([, , shown]) => shown)
              .map(([id, name]) => (
                <li key={id}>
                  <a
                    href={`#${sectionId(id)}`}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-2 py-2"
                    style={{ color: TEXT2 }}
                  >
                    {name}
                  </a>
                </li>
              ))}
          </ul>
        )}
      </nav>

      {/* The robot: sticky, follows you down the page and comments on each section (wide screens). */}
      <div aria-hidden className="sticky top-28 z-30 hidden h-0 @5xl:block">
        <div className="absolute right-[50px] top-0 flex items-start gap-3">
          <span className="mt-3 w-[170px] rounded-[15px] bg-white px-4 py-2.5 text-[12px] font-medium text-[#333] shadow-[0_5px_15px_rgba(0,0,0,.2)]">
            {robotSays[active]}
          </span>
          <span className="relative block h-[150px] w-[120px]">
            <span className="absolute left-1/2 top-0 -ml-[30px] size-[60px] rounded-full border-[3px] border-[#10b981] bg-[var(--t-accent)]">
              <span className="absolute left-1/2 top-[15px] flex -translate-x-1/2 gap-2.5">
                <i className="block size-2 rounded-full bg-[#333]" />
                <i className="block size-2 rounded-full bg-[#333]" />
              </span>
            </span>
            <span className="absolute left-1/2 top-[50px] -ml-5 h-[60px] w-10 rounded-[20px] bg-[#10b981]" />
            <span className="absolute left-1/2 top-[60px] flex -translate-x-1/2 gap-[50px]">
              <i
                className={`block h-10 w-5 rounded-[10px] bg-[var(--t-accent)] ${active === "home" ? "syn-wave" : ""}`}
              />
              <i className="block h-10 w-5 rounded-[10px] bg-[var(--t-accent)]" />
            </span>
          </span>
        </div>
      </div>

      {/* ——— Hero ——— */}
      <section
        id={sectionId("home")}
        className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-12 px-5 pb-16 pt-14 @3xl:px-8 @5xl:flex-row"
      >
        <div className="w-full max-w-[600px]">
          <h1
            className={`${mono} mb-4 min-h-[2.3em] text-[clamp(2.5rem,5cqw,4rem)] font-extrabold leading-[1.1]`}
            {...ed("name")}
          >
            <span className="sr-only">{c.name}</span>
            <span aria-hidden className="syn-grad-text">
              {typed}
            </span>
            <span
              aria-hidden
              className="syn-caret ml-[.06em] inline-block h-[.9em] w-[.08em] bg-[#10b981] align-[-0.08em]"
            />
          </h1>
          <p
            className="mb-2 text-[1.6rem] font-medium leading-[1.35]"
            style={{ color: TEXT2 }}
            {...ed("professional_title")}
          >
            {c.professional_title}
          </p>
          {c.tagline && (
            <p className="mb-10 text-[1.1rem] font-medium text-[#10b981]" {...ed("tagline")}>
              {c.tagline}
            </p>
          )}
          <div className="mb-12 flex flex-wrap gap-x-8 gap-y-5 border-y py-4" style={{ borderColor: LINE }}>
            {c.email && (
              <a href={`mailto:${c.email}`} className="flex min-w-0 items-center gap-3" {...ed("email")}>
                <GradientIcon icon={Mail} />
                <span>
                  <b className="block text-[0.9rem] font-semibold">Email</b>
                  <span className="text-[0.85rem] [overflow-wrap:anywhere]" style={{ color: TEXT2 }}>
                    {c.email}
                  </span>
                </span>
              </a>
            )}
            {c.phone && (
              <a
                href={`tel:${c.phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-3"
                {...ed("phone")}
              >
                <GradientIcon icon={Phone} />
                <span>
                  <b className="block text-[0.9rem] font-semibold">Phone</b>
                  <span className="text-[0.85rem]" style={{ color: TEXT2 }}>
                    {c.phone}
                  </span>
                </span>
              </a>
            )}
            {c.location && (
              <span className="flex items-center gap-3" {...ed("location")}>
                <GradientIcon icon={MapPin} />
                <span>
                  <b className="block text-[0.9rem] font-semibold">Location</b>
                  <span className="text-[0.85rem]" style={{ color: TEXT2 }}>
                    {c.location}
                  </span>
                </span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            {has("contact") && (
              <a href={`#${sectionId("contact")}`} className={btn} style={{ background: GRADIENT }}>
                <Send size={16} /> Contact Me
              </a>
            )}
            {has("projects") && (
              <a href={`#${sectionId("projects")}`} className={outline}>
                <Code2 size={16} /> View Projects
              </a>
            )}
            {cv?.url && (
              <span className="inline-flex">
                <a
                  href={cv.url}
                  {...external(cv.url)}
                  className={`${btn} rounded-r-none`}
                  style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                >
                  <Eye size={16} /> View
                </a>
                <a
                  href={cv.url}
                  download
                  className={`${btn} rounded-l-none border-l border-white/25`}
                  style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                >
                  <Download size={16} /> Download
                </a>
              </span>
            )}
            {c.github && (
              <a href={c.github} {...external(c.github)} className={outline} {...ed("github")}>
                GitHub
              </a>
            )}
            {otherLinks.map((link) => (
              <a key={link.url} href={link.url} {...external(link.url!)} className={outline}>
                {link.label}
              </a>
            ))}
            {c.linkedin && (
              <a href={c.linkedin} {...external(c.linkedin)} className={outline} {...ed("linkedin")}>
                LinkedIn
              </a>
            )}
          </div>
        </div>

        {/* The terminal with floating tech tiles */}
        <div className="relative h-[450px] w-full max-w-[600px]">
          <div
            className="h-full overflow-hidden rounded-[20px] border-2 shadow-[0_25px_50px_rgba(0,0,0,.3)] backdrop-blur-xl"
            style={{ background: "color-mix(in oklab, var(--t-bg) 90%, transparent)", borderColor: LINE }}
          >
            <div className="flex items-center gap-4 bg-[linear-gradient(90deg,var(--t-accent),#8b5cf6)] px-6 py-4">
              <span className="flex gap-2">
                <i className="block size-3 rounded-full bg-[#ff5f56]" />
                <i className="block size-3 rounded-full bg-[#ffbd2e]" />
                <i className="block size-3 rounded-full bg-[#27ca3f]" />
              </span>
              <span className="truncate text-[0.9rem] font-semibold text-white">
                {first.toLowerCase()}@portfolio:~
              </span>
            </div>
            <div
              className={`${mono} h-[calc(100%-56px)] overflow-hidden p-8 text-[clamp(.8rem,1.6cqw,1rem)]`}
            >
              {[
                <>
                  <span className="text-[var(--t-accent)]">const</span>{" "}
                  <span className="text-[#f59e0b]">developer</span> = {"{"}
                </>,
                <>
                  {"  "}
                  <span className="text-[#10b981]">&quot;name&quot;</span>:{" "}
                  <span className="text-[#10b981]">&quot;{c.name}&quot;</span>,
                </>,
                <>
                  {"  "}
                  <span className="text-[#10b981]">&quot;role&quot;</span>:{" "}
                  <span className="text-[#10b981]">
                    &quot;{(c.professional_title ?? "").split(/\s*&\s*/)[0]}&quot;
                  </span>
                  ,
                </>,
                <>
                  {"  "}
                  <span className="text-[#10b981]">&quot;expertise&quot;</span>: [
                  {expertise.map((item, index) => (
                    <span key={item}>
                      <span className="text-[#10b981]">&quot;{item}&quot;</span>
                      {index < expertise.length - 1 ? ", " : ""}
                    </span>
                  ))}
                  ],
                </>,
                <>
                  {"  "}
                  <span className="text-[#10b981]">&quot;status&quot;</span>:{" "}
                  <span className="text-[#10b981]">&quot;Coding... 🚀&quot;</span>
                </>,
                <>{"};"}</>,
                <span key="comment" className="text-[#64748b]">
                  {"// Building innovative solutions"}
                </span>,
                <>
                  <span className="text-[var(--t-accent)]">function</span>{" "}
                  <span className="text-[#8b5cf6]">buildProject</span>() {"{"}
                </>,
                <>
                  {"  "}
                  <span className="text-[var(--t-accent)]">return</span>{" "}
                  <span className="text-[#10b981]">
                    &quot;{c.tagline?.replace(/\.$/, "") || "Efficient & Scalable Solutions"}&quot;
                  </span>
                  ;
                </>,
                <>{"}"}</>,
                <span key="status" className="text-[#64748b]">
                  {"// "}
                  {c.availability || "Ready for new challenges!"}
                  <span className="syn-caret">▋</span>
                </span>,
              ].map((line, index) => (
                <div
                  key={index}
                  className="syn-line mb-4 flex items-baseline gap-4"
                  style={{ animationDelay: `${0.3 + index * 0.25}s` }}
                >
                  <span className="min-w-[30px] text-[0.9rem] text-[#10b981]">{index + 1}</span>
                  <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">{line}</span>
                </div>
              ))}
            </div>
          </div>
          {TILES.map(({ icon: Icon, from, to, place }, index) => (
            <span
              key={index}
              aria-hidden
              className={`syn-float absolute z-10 grid size-[50px] place-items-center rounded-[10px] text-white shadow-[0_10px_20px_rgba(0,0,0,.2)] ${place}`}
              style={{ background: `linear-gradient(135deg,${from},${to})` }}
            >
              <Icon size={26} />
            </span>
          ))}
        </div>
      </section>

      {/* ——— About ——— */}
      {has("about") && (
        <section className="mx-auto max-w-[1200px] px-5 py-20 @3xl:px-8">
          <h2 className={sectionTitle}>
            <span className="syn-grad-text">{label("about", "About Me")}</span>
          </h2>
          <Reveal>
            <div
              className="mx-auto flex max-w-[820px] flex-col gap-8 rounded-[28px] border-[1.5px] p-9 backdrop-blur-xl @3xl:flex-row"
              style={{
                ...cardStyle,
                boxShadow: "0 8px 40px rgba(59,130,246,.18), 0 1.5px 8px rgba(16,185,129,.1)",
              }}
            >
              <span className="grid size-[70px] shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,var(--t-accent)_60%,#10b981)] text-white shadow-[0_4px_18px_rgba(59,130,246,.18)]">
                <User size={34} />
              </span>
              <div>
                <h3 className={`${mono} mb-5 text-[1.35rem] font-bold text-[var(--t-accent)]`}>
                  {c.professional_title}
                </h3>
                <div className="space-y-4 rounded-[18px] p-6 text-[1.13rem] leading-[1.8] shadow-[0_2px_16px_rgba(59,130,246,.1)]">
                  {(c.summary ?? []).map((text, index) => (
                    <p
                      key={index}
                      className={/^goal:/i.test(text) ? "font-semibold text-[#fbbf24]" : ""}
                      {...ed(`summary.${index}`)}
                    >
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ——— Skills ——— */}
      {has("skills") && (
        <section id={sectionId("skills")} className="mx-auto max-w-[1200px] px-5 py-20 @3xl:px-8">
          <h2 className={sectionTitle}>
            <span className="syn-grad-text">{label("skills", "Skills & Technologies")}</span>
          </h2>
          <div className="grid gap-8 @3xl:grid-cols-2 @5xl:grid-cols-4" {...ed("skills")}>
            {groups.map((group, index) => {
              const Icon = SKILL_ICONS[index % SKILL_ICONS.length]!;
              return (
                <Reveal key={group.title} delay={index * 80}>
                  <div className={`${card} flex h-full flex-col items-center text-center`} style={cardStyle}>
                    <h3 className="mb-6 flex items-center gap-3 text-[1.3rem] font-semibold text-[var(--t-accent)]">
                      <Icon size={22} /> {group.title}
                    </h3>
                    <div className="flex flex-wrap justify-center gap-3">
                      {group.items.map((item) => (
                        <span
                          key={item}
                          className="rounded-full px-4 py-2 text-[0.9rem] font-medium text-white transition hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(59,130,246,.3)]"
                          style={{ background: GRADIENT }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* ——— Projects ——— */}
      {has("projects") && (
        <section id={sectionId("projects")} className="mx-auto max-w-[1200px] px-5 py-20 @3xl:px-8">
          <h2 className={sectionTitle}>
            <span className="syn-grad-text">{label("projects", "Featured Projects")}</span>
          </h2>
          <div className="grid gap-8 @3xl:grid-cols-2 @6xl:grid-cols-3">
            {(c.projects ?? []).map((project, index) => {
              const art = PROJECT_ART[index % PROJECT_ART.length]!;
              const Icon = art.icon;
              return (
                <Reveal key={index} delay={(index % 3) * 80}>
                  <article
                    className="group h-full overflow-hidden rounded-[20px] border backdrop-blur-xl transition duration-300 hover:-translate-y-2.5 hover:border-[var(--t-accent)] hover:shadow-[0_20px_40px_rgba(59,130,246,.3)]"
                    style={cardStyle}
                    {...ed(`projects.${index}`)}
                  >
                    <div className="h-[180px] overflow-hidden">
                      {project.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- the owner's own screenshot
                        <img
                          src={project.image}
                          alt={project.title ?? ""}
                          loading="lazy"
                          className="size-full object-cover transition duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div
                          className="grid size-full place-items-center text-white transition duration-300 group-hover:scale-110"
                          style={{ background: `linear-gradient(135deg,${art.from},${art.to})` }}
                        >
                          <Icon size={64} />
                        </div>
                      )}
                    </div>
                    <div className="p-7">
                      <h3 className="mb-4 text-[1.3rem] font-semibold leading-tight">{project.title}</h3>
                      {project.description && (
                        <p className="mb-6 text-[0.95rem]" style={{ color: TEXT2 }}>
                          {project.description}
                        </p>
                      )}
                      <div className="my-4 flex flex-wrap gap-2">
                        {(project.technologies ?? []).map((tech) => (
                          <span
                            key={tech}
                            className="rounded-full px-3 py-1 text-[0.8rem] font-medium text-white"
                            style={{ background: GRADIENT }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 flex flex-wrap gap-4">
                        {project.live_url && (
                          <a
                            href={project.live_url}
                            {...external(project.live_url)}
                            className={`${btn} min-w-[80px] flex-1 px-4 py-2 text-[0.8rem]`}
                            style={{ background: GRADIENT }}
                          >
                            <Rocket size={14} /> Live
                          </a>
                        )}
                        {project.github && (
                          <a
                            href={project.github}
                            {...external(project.github)}
                            className={`${outline} min-w-[80px] flex-1 px-4 py-1.5 text-[0.8rem]`}
                          >
                            <Code2 size={14} /> Code
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* ——— Experience and activities ——— */}
      {(has("experience") || activities.length > 0) && (
        <section id={sectionId("experience")} className="mx-auto max-w-[1200px] px-5 py-20 @3xl:px-8">
          <h2 className={sectionTitle}>
            <span className="syn-grad-text">{label("experience", "Experience")}</span>
          </h2>
          <div className="mx-auto max-w-[800px]">
            {(c.experience ?? []).map((job, index) => (
              <Reveal key={index}>
                <div
                  className={`${card} mb-8 flex gap-8 rounded-[15px] hover:translate-x-2.5 hover:translate-y-0`}
                  style={cardStyle}
                  {...ed(`experience.${index}`)}
                >
                  <span className="hidden @3xl:block">
                    <GradientIcon icon={Briefcase} size={60} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                      <h3 className="text-[1.2rem] font-semibold text-[var(--t-accent)]">
                        {job.company}
                        <small className="block text-[0.9rem] font-normal" style={{ color: TEXT2 }}>
                          {job.job_title}
                        </small>
                      </h3>
                      <span
                        className="whitespace-nowrap rounded-full px-4 py-1 text-[0.85rem] font-medium text-white"
                        style={{ background: GRADIENT }}
                      >
                        {[job.start_date, job.end_date].filter(Boolean).join(" – ")}
                      </span>
                    </div>
                    {job.description && <p style={{ color: TEXT2 }}>{job.description}</p>}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          {activities.length > 0 && (
            <>
              <h3 className={`${mono} mb-8 mt-16 text-center text-[2rem] font-bold`}>
                <span className="syn-grad-text">Activities</span>
              </h3>
              <div className="grid gap-6 @3xl:grid-cols-3">
                {activities.map((item) => {
                  const index = (c.highlights ?? []).indexOf(item);
                  return (
                    <div
                      key={index}
                      className={`${card} rounded-[15px] p-6`}
                      style={cardStyle}
                      {...ed(`highlights.${index}`)}
                    >
                      <h4 className="mb-1.5 flex items-center gap-2 text-[1.1rem] font-semibold">
                        <Trophy size={18} className="shrink-0 text-[#fbbf24]" /> {item.title}
                      </h4>
                      {item.detail && (
                        <p className="text-[0.95rem]" style={{ color: TEXT2 }}>
                          {item.detail}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {/* ——— Education and certificates ——— */}
      {(has("education") || certificates.length > 0) && (
        <section id={sectionId("education")} className="mx-auto max-w-[1200px] px-5 py-20 @3xl:px-8">
          <h2 className={sectionTitle}>
            <span className="syn-grad-text">{label("education", "Education")}</span>
          </h2>
          <div className="grid gap-8 @3xl:grid-cols-2 @6xl:grid-cols-3">
            {(c.education ?? []).map((item, index) => (
              <Reveal key={index} delay={index * 80}>
                <div className={`${card} h-full`} style={cardStyle} {...ed(`education.${index}`)}>
                  <div className="mb-6 flex items-start gap-6">
                    <span
                      className="grid size-[60px] shrink-0 place-items-center rounded-[15px] text-white"
                      style={{ background: GRADIENT }}
                    >
                      <GraduationCap size={26} />
                    </span>
                    <div>
                      <h3 className="mb-1 text-[1.3rem] font-semibold leading-tight">{item.degree}</h3>
                      <p className="mb-1 font-medium text-[#10b981]">{item.school}</p>
                      <span className="text-[0.9rem]" style={{ color: TEXT2 }}>
                        {[item.start_date, item.end_date].filter(Boolean).join(" – ")}
                      </span>
                    </div>
                  </div>
                  {item.description && <p style={{ color: TEXT2 }}>{item.description}</p>}
                </div>
              </Reveal>
            ))}
          </div>
          {certificates.length > 0 && (
            <>
              <h3 className={`${mono} mb-8 mt-16 text-center text-[2rem] font-bold`}>
                <span className="syn-grad-text">Certifications & Courses</span>
              </h3>
              <div className="grid gap-6 @3xl:grid-cols-2 @6xl:grid-cols-3">
                {certificates.map((item) => {
                  const index = (c.highlights ?? []).indexOf(item);
                  const body = (
                    <>
                      {/* A drawn certificate until a real scan is linked */}
                      <div
                        className="mb-4 grid h-[180px] place-items-center rounded-[10px] border-4 border-double p-4 text-center"
                        style={{ background: "#f8fafc", borderColor: "#c9a227", color: "#1e293b" }}
                      >
                        <span>
                          <Award className="mx-auto text-[#c9a227]" size={34} />
                          <span className="mt-2 block text-[12px] uppercase tracking-[0.2em]">
                            Certificate
                          </span>
                          <span className="block text-[14px] font-semibold">{item.title}</span>
                        </span>
                      </div>
                      <h4 className="mb-2 text-[1.1rem] font-semibold leading-snug">{item.title}</h4>
                      <p className="text-[0.95rem] text-[#10b981]">
                        {[item.detail, item.year].filter(Boolean).join(" · ")}
                      </p>
                    </>
                  );
                  return item.url ? (
                    <a
                      key={index}
                      href={item.url}
                      {...external(item.url)}
                      className={`${card} block rounded-[15px] p-6`}
                      style={cardStyle}
                      {...ed(`highlights.${index}`)}
                    >
                      {body}
                    </a>
                  ) : (
                    <div
                      key={index}
                      className={`${card} rounded-[15px] p-6`}
                      style={cardStyle}
                      {...ed(`highlights.${index}`)}
                    >
                      {body}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {/* ——— Contact ——— */}
      {has("contact") && (
        <section id={sectionId("contact")} className="mx-auto max-w-[1200px] px-5 py-20 @3xl:px-8">
          <h2 className={sectionTitle}>
            <span className="syn-grad-text">Get In Touch</span>
          </h2>
          <div className="grid items-start gap-12 @4xl:grid-cols-2">
            <div className="flex flex-col gap-6">
              <div className={`${card} hover:translate-y-0`} style={cardStyle}>
                <h3 className="mb-6 flex items-center gap-3 text-[1.3rem] font-semibold text-[var(--t-accent)]">
                  <Sparkles size={20} /> Contact Information
                </h3>
                <div className="flex flex-col gap-5">
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="flex min-w-0 items-center gap-4">
                      <GradientIcon icon={Mail} size={45} />
                      <span>
                        <b className="block font-semibold">Email</b>
                        <span className="text-[0.9rem] [overflow-wrap:anywhere]" style={{ color: TEXT2 }}>
                          {c.email}
                        </span>
                      </span>
                    </a>
                  )}
                  {c.phone && (
                    <a href={`tel:${c.phone.replace(/\s+/g, "")}`} className="flex items-center gap-4">
                      <GradientIcon icon={Phone} size={45} />
                      <span>
                        <b className="block font-semibold">Phone</b>
                        <span className="text-[0.9rem]" style={{ color: TEXT2 }}>
                          {c.phone}
                        </span>
                      </span>
                    </a>
                  )}
                  {c.location && (
                    <span className="flex items-center gap-4">
                      <GradientIcon icon={MapPin} size={45} />
                      <span>
                        <b className="block font-semibold">Location</b>
                        <span className="text-[0.9rem]" style={{ color: TEXT2 }}>
                          {c.location}
                        </span>
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {[
                  ["GitHub", c.github],
                  ["LinkedIn", c.linkedin],
                  ...otherLinks.map((link) => [link.label ?? "Link", link.url]),
                ]
                  .filter(([, url]) => url)
                  .map(([name, url]) => (
                    <a
                      key={url}
                      href={url}
                      {...external(url!)}
                      className="rounded-full border px-5 py-2.5 text-[0.95rem] transition hover:-translate-y-0.5 hover:text-white"
                      style={{ background: GLASS, borderColor: LINE, color: TEXT2 }}
                    >
                      {name}
                    </a>
                  ))}
              </div>
            </div>
            {c.email && (
              <form onSubmit={sendMessage} className={`${card} hover:translate-y-0`} style={cardStyle}>
                {[
                  ["name", "Your name", "text"],
                  ["email", "Your email", "email"],
                  ["subject", "Subject", "text"],
                ].map(([name, text, type]) => (
                  <label key={name} className="mb-6 block text-[0.95rem] font-medium">
                    {text}
                    <input
                      name={name}
                      type={type}
                      required
                      className="mt-2 w-full rounded-[10px] border px-4 py-4 outline-none transition focus:border-[var(--t-accent)]"
                      style={{ background: "rgba(30,41,59,.5)", borderColor: LINE }}
                    />
                  </label>
                ))}
                <label className="mb-6 block text-[0.95rem] font-medium">
                  Message
                  <textarea
                    name="message"
                    required
                    className="mt-2 min-h-[150px] w-full rounded-[10px] border px-4 py-4 outline-none transition focus:border-[var(--t-accent)]"
                    style={{ background: "rgba(30,41,59,.5)", borderColor: LINE }}
                  />
                </label>
                <button
                  type="submit"
                  className={`${btn} w-full rounded-[10px]`}
                  style={{ background: GRADIENT }}
                >
                  <Send size={16} /> Send Message
                </button>
                <p className="mt-3 text-[12px]" style={{ color: TEXT2 }}>
                  Opens your email app with the message written. Nothing is stored here.
                </p>
              </form>
            )}
          </div>
        </section>
      )}

      <footer
        className="mt-16 border-t px-5 pb-12 pt-12 text-center"
        style={{ background: "var(--t-surface)", borderColor: LINE }}
      >
        <p className={`${mono} syn-grad-text text-[1.4rem] font-bold`}>{c.name}</p>
        <p className="mt-4 text-[0.9rem]" style={{ color: TEXT2 }}>
          Built with ❤️ using modern web technologies
        </p>
      </footer>

      {/* The chat bubble: quick answers from the content (sticky at the bottom right; no AI, nothing stored). */}
      <div className="pointer-events-none sticky bottom-5 z-40 h-0">
        <div className="pointer-events-auto absolute bottom-0 right-5">
          {chatOpen && (
            <div
              className="absolute bottom-20 right-0 flex w-[min(350px,calc(100cqw-40px))] flex-col overflow-hidden rounded-[20px] border backdrop-blur-xl"
              style={{ background: "rgba(30,41,59,.92)", borderColor: LINE }}
            >
              <div
                className="flex items-center justify-between px-5 py-4 text-white"
                style={{ background: GRADIENT }}
              >
                <b>Ask about {first}</b>
                <button type="button" aria-label="Close chat" onClick={() => setChatOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 text-[0.95rem]">
                <p className="rounded-xl bg-white/10 px-4 py-3">
                  {answer || `Hi! Ask me about ${first}'s skills, projects or how to get in touch.`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {quickAnswers.map(([question, reply]) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => setAnswer(reply)}
                      className="rounded-full border px-3 py-1.5 text-[0.85rem]"
                      style={{ borderColor: LINE, color: TEXT2 }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <button
            type="button"
            aria-label={chatOpen ? "Close chat" : "Open chat"}
            onClick={() => setChatOpen(!chatOpen)}
            className="grid size-[60px] place-items-center rounded-full text-white shadow-[0_5px_20px_rgba(59,130,246,.4)] transition hover:scale-110"
            style={{ background: GRADIENT }}
          >
            <MessageCircle size={26} />
          </button>
        </div>
      </div>
    </StudioRoot>
  );
}
