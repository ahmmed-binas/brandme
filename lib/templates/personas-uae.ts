import type { StandardContent } from "@/lib/portfolio/schema";

/**
 * Sample agents for the UAE collection (Mirage, Yield, Majlis, Keys, Debut).
 * Everyone here is invented; prices are realistic for 2026. Photos are the
 * Unsplash set in public/samples/re (see CREDITS.md): fine in previews and the
 * gallery, left out of free downloads.
 */
const r = (name: string) => `/samples/re/${name}.webp`;

export const UAE_PERSONAS: Record<string, StandardContent> = {
  "re-mirage": {
    name: "Nadia Rahman", professional_title: "Prime Property Adviser · Dubai", location: "Palm Jumeirah, Dubai", availability: "Private viewings this week · Off-market list on request",
    tagline: "Villas and penthouses on Dubai’s best addresses, bought and sold quietly.",
    summary: [
      "I work with a small number of buyers and sellers at the very top of the Dubai market: Palm Jumeirah, Emirates Hills, Jumeirah Bay and the Downtown skyline.",
      "Many of my homes are sold before they reach the portals. I know the owners, the developers’ release dates and which buildings hold their value, and I will tell you plainly when to wait.",
    ],
    email: "nadia@example.com", phone: "+971 55 555 0187", instagram: "https://www.instagram.com/", linkedin: "https://www.linkedin.com/",
    avatar: r("agent-woman-2"), cover: r("dubai-dusk"),
    skills: ["Palm Jumeirah", "Emirates Hills", "Jumeirah Bay", "Downtown Dubai", "Dubai Hills Estate", "Bluewaters", "Al Barari", "Dubai Marina"],
    projects: [
      { title: "Beachfront Villa, Frond F", client: "AED 48,000,000", role: "6 bd · 8 ba · 12,100 sq ft · private beach", category: "For sale", year: "2026", description: "Contemporary villa on the water with a 25 m pool, cinema, staff quarters and sunset views across the Gulf.", image: r("villa-pool") },
      { title: "Sky Penthouse, Marina", client: "AED 21,500,000", role: "4 bd · 5 ba · 6,400 sq ft", category: "Off-market", year: "2026", description: "Full-floor penthouse with a private lift, wraparound terrace and views from Ain Dubai to the Palm.", image: r("living-chandelier") },
      { title: "Residence 6201, Downtown", client: "AED 11,200,000", role: "3 bd · 4 ba · 3,600 sq ft", category: "For sale", year: "2026", description: "Burj Khalifa and fountain views from every room, hotel services and two parking bays. Vacant on transfer.", image: r("living-city") },
      { title: "Golf Mansion, Emirates Hills", client: "AED 72,000,000", role: "7 bd · 9 ba · 24,000 sq ft", category: "Sold", year: "2025", description: "Represented the buyer. Agreed off-market in one meeting, 6% under the original asking price.", image: r("kitchen-island") },
    ],
    services: [
      { title: "Buying in Dubai", description: "A shortlist within 48 hours, private viewings, due diligence on the building and a negotiator in the room.", price: "Buyer representation" },
      { title: "Selling your home", description: "Discreet marketing to my own buyers first; the portals only if you want them.", price: "2% · agreed upfront" },
      { title: "Golden Visa & relocation", description: "Homes that qualify for the 10-year visa, and introductions to the lawyers, banks and schools you’ll need.", price: "Included" },
    ],
    testimonials: [
      { quote: "Nadia found our villa before it was listed and saved us more than her fee in the negotiation.", name: "James & Priya R.", role: "Bought on Palm Jumeirah, 2025" },
      { quote: "Calm, precise and completely discreet. We sold without a single public viewing.", name: "Private seller", role: "Downtown, 2025" },
      { quote: "She told us not to buy twice, and she was right both times.", name: "M. Al-Sayed", role: "Investor, Riyadh" },
    ],
    highlights: [
      { title: "AED 900m+ sold since 2020", detail: "Prime villas and penthouses", year: "2025" },
      { title: "RERA licensed broker", detail: "BRN 00000", year: "2018" },
    ],
    stats: [{ value: "AED 900m", label: "sold since 2020" }, { value: "52%", label: "of sales off-market" }, { value: "14", label: "median days to sell" }, { value: "31", label: "nationalities served" }],
    gallery: [
      { image: r("dubai-towers"), caption: "Dubai Marina" }, { image: r("villa-pool"), caption: "Frond F, Palm Jumeirah" }, { image: r("living-chandelier"), caption: "Sky Penthouse" },
      { image: r("bath-lux"), caption: "Principal bathroom, Frond F" }, { image: r("dubai-day"), caption: "The Marina from the water" }, { image: r("bed-room"), caption: "Residence 6201" },
    ],
    education: [{ school: "Dubai Real Estate Regulatory Agency (RERA)", degree: "Licensed broker · BRN 00000", end_date: "2018" }],
  },

  "re-yield": {
    name: "Arjun Mehta", professional_title: "Off-plan Investment Consultant · Dubai", location: "Business Bay, Dubai", availability: "Next launch: 14 November 2026 · Early allocations open",
    tagline: "New-build Dubai property, explained in numbers before you sign anything.",
    summary: [
      "I help investors from India, the UK and the GCC buy off-plan in Dubai with their eyes open: the payment plan, the developer’s track record, the service charges and a realistic rent on handover.",
      "I only work with developers who have delivered on time before, and I will show you the sums for every unit I recommend.",
    ],
    email: "arjun@example.com", phone: "+971 55 555 0163", linkedin: "https://www.linkedin.com/", instagram: "https://www.instagram.com/",
    avatar: r("agent-man-2"), cover: r("dubai-towers"),
    skills: ["Business Bay", "Dubai Creek Harbour", "Jumeirah Village Circle", "Dubai Hills Estate", "Sobha Hartland", "Dubai South", "Meydan", "Al Marjan Island"],
    projects: [
      { title: "Creek Vista, Tower B · 1 bed", client: "AED 1,650,000", role: "1 bd · 812 sq ft · 60/40 plan", category: "Launching", year: "Handover Q4 2028", description: "Creek and skyline views, ten minutes from Downtown. 10% on booking, 50% during construction, 40% on handover.", image: r("tower-modern") },
      { title: "Hartland Gardens · 2 bed", client: "AED 2,480,000", role: "2 bd · 1,240 sq ft · 70/30 plan", category: "Selling", year: "Handover Q2 2027", description: "Garden-facing two-bed by a developer with five on-time handovers. Golden Visa threshold met.", image: r("tower-balconies") },
      { title: "JVC Park Residences · Studio", client: "AED 890,000", role: "Studio · 455 sq ft · 50/50 plan", category: "Selling", year: "Handover Q1 2027", description: "The rental workhorse: studios in JVC have let at 7–8% gross for three years running.", image: r("kitchen-white") },
      { title: "Marjan Beach Villas · 4 bed", client: "AED 6,900,000", role: "4 bd · 3,950 sq ft · 60/40 plan", category: "Sold out", year: "Handover Q3 2028", description: "Sold out in the first allocation, before public launch. Ask me about the next phase.", image: r("villa-pool") },
    ],
    services: [
      { title: "Launch allocations", description: "Units reserved for my clients before public release, with the floor plans and price list the day they’re issued.", price: "No fee to buyers" },
      { title: "Investment review", description: "A one-page report on any unit: total cost with fees, the payment schedule, expected rent and the developer’s record.", price: "Free" },
      { title: "Handover & leasing", description: "Snagging on handover, then a tenant found and the lease registered, so the unit earns from the first month.", price: "5% of first year’s rent" },
    ],
    testimonials: [
      { quote: "Arjun sent us the full cost, fees included, before we’d even asked. No surprises on handover.", name: "Rohan & Meera S.", role: "Bought in Creek Harbour from Mumbai" },
      { quote: "Clear on the risks as well as the returns. That’s why we bought three units with him.", name: "David L.", role: "Investor, London" },
    ],
    highlights: [
      { title: "Top off-plan broker, Q2 2026", detail: "Developer partner ranking", year: "2026" },
      { title: "RERA licensed broker", detail: "BRN 00000", year: "2019" },
    ],
    stats: [{ value: "140+", label: "investors advised" }, { value: "7.1%", label: "average gross yield" }, { value: "0", label: "late handovers" }],
    gallery: [
      { image: r("tower-modern"), caption: "Creek Vista, illustrative" }, { image: r("build-crane"), caption: "Hartland Gardens, topping out" }, { image: r("living-view"), caption: "Show apartment" },
      { image: r("kitchen-island"), caption: "Two-bed kitchen" }, { image: r("build-site"), caption: "JVC site, September" },
    ],
    education: [{ school: "Dubai Real Estate Regulatory Agency (RERA)", degree: "Licensed broker · BRN 00000", end_date: "2019" }],
  },

  "re-majlis": {
    name: "Khalid Al Suwaidi", professional_title: "Family Villa Specialist · Abu Dhabi & Dubai", location: "Saadiyat Island, Abu Dhabi", availability: "Viewings every day except Friday",
    tagline: "Family homes in the communities I grew up in, in Arabic or English.",
    summary: [
      "I help families find villas and townhouses in Abu Dhabi and Dubai, from Saadiyat and Yas to Arabian Ranches and Al Barari.",
      "I know which streets are quiet, which schools have places and which compounds suit grandparents too. I speak with you in Arabic or English, whichever is easier.",
      "أساعد العائلات في العثور على الفلل والتاون هاوس في أبوظبي ودبي، من السعديات وجزيرة ياس إلى المرابع العربية والبراري.",
      "أعرف الأحياء الهادئة والمدارس المتاحة والمجمعات المناسبة لكبار السن أيضاً. يسعدني التواصل معكم بالعربية أو بالإنجليزية.",
    ],
    email: "khalid@example.com", phone: "+971 50 555 0129", instagram: "https://www.instagram.com/", linkedin: "https://www.linkedin.com/",
    avatar: r("agent-man"), cover: r("dubai-day"),
    skills: ["Saadiyat Island", "Yas Island", "Al Reem Island", "Arabian Ranches", "Al Barari", "Dubai Hills Estate", "Jumeirah Golf Estates", "Al Raha Beach"],
    projects: [
      { title: "Saadiyat Lagoons Villa", client: "AED 7,800,000", role: "5 bd · 6 ba · 5,900 sq ft · garden", category: "For sale", year: "2026", description: "A corner villa on a quiet street, five minutes from Cranleigh and the Louvre. Maid’s room and a large majlis.", image: r("villa-pool") },
      { title: "Yas Acres Townhouse", client: "AED 3,350,000", role: "3 bd · 4 ba · 2,700 sq ft", category: "For sale", year: "2026", description: "Backing onto the golf course, with a community pool and park at the end of the road.", image: r("living-wood") },
      { title: "Arabian Ranches III Villa", client: "AED 5,200,000", role: "4 bd · 5 ba · 3,800 sq ft", category: "Under offer", year: "2026", description: "Family villa near the central park and the new school. Under offer within two weeks.", image: r("living-curtains") },
      { title: "Al Barari Mansion", client: "AED 26,000,000", role: "6 bd · 8 ba · 13,000 sq ft", category: "Sold", year: "2025", description: "Sold to a family relocating from Riyadh, with a private viewing for three generations.", image: r("kitchen-dining") },
    ],
    services: [
      { title: "Finding the family home", description: "Schools, commute, mosque, parks and the neighbours: a shortlist built around how your family really lives.", price: "Buyer representation" },
      { title: "Selling your villa", description: "Professional photography, a fair price backed by recent sales and viewings handled with care.", price: "2% · agreed upfront" },
      { title: "Renting while you decide", description: "A one-year rental in the community you’re considering, so you can try it first.", price: "5% of annual rent" },
    ],
    testimonials: [
      { quote: "Khalid understood what my parents needed before we did. We found a villa with a ground-floor suite in a week.", name: "Abdullah K.", role: "Bought in Saadiyat, 2025" },
      { quote: "تعامل راقٍ ومعرفة ممتازة بالمنطقة. أنصح به بشدة.", name: "أم سلطان", role: "اشترت في المرابع العربية" },
      { quote: "Patient, honest and he knows every school in Yas.", name: "Claire & Tom W.", role: "Relocated from London" },
    ],
    highlights: [
      { title: "ADREC & RERA licensed", detail: "Abu Dhabi and Dubai", year: "2020" },
      { title: "Family relocation partner", detail: "For two Abu Dhabi schools", year: "2024" },
    ],
    stats: [{ value: "210+", label: "families housed" }, { value: "2", label: "emirates covered" }, { value: "4.9", label: "Google rating" }],
    gallery: [
      { image: r("villa-pool"), caption: "Saadiyat Lagoons" }, { image: r("living-curtains"), caption: "Majlis, Al Barari" }, { image: r("kitchen-dining"), caption: "Family kitchen" },
      { image: r("bath-window"), caption: "Principal suite" }, { image: r("villa-pool"), caption: "Garden pool" },
    ],
    education: [{ school: "Abu Dhabi Real Estate Centre (ADREC)", degree: "Licensed broker · Abu Dhabi & Dubai", end_date: "2020" }],
  },

  "re-keys": {
    name: "Maria Santos", professional_title: "Rental Specialist · Dubai Marina & JLT", location: "Jumeirah Lake Towers, Dubai", availability: "New listings every Monday · Same-day viewings",
    tagline: "Apartments to rent near the Metro, with every cost on the table before you move.",
    summary: [
      "I find apartments to rent in Dubai Marina, JLT, Business Bay and JVC for professionals and young families moving to Dubai.",
      "Before you view, you’ll know the rent, how many cheques the landlord accepts, the deposit, the agency fee and the DEWA set-up. No surprises on moving day.",
    ],
    email: "maria@example.com", phone: "+971 52 555 0174", instagram: "https://www.instagram.com/",
    avatar: r("agent-woman-2"), cover: r("dubai-day"),
    skills: ["Dubai Marina", "Jumeirah Lake Towers", "Business Bay", "Jumeirah Village Circle", "Downtown Dubai", "Al Barsha", "Dubai Hills Estate", "Motor City"],
    projects: [
      { title: "Marina Promenade, 1 bed", client: "AED 115,000 / year", role: "1 bd · 1 ba · 840 sq ft · Furnished · 6 min to Metro", category: "Available now", year: "Up to 4 cheques", description: "Marina view, gym and pool. Bills not included. Ideal for one or two people working in Media City.", image: r("living-view") },
      { title: "JLT Cluster D, 2 bed", client: "AED 140,000 / year", role: "2 bd · 2 ba · 1,250 sq ft · Unfurnished · 3 min to Metro", category: "Available now", year: "Up to 6 cheques", description: "Lake view, balcony, covered parking. Pets considered.", image: r("living-wood") },
      { title: "Business Bay Studio", client: "AED 72,000 / year", role: "Studio · 1 ba · 480 sq ft · Furnished · 8 min to Metro", category: "Available 1 Nov", year: "Up to 12 cheques", description: "Canal view, fully furnished. The landlord accepts monthly cheques.", image: r("kitchen-stools") },
      { title: "JVC Townhouse, 3 bed", client: "AED 165,000 / year", role: "3 bd · 4 ba · 2,100 sq ft · Unfurnished", category: "Let agreed", year: "2 cheques", description: "Let in four days to a family relocating from Manila.", image: r("living-curtains") },
    ],
    services: [
      { title: "Finding your apartment", description: "A shortlist that fits your budget, your commute and your cheque plan, and viewings the same day.", price: "5% of annual rent" },
      { title: "Moving in", description: "Ejari registration, the DEWA connection and the move-in inspection, done for you.", price: "Included" },
      { title: "Landlords", description: "Tenants checked, the lease registered and rent cheques collected and deposited.", price: "From 5%" },
    ],
    testimonials: [
      { quote: "Maria told us exactly what we’d pay on day one. Everyone else just said ‘plus fees’.", name: "Ana & Joel R.", role: "Rented in JLT, 2026" },
      { quote: "I moved from Lagos with two weeks’ notice. She had a flat ready when I landed.", name: "Tunde A.", role: "Rented in Business Bay" },
    ],
    highlights: [{ title: "RERA licensed broker", detail: "BRN 00000", year: "2021" }],
    stats: [{ value: "320+", label: "tenants housed" }, { value: "4", label: "days to let, on average" }, { value: "24h", label: "to a shortlist" }],
    gallery: [
      { image: r("living-view"), caption: "Marina Promenade" }, { image: r("kitchen-stools"), caption: "Business Bay studio" }, { image: r("bed-room"), caption: "JLT bedroom" },
      { image: r("bath-modern"), caption: "JLT bathroom" }, { image: r("dubai-day"), caption: "Dubai Marina" },
    ],
    education: [{ school: "Dubai Real Estate Regulatory Agency (RERA)", degree: "Licensed broker · BRN 00000", end_date: "2021" }],
  },

  "re-debut": {
    name: "Yousef Haddad", professional_title: "Property Agent · Dubai Hills & JVC", location: "Dubai, UAE", availability: "Replies on WhatsApp within the hour",
    tagline: "New to Dubai property? So was I. I’ll walk you through every step.",
    summary: [
      "I joined Dubai real estate in 2025 after six years in banking, so I explain mortgages, fees and paperwork in plain words.",
      "I post a new home tour every day. If you like what you see, message me and I’ll set up a viewing the same week.",
    ],
    email: "yousef@example.com", phone: "+971 56 555 0158", instagram: "https://www.instagram.com/", links: [{ label: "TikTok", url: "https://www.tiktok.com/" }],
    avatar: r("agent-man-3"), cover: r("living-city"),
    skills: ["Dubai Hills Estate", "Jumeirah Village Circle", "Arjan", "Al Furjan", "Town Square", "Damac Hills"],
    projects: [
      { title: "Dubai Hills, Park Heights 2 bed", client: "AED 2,650,000", role: "2 bd · 2 ba · 1,180 sq ft", category: "For sale", year: "Tour on TikTok", description: "Park view, five minutes to the mall. Mortgage-ready: 20% down is about AED 530,000.", image: r("living-view") },
      { title: "JVC, Bloom Towers 1 bed", client: "AED 1,050,000", role: "1 bd · 1 ba · 720 sq ft", category: "For sale", year: "Tour on TikTok", description: "A first home or a first investment: rents at about AED 75,000 a year.", image: r("kitchen-white") },
      { title: "Al Furjan Townhouse", client: "AED 3,400,000", role: "3 bd · 4 ba · 2,300 sq ft", category: "New", year: "Tour on TikTok", description: "Corner unit near the Metro, with a garden and a maid’s room.", image: r("kitchen-dining") },
      { title: "Town Square 1 bed", client: "AED 940,000", role: "1 bd · 1 ba · 680 sq ft", category: "Sold", year: "2026", description: "My first sale: a first-time buyer from Cairo, with a mortgage approved in nine days.", image: r("bed-room") },
    ],
    services: [
      { title: "First home in Dubai", description: "Your budget, the mortgage, the fees and the paperwork, explained over one coffee.", price: "Free first meeting" },
      { title: "Video viewings", description: "Can’t come in person? I’ll walk you through on a live video call and answer everything.", price: "Free" },
      { title: "Selling", description: "A short-video launch for your home, posted to my followers and the portals the same day.", price: "2%" },
    ],
    testimonials: [
      { quote: "Yousef explained the mortgage better than the bank did. We bought our first flat in a month.", name: "Sara & Karim M.", role: "First-time buyers, Town Square" },
      { quote: "Found him on TikTok, bought through him a week later. Fast and honest.", name: "Liam O.", role: "Bought in JVC" },
    ],
    highlights: [{ title: "RERA licensed broker", detail: "BRN 00000", year: "2025" }, { title: "Ex-mortgage adviser", detail: "Six years in UAE banking", year: "2019–2025" }],
    stats: [{ value: "40+", label: "home tours posted" }, { value: "1h", label: "WhatsApp reply" }, { value: "6 yrs", label: "in UAE banking" }],
    gallery: [
      { image: r("living-city"), caption: "Park Heights" }, { image: r("kitchen-white"), caption: "Bloom Towers" }, { image: r("kitchen-dining"), caption: "Al Furjan" }, { image: r("bed-room"), caption: "Town Square" },
    ],
    education: [{ school: "Dubai Real Estate Regulatory Agency (RERA)", degree: "Licensed broker · BRN 00000", end_date: "2025" }],
  },
};
