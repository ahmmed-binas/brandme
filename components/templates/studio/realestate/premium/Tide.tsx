"use client";

import "@fontsource/italiana";
import "@fontsource-variable/figtree";
import { useState } from "react";
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
import "./tide.css";

/**
 * Tide (premium 3D, Pro): a waterfront agent's site. The hero is the Gulf at
 * golden hour under a real photographed sky, with a sail-shaped hotel, mirror
 * water and boats; drag to look along the coast. Below: a ticker of the agent's
 * specialities, homes, the coast compared (with how much beach each community
 * has), about, a UAE mortgage calculator, reviews and an enquiry form.
 */

const ART = {
  sky1: "#f4c79a",
  sky2: "#e98c6e",
  far: "#d9a089",
  body: "#f7f1ea",
  body2: "#e7d8cc",
  glass: "#7fb3b0",
  lit: "#ffe3b8",
  trim: "#0b3b40",
  ground: "#0b3b40",
};

/** “5,900 · 4.6% · 95%”: price per foot, gross yield, share of beach access. */
const coastFigures = (text?: string) => {
  const parts = (text ?? "").split("·").map((part) => part.trim());
  const beach = Number.parseFloat(parts[2] ?? "");
  return {
    psf: parts[0] ?? "",
    yld: parts[1] ?? "",
    beach: Number.isFinite(beach) ? Math.min(100, beach) : 0,
  };
};

