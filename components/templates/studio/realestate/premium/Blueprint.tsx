"use client";

import "@fontsource-variable/archivo";
import "@fontsource/ibm-plex-mono";
import { Fragment, useRef, useState } from "react";
import {
  Picture,
  StudioRoot,
  ed,
  firstName,
  initials,
  paragraphs,
  useStudio,
  type StudioProps,
} from "../../kit";
import {
  DirectContacts,
  LeadForm,
  Listings,
  MortgageCalc,
  OrbitHint,
  WhatsAppFloat,
  enquiryText,
  startingPrice,
  useScene,
  useScrolled,
} from "./pieces";
import "./premium.css";
import "./blueprint.css";

/**
 * Arc (premium 3D, Pro; drawn as “Blueprint”): an off-plan adviser's site on drafting paper.
 * The hero tower draws itself floor by floor; drag the construction slider and
 * the building rises while the panel shows what the buyer has paid on a 60/40
 * plan; switch Drawing / Render to see it as glass. Below: launches, the five
 * steps of buying off-plan, a payment-plan schedule, a handover mortgage
 * calculator, reviews and an enquiry form.
 */

const QUARTERS = [
  "Q1 2025",
  "Q2 2025",
  "Q3 2025",
  "Q4 2025",
  "Q1 2026",
  "Q2 2026",
  "Q3 2026",
  "Q4 2026",
  "Q1 2027",
  "Q2 2027",
  "Q3 2027",
  "Q4 2027",
];

/** Share paid on a 60/40 plan at each construction stage. */
const paidAt = (pct: number) => {
  if (pct >= 100) return 100;
  return 20 + [20, 40, 60, 80].filter((mark) => pct >= mark).length * 10;
};

const PLANS: Record<string, Array<[string, string, number]>> = {
  "60/40": [
    ["Booking", "On signing", 10],
    ["Oqood registration", "Within 30 days", 10],
    ["20% construction", "Q3 2025", 10],
    ["40% construction", "Q1 2026", 10],
    ["60% construction", "Q3 2026", 10],
    ["80% construction", "Q1 2027", 10],
    ["Handover", "Q4 2027", 40],
  ],
  "70/30": [
    ["Booking", "On signing", 20],
    ["20% construction", "Q3 2025", 10],
    ["40% construction", "Q1 2026", 10],
    ["60% construction", "Q3 2026", 10],
    ["80% construction", "Q1 2027", 10],
    ["Topping out", "Q2 2027", 10],
    ["Handover", "Q4 2027", 30],
  ],
  "50/50": [
    ["Booking", "On signing", 20],
    ["30% construction", "Q4 2025", 10],
    ["60% construction", "Q3 2026", 10],
    ["90% construction", "Q2 2027", 10],
    ["Handover", "Q4 2027", 20],
    ["Post-handover, 12 months", "2028", 30],
  ],
  "40/60": [
    ["Booking", "On signing", 10],
    ["30% construction", "Q4 2025", 10],
    ["60% construction", "Q3 2026", 10],
    ["Handover", "Q4 2027", 10],
    ["Post-handover, 36 monthly instalments", "2028–2030", 60],
  ],
};

/** The plan's rows, each marked when it falls after handover (drawn in a different colour). */
function planRows(plan: string) {
  let afterHandover = false;
  return (PLANS[plan] ?? []).map(([stage, when, pct]) => {
    const post = afterHandover || /post/i.test(stage);
    if (/handover/i.test(stage) && !/post/i.test(stage)) afterHandover = true;
    return { stage, when, pct, post };
  });
}

const STEPS = [
  [
    "Reserve",
    "Pay the booking amount, usually 10–20%, into the project’s escrow account. Never to a personal account.",
    "Week 1",
  ],
  [
    "Sign the SPA",
    "The sale and purchase agreement fixes the price, plan and handover date. I mark every clause that matters.",
    "Weeks 1–3",
  ],
  [
    "Register Oqood",
    "The DLD records your unit. The 4% transfer fee is paid at this stage, not at handover.",
    "Within 30 days",
  ],
  [
    "Pay by milestone",
    "Instalments fall due as construction reaches set stages. I send you the site photos at each one.",
    "During construction",
  ],
  [
    "Snag & hand over",
    "We inspect the finished unit together, list the defects and make sure they’re fixed before you take the keys.",
    "Handover",
  ],
];

