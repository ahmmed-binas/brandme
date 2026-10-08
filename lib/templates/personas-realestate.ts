import type { StandardContent } from "@/lib/portfolio/schema";

/**
 * Sample agents for the real estate collection (Skyline, Manor, Front Door,
 * Shoreline, Off Plan). Photos are from Unsplash (public/samples/re, see
 * CREDITS.md): shown in previews and the gallery, left out of free downloads.
 * Listings use projects: title = address, client = price, role = size,
 * category = status, year = when (or the floor, for new builds).
 */
const r = (name: string) => `/samples/re/${name}.webp`;

export const REALESTATE_PERSONAS: Record<string, StandardContent> = {
  "re-skyline": {
    name: "Layla Haddad", professional_title: "Luxury Property Consultant · Dubai", location: "Dubai Marina, UAE", availability: "Private viewings this week · Off-market list on request",
    tagline: "Dubai’s finest addresses, found quietly and negotiated hard.",
    summary: [
      "I advise buyers from London, Riyadh, Mumbai and Zurich on Dubai’s top 1% of homes: Palm Jumeirah villas, Marina penthouses and Downtown sky residences.",
      "Half of what I sell never reaches the portals. I know the owners, the developers’ release dates and which buildings hold their value, and I tell you honestly when to wait.",
    ],
    email: "layla@example.com", phone: "+971 55 555 0142", instagram: "https://www.instagram.com/", linkedin: "https://www.linkedin.com/", website: "https://example.com",
    avatar: r("agent-woman-2"), cover: r("dubai-dusk"),
    skills: ["Palm Jumeirah", "Dubai Marina", "Downtown", "Emirates Hills", "Bluewaters", "Jumeirah Bay", "Dubai Hills", "Business Bay"],
    projects: [
      { title: "Signature Villa, Frond G", client: "AED 42,000,000", role: "6 bd · 8 ba · 11,400 sq ft · private beach", category: "Off-market", year: "2026", description: "Contemporary beachfront villa with a 25 m infinity pool, cinema and staff quarters. Shown to qualified buyers only.", image: r("villa-pool") },
      { title: "Penthouse 7101, Marina Gate", client: "AED 18,750,000", role: "4 bd · 5 ba · 6,120 sq ft", category: "For sale", year: "2026", description: "Full-floor penthouse with 270° views over the Marina and the Gulf, private lift lobby and a 1,400 sq ft terrace.", image: r("living-chandelier") },
      { title: "Sky Residence 5402, Downtown", client: "AED 9,900,000", role: "3 bd · 4 ba · 3,480 sq ft", category: "For sale", year: "2026", description: "Burj Khalifa and fountain views from every room. Hotel services, two parking bays, vacant on transfer.", image: r("living-city") },
      { title: "Bluewaters Residences, 1204", client: "AED 6,450,000", role: "2 bd · 3 ba · 2,150 sq ft", category: "Sold", year: "2025", description: "Sold off-market to a London family in eleven days, 4% above the building’s previous record.", image: r("living-wood") },
      { title: "Jumeirah Bay Mansion", client: "AED 65,000,000", role: "7 bd · 9 ba · 21,000 sq ft", category: "Sold", year: "2025", description: "Island mansion with a marina berth. Represented the buyer; agreed in one meeting.", image: r("kitchen-island") },
    ],
    services: [
      { title: "Buying in Dubai", description: "A shortlist within 48 hours, private viewings, due diligence and a negotiator in the room.", price: "Buyer advisory" },
      { title: "Selling your home", description: "Discreet marketing to my buyer list first, then the portals only if you want them.", price: "2% · agreed upfront" },
      { title: "Off-plan & investment", description: "Developer allocations before public launch, payment plans and rental yield projections.", price: "Free consultation" },
    ],
    testimonials: [
      { quote: "Layla found our villa before it was listed and saved us more than her fee in the negotiation alone.", name: "James & Priya R.", role: "Bought on Palm Jumeirah, 2025" },
      { quote: "Calm, exact and completely discreet. We sold in eleven days without a single public viewing.", name: "Confidential seller", role: "Bluewaters, 2025" },
      { quote: "The best adviser we’ve had in any city. She told us not to buy twice, and she was right both times.", name: "M. Al-Sayed", role: "Investor, Riyadh" },
    ],
    highlights: [
      { title: "Top 10 luxury agents, Dubai", detail: "Annual industry ranking", year: "2025" },
      { title: "AED 1.2bn in sales since 2019", year: "2025" },
      { title: "RERA licensed broker", detail: "BRN 00000", year: "2017" },
    ],
    stats: [{ value: "AED 1.2bn", label: "sold since 2019" }, { value: "48%", label: "of sales off-market" }, { value: "11", label: "median days to sell" }],
    gallery: [
      { image: r("dubai-towers"), caption: "Dubai Marina" }, { image: r("villa-pool"), caption: "Frond G, Palm Jumeirah" }, { image: r("living-chandelier"), caption: "Marina Gate penthouse" },
      { image: r("bath-lux"), caption: "Principal bathroom, Frond G" }, { image: r("dubai-day"), caption: "The Marina from the water" }, { image: r("bed-room"), caption: "Sky Residence 5402" },
    ],
    education: [{ school: "Dubai Real Estate Regulatory Agency (RERA)", degree: "Licensed broker · BRN 00000", end_date: "2017" }],
  },

  "re-manor": {
    name: "Edward Ashby", professional_title: "Country House Agent · The Cotswolds", location: "Burford, Oxfordshire", availability: "Free market appraisals this month",
    tagline: "Country houses, farmhouses and village homes, sold with patience and proper photographs.",
    summary: [
      "For eighteen years I’ve sold houses between Burford and Chipping Campden. Most of my buyers are moving from London; most of my sellers have been in their homes for decades.",
      "A good country house sale is slow at the start and quick at the end. I spend time on the price, the story and the photographs, so the right buyer recognises the house the moment they see it.",
    ],
    email: "edward@example.com", phone: "+44 7700 900461", instagram: "https://www.instagram.com/", website: "https://example.com",
    avatar: r("agent-man-3"), cover: r("cotswold-house"),
    skills: ["Burford", "Bibury", "Stow-on-the-Wold", "Chipping Campden", "Bourton-on-the-Water", "Painswick", "Tetbury", "Lechlade"],
    projects: [
      { title: "Hollybrook House, Bibury", client: "£2,450,000", role: "6 bedrooms · 4 bathrooms · 4.2 acres", category: "For sale", year: "2026", description: "A Grade II listed Cotswold stone house on the Coln, with a walled garden, paddock and a two-bedroom cottage.", image: r("cotswold-house") },
      { title: "The Old Rectory, Little Barrington", client: "£1,875,000", role: "5 bedrooms · 3 bathrooms · 1.1 acres", category: "Under offer", year: "2026", description: "Flint and brick rectory beside the church, beautifully kept, with views across the Windrush valley.", image: r("cottage-stone") },
      { title: "Thatch End, Coln St Aldwyns", client: "£895,000", role: "3 bedrooms · 2 bathrooms · cottage garden", category: "For sale", year: "2026", description: "A seventeenth-century thatched cottage, rethatched in 2023, with inglenook fireplaces and a summer house.", image: r("cottage-thatch") },
      { title: "Mill Barn, Eastleach", client: "£1,150,000", role: "4 bedrooms · 3 bathrooms · 0.6 acres", category: "Sold", year: "2025", description: "A converted barn with a vaulted kitchen. Sold to a family from Clapham after the first weekend.", image: r("kitchen-dining") },
    ],
    services: [
      { title: "Selling your house", description: "Valuation, a photographer and copywriter I trust, and every viewing accompanied by me.", price: "1.5% + VAT" },
      { title: "Free market appraisal", description: "What your home would sell for now, with the comparable sales, in writing within a week.", price: "Free" },
      { title: "Finding a country house", description: "For buyers moving out of London: an honest guide to villages, schools and train times.", price: "By arrangement" },
    ],
    testimonials: [
      { quote: "Edward understood the house better than we did. He priced it carefully and it sold to the right people.", name: "The Fairfax family", role: "Sold in Bibury, 2025" },
      { quote: "As Londoners we knew nothing about the Cotswolds. Edward told us which villages actually suit families.", name: "Sophie & Tom H.", role: "Bought in Stow, 2024" },
    ],
    highlights: [{ title: "Best country agent, Oxfordshire", detail: "Regional property awards", year: "2024" }, { title: "Fellow, Propertymark (FNAEA)", year: "2015" }],
    stats: [{ value: "£186m", label: "of homes sold" }, { value: "18", label: "years in the Cotswolds" }, { value: "97%", label: "of asking price, on average" }],
    gallery: [
      { image: r("cotswold-house"), caption: "Hollybrook House, Bibury" }, { image: r("cottage-thatch"), caption: "Thatch End" }, { image: r("kitchen-dining"), caption: "Mill Barn kitchen" },
      { image: r("cottage-stone"), caption: "The Old Rectory" }, { image: r("living-curtains"), caption: "Drawing room, Hollybrook" }, { image: r("bath-window"), caption: "Principal bathroom" },
    ],
    education: [{ school: "Propertymark", degree: "Fellow, National Association of Estate Agents", end_date: "2015" }],
  },

  "re-frontdoor": {
    name: "Jordan Reyes", professional_title: "Buyer’s Agent · Fairfield County, CT", location: "Westport, Connecticut", availability: "Taking on 3 new buyers this month",
    tagline: "Your first home, without the guesswork.",
    summary: [
      "I only represent buyers, so there’s never a question of whose side I’m on. Most of my clients are buying for the first time and moving out of New York.",
      "I’ll show you what you can really afford, which towns fit your commute and budget, and how to win in a market where good houses get six offers.",
    ],
    email: "jordan@example.com", phone: "+1 203 555 0187", instagram: "https://www.instagram.com/", linkedin: "https://www.linkedin.com/",
    avatar: r("agent-man-2"), cover: r("house-white"),
    skills: ["Westport", "Fairfield", "Norwalk", "Ridgefield", "Trumbull", "Darien", "Wilton", "Stamford"],
    projects: [
      { title: "18 Maple Hill Rd, Fairfield", client: "$689,000", role: "4 bd · 2.5 ba · 2,240 sq ft", category: "For sale", year: "2026", description: "Cape Cod with a new roof, fenced garden and a 12-minute walk to Metro-North.", image: r("house-white") },
      { title: "52 Old Post Rd, Westport", client: "$1,095,000", role: "4 bd · 3 ba · 2,980 sq ft", category: "For sale", year: "2026", description: "1890s farmhouse on an acre, renovated kitchen, top-rated schools.", image: r("house-farm") },
      { title: "7 Church St, Ridgefield", client: "$845,000", role: "3 bd · 2.5 ba · 2,100 sq ft", category: "Under contract", year: "2026", description: "Colonial in the village centre. Won for my clients against seven offers.", image: r("house-black") },
      { title: "Unit 3B, 400 Main St, Norwalk", client: "$419,000", role: "2 bd · 2 ba · 1,050 sq ft", category: "For sale", year: "2026", description: "Bright condo with a renovated kitchen. HOA includes heat and water.", image: r("kitchen-white") },
      { title: "31 Elm Ct, Trumbull", client: "$575,000", role: "3 bd · 2 ba · 1,780 sq ft", category: "Sold", year: "2025", description: "First home for two teachers after four lost bids. Closed in 28 days.", image: r("kitchen-stools") },
    ],
    services: [
      { title: "Buyer consultation", description: "An hour on budget, towns and the buying process. No pressure, no contract.", price: "Free" },
      { title: "Full buyer representation", description: "Search, tours, offer strategy, inspection and everything up to the keys.", price: "Paid at closing" },
      { title: "Lender & inspector introductions", description: "People I’ve worked with for years, who answer the phone.", price: "Free" },
    ],
    testimonials: [
      { quote: "Jordan’s calculator told us the truth about our budget in five minutes. We closed under it.", name: "Aisha & Ben", role: "First home, Fairfield" },
      { quote: "We’d lost four houses. Jordan rewrote our offer and we won the fifth.", name: "Kim T.", role: "Bought in Trumbull, 2025" },
      { quote: "Patient with every question, and we had hundreds.", name: "Marco D.", role: "First home, Norwalk" },
    ],
    highlights: [{ title: "Accredited Buyer’s Representative (ABR®)", year: "2021" }, { title: "Top 5 buyer’s agents, Fairfield County", year: "2025" }],
    stats: [{ value: "212", label: "families housed" }, { value: "$14K", label: "average saved off asking" }, { value: "31", label: "days to keys, on average" }],
    gallery: [
      { image: r("house-white"), caption: "Maple Hill Rd" }, { image: r("kitchen-island"), caption: "Kitchen, Old Post Rd" }, { image: r("house-farm"), caption: "Old Post Rd" },
      { image: r("bed-room"), caption: "Main bedroom, Maple Hill" }, { image: r("house-black"), caption: "Church St, Ridgefield" }, { image: r("kitchen-stools"), caption: "Elm Ct, sold" },
    ],
    education: [{ school: "Connecticut Department of Consumer Protection", degree: "Licensed Real Estate Salesperson · RES.000000", end_date: "2018" }],
  },

  "re-shoreline": {
    name: "Inês Duarte", professional_title: "Coastal Homes · Algarve & the Cyclades", location: "Lagos, Portugal", availability: "Viewing trips arranged all year",
    tagline: "Homes a short walk from the sea, and honest advice on living in them.",
    summary: [
      "I help families from the UK, Ireland and the Netherlands buy homes by the sea in the Algarve and the Greek islands: for holidays, for letting, and more and more for living.",
      "I grew up in Lagos. I know which beaches stay quiet in August, which villas let all year and which ones only look good in the photographs.",
    ],
    email: "ines@example.com", phone: "+351 912 000 314", instagram: "https://www.instagram.com/", website: "https://example.com",
    cover: r("coast-aerial"),
    skills: ["Lagos", "Praia da Luz", "Carvoeiro", "Comporta", "Tavira", "Mykonos", "Paros", "Naxos"],
    projects: [
      { title: "Casa das Ondas, Carvoeiro", client: "€2,250,000", role: "4 bed · 4 bath · 280 m² · 50 m to the beach", category: "For sale", year: "2026", description: "A white clifftop villa with a heated pool and steps down to a cove. Licensed for holiday letting.", image: r("bali-house") },
      { title: "Little Venice House, Mykonos", client: "€3,400,000", role: "5 bed · 5 bath · 320 m² · on the water", category: "For sale", year: "2026", description: "Restored captain’s house with balconies over the sea, minutes from the windmills.", image: r("mykonos") },
      { title: "Ocean Suite, Praia da Luz", client: "€1,650,000", role: "3 bed · 3 bath · 190 m² · sea views", category: "Reserved", year: "2026", description: "Every bedroom faces the Atlantic. Walk to the bakery, the beach and the church square.", image: r("bedroom-ocean") },
      { title: "Villa Branca, Comporta", client: "€2,950,000", role: "5 bed · 5 bath · 1.2 ha", category: "Sold", year: "2025", description: "New-build villa among the pines. Sold to a Dutch family before completion.", image: r("villa-pool") },
      { title: "Beach apartment, Lagos", client: "€640,000", role: "2 bed · 2 bath · 105 m² · 200 m to the beach", category: "For sale", year: "2026", description: "Light-filled apartment with a terrace and a shared pool. Lets for €2,100 a week in summer.", image: r("living-curtains") },
    ],
    services: [
      { title: "Viewing trips", description: "Two or three days, homes chosen in advance, lawyer and bank meetings in the same trip.", price: "Free" },
      { title: "Buying from abroad", description: "Tax number, bank account, lawyer, surveyor and the deed: handled in English.", price: "Included" },
      { title: "Holiday-let set-up", description: "Licence, a management company I trust and a realistic income forecast.", price: "From €900" },
    ],
    testimonials: [
      { quote: "Inês found us a house we could actually afford, near a beach that’s quiet in August. That doesn’t happen.", name: "Claire & Niall O.", role: "Bought in Praia da Luz" },
      { quote: "She handled everything from Dublin to the deed. We flew out twice.", name: "Aoife M.", role: "Bought in Lagos, 2025" },
    ],
    highlights: [{ title: "Licensed by IMPIC", detail: "AMI 00000", year: "2014" }, { title: "Golden Visa and NHR guidance partner", year: "2023" }],
    stats: [{ value: "140+", label: "homes sold by the sea" }, { value: "6", label: "languages spoken" }, { value: "8", label: "weeks, offer to keys" }],
    gallery: [
      { image: r("coast-aerial"), caption: "The coast near Carvoeiro" }, { image: r("mykonos"), caption: "Little Venice, Mykonos" }, { image: r("bedroom-ocean"), caption: "Ocean Suite, Praia da Luz" },
      { image: r("bali-house"), caption: "Casa das Ondas" }, { image: r("bath-window"), caption: "Bathroom, Casa das Ondas" }, { image: r("living-view"), caption: "Living room, Villa Branca" },
    ],
  },

  "re-offplan": {
    name: "Daniel Hart", professional_title: "New Homes Director · The Weaving Rooms, Manchester", location: "Ancoats, Manchester", availability: "Launch weekend: 14 November 2026",
    tagline: "214 homes on the canal in Ancoats. Choose your floor before anyone else.",
    summary: [
      "The Weaving Rooms is a 22-storey building of one-, two- and three-bedroom homes beside the Rochdale Canal, five minutes’ walk from Piccadilly.",
      "I run sales for the development. I’ll show you the show home, the floor plans and the real numbers: service charge, completion dates and what similar homes rent for.",
    ],
    email: "daniel@example.com", phone: "+44 7700 900382", instagram: "https://www.instagram.com/", linkedin: "https://www.linkedin.com/", website: "https://example.com",
    avatar: r("agent-man"), cover: r("tower-kaktus"),
    skills: ["Concierge", "Residents’ gym", "Roof garden", "Co-working lounge", "Cycle store", "EV charging", "10-year warranty", "EPC A"],
    projects: [
      { title: "Penthouse 21.01", client: "£1,250,000", role: "3 bed · 145 m² · wraparound terrace", category: "Available", year: "Floor 21", description: "The top of the building: three aspects, a 60 m² terrace and views to the Pennines.", image: r("living-wood") },
      { title: "Apartment 19.04", client: "£595,000", role: "2 bed · 82 m² · balcony", category: "Reserved", year: "Floor 19", description: "Corner apartment facing the canal basin.", image: r("living-city") },
      { title: "Apartment 16.02", client: "£545,000", role: "2 bed · 78 m² · balcony", category: "Available", year: "Floor 16", description: "South-facing, with a separate kitchen.", image: r("kitchen-island") },
      { title: "Apartment 12.06", client: "£399,000", role: "1 bed · 56 m² · balcony", category: "Sold", year: "Floor 12", description: "Sold in the first hour of the friends-and-family release.", image: r("bed-room") },
      { title: "Apartment 9.03", client: "£425,000", role: "2 bed · 70 m²", category: "Available", year: "Floor 9", description: "Canal-side, with a study nook.", image: r("kitchen-white") },
      { title: "Apartment 6.01", client: "£329,000", role: "1 bed · 51 m²", category: "Sold", year: "Floor 6", description: "Reserved off-plan by a first-time buyer with the developer’s 5% deposit scheme.", image: r("living-curtains") },
      { title: "Apartment 3.05", client: "£315,000", role: "1 bed · 50 m² · terrace", category: "Available", year: "Floor 3", description: "A private terrace above the towpath.", image: r("bath-modern") },
    ],
    services: [
      { title: "Reserve off-plan", description: "Choose your floor and view, then hold it with a £2,000 reservation fee.", price: "£2,000 to reserve" },
      { title: "5% deposit scheme", description: "For first-time buyers: 5% at exchange, the rest on completion.", price: "Developer-backed" },
      { title: "Investor pack", description: "Rental comparables, service charge budget and a letting partner.", price: "Free" },
    ],
    testimonials: [
      { quote: "Daniel showed us the real service charge before we asked. That’s why we bought here.", name: "Hannah & Sid", role: "Reserved 16.02" },
      { quote: "Clear numbers, no pressure and a show home that looked exactly like the finished flat.", name: "R. Okonkwo", role: "First-time buyer" },
    ],
    highlights: [
      { title: "Completion: spring 2027", detail: "Phase one, floors 1–11", year: "2027" },
      { title: "Shortlisted, Residential Development of the Year", detail: "North West Property Awards", year: "2026" },
    ],
    stats: [{ value: "214", label: "homes" }, { value: "72%", label: "built" }, { value: "61%", label: "reserved" }],
    gallery: [
      { image: r("tower-kaktus"), caption: "The Weaving Rooms (illustrative)" }, { image: r("build-crane"), caption: "Topping out, September" }, { image: r("living-wood"), caption: "Penthouse show home" },
      { image: r("kitchen-island"), caption: "Two-bed kitchen" }, { image: r("tower-balconies"), caption: "Balconies over the canal" }, { image: r("bath-modern"), caption: "Show home bathroom" },
      { image: r("build-site"), caption: "Site, August" }, { image: r("tower-modern"), caption: "The east elevation" },
    ],
  },
};
