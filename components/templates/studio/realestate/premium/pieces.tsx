"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { StandardContent } from "@/lib/portfolio/schema";
import { Picture, ed, firstName } from "../../kit";
import { parsePrice, type Listing } from "../re-kit";

/**
 * Shared pieces for the premium agent templates (Monolith, Tide, Blueprint, Dune,
 * Atlas). Each piece renders the same class names as the original standalone
 * pages (lst-*, calc-*, field, direct…), so every template styles them its own way
 * in its scoped CSS.
 */

type Controller = { destroy: () => void };

/** Mounts a 3D scene on a canvas and tears it down when the template unmounts. */
export function useScene<T extends Controller>(mount: (canvas: HTMLCanvasElement) => Promise<T | null>) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<T | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    let gone = false;
    mount(node)
      .then((made) => {
        if (gone) {
          made?.destroy();
          return;
        }
        controller.current = made;
        setReady(Boolean(made));
      })
      .catch(() => setReady(false));
    return () => {
      gone = true;
      controller.current?.destroy();
      controller.current = null;
    };
    // The scene is built once; templates pass live values through the controller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { canvas, controller, ready };
}

/** “Drag to …” pill over the 3D, gone after the first drag. */
export function OrbitHint({ text, hidden }: { text: string; hidden?: boolean }) {
  return (
    <div className={`pm-hint ${hidden ? "gone" : ""}`} aria-hidden>
      {text}
    </div>
  );
}

/** True once the page has scrolled past the top (for a nav that turns solid). */
export function useScrolled() {
  const sentinel = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry?.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { sentinel, scrolled };
}

/* ---------- Listings ---------- */

const STATUS = [
  { id: "all", label: "All" },
  { id: "sale", label: "For sale" },
  { id: "rent", label: "For rent" },
  { id: "offplan", label: "Off-plan" },
] as const;

/** Reads the listing's status from its category: “For sale”, “For rent”, “Off-plan”, “Sold”. */
export const statusOf = (listing: Listing) => {
  const text = (listing.category ?? "").toLowerCase();
  if (text.includes("rent") || text.includes("lease")) return "rent";
  if (text.includes("off") || text.includes("launch")) return "offplan";
  return "sale";
};

/** Seeded random numbers from a piece of text, so the same listing always gets the same drawing. */
function seededRandom(text: string) {
  let seed = 2166136261;
  for (const ch of text) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619);
  return () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) % 100000) / 100000;
  };
}

/** A drawn elevation for listings without a photo (villa or tower, seeded by the title). */
function ListingArt({ listing, palette }: { listing: Listing; palette: Record<string, string> }) {
  const shapes = useMemo(() => {
    const random = seededRandom(listing.title ?? "home");
    const ground = 214;
    const out: ReactNode[] = [];
    for (let i = 0; i < 9; i++) {
      const w = 18 + random() * 34;
      const h = 30 + random() * 90;
      out.push(
        <rect key={`far${i}`} x={random() * 400} y={ground - h} width={w} height={h} fill={palette.far} />,
      );
    }
    const villa = /villa|townhouse|mansion/i.test(`${listing.title} ${listing.role}`);
    if (villa) {
      out.push(
        <rect key="b1" x={80} y={ground - 62} width={250} height={62} fill={palette.body} />,
        <rect key="b2" x={120} y={ground - 112} width={150} height={50} fill={palette.body2} />,
        <rect key="t1" x={60} y={ground - 116} width={230} height={6} fill={palette.trim} />,
        <rect key="t2" x={70} y={ground - 66} width={280} height={5} fill={palette.trim} />,
        <rect key="w1" x={128} y={ground - 100} width={134} height={26} fill={palette.lit} opacity={0.8} />,
        <rect key="w2" x={92} y={ground - 48} width={226} height={30} fill={palette.glass} opacity={0.7} />,
      );
    } else {
      const floors = 14 + Math.floor(random() * 8);
      const floorHeight = Math.min(8.2, (ground - 30) / floors);
      const w = 96 + random() * 40;
      const x = 200 - w / 2 + (random() - 0.5) * 60;
      const h = floors * floorHeight;
      out.push(
        <rect key="tw" x={x} y={ground - h} width={w} height={h} fill={palette.body} />,
        <rect
          key="ts"
          x={x + w}
          y={ground - h * 0.92}
          width={w * 0.28}
          height={h * 0.92}
          fill={palette.body2}
        />,
      );
      for (let floor = 0; floor < floors; floor++)
        for (let col = 0; col < 6; col++)
          out.push(
            <rect
              key={`w${floor}-${col}`}
              x={x + 8 + col * ((w - 16) / 6)}
              y={ground - h + 4 + floor * floorHeight + floorHeight * 0.25}
              width={((w - 16) / 6) * 0.56}
              height={floorHeight * 0.5}
              fill={random() < 0.38 ? palette.lit : palette.glass}
              opacity={0.85}
            />,
          );
    }
    return out;
  }, [listing.title, listing.role, palette]);
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="400" height="260" fill={palette.sky2} />
      <rect width="400" height="150" fill={palette.sky1} opacity={0.6} />
      {shapes}
      <rect y="214" width="400" height="46" fill={palette.ground} />
    </svg>
  );
}

