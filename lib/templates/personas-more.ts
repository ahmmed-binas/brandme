import type { StandardContent } from "@/lib/portfolio/schema";

/**
 * Sample people for the everyday professions: lawyers, agents, clinicians,
 * teachers, tradespeople and the rest. Like the creative personas they are
 * fictional, and specific on purpose — fees, licences, service areas and
 * outcomes are what these visitors look for first.
 */

const s = (name: string) => `/samples/${name}.webp`;

export const MORE_PERSONAS: Record<string, StandardContent> = {
  management: {
    name: "Rebecca Hale", professional_title: "Operations Manager", location: "Birmingham, UK", availability: "Open to Head of Operations roles",
    tagline: "I make busy organisations run smoothly, quietly and on budget.",
    summary: [
      "I’ve managed operations for twelve years, in logistics, healthcare and retail. I like messy processes, honest numbers and teams who know what good looks like.",
      "My work is mostly invisible when it’s done well: orders that arrive, rotas that work, costs that stay where they should.",
    ],
    email: "rebecca@example.com", phone: "+44 121 496 0281", linkedin: "https://www.linkedin.com/",
    skills: ["Operations management", "Process improvement", "Budgeting", "People leadership", "Lean", "Supplier management", "KPIs & reporting", "Change management"],
    projects: [
      { title: "New regional distribution centre", year: "2024", role: "Operations lead", client: "On time, 4% under budget", category: "Programme", description: "Opened a 120,000 sq ft site with 180 staff in nine months, without a single missed delivery to stores." },
      { title: "Same-day picking", year: "2023", role: "Project owner", client: "Pick rate +27%", category: "Process", description: "Redesigned warehouse slotting and shift patterns; same-day dispatch went from 71% to 96%." },
      { title: "Absence down by a third", year: "2022", role: "Sponsor", client: "Absence −34%", category: "People", description: "Fairer rotas, return-to-work conversations and team leads trained to have them." },
    ],
    experience: [
      { job_title: "Operations Manager", company: "Midland Fresh Foods", location: "Birmingham", start_date: "2021", end_date: "Present", description: "Run two distribution centres, 420 people and a £38m budget." },
      { job_title: "Operations Team Leader", company: "Severn Logistics", location: "Worcester", start_date: "2016", end_date: "2021" },
      { job_title: "Graduate Management Trainee", company: "Northway Retail", location: "Coventry", start_date: "2013", end_date: "2016" },
    ],
    education: [{ school: "Aston University", degree: "BSc Business & Management", start_date: "2010", end_date: "2013" }, { school: "Chartered Management Institute", degree: "Level 7 Diploma in Strategic Management", start_date: "", end_date: "2020" }],
    testimonials: [{ quote: "Rebecca made the hardest year in our history feel organised. Nobody missed a shift pay or a delivery.", name: "Managing Director", role: "Midland Fresh Foods" }, { quote: "The best manager I’ve worked for: clear, fair and always in the warehouse, not just the office.", name: "Shift Manager", role: "Her team" }],
    highlights: [{ title: "Chartered Manager (CMgr)", detail: "Chartered Management Institute", year: "2021" }, { title: "Operations Leader of the Year, Midlands", detail: "Regional business awards", year: "2024" }],
    stats: [{ value: "420", label: "people led" }, { value: "£38m", label: "budget" }, { value: "96%", label: "same-day dispatch" }],
    services: [{ title: "Operations review", description: "Two weeks on site, then a written plan with costs.", price: "£6,500" }, { title: "Interim operations manager", description: "Hands-on cover for three to nine months.", price: "From £650 / day" }],
  },

  admin: {
    name: "Sofia Marchetti", professional_title: "Executive Assistant to the CEO", location: "London", availability: "Open to EA and Chief of Staff roles",
    tagline: "I keep a busy leader’s week calm, so they can do the work only they can do.",
    summary: [
      "I’ve supported chief executives for nine years, in a fintech, a charity and a design studio. Diaries, travel, board papers, events and the hundred small things that keep an office running.",
      "I’m discreet, very organised and the person people come to when they don’t know who else to ask.",
    ],
    email: "sofia@example.com", phone: "+44 20 7946 0647", linkedin: "https://www.linkedin.com/",
    skills: ["Diary management", "Travel planning", "Board papers", "Event planning", "Office management", "Google Workspace", "Microsoft 365", "Discretion"],
    projects: [
      { title: "Board meetings, rebuilt", year: "2024", role: "Owner", client: "Papers out 5 days earlier", category: "Governance", description: "A shared calendar and template for board papers. Directors now get packs a full week ahead." },
      { title: "Company retreat for 140", year: "2023", role: "Organiser", client: "Under budget", category: "Event", description: "Three days in Lisbon: flights, hotel, venues and a programme everyone actually enjoyed." },
      { title: "New office move", year: "2022", role: "Project lead", client: "Zero downtime", category: "Office", description: "Moved 90 people over one weekend, from furniture to Wi-Fi." },
    ],
    experience: [
      { job_title: "Executive Assistant to the CEO", company: "Northwind Pay", location: "London", start_date: "2021", end_date: "Present" },
      { job_title: "Executive Assistant", company: "City Harvest (charity)", location: "London", start_date: "2018", end_date: "2021" },
      { job_title: "Office Manager", company: "Atelier Nove", location: "London", start_date: "2016", end_date: "2018" },
    ],
    education: [{ school: "University of Sussex", degree: "BA Italian & History", start_date: "2012", end_date: "2016" }],
    testimonials: [{ quote: "Sofia runs my week better than I could. I’d follow her to any company.", name: "Chief Executive", role: "Northwind Pay" }, { quote: "Calm in every crisis, and somehow always two steps ahead.", name: "Chair of the Board", role: "City Harvest" }],
    highlights: [{ title: "PA of the Year, finalist", detail: "Office industry awards", year: "2024" }],
    stats: [{ value: "9", label: "years supporting CEOs" }, { value: "140", label: "person retreat organised" }, { value: "3", label: "languages" }],
    services: [{ title: "Virtual assistance", description: "Diary, inbox and travel, ten hours a week.", price: "From £450 / month" }, { title: "Event organising", description: "Offsites, dinners and conferences.", price: "Quote" }],
  },

  legal: {
    name: "Priya Raman", professional_title: "Employment Solicitor & Partner", location: "Manchester, UK", availability: "Taking new instructions for employers and senior employees",
    tagline: "Clear employment advice for people who would rather not need it.",
    summary: [
      "I advise employers and senior employees on the moments that go wrong at work: dismissals, discrimination claims, restructures, restrictive covenants and the settlement that ends them.",
      "I’ve run tribunal claims for seventeen years and prefer to settle the ones that should settle. My clients get a straight answer on the first call, a written fee estimate, and no surprises on the bill.",
    ],
    email: "priya@example.com", phone: "+44 161 496 0732", linkedin: "https://www.linkedin.com/", website: "https://ramanemployment.co.uk",
    skills: ["Unfair dismissal", "Discrimination", "Settlement agreements", "Restrictive covenants", "TUPE", "Redundancy", "Whistleblowing", "Senior exits"],
    projects: [
      { title: "Unfair dismissal, regional logistics manager", year: "2025", role: "Lead solicitor for the claimant", category: "Employment Tribunal", client: "Settled", description: "Dismissed after raising safety concerns. Settled for a six-figure sum two weeks before the final hearing, with an agreed reference." },
      { title: "Restructure of 140 roles", year: "2024", role: "Adviser to the employer", category: "Collective consultation", client: "No claims", description: "Ran the consultation for a manufacturing group closing a site. Every affected employee was offered a role or an enhanced package; no tribunal claims followed." },
      { title: "Enforcing a non-compete", year: "2024", role: "Lead solicitor", category: "High Court injunction", client: "Injunction granted", description: "Stopped a departing sales director taking a client book to a competitor. Interim injunction granted within nine days." },
      { title: "Maternity discrimination appeal", year: "2023", role: "Instructing solicitor", category: "Employment Appeal Tribunal", client: "Appeal allowed", description: "Overturned a first-instance decision for a pharmacist; the case is now cited in the firm’s training on pregnancy-related dismissals." },
    ],
    experience: [
      { job_title: "Partner, Employment", company: "Halden Raman LLP", location: "Manchester", start_date: "2019", end_date: "Present", description: "Lead a team of five advising 60 employers across the North West, plus senior individuals on exits." },
      { job_title: "Senior Associate", company: "Broadgate Clarke", location: "Leeds", start_date: "2012", end_date: "2019", description: "Tribunal and High Court employment litigation." },
      { job_title: "Trainee → Solicitor", company: "Pennine Law", location: "Bradford", start_date: "2008", end_date: "2012" },
    ],
    education: [
      { school: "University of Manchester", degree: "LLB Law, First Class", start_date: "2003", end_date: "2006" },
      { school: "College of Law, York", degree: "Legal Practice Course, Distinction", start_date: "2006", end_date: "2007" },
      { school: "Solicitors Regulation Authority", degree: "Admitted as a solicitor · SRA no. 4XXXXX", start_date: "", end_date: "2010" },
    ],
    services: [
      { title: "Settlement agreement review", description: "Independent advice for employees, paid by your employer in most cases.", price: "Fixed £450 + VAT" },
      { title: "Tribunal claim", description: "From early conciliation to final hearing, with a written budget at each stage.", price: "From £4,500 + VAT" },
      { title: "Employer retainer", description: "Unlimited phone advice, contract and handbook reviews, one training session a year.", price: "From £650 / month" },
    ],
    testimonials: [
      { quote: "Priya told us in ten minutes what three other firms had taken three weeks not to say. The claim settled for a quarter of what we had feared.", name: "Operations Director", role: "Manufacturing client" },
      { quote: "Calm, exact and on my side. I left with a fair settlement and my reference intact.", name: "Former Head of Sales", role: "Individual client" },
    ],
    highlights: [
      { title: "Leading individual, Employment (North West)", detail: "Independent legal directory", year: "2025" },
      { title: "Restrictive covenants after the 2024 reforms", detail: "Talk, Manchester Law Society", year: "2024" },
      { title: "Fellow, Chartered Institute of Personnel and Development", year: "2021" },
    ],
    stats: [{ value: "17", label: "years in practice" }, { value: "600+", label: "claims handled" }, { value: "92%", label: "settled before hearing" }],
  },

  realestate: {
    name: "Hannah Brooks", professional_title: "Realtor®, Brooks & Field", location: "Portland, Oregon", availability: "Taking listings for spring",
    tagline: "Southeast Portland homes, sold with honest pricing and very good photographs.",
    summary: [
      "I’ve lived in Southeast Portland for twenty years and sold homes here for twelve. I price carefully, prepare houses properly, and tell sellers the truth about what buyers will notice.",
      "For buyers, I know which streets flood, which schools have waitlists and which sellers will take a quick close over a higher offer.",
    ],
    email: "hannah@example.com", phone: "+1 503 555 0148", instagram: "https://www.instagram.com/", website: "https://brooksandfield.com", linkedin: "https://www.linkedin.com/",
    skills: ["Richmond", "Sellwood", "Hawthorne", "Mt. Tabor", "Woodstock", "Ladd’s Addition", "Brooklyn", "Eastmoreland"],
    projects: [
      { title: "4012 SE Lincoln St", year: "2025", category: "Sold", client: "$865,000", role: "3 bd · 2 ba · 1,920 sq ft", description: "1912 Craftsman, restored porch and original built-ins. Eleven offers; sold 7% over list in five days.", image: s("home-craftsman") },
      { title: "1735 SE Clatsop St", year: "2025", category: "For sale", client: "$1,140,000", role: "4 bd · 3 ba · 2,610 sq ft", description: "Architect-built 2016 modern on a corner lot in Sellwood. South-facing glazing, ADU over the garage.", image: s("home-modern") },
      { title: "6221 SE 18th Ave", year: "2024", category: "Sold", client: "$598,000", role: "2 bd · 1 ba · 1,140 sq ft", description: "A first home for two nurses after nine lost offers elsewhere. Won with a clean offer and a flexible rent-back.", image: s("home-cottage") },
      { title: "The Alder Street Lofts, #4", year: "2024", category: "Sold", client: "$489,000", role: "1 bd · 1 ba · 880 sq ft", description: "Top-floor loft with 14ft ceilings and a shared roof deck.", image: s("interior-oak") },
    ],
    experience: [
      { job_title: "Principal Broker & Co-founder", company: "Brooks & Field Real Estate", location: "Portland", start_date: "2019", end_date: "Present" },
      { job_title: "Broker", company: "Eastside Realty Group", location: "Portland", start_date: "2013", end_date: "2019" },
    ],
    education: [{ school: "Oregon Real Estate Agency", degree: "Licensed Principal Broker · #2XXXXXXX", start_date: "", end_date: "2013" }],
    services: [
      { title: "Selling your home", description: "Pricing study, staging plan, professional photography and a weekly written update.", price: "Fee agreed upfront" },
      { title: "Buying a home", description: "Neighbourhood tours, inspection referrals and negotiation.", price: "Paid at closing" },
      { title: "Free market report", description: "What your home would sell for this month, with the comparables.", price: "Free" },
    ],
    testimonials: [
      { quote: "Hannah was right about the price to the dollar and right about the paint colour. We closed in nineteen days.", name: "Dana & Lee M.", role: "Sold in Richmond, 2025" },
      { quote: "We’d given up after nine losing offers. Hannah got us the house on the tenth.", name: "Maria K.", role: "Bought in Woodstock, 2024" },
    ],
    highlights: [{ title: "Top 1% of Portland agents by volume", detail: "Regional MLS data", year: "2024" }, { title: "Five Star Professional award", year: "2023, 2024" }],
    stats: [{ value: "64", label: "homes sold in 2024" }, { value: "9", label: "median days on market" }, { value: "101.8%", label: "of list price" }],
    gallery: [{ image: s("home-craftsman"), caption: "Lincoln St, sold" }, { image: s("home-modern"), caption: "Clatsop St, for sale" }, { image: s("home-cottage"), caption: "18th Ave, sold" }],
  },

  healthcare: {
    name: "Dr. Lucía Ferrer", professional_title: "Family Physician & Sports Medicine", location: "Barcelona, Spain", availability: "Accepting new patients · English, Spanish, Catalan",
    tagline: "Unhurried appointments, plain explanations and a plan you can follow.",
    summary: [
      "I’m a family physician with a special interest in sports and exercise medicine. I look after adults and teenagers for everything from blood pressure to a knee that won’t settle after a marathon.",
      "Appointments are thirty minutes, because most problems need more than ten. I explain what I think is going on, what the options are, and what I would do in your place.",
    ],
    email: "consulta@example.com", phone: "+34 932 00 41 18", website: "https://draferrer.es", linkedin: "https://www.linkedin.com/",
    skills: ["Family medicine", "Sports injuries", "Running medicine", "Hypertension", "Diabetes care", "Health checks", "Ultrasound-guided injections", "Travel medicine"],
    services: [
      { title: "Consultation", description: "Thirty minutes, in person in Eixample or by video.", price: "€70" },
      { title: "Sports medicine assessment", description: "History, examination, ultrasound if needed and a return-to-sport plan.", price: "€110" },
      { title: "Annual health check", description: "Bloods, ECG, blood pressure and a written summary.", price: "€160" },
      { title: "Follow-up", description: "Within six weeks of a consultation.", price: "€45" },
    ],
    experience: [
      { job_title: "Family Physician, private practice", company: "Consulta Ferrer, Eixample", location: "Barcelona", start_date: "2020", end_date: "Present" },
      { job_title: "Sports Medicine Physician", company: "Club Natació Barcelona", location: "Barcelona", start_date: "2018", end_date: "Present", description: "Medical cover for the masters swimming and triathlon squads." },
      { job_title: "Specialist Registrar, Family Medicine", company: "Hospital del Mar", location: "Barcelona", start_date: "2014", end_date: "2018" },
    ],
    education: [
      { school: "Universitat de Barcelona", degree: "Doctor of Medicine (MD)", start_date: "2006", end_date: "2012" },
      { school: "Hospital del Mar", degree: "Specialist training, Family & Community Medicine", start_date: "2014", end_date: "2018" },
      { school: "Universidad de Zaragoza", degree: "Master’s in Sports Medicine", start_date: "2018", end_date: "2019" },
    ],
    highlights: [
      { title: "Return to running after Achilles tendinopathy: a 12-week protocol", detail: "Apunts Sports Medicine", year: "2024", url: "https://example.com" },
      { title: "Medical team, Barcelona Marathon", year: "2019–2025" },
      { title: "Collegiate member, COMB no. 08XXXXX", year: "2012" },
    ],
    testimonials: [
      { quote: "The first doctor who explained my blood pressure readings instead of just handing me a prescription.", name: "Jordi P.", role: "Patient" },
      { quote: "Back running pain-free after a year of physio that wasn’t working.", name: "Sarah L.", role: "Patient" },
    ],
    stats: [{ value: "30", label: "minute appointments" }, { value: "11", label: "years practising" }, { value: "3", label: "languages" }],
  },

  education: {
    name: "Grace Mensah", professional_title: "Secondary Science Teacher & Head of Year 9", location: "Leeds, UK", availability: "GCSE Chemistry tutoring: two evening slots free",
    tagline: "I teach teenagers that they are better at science than they think.",
    summary: [
      "I’ve taught science in a Leeds comprehensive for nine years. I like practical lessons, low-stakes quizzing and the moment a quiet student explains something to the rest of the class.",
      "I also tutor GCSE and A-level Chemistry online, and write free revision resources used by teachers around the country.",
    ],
    email: "grace@example.com", website: "https://msmensah.science", linkedin: "https://www.linkedin.com/",
    skills: ["GCSE Chemistry", "A-level Chemistry", "KS3 Science", "Practical work", "Retrieval practice", "SEND support", "Pastoral leadership", "Curriculum design"],
    projects: [
      { title: "Kitchen Chemistry", year: "2024", category: "Curriculum", role: "Designer", description: "A Year 8 unit taught with things from a supermarket. Practical skills scores up 18% on the year before; now used across the trust.", image: s("lesson-board") },
      { title: "Rocket Club", year: "2023", category: "Enrichment", role: "Founder", description: "Thursday after-school club; 34 regulars, two girls’ teams at the national schools’ rocketry final." },
      { title: "Ten-minute retrieval quizzes", year: "2022", category: "Free resource", role: "Author", description: "180 printable GCSE quizzes with answers. Downloaded 41,000 times by teachers.", live_url: "https://example.com" },
    ],
    experience: [
      { job_title: "Teacher of Science & Head of Year 9", company: "Roundhay Park Academy", location: "Leeds", start_date: "2019", end_date: "Present", description: "Teach KS3–KS5 chemistry; pastoral lead for 240 students." },
      { job_title: "Teacher of Science", company: "Hunslet Moor High School", location: "Leeds", start_date: "2016", end_date: "2019" },
    ],
    education: [
      { school: "University of Leeds", degree: "BSc Chemistry", start_date: "2011", end_date: "2014" },
      { school: "Leeds Beckett University", degree: "PGCE Secondary Science · QTS", start_date: "2015", end_date: "2016" },
    ],
    services: [
      { title: "GCSE Chemistry tutoring", description: "One hour online, with a written note for parents after each session.", price: "£45 / hour" },
      { title: "A-level Chemistry tutoring", description: "Exam technique, required practicals and past papers.", price: "£55 / hour" },
      { title: "Teacher training", description: "Half-day INSET on retrieval practice and practical lessons.", price: "£450" },
    ],
    testimonials: [
      { quote: "Our son went from a 4 to a 7 in Chemistry and actually talks about it at dinner now.", name: "Parent of a Year 11 student", role: "Tutoring, 2024" },
      { quote: "Miss Mensah never makes you feel stupid for asking.", name: "Year 10 student", role: "Roundhay Park Academy" },
    ],
    highlights: [{ title: "Pearson Teaching Award, Silver", detail: "Secondary teacher of the year", year: "2024" }, { title: "Chartered Science Teacher (CSciTeach)", year: "2022" }, { title: "Retrieval practice that sticks", detail: "Talk, ASE Annual Conference", year: "2023" }],
    stats: [{ value: "94%", label: "grade 4+ in GCSE Chemistry" }, { value: "9", label: "years teaching" }, { value: "41k", label: "resource downloads" }],
  },

  finance: {
    name: "Henrik Larsen", professional_title: "Chartered Accountant · Fractional CFO", location: "Copenhagen · London", availability: "One fractional CFO seat free from March",
    tagline: "Finance that founders understand and investors trust.",
    summary: [
      "I’m a chartered accountant who spent eight years in audit and six as a finance director in venture-backed companies. Now I work two days a week as CFO for three or four growth companies at a time.",
      "I build the model, the board pack and the month-end close, then hire and train the team that will run them after me.",
    ],
    email: "henrik@example.com", phone: "+45 31 22 04 87", linkedin: "https://www.linkedin.com/", website: "https://larsen.finance",
    skills: ["Fundraising", "Financial modelling", "Board reporting", "Month-end close", "Cash forecasting", "Due diligence", "IFRS", "Xero & NetSuite"],
    projects: [
      { title: "Series B readiness, Nordlys Energy", year: "2025", role: "Fractional CFO", client: "€38m raised", category: "Fundraising", description: "Rebuilt the three-statement model, cleaned up two years of revenue recognition and ran the data room. Closed in eleven weeks.", image: s("chart-lines") },
      { title: "Month-end in five days, Fable Foods", year: "2024", role: "Interim Finance Director", client: "Close: 18 → 5 days", category: "Operations", description: "Moved a 120-person company from spreadsheets to NetSuite and trained a team of three." },
      { title: "Sale to a strategic buyer, Kontor", year: "2023", role: "CFO", client: "Exit", category: "M&A", description: "Led financial due diligence for a software company’s sale; no price chip after diligence." },
    ],
    experience: [
      { job_title: "Fractional CFO", company: "Larsen Finance ApS", location: "Copenhagen", start_date: "2021", end_date: "Present", description: "CFO for seven venture-backed companies so far; £140m raised across clients." },
      { job_title: "Finance Director", company: "Kontor Software", location: "London", start_date: "2017", end_date: "2021" },
      { job_title: "Audit Manager", company: "Deloitte", location: "Copenhagen", start_date: "2009", end_date: "2017" },
    ],
    education: [
      { school: "Copenhagen Business School", degree: "MSc Accounting, Strategy & Control", start_date: "2004", end_date: "2009" },
      { school: "ICAEW", degree: "Chartered Accountant (ACA)", start_date: "", end_date: "2012" },
    ],
    services: [
      { title: "Fractional CFO", description: "Two days a week: model, board pack, investor relations and the finance team.", price: "From £5,500 / month" },
      { title: "Fundraising sprint", description: "Twelve weeks: model, data room and diligence support for one round.", price: "£18,000 fixed" },
      { title: "Finance health check", description: "A written review of your numbers, systems and risks.", price: "£2,400" },
    ],
    testimonials: [{ quote: "Henrik made our board meetings shorter and our investors calmer. Both are worth the fee.", name: "CEO", role: "Nordlys Energy" }, { quote: "The first finance person who answered my questions in sentences.", name: "Founder", role: "Fable Foods" }],
    highlights: [{ title: "The founder’s guide to the 13-week cash forecast", detail: "Essay, 22k readers", year: "2024" }, { title: "Mentor, Copenhagen Fintech Lab", year: "2022–2025" }],
    stats: [{ value: "£140m", label: "raised by clients" }, { value: "7", label: "companies as CFO" }, { value: "5 days", label: "typical month-end" }],
  },

  trades: {
    name: "Sean Gallagher", professional_title: "Electrician · Gallagher Electrical", location: "Bristol & North Somerset", availability: "Booking rewires from April · EICRs this week",
    tagline: "Safe, tidy electrical work, done when we said it would be.",
    summary: [
      "I’m a fully qualified electrician with twenty years on the tools. We’re a small firm of three, and I still see every job myself from quote to certificate.",
      "We do rewires, consumer units, EV chargers, solar and batteries, and a lot of fault-finding other firms gave up on. Dust sheets down, floors back, and a clear written quote before we start.",
    ],
    email: "sean@example.com", phone: "0117 496 0518", website: "https://gallagherelectrical.co.uk", instagram: "https://www.instagram.com/",
    skills: ["Full rewires", "Consumer units", "EV chargers", "Solar PV & batteries", "Fault finding", "EICRs", "Lighting design", "Landlord certificates"],
    projects: [
      { title: "Full rewire, Victorian terrace", year: "2025", category: "Rewire", client: "Bishopston", role: "8 days · lifting floors, chasing walls, making good", description: "Original 1960s wiring replaced, new 18-way consumer unit, kitchen lighting design. Floors and plaster made good before the decorators arrived.", image: s("job-rewire") },
      { title: "7kW EV charger + battery", year: "2025", category: "EV & solar", client: "Portishead", role: "1 day", description: "Charger, 10kWh battery and an export-limited solar array, with the DNO notification done for the customer.", image: s("job-panel") },
      { title: "Kitchen fit-out lighting", year: "2024", category: "Lighting", client: "Clifton", role: "3 days", description: "Dimmable LED channels under cabinets and in the ceiling, set into scenes with a single wall switch.", image: s("interior-stone") },
    ],
    services: [
      { title: "Electrical safety check (EICR)", description: "Full test of your installation with a written report. Landlord certificates the same week.", price: "From £180" },
      { title: "Consumer unit upgrade", description: "New fuse board with RCBO protection, tested and certified.", price: "From £650" },
      { title: "EV charger installed", description: "7kW smart charger, cable up to 10m, certification and DNO notification.", price: "From £899" },
      { title: "Full rewire", description: "Three-bed house typically 6–8 days. Fixed written quote after a free survey.", price: "Free survey" },
    ],
    experience: [{ job_title: "Owner & Lead Electrician", company: "Gallagher Electrical", location: "Bristol", start_date: "2012", end_date: "Present" }, { job_title: "Approved Electrician", company: "SW Electrical Services", start_date: "2005", end_date: "2012" }],
    education: [
      { school: "City of Bristol College", degree: "City & Guilds 2365 Level 3", start_date: "2003", end_date: "2005" },
      { school: "City & Guilds", degree: "18th Edition (BS 7671:2018) · 2391 Inspection & Testing", start_date: "", end_date: "2019" },
      { school: "NICEIC", degree: "Approved Contractor · Part P registered", start_date: "", end_date: "2012" },
    ],
    testimonials: [
      { quote: "Rewired our whole house and you’d never know they’d been. Turned up at 8 every day, left it cleaner than they found it.", name: "Kate H.", role: "Rewire, Bishopston" },
      { quote: "Two other electricians couldn’t find the fault tripping our kitchen. Sean found it in forty minutes.", name: "Mo A.", role: "Fault finding, Redland" },
    ],
    highlights: [{ title: "NICEIC Approved Contractor", year: "Since 2012" }, { title: "£5m public liability insurance", year: "2025" }, { title: "Fully guaranteed work, 6 years", year: "" }],
    stats: [{ value: "20", label: "years on the tools" }, { value: "1,400+", label: "jobs done" }, { value: "4.9★", label: "from 312 reviews" }],
    gallery: [{ image: s("job-rewire"), caption: "Second fix, Bishopston" }, { image: s("job-panel"), caption: "18-way RCBO board" }],
  },

  food: {
    name: "Tomás Ibarra", professional_title: "Chef · Private Dining & Pop-ups", location: "London", availability: "Private dinners booking from May",
    tagline: "Mexican cooking from my grandmother’s comal, at your table.",
    summary: [
      "I grew up cooking in my grandmother’s kitchen in Oaxaca and trained in London, where I spent eleven years in restaurant kitchens, the last four as head chef.",
      "Now I cook private dinners for eight to forty people, run a monthly supper club, and consult on menus for restaurants opening their first Mexican dishes.",
    ],
    email: "tomas@example.com", phone: "+44 7700 900417", instagram: "https://www.instagram.com/", website: "https://comal.london",
    skills: ["Oaxacan cooking", "Nixtamal & masa", "Moles", "Live-fire cooking", "Menu development", "Private dining", "Kitchen management", "Allergen planning"],
    projects: [
      { title: "Mole negro", year: "Signature", category: "Dish", role: "31 ingredients · two days", description: "My grandmother’s recipe, with chilhuacle negro chillies brought back each winter. Served with confit duck leg and blue-corn tortillas.", image: s("dish-mole") },
      { title: "Tetela de frijol", year: "Signature", category: "Dish", role: "Masa made in-house", description: "Triangular stuffed masa, black beans, hoja santa, salsa macha and a little queso fresco.", image: s("dish-tetela") },
      { title: "Aguachile verde", year: "Summer", category: "Dish", role: "Raw · served cold", description: "Cornish scallops cured in lime and serrano, cucumber, red onion and toasted pumpkin seeds.", image: s("dish-aguachile") },
      { title: "Comal supper club", year: "2023–", category: "Pop-up", role: "Founder", description: "A ten-course dinner on the first Friday of each month in a Hackney bakery. Sold out 26 months running." },
    ],
    experience: [
      { job_title: "Chef & founder", company: "Comal Private Dining", location: "London", start_date: "2023", end_date: "Present" },
      { job_title: "Head Chef", company: "Maíz, Soho", location: "London", start_date: "2019", end_date: "2023", description: "Ran a 70-cover kitchen and a team of twelve. Bib Gourmand three years running." },
      { job_title: "Sous Chef", company: "Brindisa Kitchen", location: "London", start_date: "2015", end_date: "2019" },
    ],
    services: [
      { title: "Private dinner", description: "Seven courses cooked in your kitchen, served and cleared. Wine pairing on request.", price: "From £95 per guest" },
      { title: "Event catering", description: "Taco bars, live fire and canapés for 40–150 guests.", price: "From £48 per guest" },
      { title: "Menu consultancy", description: "Recipes, costing and two days training your kitchen.", price: "From £2,200" },
    ],
    testimonials: [{ quote: "Our guests are still talking about the mole. Tomás cooked, served, explained every dish and left the kitchen spotless.", name: "Lauren T.", role: "40th birthday, 16 guests" }, { quote: "The best Mexican food in London, and it arrived at my dining table.", name: "Food writer", role: "Weekend magazine" }],
    highlights: [{ title: "Bib Gourmand, Maíz", detail: "Michelin Guide", year: "2021–2023" }, { title: "Best Supper Club, London Food Awards", year: "2024" }],
    education: [{ school: "Westminster Kingsway College", degree: "Professional Chef Diploma", start_date: "2010", end_date: "2012" }],
    stats: [{ value: "26", label: "sold-out supper clubs" }, { value: "14", label: "years cooking" }, { value: "31", label: "ingredients in the mole" }],
    gallery: [{ image: s("dish-mole"), caption: "Mole negro" }, { image: s("dish-tetela"), caption: "Tetela de frijol" }, { image: s("dish-aguachile"), caption: "Aguachile verde" }],
  },

  beauty: {
    name: "Chloé Martin", professional_title: "Hair Colourist & Stylist", location: "Studio 4, Shoreditch, London", availability: "New clients: consultations on Tuesdays",
    tagline: "Colour that grows out beautifully.",
    summary: [
      "I’m a colourist with fourteen years behind the chair, from a Paris salon to London Fashion Week backstage. I specialise in lived-in blondes, copper and corrective colour.",
      "Every new client starts with a consultation and strand test. I’ll tell you honestly what your hair can do and how long it will take to get there.",
    ],
    email: "bookings@example.com", phone: "+44 20 7946 0193", instagram: "https://www.instagram.com/", website: "https://chloemartin.studio",
    skills: ["Balayage", "Lived-in blonde", "Copper & red", "Colour correction", "Grey blending", "Precision cuts", "Curly hair", "Bridal hair"],
    services: [
      { title: "Consultation & strand test", description: "Twenty minutes, redeemable against your first colour.", price: "£25" },
      { title: "Balayage", description: "Hand-painted lightening, toner and a blow-dry. Allow three hours.", price: "From £195" },
      { title: "Root colour & gloss", description: "Every 6–8 weeks to keep it fresh.", price: "From £95" },
      { title: "Cut & finish", description: "Wash, precision cut and style.", price: "£75" },
      { title: "Bridal trial & wedding day", description: "Trial in the studio, styling on location.", price: "From £340" },
    ],
    projects: [
      { title: "Copper melt", year: "2025", category: "Colour", description: "Natural level 6 to a warm copper, glossed to keep it bright between visits.", image: s("hair-copper") },
      { title: "Lived-in blonde", year: "2025", category: "Balayage", description: "Soft root, bright ends, grows out without a line for four months.", image: s("hair-blonde") },
      { title: "Brunette dimension", year: "2024", category: "Colour", description: "Chocolate base with caramel ribbons, for a client returning from box dye.", image: s("hair-brunette") },
    ],
    experience: [{ job_title: "Owner & Senior Colourist", company: "Chloé Martin Studio", location: "London", start_date: "2020", end_date: "Present" }, { job_title: "Senior Colourist", company: "Salon Rive Gauche", location: "Paris", start_date: "2012", end_date: "2020" }],
    education: [{ school: "L’Oréal Professionnel Academy", degree: "Master Colourist", start_date: "", end_date: "2015" }, { school: "CAP Coiffure, Paris", degree: "Hairdressing qualification", start_date: "2009", end_date: "2011" }],
    testimonials: [{ quote: "Three salons said my hair couldn’t go copper without breaking. Chloé did it in two sessions and it’s healthier than before.", name: "Jess R.", role: "Client since 2023" }, { quote: "I get stopped in the street about my colour. Every time.", name: "Amira S.", role: "Client" }],
    highlights: [{ title: "Backstage colour team, London Fashion Week", year: "2023, 2024" }, { title: "British Hairdressing Awards, Colour Technician finalist", year: "2024" }],
    stats: [{ value: "14", label: "years colouring" }, { value: "90%", label: "of clients rebook" }],
    gallery: [{ image: s("hair-copper"), caption: "Copper melt" }, { image: s("hair-blonde"), caption: "Lived-in blonde" }, { image: s("hair-brunette"), caption: "Brunette dimension" }],
  },

  events: {
    name: "Olivia Bennett", professional_title: "Wedding & Event Planner", location: "The Cotswolds & destination", availability: "Now booking 2027 weddings · two 2026 dates left",
    tagline: "Calm, beautiful days, planned down to the last place card.",
    summary: [
      "I plan weddings and private celebrations in the Cotswolds and across Europe: country houses, barns, gardens and the occasional Italian hillside.",
      "I’ve planned 160 weddings in eleven years. My couples get one planner from first coffee to last dance, a budget they can see at any time, and a timeline that keeps the day relaxed.",
    ],
    email: "olivia@example.com", phone: "+44 1451 820 744", instagram: "https://www.instagram.com/", website: "https://oliviabennettevents.com",
    skills: ["Full wedding planning", "Destination weddings", "Venue sourcing", "Design & styling", "Supplier management", "Budgeting", "On-the-day coordination", "Private parties"],
    projects: [
      { title: "Ana & Kofi", year: "June 2025", category: "Wedding", client: "140 guests", role: "Country house, Gloucestershire", description: "A garden ceremony, a long-table dinner under the cedar and a Ghanaian highlife band until midnight.", image: s("event-table") },
      { title: "Sophie & Marc", year: "September 2024", category: "Destination", client: "60 guests", role: "Masseria, Puglia", description: "Three days: welcome aperitivo, a ceremony in the olive grove and Sunday lunch by the pool.", image: s("event-lights") },
      { title: "The Harrow 50th", year: "2024", category: "Private party", client: "220 guests", role: "Marquee, Oxfordshire", description: "A golden anniversary with a dance floor built over the tennis court." },
    ],
    services: [
      { title: "Full planning", description: "From the venue search to the last dance, with monthly meetings and a shared budget.", price: "From £6,500" },
      { title: "Partial planning", description: "For couples with a venue booked: suppliers, design and timeline.", price: "From £3,800" },
      { title: "On-the-day coordination", description: "We take over eight weeks before and run the day.", price: "£1,450" },
    ],
    testimonials: [{ quote: "We didn’t make a single decision on the day. Olivia had thought of everything, including the rain plan we needed at 4pm.", name: "Ana & Kofi", role: "Married June 2025" }, { quote: "Organised, kind and very funny. Our families still ask after her.", name: "Sophie & Marc", role: "Married in Puglia" }],
    highlights: [{ title: "Wedding Planner of the Year, South West", detail: "Regional wedding awards", year: "2024" }, { title: "Featured in Rock My Wedding", year: "2023" }, { title: "UK Alliance of Wedding Planners, member", year: "Since 2016" }],
    experience: [{ job_title: "Founder & Lead Planner", company: "Olivia Bennett Events", location: "Cotswolds", start_date: "2014", end_date: "Present" }, { job_title: "Events Manager", company: "Barnsley House Hotel", start_date: "2010", end_date: "2014" }],
    stats: [{ value: "160", label: "weddings planned" }, { value: "11", label: "years" }, { value: "6", label: "countries" }],
    gallery: [{ image: s("event-table"), caption: "Long-table dinner, Gloucestershire" }, { image: s("event-lights"), caption: "Evening in Puglia" }],
  },

  product: {
    name: "Samira Qureshi", professional_title: "Senior Product Manager", location: "Toronto, Canada", availability: "Open to Group PM roles in fintech and health",
    tagline: "I find the problem worth solving, then ship the smallest thing that solves it.",
    summary: [
      "I’ve been a product manager for eight years, mostly in payments and digital health. I’m strongest at the start of a problem — research, sizing, saying no — and at getting a team to ship on a steady rhythm.",
      "I write a lot, measure honestly and like engineers who argue with me.",
    ],
    email: "samira@example.com", linkedin: "https://www.linkedin.com/", website: "https://samiraq.ca",
    skills: ["Product discovery", "User research", "Experimentation", "Roadmapping", "SQL", "Pricing", "Payments", "Healthcare compliance"],
    projects: [
      { title: "Instant payouts", year: "2025", role: "Lead PM", client: "Northwind Pay", category: "Payments", description: "Problem: small merchants waited three days for their money and churned. Bet: same-day payouts for a 1% fee. Outcome: 31% of merchants opted in; churn in that cohort fell by 22%.", image: s("ui-ledger") },
      { title: "Prescription refills", year: "2023", role: "PM", client: "Stillwater Health", category: "Health", description: "Problem: 40% of refill requests needed a phone call. Bet: a three-question refill flow with pharmacist review. Outcome: calls down 63%, refills done in a median of 4 hours.", image: s("ui-health") },
      { title: "Accessible trip planner", year: "2021", role: "Associate PM", client: "City of Porto", category: "Civic", description: "Problem: the transit app failed screen-reader users. Bet: rebuild the planner with blind riders as co-designers. Outcome: WCAG AA, and 4.7★ from accessibility reviewers.", image: s("ui-transit") },
    ],
    experience: [
      { job_title: "Senior Product Manager", company: "Northwind Pay", location: "Toronto", start_date: "2023", end_date: "Present", description: "Merchant payouts and risk; a team of eleven engineers and two designers." },
      { job_title: "Product Manager", company: "Stillwater Health", location: "Toronto", start_date: "2020", end_date: "2023" },
      { job_title: "Associate Product Manager", company: "Porto Digital", location: "Porto", start_date: "2017", end_date: "2020" },
    ],
    education: [{ school: "University of Toronto", degree: "BASc Industrial Engineering", start_date: "2012", end_date: "2016" }],
    testimonials: [{ quote: "Samira’s one-page briefs are the reason my team ships. Nobody wonders why we’re building something.", name: "Engineering Manager", role: "Northwind Pay" }, { quote: "She brought patients into the room and kept them there.", name: "Head of Design", role: "Stillwater Health" }],
    highlights: [{ title: "Writing the one-page brief", detail: "Talk, Mind the Product Toronto", year: "2024" }, { title: "Pricing a fee nobody resents", detail: "Essay", year: "2025" }],
    stats: [{ value: "8", label: "years in product" }, { value: "−22%", label: "merchant churn" }, { value: "−63%", label: "refill calls" }],
  },

  sales: {
    name: "Jordan Reyes", professional_title: "Enterprise Account Executive", location: "Chicago, Illinois", availability: "Open to Strategic AE and first-line sales leadership roles",
    tagline: "I sell complex software to careful buyers, and they renew.",
    summary: [
      "I’ve sold enterprise software for nine years, most recently clinical-workflow software to hospital networks. Long cycles, many stakeholders, procurement teams who read every clause.",
      "I win by understanding the buyer’s problem better than they expect and by being straight about what our product won’t do.",
    ],
    email: "jordan@example.com", phone: "+1 312 555 0179", linkedin: "https://www.linkedin.com/",
    skills: ["Enterprise sales", "MEDDICC", "Healthcare buyers", "Procurement", "Negotiation", "Forecasting", "Salesforce", "Partner selling"],
    projects: [
      { title: "Top-10 US hospital network", year: "FY25", category: "New logo", client: "$2.4M ACV", role: "14-month cycle · 23 stakeholders", description: "Replaced a homegrown scheduling system across 31 hospitals. Largest new-logo deal in company history." },
      { title: "Regional health system expansion", year: "FY24", category: "Expansion", client: "$860k ACV", role: "From one department to system-wide", description: "Grew a pilot in radiology into every outpatient department after a measured ROI study with their finance team." },
      { title: "Competitive displacement", year: "FY23", category: "New logo", client: "$1.1M ACV", role: "Won against the incumbent", description: "Rebuilt the business case around nurse overtime, which the incumbent had never measured." },
    ],
    experience: [
      { job_title: "Enterprise Account Executive", company: "Clarity Health Systems", location: "Chicago", start_date: "2021", end_date: "Present", description: "Strategic accounts in the Midwest; $4M annual quota." },
      { job_title: "Account Executive", company: "Brightline Software", location: "Chicago", start_date: "2018", end_date: "2021" },
      { job_title: "Sales Development Representative", company: "Brightline Software", location: "Chicago", start_date: "2016", end_date: "2018" },
    ],
    education: [{ school: "University of Illinois Urbana-Champaign", degree: "BS Business Administration", start_date: "2012", end_date: "2016" }],
    testimonials: [{ quote: "Jordan was the only vendor who asked to meet our charge nurses. That’s why we signed.", name: "VP Operations", role: "Hospital network customer" }, { quote: "Forecast within 5% four quarters running. I stopped checking his numbers.", name: "Regional VP Sales", role: "Clarity Health Systems" }],
    highlights: [{ title: "President’s Club", year: "FY23, FY24, FY25" }, { title: "Largest new-logo deal in company history", year: "FY25" }, { title: "Mentor, Chicago Women in Sales (ally program)", year: "2024" }],
    stats: [{ value: "142%", label: "of quota, FY25" }, { value: "3×", label: "President’s Club" }, { value: "$9.6M", label: "closed in 3 years" }],
  },

  hr: {
    name: "Ruth Adeyemi", professional_title: "Talent Partner, Engineering & Product", location: "Berlin · Remote in Europe", availability: "Taking two fractional recruiting clients for Q2",
    tagline: "I help small companies hire the people they’ll still be glad of in five years.",
    summary: [
      "I’ve recruited engineers, designers and product people for nine years, in-house at two scale-ups and now as a fractional talent partner for seed and Series A companies.",
      "I set up hiring processes that are fair, quick and kind to candidates, and I train founders to interview well enough not to need me.",
    ],
    email: "ruth@example.com", linkedin: "https://www.linkedin.com/", website: "https://ruthadeyemi.com",
    skills: ["Technical recruiting", "Hiring process design", "Interview training", "Employer branding", "Inclusive hiring", "Compensation bands", "Greenhouse & Ashby", "Sourcing"],
    projects: [
      { title: "Zero to 40 engineers", year: "2023–2024", role: "Head of Talent", client: "Talo", category: "Scale-up", description: "Built the hiring team and process for a Series B company; 92% offer acceptance and 31-day median time to hire." },
      { title: "Founding team for a climate start-up", year: "2025", role: "Fractional talent partner", client: "Nordlys Energy", category: "Seed", description: "Hired the first eight, including a CTO, in four months." },
      { title: "Structured interviews in a week", year: "2022", role: "Workshop", category: "Training", description: "A one-week programme run with 14 companies; interviewers rated it 4.8 out of 5." },
    ],
    experience: [
      { job_title: "Fractional Talent Partner", company: "Independent", location: "Berlin", start_date: "2024", end_date: "Present" },
      { job_title: "Head of Talent", company: "Talo", location: "Berlin", start_date: "2020", end_date: "2024" },
      { job_title: "Technical Recruiter", company: "N26", location: "Berlin", start_date: "2016", end_date: "2020" },
    ],
    services: [
      { title: "Fractional talent partner", description: "Three days a week running your hiring end to end.", price: "From €6,000 / month" },
      { title: "Hiring process set-up", description: "Scorecards, interview plans, an ATS configured, and interviewer training.", price: "€7,500 fixed" },
      { title: "Single executive search", description: "CTO, VP Engineering or Head of Product.", price: "20% of base salary" },
    ],
    education: [{ school: "Freie Universität Berlin", degree: "MA Sociology", start_date: "2012", end_date: "2015" }, { school: "CIPD", degree: "Level 5 Associate Diploma in People Management", start_date: "", end_date: "2021" }],
    testimonials: [{ quote: "Every candidate who turned us down still wrote to thank Ruth for the process.", name: "Founder & CEO", role: "Nordlys Energy" }, { quote: "She made our interviews fair and fast. We hire better people now.", name: "CTO", role: "Talo" }],
    highlights: [{ title: "Rejecting candidates kindly", detail: "Talk, Hiring Summit Berlin", year: "2024" }, { title: "Open-source interview scorecards", detail: "Used by 300+ companies", year: "2023" }],
    stats: [{ value: "220", label: "hires made" }, { value: "31", label: "days median time to hire" }, { value: "92%", label: "offer acceptance" }],
  },

  engineering: {
    name: "Elena Petrova", professional_title: "Chartered Structural Engineer, CEng MIStructE", location: "Glasgow, Scotland", availability: "Associate Director roles and expert-witness work",
    tagline: "Structures that use less material and stand for longer.",
    summary: [
      "I’m a structural engineer with fourteen years on bridges, schools and low-carbon buildings. I lead design teams from concept to site and care most about the material we don’t use.",
      "My recent work is in mass timber and in reusing existing structures rather than demolishing them.",
    ],
    email: "elena@example.com", linkedin: "https://www.linkedin.com/",
    skills: ["Structural design", "Mass timber", "Steel & concrete", "Bridges", "Retrofit & reuse", "Embodied carbon", "Eurocodes", "Tekla & Robot"],
    projects: [
      { title: "Kelvin footbridge", year: "2024", role: "Lead structural engineer", client: "Glasgow City Council", category: "Bridge", description: "A 46m steel truss footbridge over the River Kelvin, lifted into place in a single night. 38% less steel than the reference design.", image: s("eng-bridge") },
      { title: "Riverside primary school retrofit", year: "2023", role: "Project engineer", client: "Renfrewshire Council", category: "Reuse", description: "Kept a 1970s concrete frame and added two storeys in CLT. Saved an estimated 1,900 tonnes of embodied carbon.", image: s("arch-section") },
      { title: "Clyde timber office", year: "2022", role: "Design team lead", client: "Private developer", category: "Mass timber", description: "Six storeys of glulam and CLT on a steel podium. Scotland’s tallest timber office when completed.", image: s("eng-detail") },
    ],
    experience: [
      { job_title: "Associate, Structures", company: "Arden Partnership", location: "Glasgow", start_date: "2019", end_date: "Present", description: "Lead a team of nine engineers on civic and education projects." },
      { job_title: "Senior Engineer", company: "Arup", location: "Edinburgh", start_date: "2014", end_date: "2019" },
      { job_title: "Graduate Engineer", company: "Atkins", location: "Glasgow", start_date: "2011", end_date: "2014" },
    ],
    education: [{ school: "University of Strathclyde", degree: "MEng Civil & Structural Engineering", start_date: "2006", end_date: "2011" }, { school: "Institution of Structural Engineers", degree: "Chartered Member (MIStructE) · CEng", start_date: "", end_date: "2015" }],
    highlights: [{ title: "Structural Awards, shortlisted (Kelvin footbridge)", year: "2025" }, { title: "Reuse before rebuild: a design guide", detail: "The Structural Engineer journal", year: "2024", url: "https://example.com" }, { title: "STEM ambassador", detail: "Glasgow secondary schools", year: "2018–" }],
    testimonials: [{ quote: "Elena found us a structure that kept the building and the budget.", name: "Head of Estates", role: "Renfrewshire Council" }],
    stats: [{ value: "14", label: "years designing" }, { value: "1,900t", label: "CO₂e saved on one school" }, { value: "46m", label: "longest span" }],
    gallery: [{ image: s("eng-bridge"), caption: "Kelvin footbridge, general arrangement" }, { image: s("eng-detail"), caption: "Glulam connection detail" }],
  },

  language: {
    name: "Ana Lucía Torres", professional_title: "Literary Translator & Conference Interpreter", location: "Madrid · remote", availability: "Accepting book translations for 2027",
    tagline: "Spanish ⇄ English, so it reads as though it was written that way.",
    summary: [
      "I translate fiction and non-fiction between Spanish and English and interpret at conferences in both directions. Twelve books published, and some 2.4 million words of commercial translation behind them.",
      "Clients come back because I ask good questions, meet deadlines and care about the rhythm of a sentence as much as its meaning.",
    ],
    email: "ana@example.com", phone: "+34 612 00 44 91", linkedin: "https://www.linkedin.com/", website: "https://analuciatorres.com",
    skills: ["Spanish → English", "English → Spanish", "Literary fiction", "Non-fiction", "Conference interpreting", "Subtitling", "Transcreation", "Legal & sworn translation"],
    projects: [
      { title: "The Salt Years / Los años de sal", year: "2024", category: "Literary", role: "Translator, EN → ES", client: "Editorial Siruela", description: "Amara Osei’s essay collection. Shortlisted for the Premio Esther Benítez.", image: s("cover-salt") },
      { title: "Night Shift / Turno de noche", year: "2023", category: "Literary", role: "Translator, EN → ES", client: "Anagrama", description: "A novel about three nurses in Lagos. Second printing within a month.", image: s("cover-night") },
      { title: "UN Habitat Assembly", year: "2025", category: "Interpreting", role: "Simultaneous interpreter, ES ⇄ EN", client: "Nairobi", description: "Five days in the booth for the plenary and two working groups." },
    ],
    services: [
      { title: "Literary translation", description: "Sample chapter free for publishers.", price: "Per 1,000 words, on request" },
      { title: "Business translation", description: "Websites, reports and marketing, with a second-pair-of-eyes review.", price: "From €0.12 / word" },
      { title: "Conference interpreting", description: "Simultaneous or consecutive, in person or remote.", price: "€680 / day" },
      { title: "Sworn translation", description: "Certificates, contracts and court documents.", price: "From €45 / page" },
    ],
    experience: [{ job_title: "Freelance translator & interpreter", company: "Torres Translation", location: "Madrid", start_date: "2013", end_date: "Present" }, { job_title: "In-house translator", company: "Instituto Cervantes", location: "London", start_date: "2010", end_date: "2013" }],
    education: [{ school: "Universidad Complutense de Madrid", degree: "BA Translation & Interpreting", start_date: "2004", end_date: "2008" }, { school: "University of Bath", degree: "MA Interpreting & Translating", start_date: "2008", end_date: "2009" }, { school: "Ministerio de Asuntos Exteriores", degree: "Sworn translator (traductora jurada), EN–ES", start_date: "", end_date: "2012" }],
    testimonials: [{ quote: "Ana’s translation has the same music as the English. Readers don’t notice her, which is the highest compliment.", name: "Editor", role: "Editorial Siruela" }, { quote: "Our delegates forgot they were listening to an interpreter.", name: "Conference organiser", role: "UN Habitat" }],
    highlights: [{ title: "Shortlist, Premio Esther Benítez", detail: "For The Salt Years", year: "2025" }, { title: "Member, ACE Traductores and AIIC", year: "" }],
    stats: [{ value: "12", label: "books translated" }, { value: "2.4m", label: "words" }, { value: "2", label: "directions" }],
  },

  nonprofit: {
    name: "Joseph Mwangi", professional_title: "Programme Director, Clean Water", location: "Nairobi, Kenya", availability: "Open to country director and board roles",
    tagline: "Water points that are still working in ten years.",
    summary: [
      "I lead clean-water programmes in rural Kenya and Uganda. For twelve years I’ve worked on the dull problem that matters most: keeping wells and pipes working long after the ribbon is cut.",
      "That means community water committees with real budgets, spare parts within a day’s travel, and data we publish even when it is unflattering.",
    ],
    email: "joseph@example.com", linkedin: "https://www.linkedin.com/", website: "https://example.org",
    skills: ["Programme management", "WASH", "Monitoring & evaluation", "Community governance", "Grant writing", "Donor reporting", "Team leadership", "Swahili & Kikuyu"],
    projects: [
      { title: "Water for Laikipia", year: "2021–2025", role: "Programme Director", client: "212,000 people served", category: "Programme", description: "Rehabilitated 380 boreholes and trained a water committee for each. Functionality after three years: 94%, against a regional average near 60%.", image: s("photo-dunes") },
      { title: "Pay-as-you-go water kiosks", year: "2023", role: "Lead", client: "41 kiosks", category: "Pilot", description: "Mobile-money water kiosks that fund their own repairs. 88% of kiosks covered maintenance costs in year one.", image: s("photo-ridges") },
      { title: "Open functionality data", year: "2022", role: "Sponsor", client: "Public dashboard", category: "Transparency", description: "Monthly data on every water point we support, including the broken ones." },
    ],
    experience: [
      { job_title: "Programme Director", company: "Maji Kesho (clean-water NGO)", location: "Nairobi", start_date: "2019", end_date: "Present", description: "Lead 64 staff and a $7.2M annual programme budget across two countries." },
      { job_title: "Monitoring & Evaluation Manager", company: "WaterWorks East Africa", location: "Kampala", start_date: "2014", end_date: "2019" },
      { job_title: "Field Engineer", company: "Kenya Red Cross", location: "Nakuru", start_date: "2012", end_date: "2014" },
    ],
    education: [{ school: "University of Nairobi", degree: "BSc Civil Engineering", start_date: "2007", end_date: "2011" }, { school: "London School of Hygiene & Tropical Medicine", degree: "MSc Public Health (distance learning)", start_date: "2015", end_date: "2018" }],
    testimonials: [{ quote: "Joseph is the reason we fund for ten years instead of three.", name: "Programme Officer", role: "Foundation donor" }, { quote: "Before, we waited months for repairs. Now our committee fixes the pump in a week.", name: "Chair, Ol Moran Water Committee", role: "Community partner" }],
    highlights: [{ title: "Keeping the water flowing: lessons from 380 boreholes", detail: "Report", year: "2024", url: "https://example.com" }, { title: "Speaker, UN Water Conference side event", year: "2023" }],
    stats: [{ value: "212k", label: "people with safe water" }, { value: "94%", label: "water points working" }, { value: "$7.2M", label: "annual budget" }],
    gallery: [{ image: s("photo-dunes"), caption: "Laikipia, dry season" }, { image: s("photo-ridges"), caption: "Ol Moran" }],
  },
};
