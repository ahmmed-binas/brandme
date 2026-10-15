"use client";

import "@fontsource-variable/unbounded";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/jetbrains-mono";
import { Fragment, useRef, useState } from "react";
import type { StandardContent } from "@/lib/portfolio/schema";
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
import "./atlas.css";

/**
 * Atlas (premium 3D, Pro): an area specialist's site built on a night map of
 * Dubai. Tap a district (on the map, a chip or a table row) and the camera flies
 * to it while the card shows its price per foot, yield and rent. The numbers are
 * the agent's own: each area row (services) whose title names a district sets
 * that district's figures. Below: a sortable comparison, listings, about, a UAE
 * mortgage calculator, reviews and an enquiry form.
 */

type Area = {
  id: string;
  name: string;
  color: string;
  x: number;
  z: number;
  r: number;
  tall: number[];
  n: number;
  psf: number;
  yld: number;
  rent: number;
  growth: number;
  fit: string;
  desc: string;
};

/** The map: where each district sits and how tall it builds. Figures are defaults. */
const DISTRICTS: Area[] = [
  {
    id: "marina",
    name: "Dubai Marina",
    color: "#5ee6d0",
    x: -250,
    z: 30,
    r: 34,
    tall: [40, 150],
    n: 70,
    psf: 2250,
    yld: 6.8,
    rent: 105,
    growth: 9.5,
    fit: "Sea views, walkable, strong short-let demand",
    desc: "A canal lined with towers, the JBR beach and the tram. Easy to rent, busy at weekends.",
  },
  {
    id: "palm",
    name: "Palm Jumeirah",
    color: "#ffb547",
    x: -150,
    z: -150,
    r: 0,
    tall: [3, 10],
    n: 0,
    psf: 5900,
    yld: 4.6,
    rent: 190,
    growth: 14.2,
    fit: "Beachfront villas, trophy homes",
    desc: "Private-beach villas on the fronds, hotel apartments on the trunk. Prices rise fastest here.",
  },
  {
    id: "jvc",
    name: "Jumeirah Village Circle",
    color: "#b6e35a",
    x: -175,
    z: 150,
    r: 42,
    tall: [6, 30],
    n: 110,
    psf: 1150,
    yld: 8.1,
    rent: 68,
    growth: 11.0,
    fit: "Highest yields, first investments",
    desc: "Mid-rise apartments and townhouses around parks. The yield leader for investors.",
  },
  {
    id: "hills",
    name: "Dubai Hills Estate",
    color: "#9d8cff",
    x: -20,
    z: 140,
    r: 46,
    tall: [3, 40],
    n: 120,
    psf: 2150,
    yld: 5.9,
    rent: 110,
    growth: 12.8,
    fit: "Families, schools, golf and the park",
    desc: "Villas and low-rise apartments around an 18-hole course and a 2.7 km park.",
  },
  {
    id: "downtown",
    name: "Downtown Dubai",
    color: "#f3d36b",
    x: 95,
    z: 85,
    r: 28,
    tall: [30, 120],
    n: 60,
    psf: 3150,
    yld: 5.8,
    rent: 130,
    growth: 8.4,
    fit: "Prestige, tower views, short lets",
    desc: "The tallest tower, the fountain and the boulevard. Premium prices, steady demand.",
  },
  {
    id: "bay",
    name: "Business Bay",
    color: "#ff6f91",
    x: 150,
    z: 45,
    r: 30,
    tall: [25, 95],
    n: 70,
    psf: 2280,
    yld: 6.9,
    rent: 96,
    growth: 10.3,
    fit: "Value next to Downtown, canal living",
    desc: "Towers along the Dubai Water Canal, a short walk from Downtown at a lower price per foot.",
  },
  {
    id: "creek",
    name: "Dubai Creek Harbour",
    color: "#53b8ff",
    x: 255,
    z: 110,
    r: 30,
    tall: [20, 80],
    n: 55,
    psf: 2050,
    yld: 6.2,
    rent: 92,
    growth: 13.1,
    fit: "Off-plan upside, skyline views",
    desc: "A new waterfront city on the Creek with views back to Downtown. Mostly off-plan today.",
  },
];