export function Listings({
  c,
  embedded,
  palette,
  agentFirst,
  onEnquire,
}: {
  c: StandardContent;
  embedded?: boolean;
  palette: Record<string, string>;
  agentFirst: string;
  onEnquire: (listing: Listing) => void;
}) {
  const [filter, setFilter] = useState<(typeof STATUS)[number]["id"]>("all");
  const listings = (c.projects ?? []).map((listing, index) => ({ listing, index }));
  const present = new Set(listings.map(({ listing }) => statusOf(listing)));
  const shown = listings.filter(({ listing }) => filter === "all" || statusOf(listing) === filter);
  return (
    <>
      {present.size > 1 && (
        <div className="filters" role="group" aria-label="Filter listings">
          {STATUS.filter((status) => status.id === "all" || present.has(status.id)).map((status) => (
            <button
              key={status.id}
              type="button"
              aria-pressed={filter === status.id}
              onClick={() => setFilter(status.id)}
            >
              {status.label}
            </button>
          ))}
        </div>
      )}
      <div className="grid">
        {shown.map(({ listing, index }) => (
          <article key={index} className="lst" {...ed(`projects.${index}`)}>
            <div className="lst-art">
              {listing.image ? (
                <Picture
                  src={listing.image}
                  alt={listing.title ?? ""}
                  embedded={embedded}
                  className="lst-photo"
                />
              ) : (
                <ListingArt listing={listing} palette={palette} />
              )}
              {listing.category && <span className="lst-tag">{listing.category}</span>}
            </div>
            <div className="lst-body">
              {(listing.technologies ?? []).length > 0 && (
                <p className="lst-area">{(listing.technologies ?? []).join(" · ")}</p>
              )}
              <h3 className="lst-title">{listing.title}</h3>
              {listing.client && <p className="lst-price">{listing.client}</p>}
              {listing.role && <p className="lst-specs">{listing.role}</p>}
              {listing.description && <p className="lst-note">{listing.description}</p>}
              <div className="lst-foot">
                <span className="lst-permit">{listing.year}</span>
                <a className="lst-cta" href="#contact" onClick={() => onEnquire(listing)}>
                  Ask {agentFirst}
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

/* ---------- UAE mortgage maths ---------- */

const AED = new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 });
const aed = (n: number) => "AED " + AED.format(Math.round(n));

/**
 * Central Bank of the UAE limits loan-to-value on a first home. Fees are typical
 * Dubai figures (DLD 4% + AED 580, registration 0.25% + AED 290, agency 2% + VAT,
 * trustee office); the page says they are estimates.
 */
export function mortgage(price: number, downPct: number, ratePct: number, years: number, national: boolean) {
  const maxLtv = national ? (price <= 5e6 ? 0.85 : 0.75) : price <= 5e6 ? 0.8 : 0.7;
  const minDown = 1 - maxLtv;
  const down = Math.max(downPct / 100, minDown) * price;
  const loan = price - down;
  const months = years * 12;
  const rate = ratePct / 100 / 12;
  const monthly = rate === 0 ? loan / months : (loan * rate) / (1 - Math.pow(1 + rate, -months));
  const dld = price * 0.04 + 580;
  const registration = loan * 0.0025 + 290;
  const agency = price * 0.02 * 1.05;
  const trustee = price >= 500000 ? 4200 : 2100;
  const upfront = down + dld + registration + agency + trustee;
  return {
    minDown,
    down,
    loan,
    monthly,
    dld,
    registration,
    agency,
    trustee,
    upfront,
    interest: monthly * months - loan,
    raised: downPct / 100 < minDown,
  };
}

/** The first listing's price (when it's a sale price), as a sensible starting point. */
export function startingPrice(c: StandardContent, fallback: number) {
  const sale = (c.projects ?? []).find((listing) => statusOf(listing) !== "rent");
  const parsed = parsePrice(sale?.client);
  return parsed && parsed.amount >= 300000 ? Math.min(parsed.amount, 30_000_000) : fallback;
}

export function MortgageCalc({ start, label = "Price" }: { start: number; label?: string }) {
  const [price, setPrice] = useState(start);
  const [down, setDown] = useState(25);
  const [rate, setRate] = useState(4.2);
  const [years, setYears] = useState(25);
  const [national, setNational] = useState(false);
  const r = mortgage(price, down, rate, years, national);
  const total = r.loan + r.interest + r.upfront;
  return (
    <div className="calc">
      <div className="calc-in">
        <div className="range">
          <label htmlFor="calc-price">
            {label} <output>{aed(price)}</output>
          </label>
          <input
            id="calc-price"
            type="range"
            min={500000}
            max={30000000}
            step={50000}
            value={price}
            onChange={(e) => setPrice(+e.target.value)}
          />
        </div>
        <div className="range">
          <label htmlFor="calc-down">
            Deposit <output>{Math.round((r.down / Math.max(price, 1)) * 100)}%</output>
          </label>
          <input
            id="calc-down"
            type="range"
            min={15}
            max={80}
            step={1}
            value={down}
            onChange={(e) => setDown(+e.target.value)}
          />
        </div>
        <div className="range">
          <label htmlFor="calc-rate">
            Rate <output>{rate.toFixed(2)}%</output>
          </label>
          <input
            id="calc-rate"
            type="range"
            min={2.5}
            max={7}
            step={0.05}
            value={rate}
            onChange={(e) => setRate(+e.target.value)}
          />
        </div>
        <div className="range">
          <label htmlFor="calc-years">
            Term <output>{years} years</output>
          </label>
          <input
            id="calc-years"
            type="range"
            min={5}
            max={25}
            step={1}
            value={years}
            onChange={(e) => setYears(+e.target.value)}
          />
        </div>
        <div className="range">
          <label htmlFor="calc-resident">Buyer</label>
          <select
            id="calc-resident"
            value={national ? "national" : "expat"}
            onChange={(e) => setNational(e.target.value === "national")}
          >
            <option value="expat">UAE resident or overseas buyer</option>
            <option value="national">UAE national</option>
          </select>
        </div>
        <p className="fine calc-note">
          {r.raised
            ? `Raised to the ${Math.round(r.minDown * 100)}% minimum deposit for this price and buyer.`
            : `Minimum deposit for this price and buyer: ${Math.round(r.minDown * 100)}%.`}
        </p>
      </div>
      <div className="calc-out" aria-live="polite">
        <span className="eyebrow">Monthly payment</span>
        <div className="big">{aed(r.monthly)}</div>
        <div
          className="bar"
          role="img"
          aria-label="Share of upfront cash and loan"
          style={{
            ["--a" as string]: `${(r.upfront / total) * 100}%`,
            ["--b" as string]: `${(r.loan / total) * 100}%`,
          }}
        />
        <dl>
          <dt>Loan amount</dt>
          <dd>{aed(r.loan)}</dd>
          <dt>Deposit</dt>
          <dd>{aed(r.down)}</dd>
          <dt>DLD transfer fee (4% + AED 580)</dt>
          <dd>{aed(r.dld)}</dd>
          <dt>Mortgage registration</dt>
          <dd>{aed(r.registration)}</dd>
          <dt>Agency fee (2% + VAT)</dt>
          <dd>{aed(r.agency)}</dd>
          <dt>Trustee office</dt>
          <dd>{aed(r.trustee)}</dd>
          <dt className="total">Cash needed on transfer</dt>
          <dd className="total">{aed(r.upfront)}</dd>
          <dt>Interest over the term</dt>
          <dd>{aed(r.interest)}</dd>
        </dl>
        <p className="fine">Estimates. Your bank’s offer is final.</p>
      </div>
    </div>
  );
}

/* ---------- Contact ---------- */

const digits = (phone?: string) => (phone ?? "").replace(/[^\d]/g, "");
export const waLink = (c: StandardContent, text = "") => {
  const number = digits(c.phone);
  return number ? `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}` : undefined;
};

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="copy"
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          // Clipboard blocked: the number is on screen to copy by hand.
        }
      }}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