export default function Tide({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const first = firstName(c.name) || "me";
  const [dragged, setDragged] = useState(false);
  const [menu, setMenu] = useState(false);
  const [message, setMessage] = useState("");
  const { sentinel, scrolled } = useScrolled();
  const { canvas, ready } = useScene(async (node) => {
    const { mountTide } = await import("./scenes/tide.js");
    return mountTide(node, { onFirstDrag: () => setDragged(true) });
  });
  const ticker = c.skills ?? [];
  const links = [
    has("projects") && ["#homes", "Homes"],
    has("services") && ["#coast", "The coast"],
    has("about") && ["#about", "About"],
    ["#calculator", "Mortgage"],
    ["#contact", "Contact"],
  ].filter(Boolean) as string[][];

  return (
    <StudioRoot studio={studio} className={`pm pm-tide ${ready ? "gl-ready" : ""}`}>
      <div ref={sentinel} aria-hidden className="pm-sentinel" />
      <header className={`nav ${scrolled ? "scrolled" : ""} ${menu ? "open" : ""}`}>
        <div className="wrap nav-in">
          <a className="brand" href="#top">
            <h1 {...ed("name")}>{c.name}</h1>
            <small {...ed("professional_title")}>{c.professional_title}</small>
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
          <a className="btn sun nav-cta" href="#contact">
            Book a boat viewing
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
        <OrbitHint text="Drag to look along the coast" hidden={dragged} />
        <div className="wrap hero-in">
          <div className="hero-copy">
            {c.availability && (
              <span className="kicker hero-kicker" {...ed("availability")}>
                {c.availability}
              </span>
            )}
            <p className="hero-title" {...ed("tagline")}>
              {c.tagline || c.name}
            </p>
            {paragraphs(c)[0] && <p {...ed("summary.0")}>{paragraphs(c)[0]!.text}</p>}
          </div>
          <div className="hero-side">
            {has("highlights") && (
              <div className="tide-card" aria-label="Today on the water">
                {(c.highlights ?? []).map((item, index) => (
                  <div key={index} className="tide-row" {...ed(`highlights.${index}`)}>
                    <span>{item.title}</span>
                    <b>{item.detail}</b>
                  </div>
                ))}
              </div>
            )}
            <div className="row">
              {has("projects") && (
                <a className="btn sun" href="#homes">
                  See the homes
                </a>
              )}
              <a className="btn line" href="#contact">
                Talk to {first}
              </a>
            </div>
          </div>
        </div>
      </section>

      {ticker.length > 0 && (
        <div className="marquee" {...ed("skills")}>
          <div className="marquee-track">
            {[...ticker, ...ticker].map((item, index) => (
              <span key={index} aria-hidden={index >= ticker.length}>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {has("projects") && (
        <section id="homes">
          <div className="wrap">
            <div className="head">
              <div>
                <span className="kicker">On the water now</span>
                <h2>{label("projects", "Homes where the sea is the view.")}</h2>
              </div>
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

      {has("services") && (
        <section id="coast" className="tight">
          <div className="wrap">
            <div className="head">
              <div>
                <span className="kicker">The coast, compared</span>
                <h2>{label("services", "Shorelines, and how they live.")}</h2>
              </div>
              <p className="lede">
                How much beach you actually get, and what a sea-view home costs per square foot this season.
              </p>
            </div>
            <div className="coast">
              {(c.services ?? []).map((row, index) => {
                const figures = coastFigures(row.price);
                return (
                  <article key={index} {...ed(`services.${index}`)}>
                    <h3>{row.title}</h3>
                    <p>{row.description}</p>
                    <dl>
                      <dt>AED / sq ft</dt>
                      <dd>{figures.psf}</dd>
                      <dt>Gross yield</dt>
                      <dd>{figures.yld}</dd>
                    </dl>
                    <div
                      className="beach"
                      style={{ ["--w" as string]: `${figures.beach}%` }}
                      title="Beach access"
                    />
                  </article>
                );
              })}
            </div>
            <p className="src">Bars show how much of each community has direct beach access.</p>
          </div>
        </section>
      )}

      {(has("about") || has("stats")) && (
        <section className="about" id="about">
          <div className="wrap about-grid">
            <div className="porthole" {...ed("avatar")}>
              {c.avatar ? (
                <Picture src={c.avatar} alt={c.name ?? ""} embedded={embedded} className="porthole-photo" />
              ) : (
                <span aria-hidden>{initials(c.name)}</span>
              )}
            </div>
            <div className="stack">
              <span className="kicker about-kicker">About {first}</span>
              <h2>{label("about", "By the sea, always.")}</h2>
              {paragraphs(c)
                .slice(1)
                .map(({ text, index }) => (
                  <p key={index} className="lede" {...ed(`summary.${index}`)}>
                    {text}
                  </p>
                ))}
              {has("stats") && (
                <div className="stats">
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

      <section id="calculator">
        <div className="wrap">
          <div className="head">
            <div>
              <span className="kicker">Mortgage &amp; costs</span>
              <h2>Work out the numbers.</h2>
            </div>
            <p className="lede">
              Monthly payment and the cash you need on transfer day, using UAE Central Bank deposit limits.
            </p>
          </div>
          <MortgageCalc start={startingPrice(c, 6500000)} label="Property price" />
        </div>
      </section>

      {has("testimonials") && (
        <section className="tight">
          <div className="wrap">
            <div className="head">
              <div>
                <span className="kicker">Clients</span>
                <h2>{label("testimonials", "From the people with the keys.")}</h2>
              </div>
            </div>
            <div className="quotes">
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
              <span className="kicker">Contact</span>
              <h2 className="contact-title">Come out on the water.</h2>
              <p className="lede contact-lede">
                Tell me what you’re looking for, and I’ll plan a viewing from the sea and on land.
              </p>
              <DirectContacts c={c} />
            </div>
            <div>
              <LeadForm
                c={c}
                message={message}
                budgets={["Under AED 5M", "AED 5M – 15M", "AED 15M – 40M", "Above AED 40M"]}
              />
            </div>
          </div>
        </section>
      )}

      <footer className="site">
        <div className="wrap foot">
          <p>{c.name}</p>
          <p>© {new Date().getFullYear()}</p>
        </div>
      </footer>
      <WhatsAppFloat c={c} />
    </StudioRoot>
  );
}