/** The agent's own figures: an area row titled with a district's name, price “AED 2,250 · 6.8% · AED 105k · +9.5%”. */
function withAgentFigures(c: StandardContent) {
  return DISTRICTS.map((district) => {
    const index = (c.services ?? []).findIndex(
      (row) => (row.title ?? "").trim().toLowerCase() === district.name.toLowerCase(),
    );
    if (index < 0) return { ...district, row: -1 };
    const row = c.services![index]!;
    const numbers =
      (row.price ?? "").match(/[\d,.]+/g)?.map((n) => Number.parseFloat(n.replace(/,/g, ""))) ?? [];
    const [psf, yld, rent, growth] = numbers;
    return {
      ...district,
      row: index,
      psf: psf ?? district.psf,
      yld: yld ?? district.yld,
      rent: rent ?? district.rent,
      growth: growth ?? district.growth,
      fit: row.description || district.fit,
    };
  });
}

const AED = new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 });

/** “Choose the *area* first.”: words between asterisks take the accent colour. */
function Accented({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(\*[^*]+\*)/)
        .map((part, index) =>
          part.startsWith("*") && part.endsWith("*") ? (
            <span key={index}>{part.slice(1, -1)}</span>
          ) : (
            <Fragment key={index}>{part}</Fragment>
          ),
        )}
    </>
  );
}

const ART = {
  sky1: "#0f2230",
  sky2: "#13304a",
  far: "#16304a",
  body: "#1a2a3a",
  body2: "#11202d",
  glass: "#23435c",
  lit: "#5ee6d0",
  trim: "#ffb547",
  ground: "#0a0f14",
};

type SortKey = "name" | "psf" | "yld" | "rent" | "growth" | "fit";
type AtlasScene = { destroy: () => void; select: (id: string | null) => void };

