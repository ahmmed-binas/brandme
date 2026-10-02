import type { StandardContent } from "@/lib/portfolio/schema";

/**
 * Sample people used to fill template previews and as a new portfolio's
 * starting point. They are fictional; their work is specific on purpose,
 * because a template only looks right with believable content in it.
 */

const s = (name: string) => `/samples/${name}.webp`;

export const PERSONAS: Record<string, StandardContent> = {
  developer: {
    name: "Ines Okafor", professional_title: "Staff Software Engineer", location: "Lisbon, Portugal", availability: "Open to staff and principal roles from January",
    tagline: "I make slow systems fast and confusing ones obvious, mostly in Postgres, Go and TypeScript.",
    summary: [
      "I’ve spent eleven years on the unglamorous middle of software: the queue that backs up at 9am, the query that worked fine until the table hit forty million rows, the deploy nobody wants to run on Fridays.",
      "Lately I lead platform work at a payments company, write about database internals, and maintain pgtrace, a small tool that has saved a surprising number of on-call weekends.",
    ],
    email: "ines@example.com", github: "https://github.com/", linkedin: "https://www.linkedin.com/", website: "https://ines.dev",
    skills: ["Go", "TypeScript", "PostgreSQL", "Kafka", "Kubernetes", "Terraform", "React", "Distributed systems", "Observability", "Incident response"],
    projects: [
      { title: "pgtrace", year: "2024", role: "Author & maintainer", category: "Open source", description: "A terminal tool that watches Postgres for slow queries and suggests the index that would fix them. 4.1k stars; used in production at a few hundred companies.", technologies: ["Go", "PostgreSQL"], github: "https://github.com/", image: s("ui-terminal") },
      { title: "Ledgerline", year: "2023", role: "Tech lead", client: "Northwind Pay", category: "Product", description: "Rebuilt the cash-position service behind a treasury dashboard. Reports that took 40 seconds now load in under one, on a third of the hardware.", technologies: ["Go", "Kafka", "React"], live_url: "https://example.com", image: s("ui-ledger") },
      { title: "Transit Live", year: "2021", role: "Engineer", client: "City of Porto", category: "Civic", description: "Real-time arrivals for 380 bus stops, built with a team of four in ten weeks and still running on the original architecture.", technologies: ["TypeScript", "Redis", "MapLibre"], image: s("ui-transit") },
    ],
    experience: [
      { job_title: "Staff Software Engineer", company: "Northwind Pay", location: "Lisbon", start_date: "2022", end_date: "Present", description: "Lead the platform group: payments ledger, event streaming and the internal developer portal. Cut p95 settlement latency from 2.3s to 180ms.", technologies: ["Go", "Kafka", "PostgreSQL"] },
      { job_title: "Senior Engineer", company: "Talo", location: "Berlin", start_date: "2018", end_date: "2022", description: "Built the multi-tenant data layer and the on-call practice that took incidents from weekly to quarterly.", technologies: ["TypeScript", "Kubernetes"] },
      { job_title: "Software Engineer", company: "Porto Digital", location: "Porto", start_date: "2014", end_date: "2018", description: "Public-sector web services, from parking permits to the city’s open-data portal.", technologies: ["Python", "PostgreSQL"] },
    ],
    education: [{ school: "University of Porto", degree: "MSc Informatics Engineering", start_date: "2009", end_date: "2014" }],
    highlights: [
      { title: "Indexes you forgot you needed", detail: "Talk, PGConf EU", year: "2024", url: "https://example.com" },
      { title: "The boring guide to on-call", detail: "Essay, 38k readers", year: "2023" },
      { title: "pgtrace reaches 4,000 stars", detail: "Open source", year: "2024" },
      { title: "Speaker, GopherCon Lisbon", detail: "Talk", year: "2022" },
    ],
    testimonials: [
      { quote: "Ines is the person you want in the room when the graph goes vertical. Calm, fast, and she writes it all down afterwards.", name: "Mark Tan", role: "VP Engineering, Northwind Pay" },
      { quote: "She made our on-call boring, which is the nicest thing anyone has done for this team.", name: "Lea Vogel", role: "Engineering Manager, Talo" },
    ],
    stats: [{ value: "11", label: "years shipping" }, { value: "4.1k", label: "GitHub stars" }, { value: "−92%", label: "p95 latency" }],
  },

  design: {
    name: "Theo Laurent", professional_title: "Product & Brand Designer", location: "Montréal, Canada", availability: "Booking projects for spring",
    tagline: "I design calm products and the brands that make people trust them.",
    summary: [
      "For nine years I’ve worked between brand and product: naming a thing, drawing its logo, then designing the app that has to live up to it.",
      "I’m happiest early, when the problem is still fuzzy, and I stay through launch so the details survive engineering.",
    ],
    email: "theo@example.com", linkedin: "https://www.linkedin.com/", instagram: "https://www.instagram.com/", links: [{ label: "Dribbble", url: "https://dribbble.com/" }, { label: "Read.cv", url: "https://read.cv/" }],
    skills: ["Product design", "Brand identity", "Design systems", "Figma", "Prototyping", "Typography", "User research", "Art direction"],
    projects: [
      { title: "Stillwater", year: "2024", role: "Lead designer", client: "Stillwater Health", category: "Product", description: "A sleep and breathing app for people who hate wellness apps. 4.8 stars from 22k ratings; featured by Apple in 14 countries.", technologies: ["iOS", "Design system"], image: s("ui-health") },
      { title: "Fernhouse", year: "2023", role: "Brand identity", client: "Fernhouse Nursery", category: "Brand", description: "A new name, mark and voice for a family plant nursery opening its second and third shops.", technologies: ["Identity", "Packaging"], image: s("brand-identity") },
      { title: "Transit Live", year: "2021", role: "Product designer", client: "City of Porto", category: "Product", description: "Real-time arrivals designed for a phone held in one hand, in the rain, while running.", technologies: ["Mobile", "Wayfinding"], image: s("ui-transit") },
      { title: "Ledgerline", year: "2022", role: "Product designer", client: "Northwind Pay", category: "Product", description: "A treasury dashboard finance teams actually open on Monday mornings.", technologies: ["Web app", "Data viz"], image: s("ui-ledger") },
    ],
    experience: [
      { job_title: "Independent designer", company: "Studio Laurent", location: "Montréal", start_date: "2021", end_date: "Present", description: "Brand and product work for health, civic and finance clients." },
      { job_title: "Senior Product Designer", company: "Shopify", location: "Montréal", start_date: "2017", end_date: "2021", description: "Checkout and merchant onboarding; co-led the Polaris type refresh." },
      { job_title: "Designer", company: "Pentagram (intern → junior)", location: "New York", start_date: "2015", end_date: "2017", description: "Identity systems for cultural institutions." },
    ],
    education: [{ school: "Concordia University", degree: "BFA Design", start_date: "2011", end_date: "2015" }],
    services: [
      { title: "Brand identity", description: "Name, mark, type, colour and a guide your team will actually use.", price: "From $14k" },
      { title: "Product design sprint", description: "Four weeks from fuzzy problem to tested prototype.", price: "From $18k" },
      { title: "Design system audit", description: "A frank review of your components and a plan to fix them.", price: "$6k" },
    ],
    testimonials: [{ quote: "Theo gave us a brand our customers describe as ‘like the shop smells’. That’s a weird compliment and the best one we’ve had.", name: "Rosa Fern", role: "Owner, Fernhouse" }, { quote: "The rare designer who makes engineering faster, not slower.", name: "Dev Patel", role: "CTO, Stillwater" }],
    highlights: [{ title: "Apple Design Award finalist", detail: "Stillwater", year: "2024" }, { title: "Type Directors Club, Certificate of Excellence", detail: "Fernhouse", year: "2023" }, { title: "Brand New, Noted", detail: "Fernhouse identity", year: "2023" }],
    stats: [{ value: "40+", label: "products shipped" }, { value: "9", label: "years" }, { value: "4.8★", label: "Stillwater rating" }],
  },

  art: {
    name: "Mira Sato", professional_title: "Painter & Printmaker", location: "Kyoto · Glasgow", availability: "Commissions open for 2026",
    tagline: "Colour, weather and the slow edges between them.",
    summary: [
      "I paint large, quiet fields of colour and make small riso prints in between, the way some people keep a diary.",
      "My work has been shown in Kyoto, Glasgow and Copenhagen, and lives in a few public and many private collections.",
    ],
    email: "studio@example.com", instagram: "https://www.instagram.com/", website: "https://mirasato.art",
    skills: ["Oil on linen", "Risograph", "Ink", "Screenprint", "Large-format", "Commissions"],
    gallery: [
      { image: s("art-field-red"), caption: "Late Harbour, oil on linen, 150 × 190 cm", year: "2024" },
      { image: s("art-field-blue"), caption: "Before the Rain, oil on linen, 120 × 150 cm", year: "2024" },
      { image: s("art-ink"), caption: "Kamo River I, sumi ink on washi", year: "2023" },
      { image: s("art-riso"), caption: "Two Mountains, riso, edition of 60", year: "2023" },
      { image: s("art-geometric"), caption: "Studio Study no. 4, gouache", year: "2022" },
      { image: s("art-ink-2"), caption: "Kamo River II, sumi ink on washi", year: "2023" },
      { image: s("art-riso-2"), caption: "Greenhouse, riso, edition of 40", year: "2022" },
      { image: s("art-geometric-2"), caption: "Studio Study no. 7, gouache", year: "2022" },
    ],
    projects: [
      { title: "Weather Inside", year: "2024", category: "Solo exhibition", client: "Gallery Hototogisu, Kyoto", description: "Eleven paintings made over one rainy season, hung low so you meet them at eye level.", image: s("art-field-blue") },
      { title: "Riso Diaries", year: "2023", category: "Book", client: "Self-published", description: "A year of daily prints in a sewn edition of 200. Sold out in nine days.", image: s("art-riso") },
    ],
    highlights: [
      { title: "Weather Inside", detail: "Solo, Gallery Hototogisu, Kyoto", year: "2024" },
      { title: "New Contemporaries", detail: "Group, Royal Scottish Academy", year: "2023" },
      { title: "Paper Weather", detail: "Group, Kunsthal Charlottenborg", year: "2022" },
      { title: "Hope Scott Trust Award", detail: "Award", year: "2022" },
      { title: "Residency, Cove Park", detail: "Residency", year: "2021" },
    ],
    education: [{ school: "Glasgow School of Art", degree: "MFA Fine Art Practice", start_date: "2018", end_date: "2020" }, { school: "Kyoto City University of Arts", degree: "BA Painting", start_date: "2013", end_date: "2017" }],
    testimonials: [{ quote: "Sato’s fields don’t sit still; they breathe at the edges.", name: "The List", role: "Review, 2023" }],
    stats: [{ value: "6", label: "solo shows" }, { value: "3", label: "public collections" }],
  },

  photo: {
    name: "Tomás Rivera", professional_title: "Landscape & Editorial Photographer", location: "Valparaíso, Chile", availability: "On assignment in Patagonia until March",
    tagline: "Long walks, early alarms, and the minute the light changes.",
    summary: [
      "I photograph landscapes for magazines, tourism boards and the occasional brave brand. Most of my work starts with a map, a thermos and a 4:30am alarm.",
      "Clients include Monocle, Condé Nast Traveller, Patagonia and the Chilean national parks service.",
    ],
    email: "tomas@example.com", instagram: "https://www.instagram.com/", website: "https://tomasrivera.photo",
    skills: ["Landscape", "Editorial", "Large format", "Aerial", "Colour grading", "Fine-art printing"],
    gallery: [
      { image: s("photo-ridges"), caption: "Cordillera, first light", year: "2024" },
      { image: s("photo-sea"), caption: "Pacific, Isla Negra", year: "2024" },
      { image: s("photo-dunes"), caption: "Atacama, 19:42", year: "2023" },
      { image: s("photo-bluehour"), caption: "Blue hour above Cochamó", year: "2023" },
      { image: s("photo-forest"), caption: "Snowfall, Conguillío", year: "2023" },
      { image: s("photo-harbour"), caption: "Harbour, Valparaíso", year: "2022" },
      { image: s("photo-reeds"), caption: "Wetland, Chiloé", year: "2022" },
      { image: s("photo-city"), caption: "Santiago, from a bus window", year: "2022" },
    ],
    projects: [
      { title: "The Long Coast", year: "2024", client: "Monocle", category: "Editorial", description: "4,200 km of Chilean coastline in 31 photographs, for the magazine’s travel issue.", image: s("photo-sea") },
      { title: "Desert Hours", year: "2023", client: "Condé Nast Traveller", category: "Editorial", description: "One day in the Atacama, photographed every twenty minutes from 5am to midnight.", image: s("photo-dunes") },
      { title: "Parks Chile", year: "2022", client: "CONAF", category: "Commission", description: "The visual identity photography for the national parks’ new visitor programme.", image: s("photo-forest") },
    ],
    highlights: [{ title: "Sony World Photography Awards, Landscape shortlist", year: "2024" }, { title: "The Long Coast, Monocle", detail: "Feature", year: "2024" }, { title: "Desert Hours, solo show, Santiago", year: "2023" }],
    testimonials: [{ quote: "Tomás came back with the cover, the opener and a picture we still use in pitch decks three years later.", name: "Ana Ruiz", role: "Photo director, travel magazine" }],
    services: [{ title: "Editorial assignments", description: "Travel and landscape stories, any distance.", price: "Day rate on request" }, { title: "Fine-art prints", description: "Archival pigment prints, signed, editions of 25.", price: "From $480" }],
    stats: [{ value: "31", label: "countries" }, { value: "12", label: "covers" }],
  },

  writing: {
    name: "Amara Osei", professional_title: "Writer & Editor", location: "London", availability: "Taking on two long-form commissions this autumn",
    tagline: "Essays about work, cities and the people who keep them running.",
    summary: [
      "I write long-form essays and reported features, mostly about labour, migration and the hidden infrastructure of cities. My first book, The Salt Years, came out with Granta in 2024.",
      "I also edit The Harbour Quarterly, a small magazine of new writing from port cities.",
    ],
    email: "amara@example.com", website: "https://amaraosei.com", links: [{ label: "Substack", url: "https://substack.com/" }],
    skills: ["Long-form essays", "Reported features", "Editing", "Ghostwriting", "Book proposals", "Interviewing"],
    projects: [
      { title: "The Salt Years", year: "2024", client: "Granta Books", category: "Book", description: "Essays on the docks, night buses and corner shops that keep a city alive. Shortlisted for the Orwell Prize.", image: s("cover-salt") },
      { title: "Night Shift", year: "2026", client: "Granta Books", category: "Novel", description: "A novel about a hospital porter, a Sunday, and everything that can happen in one shift.", image: s("cover-night") },
      { title: "The Harbour Quarterly", year: "2021–", role: "Founding editor", category: "Magazine", description: "Fourteen issues of fiction and essays from port cities, from Lagos to Liverpool.", image: s("cover-quarterly") },
    ],
    highlights: [
      { title: "Who Cleans the City at Night?", detail: "The Guardian Long Read", year: "2024", url: "https://example.com" },
      { title: "The Last Container Crane in Tilbury", detail: "The New Yorker", year: "2023", url: "https://example.com" },
      { title: "Notes from a Corner Shop", detail: "Granta 162", year: "2023" },
      { title: "On Overtime", detail: "London Review of Books", year: "2022" },
      { title: "Orwell Prize for Political Writing, shortlist", detail: "The Salt Years", year: "2025" },
    ],
    experience: [
      { job_title: "Founding Editor", company: "The Harbour Quarterly", start_date: "2021", end_date: "Present", description: "Commission, edit and publish four issues a year." },
      { job_title: "Features Writer", company: "The Guardian", start_date: "2016", end_date: "2021", description: "Long reads on work, housing and transport." },
    ],
    testimonials: [{ quote: "Osei writes about ordinary work with the attention most people save for art.", name: "The Observer", role: "Review of The Salt Years" }],
    stats: [{ value: "2", label: "books" }, { value: "60+", label: "features" }],
  },

  architecture: {
    name: "Jonas Berg", professional_title: "Architect, ARB", location: "Oslo · Copenhagen", availability: "Accepting residential commissions for 2026",
    tagline: "Small buildings, long lives. Timber, daylight and good corners to sit in.",
    summary: [
      "Berg Arkitekter is a studio of five. We design houses, cabins and small public buildings, mostly in timber and mostly on difficult sites.",
      "We work slowly at the start and quickly at the end: months of drawing and models, then a build that surprises nobody.",
    ],
    email: "studio@example.com", website: "https://bergarkitekter.no", instagram: "https://www.instagram.com/",
    cover: s("interior-oak"),
    gallery: [{ image: s("interior-stone"), caption: "Stone kitchen, Bergen" }, { image: s("arch-model"), caption: "Working model, Light Studio" }, { image: s("interior-oak"), caption: "Oak Room, Oslo" }],
    skills: ["Residential", "Timber construction", "Passive house", "Site planning", "Rhino", "Physical models"],
    projects: [
      { title: "House on a Slope", year: "2024", client: "Private", category: "Residential", role: "Lead architect", description: "A 140 m² family house stepped down a 1:4 slope, with every room facing the fjord and a stair that doubles as a reading room.", image: s("arch-plan") },
      { title: "Sun Path Cabin", year: "2023", client: "Private", category: "Cabin", description: "A cabin cut and angled so the low winter sun reaches the kitchen table from 10:40 to 13:15.", image: s("arch-section") },
      { title: "Light Studio", year: "2022", client: "Bergen Kunsthall", category: "Public", description: "A pavilion of four volumes for artist residencies, built in eleven weeks from cross-laminated timber.", image: s("arch-model") },
      { title: "Oak Room", year: "2021", client: "Private", category: "Interior", description: "A flat renovation built around one long oak bench.", image: s("interior-oak") },
    ],
    experience: [
      { job_title: "Founder", company: "Berg Arkitekter", location: "Oslo", start_date: "2018", end_date: "Present", description: "Studio of five; 23 completed projects." },
      { job_title: "Project Architect", company: "Snøhetta", location: "Oslo", start_date: "2012", end_date: "2018", description: "Cultural and residential projects in Norway and Denmark." },
    ],
    education: [{ school: "Oslo School of Architecture and Design", degree: "Master of Architecture", start_date: "2006", end_date: "2012" }],
    highlights: [{ title: "Statens Byggeskikkpris, shortlist", detail: "House on a Slope", year: "2025" }, { title: "Published in Arkitektur N", year: "2024" }, { title: "Wood Award, small projects", year: "2023" }],
    testimonials: [{ quote: "Jonas spent three days on our hillside before drawing a line. The house feels like it was always there.", name: "Kari & Erik Lund", role: "Clients, House on a Slope" }],
    services: [{ title: "New houses & cabins", description: "From site visit to keys, including planning applications." }, { title: "Feasibility studies", description: "What your site can hold, and what it should.", price: "From NOK 45,000" }],
    stats: [{ value: "23", label: "built projects" }, { value: "5", label: "people" }, { value: "100%", label: "timber frame" }],
  },

  academic: {
    name: "Dr. Priya Raman", professional_title: "Assistant Professor of Computational Biology", location: "University of Edinburgh", availability: "Recruiting two PhD students for 2026",
    tagline: "How cells decide, and how to measure it without fooling ourselves.",
    summary: [
      "My lab builds statistical methods for single-cell data, with a focus on cell-fate decisions in early development.",
      "Before Edinburgh I was a postdoc at the Broad Institute and did my PhD at Cambridge. I care about reproducible methods, open data and kind lab culture.",
    ],
    email: "p.raman@example.ac.uk", website: "https://ramanlab.org", github: "https://github.com/", links: [{ label: "Google Scholar", url: "https://scholar.google.com/" }, { label: "ORCID", url: "https://orcid.org/" }],
    skills: ["Single-cell genomics", "Bayesian statistics", "R", "Python", "Probabilistic programming", "Teaching"],
    highlights: [
      { title: "Fate decisions are made earlier than lineage markers suggest", detail: "Raman P, Okoye J, Lindqvist A. Nature Methods 21, 1102–1110", year: "2024", url: "https://example.com" },
      { title: "scBay: calibrated uncertainty for single-cell trajectories", detail: "Raman P, Chen W. Genome Biology 24:188", year: "2023", url: "https://example.com" },
      { title: "Batch effects masquerading as biology", detail: "Raman P, et al. Cell Systems 13(4)", year: "2022" },
      { title: "A note on pseudotime and its discontents", detail: "Raman P. Bioinformatics 37(12)", year: "2021" },
      { title: "Wellcome Career Development Award", detail: "£1.6M, 2025–2030", year: "2025" },
    ],
    projects: [
      { title: "scBay", year: "2023", category: "Software", description: "An R package for trajectory inference with honest uncertainty. 40k downloads.", github: "https://github.com/", image: s("chart-trajectory") },
      { title: "Embryo Atlas", year: "2024", category: "Dataset", description: "Single-cell profiles of 180,000 cells across six days of mouse development, openly licensed.", image: s("chart-umap") },
    ],
    experience: [
      { job_title: "Assistant Professor", company: "University of Edinburgh", start_date: "2022", end_date: "Present", description: "Lab of six; teaching Statistical Genomics (MSc)." },
      { job_title: "Postdoctoral Fellow", company: "Broad Institute", start_date: "2019", end_date: "2022", description: "Methods for single-cell lineage tracing." },
    ],
    education: [{ school: "University of Cambridge", degree: "PhD Computational Biology", start_date: "2015", end_date: "2019" }, { school: "IIT Bombay", degree: "BTech Biosciences", start_date: "2011", end_date: "2015" }],
    services: [{ title: "PhD positions", description: "Two funded places for 2026. Statistics or biology backgrounds welcome." }, { title: "Collaborations", description: "Happy to talk about single-cell experimental design." }],
    stats: [{ value: "24", label: "papers" }, { value: "2.9k", label: "citations" }, { value: "6", label: "lab members" }],
  },

  data: {
    name: "Wei Chen", professional_title: "Senior Data Scientist", location: "Singapore", availability: "Open to lead roles in forecasting",
    tagline: "Forecasts that people trust enough to act on.",
    summary: ["I build forecasting and experimentation systems for marketplaces. My favourite result is a model that gets switched off because the process it fixed no longer needs it.", "Previously at Grab and Shopee; now leading forecasting at a logistics scale-up."],
    email: "wei@example.com", github: "https://github.com/", linkedin: "https://www.linkedin.com/",
    skills: ["Python", "SQL", "Time series", "Causal inference", "Experimentation", "dbt", "Spark", "PyTorch"],
    projects: [
      { title: "Demand forecast v3", year: "2024", client: "Kargo", category: "Forecasting", description: "Weekly demand for 14k routes. MAPE down from 31% to 12%; saves about $4M a year in empty trucks.", technologies: ["Python", "LightGBM", "dbt"], image: s("chart-lines") },
      { title: "Onboarding experiment", year: "2023", client: "Kargo", category: "Experimentation", description: "Six onboarding paths tested on 90k shippers; the winner cut 90-day churn by 38%.", technologies: ["SQL", "Bayesian A/B"], image: s("chart-bars") },
      { title: "Delivery delay model", year: "2022", client: "Grab", category: "ML", description: "Predicted late deliveries 20 minutes earlier, so support could message customers first.", technologies: ["PyTorch", "Spark"], image: s("chart-scatter") },
    ],
    experience: [
      { job_title: "Senior Data Scientist", company: "Kargo", start_date: "2023", end_date: "Present", description: "Lead forecasting; team of three." },
      { job_title: "Data Scientist", company: "Grab", start_date: "2019", end_date: "2023", description: "Delivery ETA and dispatch experiments." },
      { job_title: "Analyst", company: "Shopee", start_date: "2017", end_date: "2019", description: "Pricing and promotions analytics." },
    ],
    education: [{ school: "National University of Singapore", degree: "MSc Statistics", start_date: "2015", end_date: "2017" }],
    highlights: [{ title: "Forecasts nobody uses", detail: "Talk, PyData Singapore", year: "2024" }, { title: "Kaggle Competitions Master", year: "2021" }],
    stats: [{ value: "$4M", label: "annual savings" }, { value: "−38%", label: "churn" }, { value: "12%", label: "MAPE" }],
  },

  marketing: {
    name: "Sofia Marín", professional_title: "Brand & Growth Marketing Lead", location: "Barcelona", availability: "Consulting two days a week",
    tagline: "Campaigns people remember and numbers the CFO believes.",
    summary: ["I’ve led brand and growth for consumer fintech and food brands for ten years, from a two-person launch to a 40-person team.", "I like work that is both loud and measurable: a poster on the metro and a dashboard that shows what it did."],
    email: "sofia@example.com", linkedin: "https://www.linkedin.com/",
    skills: ["Brand strategy", "Campaigns", "Lifecycle", "Paid social", "Positioning", "Team leadership"],
    projects: [
      { title: "Money, minus jargon", year: "2024", client: "ClearBank", category: "Launch campaign", description: "OOH, radio and social for a new current account. 210k sign-ups in the first quarter at a CAC 41% under plan.", image: s("poster-bank") },
      { title: "Run your city", year: "2023", client: "Northline", category: "Brand campaign", description: "A marathon partnership that turned a running app into the city’s training plan. +62% MAU.", image: s("poster-run") },
      { title: "Oat milk era", year: "2022", client: "Avena Foods", category: "Launch", description: "Retail launch in 1,800 stores across Spain and Portugal.", image: s("poster-oat") },
      { title: "Retention is the growth plan", year: "2023", client: "ClearBank", category: "Strategy", description: "The lifecycle programme that lifted 12-month retention from 54% to 75%.", image: s("slide-deck") },
    ],
    experience: [
      { job_title: "Head of Brand & Growth", company: "ClearBank", start_date: "2022", end_date: "2025", description: "Led a team of 40 across brand, performance and lifecycle." },
      { job_title: "Marketing Director", company: "Avena Foods", start_date: "2018", end_date: "2022", description: "Took the brand from 200 to 1,800 stores." },
    ],
    stats: [{ value: "210k", label: "sign-ups in Q1" }, { value: "−41%", label: "CAC vs plan" }, { value: "+21pt", label: "retention" }],
    testimonials: [{ quote: "Sofia is the only marketer our finance team asks to present.", name: "Jordi Puig", role: "CEO, ClearBank" }],
    highlights: [{ title: "Cannes Lions, Bronze, Outdoor", year: "2024" }, { title: "Effie Spain, Gold", year: "2023" }],
    services: [{ title: "Launch planning", description: "Positioning, channels and a 90-day plan." }, { title: "Growth audits", description: "Where your next 20% is hiding." }],
  },

  consulting: {
    name: "Daniel Novak", professional_title: "Fractional CFO & Finance Consultant", location: "Prague · Remote", availability: "One retainer slot from February",
    tagline: "Clear numbers for founders who would rather be building.",
    summary: ["I help seed to Series B startups set up finance that scales: monthly close, a model investors trust, and a board pack that takes an hour, not a week.", "Fifteen years in finance, the last six as a fractional CFO for 22 companies."],
    email: "daniel@example.com", linkedin: "https://www.linkedin.com/",
    skills: ["Financial modelling", "Fundraising", "Board reporting", "Unit economics", "Cash management", "Pricing"],
    services: [
      { title: "Fractional CFO", description: "Two days a month: close, reporting, board, investors.", price: "€4,500 / month" },
      { title: "Fundraise model", description: "A three-statement model and the story behind it, ready in three weeks.", price: "€9,000" },
      { title: "Pricing review", description: "What to charge, and what to stop discounting.", price: "€5,500" },
      { title: "Finance health check", description: "One day, one honest report.", price: "€1,800" },
    ],
    projects: [
      { title: "Series A, €12M", year: "2024", client: "Tessera (B2B SaaS)", category: "Fundraise", description: "Model, data room and investor Q&A. Closed in eleven weeks." },
      { title: "From 40-day to 6-day close", year: "2023", client: "Flowly", category: "Operations", description: "New chart of accounts and automation; the team got their month back." },
      { title: "Pricing reset", year: "2023", client: "Kitchen OS", category: "Pricing", description: "Moved to usage pricing; ARPA +34% with no rise in churn." },
    ],
    testimonials: [{ quote: "Daniel turned our spreadsheet chaos into a board pack I’m proud of, in a month.", name: "Petra Malá", role: "CEO, Tessera" }, { quote: "The cheapest senior hire we ever made.", name: "Tom Becker", role: "Founder, Flowly" }],
    stats: [{ value: "22", label: "startups" }, { value: "€140M", label: "raised alongside founders" }, { value: "6 days", label: "average close" }],
    experience: [{ job_title: "Fractional CFO", company: "Novak Finance", start_date: "2019", end_date: "Present" }, { job_title: "Finance Director", company: "Kiwi.com", start_date: "2015", end_date: "2019" }],
    highlights: [{ title: "Chartered accountant (ACCA)", year: "2012" }],
  },

  music: {
    name: "Low Tide", professional_title: "Composer & Producer · Ana Lindqvist", location: "Lisbon", availability: "Scoring for film and games; touring Europe in spring",
    tagline: "Slow synthesizers, field recordings and songs that sound like weather.",
    summary: ["Low Tide is the project of composer and producer Ana Lindqvist. Four albums since 2018, released on Sea Glass Records.", "I also score documentaries and games, and run a small studio in Lisbon where I record other people’s first albums."],
    email: "booking@example.com", instagram: "https://www.instagram.com/", links: [{ label: "Spotify", url: "https://open.spotify.com/" }, { label: "Bandcamp", url: "https://bandcamp.com/" }],
    skills: ["Composition", "Production", "Modular synthesis", "Field recording", "Mixing", "Film scoring"],
    projects: [
      { title: "Salt", year: "2024", category: "Album", client: "Sea Glass Records", description: "Ten tracks recorded on the Alentejo coast. BBC 6 Music album of the day.", image: s("album-tide") },
      { title: "Glasshouse", year: "2022", category: "Album", client: "Sea Glass Records", description: "Synth pop written in a greenhouse, with the rain left in.", image: s("album-glass") },
      { title: "Field Recordings", year: "2020", category: "EP", description: "Five pieces made from sounds collected walking the Tagus.", image: s("album-field") },
      { title: "Sunroom Sessions", year: "2023", category: "Live album", description: "Recorded live in one afternoon with a string quartet.", image: s("album-sun") },
    ],
    highlights: [
      { title: "Lisbon, Musicbox", detail: "with string quartet", year: "14 Mar 2026" },
      { title: "Porto, Hard Club", detail: "", year: "15 Mar 2026" },
      { title: "Madrid, Sala Clamores", detail: "", year: "18 Mar 2026" },
      { title: "Berlin, Kantine am Berghain", detail: "", year: "22 Mar 2026" },
      { title: "Leipzig, UT Connewitz", detail: "", year: "23 Mar 2026" },
      { title: "Prague, Café v lese", detail: "", year: "25 Mar 2026" },
    ],
    experience: [{ job_title: "Composer", company: "The Long Coast (documentary)", start_date: "2024", end_date: "2024", description: "Original score, 92 minutes." }, { job_title: "Composer", company: "Tidepool (game)", start_date: "2023", end_date: "2023", description: "Adaptive soundtrack for a puzzle game." }],
    stats: [{ value: "4", label: "albums" }, { value: "28M", label: "streams" }],
    gallery: [{ image: s("poster-gig"), caption: "Spring tour poster, 2026" }],
  },

  film: {
    name: "Kofi Mensah", professional_title: "Director & Cinematographer", location: "Accra · London", availability: "Available for commercials and documentary from April",
    tagline: "Wide frames, small moments.",
    summary: ["I direct and shoot documentaries, commercials and music videos. My films have screened at Sundance, IDFA and on BBC Four.", "I like working with small crews, natural light and people who aren’t actors."],
    email: "kofi@example.com", instagram: "https://www.instagram.com/", links: [{ label: "Vimeo", url: "https://vimeo.com/" }, { label: "IMDb", url: "https://www.imdb.com/" }],
    skills: ["Directing", "Cinematography", "Documentary", "Commercials", "Colour", "ARRI Alexa"],
    projects: [
      { title: "The Walk Home", year: "2024", category: "Documentary short", role: "Director, DP", client: "BBC Four", description: "A schoolboy’s 7 km walk home in Northern Ghana, filmed over one week. Sundance, short film jury prize nominee.", image: s("still-dunes") },
      { title: "Winter Light", year: "2023", category: "Commercial", role: "Director", client: "Volvo", description: "A 60-second film shot in one take on a frozen lake.", image: s("still-snow") },
      { title: "Night Bus", year: "2022", category: "Music video", role: "Director, DP", client: "Low Tide", description: "One night on the 207 from Lisbon to the coast.", image: s("still-night") },
    ],
    experience: [{ job_title: "Director", company: "Represented by Pulse Films", start_date: "2021", end_date: "Present" }, { job_title: "Cinematographer", company: "Freelance", start_date: "2015", end_date: "2021" }],
    highlights: [{ title: "Sundance Film Festival", detail: "The Walk Home, official selection", year: "2025" }, { title: "IDFA", detail: "The Walk Home", year: "2024" }, { title: "British Arrows, Silver", detail: "Winter Light", year: "2024" }],
    testimonials: [{ quote: "Mensah frames distance like few others; the film is all space and somehow all heart.", name: "Sight & Sound", role: "Review" }],
    stats: [{ value: "40+", label: "films" }, { value: "3", label: "festival selections" }],
  },

  leadership: {
    name: "Helena Brandt", professional_title: "Founder & CEO, Tessera", location: "Berlin", availability: "Speaking, advising and board roles",
    tagline: "Building software for the people who build buildings.",
    summary: ["I founded Tessera in 2019 to give construction teams software that works on a muddy tablet. We now serve 1,400 sites in nine countries with a team of 120.", "Before that I ran operations at Delivery Hero and studied civil engineering. I advise climate and construction startups and sit on two boards."],
    email: "helena@example.com", linkedin: "https://www.linkedin.com/", website: "https://tessera.build",
    skills: ["Company building", "Fundraising", "B2B SaaS", "Operations", "Hiring", "Construction tech"],
    stats: [{ value: "€58M", label: "raised" }, { value: "120", label: "people" }, { value: "1,400", label: "sites" }, { value: "9", label: "countries" }],
    experience: [
      { job_title: "Founder & CEO", company: "Tessera", start_date: "2019", end_date: "Present", description: "From a spreadsheet to €21M ARR; Series B led by Index Ventures." },
      { job_title: "VP Operations", company: "Delivery Hero", start_date: "2015", end_date: "2019", description: "Scaled courier operations across eleven markets." },
      { job_title: "Site Engineer", company: "Hochtief", start_date: "2011", end_date: "2015", description: "Bridges, mostly, and a lot of concrete." },
    ],
    highlights: [
      { title: "Forbes 30 Under 30, Europe", detail: "Industry", year: "2021" },
      { title: "Series B, €40M", detail: "Led by Index Ventures", year: "2024" },
      { title: "Keynote, Slush", detail: "Software for the physical world", year: "2024" },
      { title: "Board member, Bauwende e.V.", year: "2023" },
    ],
    projects: [{ title: "Software for the physical world", year: "2024", category: "Keynote", client: "Slush", description: "Why the next decade of SaaS is in hard hats.", image: s("slide-deck") }],
    testimonials: [{ quote: "Helena is the rare founder who can explain a load-bearing wall and a cap table in the same meeting.", name: "Martin Mignot", role: "Partner, Index Ventures" }],
    education: [{ school: "TU München", degree: "MSc Civil Engineering", start_date: "2006", end_date: "2011" }],
    services: [{ title: "Keynotes", description: "Construction, climate and company building." }, { title: "Advisory", description: "Two seed-stage companies a year." }],
  },

  student: {
    name: "Leo Kim", professional_title: "Computer Science student, class of 2026", location: "Waterloo, Ontario", availability: "Looking for a summer 2026 internship",
    tagline: "I build small useful things and write down what I learn.",
    summary: ["I’m a third-year CS student at the University of Waterloo, interested in developer tools and accessible interfaces.", "I’ve done two co-op terms, shipped a few side projects people actually use, and TA the intro programming course."],
    email: "leo@example.com", github: "https://github.com/", linkedin: "https://www.linkedin.com/",
    skills: ["TypeScript", "React", "Python", "C", "SQL", "Accessibility", "Figma"],
    projects: [
      { title: "Course Planner", year: "2025", category: "Side project", description: "Plans a degree around prerequisites. 3,200 Waterloo students used it last term.", technologies: ["Next.js", "Postgres"], live_url: "https://example.com", image: s("ui-transit") },
      { title: "Screen-reader linter", year: "2024", category: "Hackathon", description: "A VS Code extension that flags inaccessible JSX. 1st place, Hack the North accessibility track.", technologies: ["TypeScript", "VS Code API"], github: "https://github.com/" },
      { title: "Tiny Shell", year: "2024", category: "Coursework", description: "A Unix shell in 900 lines of C with pipes, jobs and history.", technologies: ["C"] },
    ],
    experience: [
      { job_title: "Software Engineering Intern", company: "Wealthsimple", start_date: "Jan 2025", end_date: "Apr 2025", description: "Built the account-transfer status page; cut related support tickets by 30%.", technologies: ["React", "Ruby"] },
      { job_title: "Teaching Assistant", company: "University of Waterloo, CS 135", start_date: "2024", end_date: "Present", description: "Office hours and labs for 400 first-years." },
    ],
    education: [{ school: "University of Waterloo", degree: "BCS Computer Science (co-op)", start_date: "2022", end_date: "2026", description: "GPA 3.8 · Dean’s honours list" }],
    highlights: [{ title: "Hack the North, 1st place (accessibility)", year: "2024" }, { title: "Dean’s honours list", year: "2023, 2024" }],
    stats: [{ value: "3,200", label: "planner users" }, { value: "2", label: "co-op terms" }],
  },

  wellness: {
    name: "Maya Haddad", professional_title: "Psychotherapist & Breathwork Coach", location: "Amsterdam · Online", availability: "New clients welcome, in person and online",
    tagline: "A quiet hour for the loud parts of life.",
    summary: ["I’m a registered psychotherapist working with adults on anxiety, burnout and big life changes. I combine talk therapy with simple breathing practices you can take home.", "Sessions are in English, Arabic or Dutch, in my practice in De Pijp or online."],
    email: "hello@example.com", instagram: "https://www.instagram.com/", website: "https://mayahaddad.nl",
    skills: ["Anxiety", "Burnout", "Life transitions", "Breathwork", "CBT", "Mindfulness"],
    services: [
      { title: "Individual therapy", description: "50 minutes, weekly or fortnightly. In person or online.", price: "€95" },
      { title: "Breathwork session", description: "60 minutes of guided breathing for stress and sleep.", price: "€70" },
      { title: "Burnout programme", description: "Eight sessions and a written plan for returning to work.", price: "€680" },
      { title: "Free introduction", description: "Fifteen minutes to see whether we’re a good fit.", price: "Free" },
    ],
    testimonials: [{ quote: "Maya helped me notice what my body had been saying for a year. I sleep now.", name: "J.", role: "Client, 2024" }, { quote: "Practical, warm and never preachy.", name: "R.", role: "Client, 2023" }],
    education: [{ school: "Vrije Universiteit Amsterdam", degree: "MSc Clinical Psychology", start_date: "2012", end_date: "2014" }, { school: "BIG-registered psychotherapist", degree: "Registration no. 19XXXXX", start_date: "", end_date: "2017" }],
    experience: [{ job_title: "Psychotherapist", company: "Private practice", start_date: "2019", end_date: "Present" }, { job_title: "Psychologist", company: "GGZ inGeest", start_date: "2014", end_date: "2019" }],
    gallery: [{ image: s("calm-water"), caption: "The practice room, De Pijp" }],
    stats: [{ value: "10", label: "years in practice" }, { value: "3", label: "languages" }],
    highlights: [{ title: "Breathing for the Overwhelmed", detail: "Workshop series, OBA library", year: "2024" }],
  },
};