/** Phone, email and office, each with a copy button. */
export function DirectContacts({ c }: { c: StandardContent }) {
  return (
    <div className="direct">
      {c.phone && (
        <div {...ed("phone")}>
          <span>
            <small>WhatsApp &amp; phone</small>
            <b>{c.phone}</b>
          </span>
          <CopyButton value={c.phone} />
        </div>
      )}
      {c.email && (
        <div {...ed("email")}>
          <span>
            <small>Email</small>
            <b>{c.email}</b>
          </span>
          <CopyButton value={c.email} />
        </div>
      )}
      {c.location && (
        <div {...ed("location")}>
          <span>
            <small>Office</small>
            <b>{c.location}</b>
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * The enquiry form. Nothing is sent to a server: on submit it opens WhatsApp (or
 * email) with the visitor's details written out, so the agent receives a normal
 * message and the visitor keeps a copy.
 */
export function LeadForm({
  c,
  message,
  budgets,
}: {
  c: StandardContent;
  message: string;
  budgets: string[];
}) {
  const agent = firstName(c.name) || "the agent";
  const [sent, setSent] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const submit = (form: HTMLFormElement) => {
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const bad = {
      name: !data.name?.trim(),
      phone: (data.phone ?? "").replace(/\D/g, "").length < 8,
      consent: data.consent !== "on",
    };
    setErrors(bad);
    if (Object.values(bad).some(Boolean)) return;
    const body = [
      `Hi ${agent}, I'm ${data.name}.`,
      `I want to: ${data.interest}. Budget: ${data.budget}.`,
      data.message,
      `Phone: ${data.phone}${data.email ? ` · Email: ${data.email}` : ""}`,
    ]
      .filter(Boolean)
      .join("\n");
    const href =
      waLink(c, body) ??
      (c.email
        ? `mailto:${c.email}?subject=${encodeURIComponent("Property enquiry")}&body=${encodeURIComponent(body)}`
        : null);
    if (href) window.open(href, "_blank", "noopener");
    setSent(data.name.split(" ")[0] ?? "");
  };

  if (sent !== null)
    return (
      <div className="lead-done">
        <span className="eyebrow">Enquiry ready</span>
        <h3>Thank you, {sent}.</h3>
        <p>Your message to {agent} opened in a new tab. Press send there, and you’ll hear back soon.</p>
        <div className="row">
          <button className="btn ghost" type="button" onClick={() => setSent(null)}>
            Send another
          </button>
        </div>
      </div>
    );

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit(e.currentTarget);
      }}
    >
      <div className={`field ${errors.name ? "invalid" : ""}`}>
        <label htmlFor="lead-name">Full name</label>
        <input id="lead-name" name="name" type="text" autoComplete="name" />
        <span className="err">Please add your name.</span>
      </div>
      <div className={`field ${errors.phone ? "invalid" : ""}`}>
        <label htmlFor="lead-phone">Phone or WhatsApp</label>
        <input id="lead-phone" name="phone" type="tel" autoComplete="tel" placeholder="+971" />
        <span className="err">Please add a number.</span>
      </div>
      <div className="field">
        <label htmlFor="lead-email">Email</label>
        <input id="lead-email" name="email" type="email" autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="lead-interest">I want to</label>
        <select id="lead-interest" name="interest">
          <option>Buy</option>
          <option>Sell</option>
          <option>Rent</option>
          <option>Off-plan</option>
        </select>
      </div>
      <div className="field full">
        <label htmlFor="lead-budget">Budget</label>
        <select id="lead-budget" name="budget" defaultValue={budgets[1]}>
          {budgets.map((budget) => (
            <option key={budget}>{budget}</option>
          ))}
        </select>
      </div>
      <div className="field full">
        <label htmlFor="lead-message">Message</label>
        <textarea
          key={message}
          id="lead-message"
          name="message"
          defaultValue={message}
          placeholder="Bedrooms, areas, move-in date…"
        />
      </div>
      <label className={`check field ${errors.consent ? "invalid" : ""}`}>
        <input name="consent" type="checkbox" /> I agree that {c.name || "the agent"} may contact me about
        property by phone, WhatsApp or email.
      </label>
      <div className="field full">
        <button className="btn" type="submit">
          Send enquiry
        </button>
      </div>
    </form>
  );
}

const WA_ICON =
  "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .3-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.2.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.4z";

/** WhatsApp button that stays at the bottom corner while the page scrolls (sticky, not fixed). */
export function WhatsAppFloat({ c }: { c: StandardContent }) {
  const href = waLink(c);
  if (!href) return null;
  return (
    <div className="wa-dock">
      <a
        className="wa-float"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat with ${firstName(c.name)} on WhatsApp`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d={WA_ICON} />
        </svg>
        WhatsApp
      </a>
    </div>
  );
}

/** Message prefilled in the form when a visitor taps “Ask …” on a listing. */
export const enquiryText = (listing: Listing) =>
  `I'm interested in ${listing.title}${listing.client ? ` (${listing.client})` : ""}. Is it still available?`;