export default function Atlas({ content, template, embedded }: StudioProps) {
  const studio = useStudio(content, template, embedded);
  const { c, has, label } = studio;
  const first = firstName(c.name) || "me";
  const areas = withAgentFigures(c);
  const [selected, setSelected] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: number }>({ key: "yld", dir: -1 });
  const [dragged, setDragged] = useState(false);
  const [menu, setMenu] = useState(false);
  const [message, setMessage] = useState("");
  const pins = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const { sentinel, scrolled } = useScrolled();

  const { canvas, controller, ready } = useScene<AtlasScene>(async (node) => {
    const { mountAtlas } = await import("./scenes/atlas.js");
    return mountAtlas(node, {
      areas: DISTRICTS,
      pinsEl: pins.current,
      onSelect: (id: string | null) => remember(id),
      onFirstDrag: () => setDragged(true),
    }) as Promise<AtlasScene | null>;
  });

  /** The page's side of a selection: highlight it and prefill the enquiry. */
  function remember(id: string | null) {
    setSelected(id);
    const district = DISTRICTS.find((d) => d.id === id);
    if (district) setMessage(`I'd like the area report for ${district.name}.`);
  }
  /** A chip or table row: fly the map there too. */
  const choose = (id: string | null) => {
    remember(id);
    controller.current?.select(id);
  };
  const area = areas.find((a) => a.id === selected);
  const average = (key: "psf" | "yld" | "rent") => areas.reduce((sum, a) => sum + a[key], 0) / areas.length;
  const listingsIn = (name: string) =>
    (c.projects ?? []).filter((listing) => (listing.technologies ?? [])[0] === name).length;
  const sorted = [...areas].sort((a, b) => {
    const x = a[sort.key];
    const y = b[sort.key];
    return (typeof x === "string" ? x.localeCompare(String(y)) : x - (y as number)) * sort.dir;
  });
  const maxPsf = Math.max(...areas.map((a) => a.psf));
  const maxYield = Math.max(...areas.map((a) => a.yld));
  const sortBy = (key: SortKey) =>
    setSort({ key, dir: sort.key === key ? -sort.dir : key === "name" || key === "fit" ? 1 : -1 });
  const links = [
    ["#map", "Map"],
    ["#compare", "Compare areas"],
    has("projects") && ["#listings", "Listings"],
    has("about") && ["#about", "About"],
    ["#contact", "Contact"],
  ].filter(Boolean) as string[][];
  const columns: Array<[SortKey, string, boolean]> = [
    ["name", "District", false],
    ["psf", "AED / sq ft", true],
    ["yld", "Gross yield", true],
    ["rent", "1-bed rent", true],
    ["growth", "12-mo price change", true],
    ["fit", "Best for", false],
  ];

  return (
    <StudioRoot studio={studio} className={`pm pm-atlas ${ready ? "gl-ready" : ""}`}>
      <div ref={sentinel} aria-hidden className="pm-sentinel" />
      <header className={`nav ${scrolled ? "scrolled" : ""} ${menu ? "open" : ""}`}>
        <div className="wrap nav-in">
          <a className="brand" href="#map">
            <svg viewBox="0 0 32 32" aria-hidden>
              <circle cx="16" cy="16" r="14" fill="none" stroke="var(--cyan)" strokeWidth="1.5" />
              <path d="M16 5 L19 16 L16 27 L13 16 Z" fill="var(--cyan)" />
              <circle cx="16" cy="16" r="2" fill="#0a0f14" />
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
            Get an area report
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

      <section className="hero" id="map" ref={hero}>
        <canvas ref={canvas} aria-hidden />
        <div className="pins" ref={pins} />
        <OrbitHint text="Drag to turn the map" hidden={dragged} />
        <div className="wrap hero-in">
          <div className="hero-copy">
            {c.availability && (
              <span className="label" {...ed("availability")}>
                {c.availability}
              </span>
            )}
            <p className="hero-title" {...ed("tagline")}>
              <Accented text={c.tagline || c.name || ""} />
            </p>
            {paragraphs(c)[0] && <p {...ed("summary.0")}>{paragraphs(c)[0]!.text}</p>}
            <div className="chips" role="group" aria-label="Choose an area">
              {areas.map((a) => (
                <button
                  key={a.id}
                  className="chip"
                  type="button"
                  aria-pressed={selected === a.id}
                  style={{ ["--c" as string]: a.color }}
                  onClick={() => choose(selected === a.id ? null : a.id)}
                >
                  <i />
                  {a.name}
                </button>
              ))}
            </div>
            <span className="hint">Tap a district on the map or a name above.</span>
          </div>
          <aside
            className="card"
            aria-live="polite"
            style={{ ["--c" as string]: area ? area.color : "var(--cyan)" }}
          >
            <span className="label area-label">{area ? "Area profile" : "Overview"}</span>
            <h3>{area ? area.name : "All of Dubai"}</h3>
            <p>
              {area
                ? area.desc
                : "Seven neighbourhoods from the Marina to the Creek. Pick one to compare prices, yields and rents."}
            </p>
            <dl>
              <div>
                <dt>Avg price / sq ft</dt>
                <dd>AED {AED.format(Math.round(area ? area.psf : average("psf")))}</dd>
              </div>
              <div>
                <dt>Gross yield</dt>
                <dd>{(area ? area.yld : average("yld")).toFixed(1)}%</dd>
              </div>
              <div>
                <dt>1-bed rent / yr</dt>
                <dd>AED {Math.round(area ? area.rent : average("rent"))}k</dd>
              </div>
              <div>
                <dt>Live listings</dt>
                <dd>{area ? listingsIn(area.name) : (c.projects ?? []).length}</dd>
              </div>
            </dl>
            <div className="row">
              <a className="btn" href="#contact">
                {area ? `Get the ${area.name.split(" ").slice(-1)[0]} report` : "Get the area report"}
              </a>
              <button className="btn ghost" type="button" onClick={() => choose(null)}>
                All areas
              </button>
            </div>
          </aside>
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

      <section id="compare">
        <div className="wrap">
          <div className="head">
            <div>
              <span className="label">Compare areas</span>
              <h2>{label("services", "The numbers, side by side.")}</h2>
            </div>
            <p className="lede">Sort any column. Select a row to see that district on the map.</p>
          </div>
          <div className="tbl">
            <table className="cmp">
              <thead>
                <tr>
                  {columns.map(([key, name, right]) => (
                    <th
                      key={key}
                      scope="col"
                      className={right ? "r" : undefined}
                      aria-sort={sort.key === key ? (sort.dir > 0 ? "ascending" : "descending") : undefined}
                    >
                      <button type="button" onClick={() => sortBy(key)}>
                        {name}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((a) => (
                  <tr
                    key={a.id}
                    tabIndex={0}
                    style={{ ["--c" as string]: a.color }}
                    onClick={() => {
                      choose(a.id);
                      hero.current?.scrollIntoView({ behavior: "smooth" });
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      choose(a.id);
                      hero.current?.scrollIntoView({ behavior: "smooth" });
                    }}
                    {...(a.row >= 0 ? ed(`services.${a.row}`) : {})}
                  >
                    <td>
                      <i />
                      {a.name}
                    </td>
                    <td className="r">
                      {AED.format(a.psf)}
                      <span className="spark">
                        <i style={{ width: `${((a.psf / maxPsf) * 100).toFixed(0)}%` }} />
                      </span>
                    </td>
                    <td className="r">
                      {a.yld.toFixed(1)}%
                      <span className="spark">
                        <i style={{ width: `${((a.yld / maxYield) * 100).toFixed(0)}%` }} />
                      </span>
                    </td>
                    <td className="r">AED {a.rent}k</td>
                    <td className="r">+{a.growth.toFixed(1)}%</td>
                    <td className="fit">{a.fit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="src">Typical figures this season. Ask me for the latest numbers on any building.</p>
        </div>
      </section>

      {has("projects") && (
        <section id="listings" className="tight">
          <div className="wrap">
            <div className="head">
              <div>
                <span className="label">Listings</span>
                <h2>{label("projects", "One good home in each area.")}</h2>
              </div>
              <p className="lede">
                All listings carry a DLD Trakheesi permit. Ask me for the building’s service charge and rental
                history.
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

      {(has("about") || has("stats")) && (
        <section id="about" className="tight">
          <div className="wrap about-grid">
            <div className="avatar" {...ed("avatar")}>
              <div>
                {c.avatar ? (
                  <Picture src={c.avatar} alt={c.name ?? ""} embedded={embedded} className="avatar-photo" />
                ) : (
                  <span aria-hidden>{initials(c.name)}</span>
                )}
              </div>
            </div>
            <div className="stack">
              <span className="label">About {first}</span>
              <h2>{label("about", "I map the city before I sell any of it.")}</h2>
              {paragraphs(c)
                .slice(1)
                .map(({ text, index }) => (
                  <p key={index} {...ed(`summary.${index}`)}>
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

      <section id="calculator" className="tight">
        <div className="wrap">
          <div className="head">
            <div>
              <span className="label">Mortgage &amp; costs</span>
              <h2>Model the purchase.</h2>
            </div>
            <p className="lede">
              Monthly payment and cash due at transfer, using UAE Central Bank deposit limits.
            </p>
          </div>
          <MortgageCalc start={startingPrice(c, 2200000)} />
        </div>
      </section>

      {has("testimonials") && (
        <section className="tight">
          <div className="wrap">
            <div className="head">
              <div>
                <span className="label">Clients</span>
                <h2>{label("testimonials", "Investors and movers.")}</h2>
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
        <section id="contact" className="tight">
          <div className="wrap contact-grid">
            <div>
              <span className="label">Contact</span>
              <h2 className="contact-title">Ask for an area report.</h2>
              <p className="lede contact-lede">
                Tell me your budget and goal. I’ll send a two-page report on the best two areas for you within
                a day.
              </p>
              <DirectContacts c={c} />
            </div>
            <div>
              <LeadForm
                c={c}
                message={message}
                budgets={["Under AED 1.5M", "AED 1.5M – 3M", "AED 3M – 8M", "Above AED 8M"]}
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
