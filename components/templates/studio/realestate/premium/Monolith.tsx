"use client";

import "@fontsource-variable/bodoni-moda";
import "@fontsource-variable/manrope";
import { Fragment, useEffect, useState } from "react";
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
import "./monolith.css";

/**
 * Monolith (premium 3D, Pro): a prime agent's site at blue hour. The hero is a
 * very tall tower over a mirror lake and a lit skyline, with reflections from a
 * real photographed sky; drag to fly around it. Below: residences, about,
 * districts with price per foot, a UAE mortgage calculator, reviews and an
 * enquiry form.
 */

const ART = {
  sky1: "#2a3352",
  sky2: "#141a2c",
  far: "#1d2438",
  body: "#262f47",
  body2: "#1a2134",
  glass: "#3a4566",
  lit: "#e2c597",
  trim: "#c8a26b",
  ground: "#07090f",
};

/** “Homes above the *city*”: words between asterisks in the brass italic. */
function Accented({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(\*[^*]+\*)/)
        .map((part, index) =>
          part.startsWith("*") && part.endsWith("*") ? (
            <em key={index}>{part.slice(1, -1)}</em>
          ) : (
            <Fragment key={index}>{part}</Fragment>
          ),
        )}
    </>
  );
}

/** Dubai's local time, updated every half minute. */
function useDubaiTime() {
  const [time, setTime] = useState("--:--");
  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Dubai",
    });
    const tick = () => setTime(format.format(new Date()));
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 30000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);
  return time;
}

const numbers = (text?: string) => (text ?? "").match(/[\d,.]+%?/g) ?? [];