const ART = {
  sky1: "#f6f7f4",
  sky2: "#e3e7f5",
  far: "#d5dbef",
  body: "#ffffff",
  body2: "#c9d1f3",
  glass: "#a9b6ef",
  lit: "#2340d6",
  trim: "#ff5a1f",
  ground: "#1f2328",
};

const AED = new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 });
const aed = (n: number) => "AED " + AED.format(Math.round(n));

/** “Buy the drawing. Own the tower.”: the last word of each sentence in the accent colours. */
function Headline({ text }: { text: string }) {
  const sentences = text.match(/[^.!?]+[.!?]?/g) ?? [text];
  return (
    <>
      {sentences.map((sentence, index) => {
        const trimmed = sentence.trim();
        const cut = trimmed.lastIndexOf(" ");
        if (cut < 0) return <Fragment key={index}>{trimmed} </Fragment>;
        const Accent = index % 2 === 0 ? "span" : "em";
        return (
          <Fragment key={index}>
            {trimmed.slice(0, cut)} <Accent>{trimmed.slice(cut + 1)}</Accent>{" "}
          </Fragment>
        );
      })}
    </>
  );
}

type BlueprintScene = {
  destroy: () => void;
  setTarget: (pct: number) => void;
  setMode: (value: number) => void;
};

