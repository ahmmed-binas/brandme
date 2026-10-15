"use client";

import "@fontsource-variable/reem-kufi";
import "@fontsource-variable/karla";
import { useRef, useState } from "react";
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
import "./dune.css";

/**
 * Dune (premium 3D, Pro): a villa specialist's site. The hero is a courtyard
 * villa in the dunes with a sun clock: drag the slider (or press Play a day) and
 * the sun crosses the sky, the shadows move, and at dusk the pool and lanterns
 * light up. Below: listings, why orientation matters, communities, about, a UAE
 * mortgage calculator, reviews and an enquiry form that hands off to WhatsApp.
 */

const NOTES: Array<[number, string]> = [
  [7.3, "Sunrise. East bedrooms fill with soft light."],
  [10.5, "Morning. The north garden is cool and fully shaded."],
  [14, "Midday. The sun is high in the south; the courtyard screen breaks the glare."],
  [16.8, "Afternoon. The house shades the north garden; the pool is still in sun."],
  [18.1, "Golden hour. The west terrace and pool catch the last light."],
  [18.9, "Dusk. Lanterns on, the pool lights up."],
  [99, "Night. A cool desert evening under the stars."],
];

const clock = (hour: number) => {
  const minutes = Math.round((hour * 60) / 5) * 5;
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};

const ART = {
  sky1: "#f3c98a",
  sky2: "#e7a76a",
  far: "#d9b48a",
  body: "#f6ecdc",
  body2: "#e3cfb2",
  glass: "#5f6c9e",
  lit: "#ffd28a",
  trim: "#b8774a",
  ground: "#c9935e",
};

type DuneScene = { destroy: () => void; setHour: (h: number) => void; setPlaying: (on: boolean) => void };