export default function Monolith({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const first = firstName(c.name) || "me";
  const [dragged, setDragged] = useState(false);
  const [menu, setMenu] = useState(false);
  const [message, setMessage] = useState("");
  const time = useDubaiTime();
  const { sentinel, scrolled } = useScrolled();
  const { canvas, ready } = useScene(async (node) => {
    const { mountMonolith } = await import("./scenes/monolith.js");
    return mountMonolith(node, { onFirstDrag: () => setDragged(true) });
  });

  const stats = c.stats ?? [];
  const story = paragraphs(c).slice(1);
  const quote = story.find(({ text }) => /^[“"]/.test(text));
  const prices = (c.services ?? []).map((row) =>
    Number.parseFloat((numbers(row.price)[0] ?? "0").replace(/,/g, "")),
  );
  const top = Math.max(1, ...prices);
  const links = [
    has("projects") && ["#residences", "Residences"],
    has("about") && ["#about", "About"],
    has("services") && ["#areas", "Areas"],
    ["#calculator", "Mortgage"],
    ["#contact", "Contact"],
  ].filter(Boolean) as string[][];

  return (
    <StudioRoot studio={studio} className={`pm pm-monolith ${ready ? "gl-ready" : ""}`}>
      <div ref={sentinel} aria-hidden className="pm-sentinel" />
      <header className={`nav ${scrolled ? "scrolled" : ""} ${menu ? "open" : ""}`}>
        <div className="wrap nav-in">
          <a className="brand" href="#top">
            <span className="mono" aria-hidden>
              {initials(c.name)}
            </span>
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
            Book a viewing
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
        <div className="hero-bg" aria-hidden />
        <canvas ref={canvas} aria-hidden />
        <OrbitHint text="Drag to fly around the tower" hidden={dragged} />
        <div className="wrap hero-in">
          {c.availability && (
            <p className="eyebrow" {...ed("availability")}>
              {c.availability}
            </p>
          )}
          <p className="hero-title" {...ed("tagline")}>
            <Accented text={c.tagline || c.name || ""} />
          </p>
          {paragraphs(c)[0] && (
            <p className="lede" {...ed("summary.0")}>
              {paragraphs(c)[0]!.text}
            </p>
          )}
          <div className="hero-actions">
            {has("projects") && (
              <a className="btn" href="#residences">
                View residences
              </a>
            )}
            <a className="btn ghost" href="#contact">
              Arrange a private viewing
            </a>
          </div>
          {stats.length > 0 && (
            <div className="hero-meta">
              {stats.slice(0, 3).map((stat, index) => (
                <div key={index} {...ed(`stats.${index}`)}>
                  <b>{stat.value}</b>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="hero-readout" aria-hidden>
          <span>{c.location || "Dubai"} · 25.197° N</span>
          <span>
            Local time <b>{time}</b>
          </span>
        </div>
      </section>

      {has("highlights") && (
        <div className="creds">
          <div className="wrap creds-in">
            <span className="verified">
              <i aria-hidden />
              RERA licensed
            </span>
            {(c.highlights ?? []).map((item, index) => (
              <span key={index} {...ed(`highlights.${index}`)}>
                {item.title} <b>{item.detail}</b>
              </span>
            ))}
            <a href="https://dubailand.gov.ae" target="_blank" rel="noopener noreferrer">
              Verify on Dubai Land Department
            </a>
          </div>
        </div>
      )}

      {has("projects") && (
        <section id="residences">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="eyebrow">Current residences</span>
                <h2>{label("projects", "Homes, each one visited in person.")}</h2>
              </div>
              <p className="lede">
                Every listing carries its Trakheesi advertising permit. Ask for floor plans, service charges
                and the view from the actual unit.
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

      {(has("about") || stats.length > 3) && (
        <section className="about" id="about">
          <div className="wrap about-in">
            <div className="portrait" {...ed("avatar")}>
              {c.avatar ? (
                <Picture src={c.avatar} alt={c.name ?? ""} embedded={embedded} className="portrait-photo" />
              ) : (
                <span aria-hidden>{initials(c.name)}</span>
              )}
            </div>
            <div>
              <span className="eyebrow">About {first}</span>
              <h2 className="about-title">{label("about", "Years on one boulevard.")}</h2>
              {story.map(({ text, index }) =>
                quote?.index === index ? (
                  <blockquote key={index} {...ed(`summary.${index}`)}>
                    {text}
                  </blockquote>
                ) : (
                  <p key={index} {...ed(`summary.${index}`)}>
                    {text}
                  </p>
                ),
              )}
              {stats.length > 3 && (
                <div className="facts">
                  {stats.slice(3, 6).map((stat, index) => (
                    <div key={index} {...ed(`stats.${index + 3}`)}>
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

      {has("services") && (
        <section id="areas">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="eyebrow">Where I work</span>
                <h2>{label("services", "Districts, known floor by floor.")}</h2>
              </div>
              <p className="lede">
                Typical asking prices for high-floor apartments this quarter. Your unit’s floor, view and
                finish move the number.
              </p>
            </div>
            <div className="tbl-wrap">
              <table className="areas-table">
                <thead>
                  <tr>
                    <th>District</th>
                    <th>Known for</th>
                    <th className="num">AED / sq ft</th>
                    <th className="num">Gross yield</th>
                  </tr>
                </thead>
                <tbody>
                  {(c.services ?? []).map((row, index) => {
                    const [psf, yld] = numbers(row.price);
                    return (
                      <tr key={index} {...ed(`services.${index}`)}>
                        <td>{row.title}</td>
                        <td>{row.description}</td>
                        <td className="num">
                          {psf}
                          <span className="meter">
                            <i style={{ width: `${Math.round(((prices[index] ?? 0) / top) * 100)}%` }} />
                          </span>
                        </td>
                        <td className="num">{yld}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section id="calculator" className="tight">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Mortgage &amp; costs</span>
              <h2>
                What it <em>really</em> costs to buy.
              </h2>
            </div>
            <p className="lede">
              Monthly payment plus the fees due on transfer day. Deposit limits follow UAE Central Bank rules
              for a first home.
            </p>
          </div>
          <MortgageCalc start={startingPrice(c, 8500000)} label="Property price" />
        </div>
      </section>

      {has("testimonials") && (
        <section className="tight">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="eyebrow">Clients</span>
                <h2>{label("testimonials", "What they said after the keys.")}</h2>
              </div>
            </div>
            <div className="reviews">
              {(c.testimonials ?? []).map((item, index) => (
                <figure key={index} className="review" {...ed(`testimonials.${index}`)}>
                  <span className="stars" aria-label="5 out of 5">
                    ★★★★★
                  </span>
                  <p>{item.quote}</p>
                  <footer>
                    <b>{item.name}</b>
                    {item.role}
                  </footer>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {has("contact") && (
        <section className="contact" id="contact">
          <div className="wrap contact-in">
            <div>
              <span className="eyebrow">Contact</span>
              <h2 className="contact-title">
                Tell me what you are <em>looking</em> for.
              </h2>
              <p className="lede contact-lede">
                I reply within the hour between 9am and 9pm Gulf time, usually on WhatsApp.
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