/** A trainer persona for the athletic template shares the wellness model with sharper content. */
PERSONAS.trainer = {
  name: "Rafael Costa", professional_title: "Strength Coach & Personal Trainer", location: "São Paulo · Online", availability: "6 spots open for online coaching",
  tagline: "Get strong, stay unbroken.",
  summary: ["I coach busy adults to lift well, run further and stop getting hurt. Fourteen years coaching, from beginners to national-level rowers.", "Programmes are written for your week, your gym and your knees."],
  email: "rafa@example.com", instagram: "https://www.instagram.com/",
  skills: ["Strength", "Mobility", "Running", "Injury return", "Nutrition basics"],
  services: [
    { title: "Online coaching", description: "Weekly programme, video form checks and a call every month.", price: "R$480 / month" },
    { title: "1:1 training", description: "In person in Pinheiros, 60 minutes.", price: "R$220" },
    { title: "12-week strength block", description: "A fixed plan with three check-ins.", price: "R$990" },
  ],
  stats: [{ value: "14", label: "years coaching" }, { value: "600+", label: "clients" }, { value: "212kg", label: "deadlift PR" }],
  testimonials: [{ quote: "First year since 2015 without a running injury. And I deadlift my bodyweight.", name: "Ana P.", role: "Client" }],
  highlights: [{ title: "CSCS, NSCA", year: "2014" }, { title: "Coach, Brazilian national rowing squad", year: "2019–2021" }],
  experience: [{ job_title: "Head Coach", company: "Costa Strength", start_date: "2018", end_date: "Present" }, { job_title: "S&C Coach", company: "Confederação Brasileira de Remo", start_date: "2019", end_date: "2021" }],
};

export function personaFor(id: string | undefined): StandardContent {
  return structuredClone(PERSONAS[id ?? "developer"] ?? PERSONAS.developer);
}