export default function Dune({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const first = firstName(c.name) || "me";
  const [hour, setHourState] = useState(17.5);
  const [playing, setPlaying] = useState(false);
  const [dragged, setDragged] = useState(false);
  const [menu, setMenu] = useState(false);
  const [message, setMessage] = useState("");
  const shownHour = useRef(17.5);
  const { sentinel, scrolled } = useScrolled();

  const { canvas, controller, ready } = useScene<DuneScene>(async (node) => {
    const { mountDune } = await import("./scenes/dune.js");
    return mountDune(node, {
      hour: 17.5,
      onFirstDrag: () => setDragged(true),
      onPlaying: (on: boolean) => setPlaying(on),
      // Only re-render when the clock moves by five minutes.
      onHour: (h: number) => {
        if (Math.abs(h - shownHour.current) < 1 / 12) return;
        shownHour.current = h;
        setHourState(h);
      },
    }) as Promise<DuneScene | null>;
  });

  const setHour = (h: number) => {
    shownHour.current = h;
    setHourState(h);
    setPlaying(false);
    controller.current?.setHour(h);
  };
  const togglePlay = () => {
    const next = !playing;
    if (next && hour > 20.3) setHourState(6);
    setPlaying(next);
    controller.current?.setPlaying(next);
  };
  const note = NOTES.find(([limit]) => hour < limit)?.[1];
  const links = [
    has("projects") && ["#villas", "Villas"],
    ["#orientation", "Orientation"],
    has("services") && ["#communities", "Communities"],
    has("about") && ["#about", "About"],
    ["#contact", "Contact"],
  ].filter(Boolean) as string[][];

  return (
    <StudioRoot studio={studio} className={`pm pm-dune ${ready ? "gl-ready" : ""}`}>
      <div ref={sentinel} aria-hidden className="pm-sentinel" />
      <header className={`nav ${scrolled ? "scrolled" : ""} ${menu ? "open" : ""}`}>
        <div className="wrap nav-in">
          <a className="brand" href="#top">
            <svg className="star" viewBox="0 0 40 40" aria-hidden>
              <g fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="9" y="9" width="22" height="22" />
                <rect x="9" y="9" width="22" height="22" transform="rotate(45 20 20)" />
                <circle cx="20" cy="20" r="4.5" />
              </g>
            </svg>
            <span>
              <h1 {...ed("name")}>{c.name}</h1>
              <small {...ed("professional_title")}>{c.professional_title}</small>
            </span>
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
            Arrange a viewing
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
        <canvas ref={canvas} aria-hidden />
        <OrbitHint text="Drag to walk around the villa" hidden={dragged} />
        <div className="wrap hero-in">
          <div className="hero-copy">
            {c.availability && (
              <p className="ar" {...ed("availability")}>
                {c.availability}
              </p>
            )}
            <p className="hero-title" {...ed("tagline")}>
              {c.tagline || c.name}
            </p>
            {paragraphs(c)[0] && <p {...ed("summary.0")}>{paragraphs(c)[0]!.text}</p>}
          </div>
          <div className="dial" role="group" aria-label="Sun over the villa">
            <div className="dial-top">
              <b>{clock(hour)}</b>
              <span>Sun over the villa</span>
            </div>
            <input
              type="range"
              min={6}
              max={20.5}
              step={0.05}
              value={hour}
              aria-label="Time of day"
              onChange={(e) => setHour(+e.target.value)}
            />
            <div className="dial-scale" aria-hidden>
              <span>6 am</span>
              <span>Noon</span>
              <span>8 pm</span>
            </div>
            <p className="note">{note}</p>
            <div className="dial-row">
              <button className="btn" type="button" onClick={togglePlay}>
                {playing ? "Pause" : "Play a day"}
              </button>
              {has("projects") && (
                <a className="btn ghost" href="#villas">
                  See villas
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {has("highlights") && (
        <div className="creds">
          <div className="wrap creds-in">
            {(c.highlights ?? []).map((item, index) => (
              <span key={index} {...ed(`highlights.${index}`)}>
                {item.title} <b>{item.detail}</b>
              </span>
            ))}
          </div>
        </div>
      )}

      {has("projects") && (
        <section id="villas">
          <div className="wrap">
            <div className="head">
              <div>
                <span className="eyebrow">Villas available</span>
                <h2>{label("projects", "Gardens, pools and room to grow.")}</h2>
              </div>
              <p className="lede">
                Each listing notes which way the garden faces. Ask for the sun study and the community’s
                service charge.
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

      <section className="orient" id="orientation">
        <div className="wrap orient-grid">
          <svg
            className="compass"
            viewBox="0 0 400 400"
            role="img"
            aria-label="Sun path over a Dubai villa plot, rising in the east and setting in the west via the south"
          >
            <circle cx="200" cy="200" r="170" fill="none" stroke="rgba(239,227,207,.25)" />
            <circle
              cx="200"
              cy="200"
              r="120"
              fill="none"
              stroke="rgba(239,227,207,.12)"
              strokeDasharray="3 5"
            />
            <path d="M40 220 A170 120 0 0 0 360 220" fill="none" stroke="var(--saffron)" strokeWidth="2" />
            <g fill="var(--saffron)">
              <circle cx="40" cy="220" r="6" />
              <circle cx="200" cy="338" r="10" />
              <circle cx="360" cy="220" r="6" />
            </g>
            <rect x="150" y="150" width="100" height="70" fill="#efe3cf" />
            <rect x="150" y="220" width="100" height="44" fill="#3e8a6a" opacity=".85" />
            <text x="200" y="190" textAnchor="middle" fontSize="13" fill="#1c2347">
              Villa
            </text>
            <text x="200" y="247" textAnchor="middle" fontSize="12" fill="#efe3cf">
              Garden
            </text>
            <g fontSize="16" fill="#efe3cf">
              <text x="200" y="22" textAnchor="middle">
                N
              </text>
              <text x="200" y="392" textAnchor="middle">
                S
              </text>
              <text x="388" y="206" textAnchor="end">
                E
              </text>
              <text x="12" y="206">
                W
              </text>
            </g>
            <g fontSize="12" fill="rgba(239,227,207,.75)">
              <text x="352" y="246" textAnchor="end">
                Sunrise
              </text>
              <text x="200" y="370" textAnchor="middle">
                Noon, high in the south
              </text>
              <text x="48" y="246">
                Sunset
              </text>
            </g>
          </svg>
          <div className="stack">
            <span className="eyebrow light">Why orientation matters</span>
            <h2>In Dubai, a north garden is worth paying for.</h2>
            <p className="lede">
              The sun crosses the southern sky for most of the year. A garden on the north side of the villa
              sits in the house’s shadow through the hot afternoon, so you can use it from October to May.
            </p>
            <div className="facing">
              <div>
                <b>North garden</b>
                <span>Shaded by the house. Usable most afternoons.</span>
              </div>
              <div>
                <b>South garden</b>
                <span>Full sun. Good for a pool, hard for a lawn.</span>
              </div>
              <div>
                <b>East bedrooms</b>
                <span>Soft morning light, cool by midday.</span>
              </div>
              <div>
                <b>West living room</b>
                <span>Sunsets, but higher cooling bills.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {has("services") && (
        <section id="communities">
          <div className="wrap">
            <div className="head">
              <div>
                <span className="eyebrow">Communities</span>
                <h2>{label("services", "Where families are buying.")}</h2>
              </div>
              <p className="lede">
                Typical prices for a four-bedroom villa this season, and what each community is best at.
              </p>
            </div>
            <div className="tbl">
              <table className="comm">
                <thead>
                  <tr>
                    <th>Community</th>
                    <th>Best for</th>
                    <th className="r">4-bed villa</th>
                  </tr>
                </thead>
                <tbody>
                  {(c.services ?? []).map((row, index) => (
                    <tr key={index} {...ed(`services.${index}`)}>
                      <td>{row.title}</td>
                      <td>{row.description}</td>
                      <td className="r">{row.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {(has("about") || has("stats")) && (
        <section id="about" className="tight">
          <div className="wrap about-grid">
            <div className="arch" {...ed("avatar")}>
              {c.avatar ? (
                <Picture src={c.avatar} alt={c.name ?? ""} embedded={embedded} className="arch-photo" />
              ) : (
                <span aria-hidden>{initials(c.name)}</span>
              )}
            </div>
            <div className="stack">
              <span className="eyebrow">About {first}</span>
              <h2>{label("about", `${c.professional_title || "Villas"}, sold with care.`)}</h2>
              {paragraphs(c)
                .slice(1)
                .map(({ text, index }) => (
                  <p key={index} {...ed(`summary.${index}`)}>
                    {text}
                  </p>
                ))}
              {has("stats") && (
                <div className="nums">
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

      <section id="calculator" className="tight">
        <div className="wrap">
          <div className="head">
            <div>
              <span className="eyebrow">Mortgage &amp; costs</span>
              <h2>Plan the purchase.</h2>
            </div>
            <p className="lede">
              Monthly payment and the cash due on transfer, using UAE Central Bank deposit limits.
            </p>
          </div>
          <MortgageCalc start={startingPrice(c, 5800000)} label="Villa price" />
        </div>
      </section>

      {has("testimonials") && (
        <section className="tight">
          <div className="wrap">
            <div className="head">
              <div>
                <span className="eyebrow">Families</span>
                <h2>{label("testimonials", "In their words.")}</h2>
              </div>
            </div>
            <div className="voices">
              {(c.testimonials ?? []).map((item, index) => (
                <figure key={index} {...ed(`testimonials.${index}`)}>
                  <blockquote>{item.quote}</blockquote>
                  <figcaption>
                    <b>{item.name}</b>
                    {item.role}
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
              <span className="eyebrow light">Contact</span>
              <h2 className="contact-title">Come and see it at the right hour.</h2>
              <p className="lede">
                Tell me what your family needs. I’ll send a shortlist with sun studies and arrange viewings in
                the morning and late afternoon.
              </p>
              <DirectContacts c={c} />
            </div>
            <div>
              <LeadForm
                c={c}
                message={message}
                budgets={["Under AED 4M", "AED 4M – 8M", "AED 8M – 15M", "Above AED 15M"]}
              />
            </div>
          </div>
        </section>
      )}

      <footer className="site">
        <div className="wrap foot">
          <p>
            {c.name}
            {(c.highlights ?? [])[0] ? ` · ${c.highlights![0]!.title} ${c.highlights![0]!.detail}` : ""}
          </p>
          <p>© {new Date().getFullYear()}</p>
        </div>
      </footer>
      <WhatsAppFloat c={c} />
    </StudioRoot>
  );
}