export default function Blueprint({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const first = firstName(c.name) || "me";
  const price = startingPrice(c, 2800000);
  const [build, setBuild] = useState(62);
  const [mode, setMode] = useState(0);
  const [dragged, setDragged] = useState(false);
  const [menu, setMenu] = useState(false);
  const [message, setMessage] = useState("");
  const [planPrice, setPlanPrice] = useState(price);
  const [plan, setPlan] = useState("60/40");
  const callout = useRef<HTMLDivElement>(null);
  const callLevel = useRef<HTMLElement>(null);
  const callH = useRef<HTMLSpanElement>(null);
  const { sentinel, scrolled } = useScrolled();
  const { canvas, controller } = useScene<BlueprintScene>(async (node) => {
    const { mountBlueprint } = await import("./scenes/blueprint.js");
    return mountBlueprint(node, {
      target: 62,
      callout: callout.current,
      callLevel: callLevel.current,
      callH: callH.current,
      onFirstDrag: () => setDragged(true),
    }) as Promise<BlueprintScene | null>;
  });

  const lead = (c.projects ?? [])[0];
  const paid = paidAt(build);
  const stageText =
    build >= 100 ? "Handed over" : build === 0 ? "Booking · site cleared" : `Construction ${build}%`;
  const quarter =
    QUARTERS[Math.min(QUARTERS.length - 1, Math.floor((build / 100) * (QUARTERS.length - 1) + 0.001))];
  const dld = planPrice * 0.04 + 580;
  const links = [
    has("projects") && ["#launches", "Launches"],
    ["#process", "How it works"],
    ["#plan", "Payment plans"],
    has("about") && ["#about", "About"],
    ["#contact", "Contact"],
  ].filter(Boolean) as string[][];

  return (
    <StudioRoot studio={studio} className="pm pm-blueprint">
      <div ref={sentinel} aria-hidden className="pm-sentinel" />
      <header className={`nav ${scrolled ? "scrolled" : ""} ${menu ? "open" : ""}`}>
        <div className="wrap nav-in">
          <a className="brand" href="#top">
            <i aria-hidden>{initials(c.name)}</i>
            <h1 {...ed("name")}>{c.name}</h1>
          </a>
          <ul className="nav-links">
            {links.map(([href, text]) => (
              <li key={href}>
                <a href={href} onClick={() => setMenu(false)}>
                  {text}
                </a>
              </li>
            ))}
          </ul>
          <a className="btn nav-cta" href="#contact">
            Get the launch list
          </a>
          <button
            className="nav-toggle"
            type="button"
            aria-label="Menu"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <div className="stack">
              {c.professional_title && (
                <span className="tag" {...ed("professional_title")}>
                  {c.professional_title}
                </span>
              )}
              <p className="hero-title" {...ed("tagline")}>
                <Headline text={c.tagline || c.name || ""} />
              </p>
              {paragraphs(c)[0] && (
                <p className="lede" {...ed("summary.0")}>
                  {paragraphs(c)[0]!.text}
                </p>
              )}
            </div>
            <div className="scrub">
              <div className="scrub-top">
                <b>{stageText}</b>
                <span>{quarter}</span>
              </div>
              <label className="mono soft" htmlFor="build">
                Drag to see the building and what you’ve paid at each stage
              </label>
              <input
                id="build"
                type="range"
                min={0}
                max={100}
                step={1}
                value={build}
                onChange={(e) => {
                  setBuild(+e.target.value);
                  controller.current?.setTarget(+e.target.value);
                }}
              />
              <div className="ticks" aria-hidden>
                <span style={{ left: 0 }}>Booking</span>
                <span style={{ left: "20%" }}>20%</span>
                <span style={{ left: "50%" }}>50%</span>
                <span style={{ left: "80%" }}>Topping out</span>
                <span style={{ left: "100%" }}>Handover</span>
              </div>
              <div className="paid">
                <span>Paid on a 60/40 plan</span>
                <b>
                  {paid}% · {aed((price * paid) / 100)}
                </b>
              </div>
            </div>
          </div>
          <div className={`hero-stage ${mode === 1 ? "render" : ""}`}>
            <canvas ref={canvas} aria-hidden />
            <OrbitHint text="Drag to turn the tower" hidden={dragged} />
            <div className="callout" ref={callout}>
              <b ref={callLevel} />
              <span ref={callH} />
            </div>
            <div className="dim">
              {(lead?.title ?? "Your next launch").toUpperCase()}
              {lead?.technologies?.[0] ? ` · ${lead.technologies[0].toUpperCase()}` : ""}
              <br />
              48 storeys · 90° twist
              <br />
              Scale 1:1500
            </div>
            <div className="mode" role="group" aria-label="View mode">
              {["Drawing", "Render"].map((name, index) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={mode === index}
                  onClick={() => {
                    setMode(index);
                    controller.current?.setMode(index);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
        {has("highlights") && (
          <div className="title-block">
            <div {...ed("name")}>
              <span>Adviser</span>
              <b>{c.name}</b>
            </div>
            {(c.highlights ?? []).map((item, index) => (
              <div key={index} {...ed(`highlights.${index}`)}>
                <span>{item.title}</span>
                <b>{item.detail}</b>
              </div>
            ))}
          </div>
        )}
      </section>

      {has("projects") && (
        <section id="launches">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="tag">Current launches</span>
                <h2>{label("projects", "Projects I would put my own money into.")}</h2>
              </div>
              <p className="lede">
                Each one is from a developer with escrow registered at the DLD. I’ve read the sale and
                purchase agreement and checked the handover clause.
              </p>
            </div>
            <Listings
              c={c}
              embedded={embedded}
              palette={ART}
              agentFirst={first}
              onEnquire={(listing) => setMessage(enquiryText(listing))}
            />
          </div>
        </section>
      )}

      <section id="process" className="tight">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="tag">How off-plan buying works</span>
              <h2>From reservation to keys in five steps.</h2>
            </div>
            <p className="lede">
              The steps are always in this order. I handle the paperwork at each one and send you a summary
              before you sign.
            </p>
          </div>
          <ol className="steps">
            {STEPS.map(([title, text, when], index) => (
              <li key={title} className="step">
                <span className="n">{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="when">{when}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="plan" className="tight">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="tag">Payment plan</span>
              <h2>See every payment before you commit.</h2>
            </div>
            <p className="lede">
              Choose a price and a plan. The schedule shows what falls due at each stage, including the DLD
              fee at registration.
            </p>
          </div>
          <div className="plan">
            <div className="plan-in">
              <div className="field">
                <label htmlFor="plan-price">Unit price (AED)</label>
                <input
                  id="plan-price"
                  type="number"
                  min={300000}
                  step={10000}
                  value={planPrice}
                  onChange={(e) => setPlanPrice(Math.max(0, +e.target.value || 0))}
                />
              </div>
              <div className="field">
                <label htmlFor="plan-type">Plan</label>
                <select id="plan-type" value={plan} onChange={(e) => setPlan(e.target.value)}>
                  <option value="60/40">60/40 · 60% during construction</option>
                  <option value="70/30">70/30 · 70% during construction</option>
                  <option value="50/50">50/50 · half after handover</option>
                  <option value="40/60">40/60 · 3 years post-handover</option>
                </select>
              </div>
              <p className="fine">Typical milestone splits. Each developer’s SPA sets the exact dates.</p>
            </div>
            <div className="plan-out">
              <table className="plan-table">
                <thead>
                  <tr>
                    <th>Stage</th>
                    <th>Due</th>
                    <th className="r">Share</th>
                    <th className="r">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>DLD fee (4% + AED 580)</td>
                    <td>Oqood registration</td>
                    <td className="r">—</td>
                    <td className="r">{aed(dld)}</td>
                  </tr>
                  {planRows(plan).map(({ stage, when, pct, post }) => {
                    return (
                      <tr key={stage}>
                        <td>{stage}</td>
                        <td>{when}</td>
                        <td className="r">
                          <span className={`pbar ${post ? "post" : ""}`} style={{ width: pct * 1.4 }} />
                          {pct}%
                        </td>
                        <td className="r">{aed((planPrice * pct) / 100)}</td>
                      </tr>
                    );
                  })}
                  <tr className="total">
                    <td colSpan={3}>Total including DLD fee</td>
                    <td className="r">{aed(planPrice + dld)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section id="calculator" className="tight">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="tag">Mortgage at handover</span>
              <h2>Financing the final payment.</h2>
            </div>
            <p className="lede">
              Most buyers take a mortgage for the handover balance. Banks lend on ready homes, so this applies
              at completion.
            </p>
          </div>
          <MortgageCalc start={price} label="Property price" />
        </div>
      </section>

      {(has("about") || has("stats")) && (
        <section id="about" className="tight">
          <div className="wrap about">
            <div className="badge" {...ed("avatar")}>
              {c.avatar ? (
                <Picture src={c.avatar} alt={c.name ?? ""} embedded={embedded} className="badge-photo" />
              ) : (
                <span aria-hidden>{initials(c.name)}</span>
              )}
            </div>
            <div className="stack">
              <span className="tag">About {first}</span>
              <h2>{label("about", "An engineer who reads the small print.")}</h2>
              {paragraphs(c)
                .slice(1)
                .map(({ text, index }) => (
                  <p key={index} {...ed(`summary.${index}`)}>
                    {text}
                  </p>
                ))}
              {has("stats") && (
                <div className="kv">
                  {(c.stats ?? []).map((stat, index) => (
                    <div key={index} {...ed(`stats.${index}`)}>
                      <b>{stat.value}</b>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {has("testimonials") && (
        <section className="tight">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="tag">Client notes</span>
                <h2>{label("testimonials", "Signed off by buyers.")}</h2>
              </div>
            </div>
            <div className="notes">
              {(c.testimonials ?? []).map((item, index) => (
                <figure
                  key={index}
                  data-ref={`REF ${String(index + 1).padStart(2, "0")}`}
                  {...ed(`testimonials.${index}`)}
                >
                  <blockquote>{item.quote}</blockquote>
                  <figcaption>
                    {item.name}
                    {item.role ? ` · ${item.role}` : ""}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {has("contact") && (
        <section className="contact" id="contact">
          <div className="wrap contact-grid">
            <div>
              <span className="tag">Contact</span>
              <h2 className="contact-title">Get the launch list before the agents do.</h2>
              <p className="lede contact-lede">
                Every month I send a short list of launches I’d consider, with the developer’s delivery
                record. Tell me your budget and I’ll add you.
              </p>
              <DirectContacts c={c} />
            </div>
            <div>
              <LeadForm
                c={c}
                message={message}
                budgets={["Under AED 1.5M", "AED 1.5M – 4M", "AED 4M – 10M", "Above AED 10M"]}
              />
            </div>
          </div>
        </section>
      )}

      <footer className="site">
        <div className="wrap foot">
          <p>
            {c.name}
            {(c.highlights ?? [])[0] ? ` · ${c.highlights![0]!.title} ${c.highlights![0]!.detail}` : ""}.
            Off-plan payments go only to DLD-registered escrow accounts.
          </p>
          <p>© {new Date().getFullYear()}</p>
        </div>
      </footer>
      <WhatsAppFloat c={c} />
    </StudioRoot>
  );
}
