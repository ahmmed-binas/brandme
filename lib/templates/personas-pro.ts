import type { StandardContent } from "@/lib/portfolio/schema";

/**
 * Sample people for the 2026 profession templates: Dispatch (trades), Atelier
 * (beauty), Roadmap (product), Radar (recruiting) and Duet (translation).
 * Everyone here is invented and based in the UAE; prices are realistic for 2026.
 * Photos are Unsplash (public/samples/pro, see CREDITS.md): fine in previews and
 * the gallery, left out of free downloads.
 */
const p = (name: string) => `/samples/pro/${name}.webp`;

export const PRO_PERSONAS: Record<string, StandardContent> = {
  "pro-trades": {
    name: "Kwame Asante",
    professional_title: "Electrician & AC Engineer",
    location: "Dubai · Sharjah · Ajman",
    availability: "Available today · Emergency call-outs 24/7",
    tagline: "Power back on, AC blowing cold, and the job left cleaner than I found it.",
    summary: [
      "I’m a DEWA-approved electrician with twelve years on the tools in Dubai, and I run a small team of three engineers. I see every job myself, from the first message to the final test.",
      "We fix the faults other firms give up on, service and install split and ducted AC, and fit EV chargers and smart lighting. You get a clear price on WhatsApp before we start, and a photo report when we finish.",
    ],
    email: "kwame@example.com",
    phone: "+971 50 555 0142",
    instagram: "https://www.instagram.com/",
    avatar: p("trades-avatar"),
    cover: p("trades-wiring"),
    skills: [
      "Dubai Marina",
      "JLT",
      "Jumeirah Village Circle",
      "Business Bay",
      "Al Barsha",
      "Arabian Ranches",
      "Sharjah",
      "Ajman",
    ],
    projects: [
      {
        title: "Full rewire, 3-bed villa",
        year: "2026",
        category: "Rewire",
        client: "Arabian Ranches",
        role: "6 days · new DB, 40 circuits, DEWA inspection",
        description:
          "Old aluminium wiring replaced throughout, a new 36-way distribution board with RCBO protection, and every circuit labelled and tested.",
        image: p("trades-wiring"),
      },
      {
        title: "Distribution board upgrade",
        year: "2026",
        category: "Fault finding",
        client: "Business Bay",
        role: "1 day · tripping fixed for good",
        description:
          "A restaurant kitchen tripping twice a day. Found an overloaded shared neutral, split the circuits and fitted a new board before dinner service.",
        image: p("trades-panel"),
      },
      {
        title: "Ducted AC service, 5 units",
        year: "2025",
        category: "AC",
        client: "Dubai Marina",
        role: "4 hours · coils, drains, gas top-up",
        description:
          "Chemical coil wash, drain lines cleared and gas topped up. Bedrooms down from 27°C to 21°C the same evening.",
        image: p("trades-install"),
      },
      {
        title: "Commercial panel, warehouse",
        year: "2025",
        category: "Commercial",
        client: "Al Quoz",
        role: "3 days",
        description:
          "Three-phase supply for new cold-storage units, with load balancing and a monitoring meter the owner reads from his phone.",
        image: p("trades-board"),
      },
    ],
    services: [
      {
        title: "AC service (split unit)",
        description: "Coil and filter clean, drain line, gas check. Before-and-after photos.",
        price: "AED 120",
      },
      {
        title: "Electrical fault call-out",
        description: "Within 2 hours in Dubai. First hour of fault finding included.",
        price: "AED 250",
      },
      {
        title: "EV charger installed",
        description: "7 kW smart charger, up to 15 m cable, DEWA EV Green Charger approval.",
        price: "From AED 2,900",
      },
      {
        title: "Full villa rewire",
        description: "Free survey and a fixed written quote. Typically 5–8 days.",
        price: "Free survey",
      },
    ],
    stats: [
      { value: "2,400+", label: "jobs completed" },
      { value: "2 hrs", label: "average call-out time" },
      { value: "12", label: "years in Dubai" },
    ],
    highlights: [
      { title: "DEWA approved electrician", detail: "Licence no. on request", year: "2016" },
      { title: "Dubai trade licence", detail: "Asante Electrical & AC LLC", year: "2019" },
      {
        title: "AED 2m public liability insurance",
        detail: "Certificate sent with every quote",
        year: "2026",
      },
    ],
    testimonials: [
      {
        quote:
          "Our AC died in August with a newborn at home. Kwame was there in ninety minutes and had it running by lunch. Fair price, no drama.",
        name: "Hannah & Omar",
        role: "Jumeirah Village Circle",
      },
      {
        quote:
          "Three other electricians couldn’t find why the kitchen kept tripping. He found it in an hour.",
        name: "Ravi Menon",
        role: "Restaurant owner, Business Bay",
      },
    ],
    experience: [
      {
        job_title: "Founder & Lead Engineer",
        company: "Asante Electrical & AC",
        location: "Dubai",
        start_date: "2019",
        end_date: "Present",
      },
      {
        job_title: "Senior Electrician",
        company: "Emirates Facilities Management",
        location: "Dubai",
        start_date: "2014",
        end_date: "2019",
      },
    ],
    education: [
      { school: "City & Guilds", degree: "Level 3 Electrical Installation", start_date: "2012" },
      { school: "Dubai Electricity & Water Authority", degree: "Approved electrician", start_date: "2016" },
    ],
  },

  "pro-beauty": {
    name: "Lina Haddad",
    professional_title: "Bridal & Editorial Makeup Artist",
    location: "Studio in Al Wasl, Dubai · I travel across the UAE",
    availability: "Booking brides for Nov–Mar · 3 dates left in December",
    tagline: "Skin that looks like skin, lashes that last until the last dance.",
    summary: [
      "I’ve been a makeup artist for eleven years, first backstage at Dubai and Paris fashion weeks, and now for brides, campaigns and the occasional red carpet.",
      "My work is soft, luminous and built to photograph well under any light, from a beach ceremony at noon to a ballroom at midnight. Every bride gets a trial, a timeline and me, not an assistant.",
    ],
    email: "lina@example.com",
    phone: "+971 52 555 0199",
    instagram: "https://www.instagram.com/",
    avatar: p("beauty-avatar"),
    cover: p("beauty-glow"),
    skills: [
      "Bridal",
      "Soft glam",
      "Editorial",
      "Airbrush",
      "Lashes",
      "Hair styling",
      "Henna night",
      "Men’s grooming",
    ],
    projects: [
      {
        title: "Golden hour bride",
        year: "2026",
        category: "Bridal",
        client: "One&Only The Palm",
        role: "Soft glam · lashes · 14 hours wear",
        description:
          "Warm bronze lids and a dewy base that held through a beach ceremony and a night of dancing.",
        image: p("beauty-glow"),
      },
      {
        title: "Lash detail",
        year: "2026",
        category: "Editorial",
        client: "Vogue Arabia beauty story",
        role: "Smoked liner, individual lashes",
        description: "A smudged, smoky eye built in five thin layers so it reads soft in close-up.",
        image: p("beauty-eye"),
      },
      {
        title: "Blush & pearl",
        year: "2025",
        category: "Campaign",
        client: "Skincare launch",
        role: "Glass skin, rose blush",
        description: "Fresh, glowing skin for a skincare campaign shot under daylight and flash.",
        image: p("beauty-pink"),
      },
      {
        title: "Deep bronze glow",
        year: "2025",
        category: "Editorial",
        client: "Portrait series",
        role: "Sculpt and highlight",
        description: "Rich, warm skin that glows rather than shines, matched perfectly to deep skin tones.",
        image: p("beauty-portrait"),
      },
      {
        title: "Fashion week backstage",
        year: "2024",
        category: "Backstage",
        client: "Arab Fashion Week",
        role: "Key artist assistant",
        description: "Forty looks in ninety minutes, and not one model late to the runway.",
        image: p("beauty-backstage"),
      },
    ],
    services: [
      {
        title: "Bridal makeup with trial",
        description: "Trial at my studio, then on the day wherever you’re getting ready.",
        price: "AED 2,500",
      },
      { title: "Soft glam (events)", description: "Full face and lashes, 75 minutes.", price: "AED 650" },
      {
        title: "Bridal party",
        description: "Per person, minimum three, same day as the bride.",
        price: "AED 450",
      },
      {
        title: "Editorial & campaign",
        description: "Half or full day, with hair on request.",
        price: "From AED 2,200",
      },
    ],
    stats: [
      { value: "600+", label: "brides" },
      { value: "11", label: "years" },
      { value: "14 hrs", label: "average wear" },
    ],
    testimonials: [
      {
        quote:
          "I cried three times and my makeup didn’t move once. Every photo looks like me on my best day.",
        name: "Mariam K.",
        role: "Bride, December 2025",
      },
      {
        quote: "Calm, fast and brilliant on set. She’s our first call for every beauty shoot.",
        name: "Sofia Laurent",
        role: "Beauty editor",
      },
    ],
    highlights: [
      { title: "Arab Fashion Week", detail: "Backstage team", year: "2024" },
      { title: "Vogue Arabia", detail: "Beauty story", year: "2026" },
    ],
    experience: [
      {
        job_title: "Founder & Lead Artist",
        company: "Lina Haddad Makeup",
        location: "Dubai",
        start_date: "2018",
        end_date: "Present",
      },
      {
        job_title: "Senior Artist",
        company: "Backstage Beauty Collective",
        location: "Dubai & Paris",
        start_date: "2015",
        end_date: "2018",
      },
    ],
    education: [
      { school: "Make Up For Ever Academy", degree: "Professional Makeup Artistry", start_date: "2015" },
    ],
  },

  "pro-product": {
    name: "Aisha Rahman",
    professional_title: "Senior Product Manager",
    location: "Dubai · remote across GCC",
    availability: "Open to Group PM roles in fintech from January",
    tagline: "I find the problem worth solving, then get a team to ship it on a steady rhythm.",
    summary: [
      "I’ve been a product manager for nine years, mostly in payments and digital banking across the Gulf. I’m strongest at the start of a problem: research, sizing, and saying no to the things that don’t matter.",
      "I lead squads of 6–14 engineers and designers, write short specs people actually read, and measure everything against one number the team agrees on before we start.",
    ],
    email: "aisha@example.com",
    linkedin: "https://www.linkedin.com/",
    avatar: p("product-avatar"),
    cover: p("product-notes"),
    skills: [
      "Discovery",
      "Roadmapping",
      "A/B testing",
      "SQL",
      "Payments",
      "Mobile apps",
      "OKRs",
      "Stakeholder management",
    ],
    projects: [
      {
        title: "Instalments at checkout",
        year: "2025",
        category: "+31% basket size",
        client: "Regional payments app",
        role: "Problem: shoppers abandoned big baskets",
        description:
          "Interviewed 40 shoppers, found price shock at the final step, and shipped split-in-four payments in 9 weeks. Basket size up 31%, with defaults under target.",
        image: p("product-notes"),
      },
      {
        title: "Onboarding in 4 minutes",
        year: "2024",
        category: "−62% drop-off",
        client: "Digital bank",
        role: "Problem: 19-minute account opening",
        description:
          "Mapped every step with compliance, removed seven screens and added Emirates ID scanning. Drop-off fell by 62% and approvals came same day.",
        image: p("product-board"),
      },
      {
        title: "Merchant dashboard",
        year: "2023",
        category: "NPS 21 → 54",
        client: "Payments platform",
        role: "Problem: merchants called support for every report",
        description:
          "Built the three reports merchants asked for most, in Arabic and English. Support tickets halved and NPS more than doubled.",
        image: p("product-team"),
      },
    ],
    stats: [
      { value: "9", label: "years in product" },
      { value: "4.2M", label: "users of what I shipped" },
      { value: "31%", label: "best single lift" },
    ],
    experience: [
      {
        job_title: "Senior Product Manager",
        company: "Regional payments app",
        location: "Dubai",
        start_date: "2022",
        end_date: "Present",
        description: "Checkout and instalments; squad of 12.",
      },
      {
        job_title: "Product Manager",
        company: "Digital bank",
        location: "Abu Dhabi",
        start_date: "2019",
        end_date: "2022",
        description: "Onboarding and KYC.",
      },
      {
        job_title: "Associate Product Manager",
        company: "E-commerce marketplace",
        location: "Dubai",
        start_date: "2017",
        end_date: "2019",
      },
    ],
    testimonials: [
      {
        quote:
          "Aisha is the PM engineers ask to work with. Clear problems, short specs, and she protects the team’s focus.",
        name: "Daniel Ortiz",
        role: "Engineering Manager",
      },
      {
        quote: "She brought data to every argument and kindness to every room.",
        name: "Fatima Al Suwaidi",
        role: "VP Product",
      },
    ],
    education: [
      {
        school: "American University of Sharjah",
        degree: "BSc Computer Engineering",
        start_date: "2013",
        end_date: "2017",
      },
    ],
    highlights: [
      { title: "Speaker, Seamless Middle East", detail: "Designing checkout for trust", year: "2025" },
      { title: "Reforge Product Strategy", detail: "Certificate", year: "2023" },
    ],
  },

  "pro-hr": {
    name: "Priya Nair",
    professional_title: "Talent Partner · Tech & Product",
    location: "Dubai · hiring across the GCC",
    availability: "Taking two new hiring briefs for Q1",
    tagline: "I find the people your competitors can’t, and they stay.",
    summary: [
      "I’ve hired engineers, product managers and designers for ten years, in-house at two Dubai scale-ups and now as a fractional talent partner for funded start-ups across the region.",
      "I run the whole process: the brief, the search, the interviews and the offer. Candidates get honest feedback within 48 hours, every time, which is why they take my calls.",
    ],
    email: "priya@example.com",
    phone: "+971 56 555 0123",
    linkedin: "https://www.linkedin.com/",
    avatar: p("hr-avatar"),
    cover: p("hr-cv"),
    skills: [
      "Engineering",
      "Product",
      "Design",
      "Data",
      "Leadership hires",
      "Employer brand",
      "Interview design",
      "Offer negotiation",
    ],
    projects: [
      {
        title: "Founding engineering team",
        year: "2026",
        category: "14 hires · 11 weeks",
        client: "Series A fintech",
        role: "Backend, mobile, data",
        description: "From zero to fourteen engineers in eleven weeks, with every offer accepted.",
        image: p("hr-interview"),
      },
      {
        title: "VP Engineering search",
        year: "2025",
        category: "Placed in 6 weeks",
        client: "Logistics scale-up",
        role: "Executive search",
        description:
          "A long-listed search across London, Bangalore and Dubai; the hire relocated with her family.",
        image: p("hr-handshake"),
      },
      {
        title: "Interview process rebuild",
        year: "2024",
        category: "Time to hire 54 → 23 days",
        client: "E-commerce",
        role: "Process design",
        description:
          "Replaced six rounds with three structured interviews and a paid take-home. Offer acceptance went up to 92%.",
        image: p("hr-chat"),
      },
    ],
    stats: [
      { value: "420+", label: "people hired" },
      { value: "23 days", label: "median time to hire" },
      { value: "94%", label: "still there after a year" },
    ],
    services: [
      {
        title: "Fractional talent partner",
        description: "Two to four days a week inside your team.",
        price: "From AED 18,000 / month",
      },
      {
        title: "Single role search",
        description: "Engineering, product or design. Paid on success.",
        price: "18% of first-year salary",
      },
      {
        title: "Hiring process audit",
        description: "A week with your team, then a written plan.",
        price: "AED 9,500",
      },
    ],
    testimonials: [
      {
        quote: "Priya hired our first ten engineers. Two years later all ten are still here.",
        name: "Yousef Al Mansoori",
        role: "CEO, fintech start-up",
      },
      {
        quote: "The only recruiter who told me why I didn’t get a job. She got me the next one.",
        name: "Arjun Patel",
        role: "Senior Engineer, placed 2025",
      },
    ],
    experience: [
      {
        job_title: "Fractional Talent Partner",
        company: "Independent",
        location: "Dubai",
        start_date: "2023",
        end_date: "Present",
      },
      {
        job_title: "Head of Talent",
        company: "Delivery scale-up",
        location: "Dubai",
        start_date: "2019",
        end_date: "2023",
      },
      {
        job_title: "Technical Recruiter",
        company: "Ride-hailing company",
        location: "Dubai",
        start_date: "2016",
        end_date: "2019",
      },
    ],
    education: [
      { school: "CIPD", degree: "Level 5 Associate Diploma in People Management", start_date: "2020" },
    ],
  },

  "pro-language": {
    name: "Nour El-Amin",
    professional_title: "Legal Translator · Arabic ⇄ English",
    location: "Abu Dhabi · serving the whole UAE",
    availability: "Same-day legal translation · Court documents within 24 hours",
    tagline:
      "Every word carries weight in a contract. I make sure it carries the same weight in both languages.",
    summary: [
      "I’m a sworn legal translator registered with the UAE Ministry of Justice, translating contracts, court papers and corporate documents between Arabic and English for fourteen years.",
      "Law firms, banks and families trust me with documents where one wrong word costs money or time. I translate, a second sworn translator reviews, and you get the stamped copy the courts accept.",
    ],
    email: "nour@example.com",
    phone: "+971 55 555 0176",
    linkedin: "https://www.linkedin.com/",
    avatar: p("lang-avatar"),
    cover: p("lang-desk"),
    skills: [
      "Arabic → English",
      "English → Arabic",
      "French → Arabic",
      "Contracts",
      "Court documents",
      "Corporate",
      "Immigration",
      "Certificates",
    ],
    projects: [
      {
        title: "Joint-venture agreement",
        year: "2026",
        category: "Corporate",
        client: "Abu Dhabi law firm",
        role: "212 pages · 6 days",
        description:
          "A bilingual JV agreement for an energy project, delivered side by side so both parties signed one document.",
        image: p("lang-desk"),
      },
      {
        title: "Court bundle",
        year: "2025",
        category: "Litigation",
        client: "Dubai Courts",
        role: "540 pages · sworn",
        description: "A commercial dispute bundle translated and stamped against a hard court deadline.",
        image: p("lang-pen"),
      },
    ],
    services: [
      {
        title: "Sworn legal translation",
        description: "MOJ-stamped, accepted by UAE courts and ministries.",
        price: "AED 120 / page",
      },
      {
        title: "Certificates & personal documents",
        description: "Birth, marriage, degree certificates, licences.",
        price: "AED 90 / page",
      },
      {
        title: "Contract review in both languages",
        description: "Checking that your Arabic and English versions say the same thing.",
        price: "AED 450 / hour",
      },
      { title: "Urgent same-day", description: "Up to 15 pages, received before 11 am.", price: "+50%" },
    ],
    stats: [
      { value: "14", label: "years translating" },
      { value: "38,000+", label: "pages delivered" },
      { value: "24 hrs", label: "court documents" },
    ],
    highlights: [
      { title: "Sworn translator, UAE Ministry of Justice", detail: "Registration on request", year: "2013" },
      { title: "Member, Arab Translators Association", detail: "", year: "2016" },
    ],
    testimonials: [
      {
        quote:
          "Nour found a clause our original Arabic version got wrong. That one catch saved us a dispute.",
        name: "James Whitfield",
        role: "Partner, international law firm",
      },
      {
        quote: "Fast, careful and always reachable. Our firm sends her everything urgent.",
        name: "Layla Hassan",
        role: "Legal counsel, bank",
      },
    ],
    experience: [
      {
        job_title: "Sworn Legal Translator",
        company: "Independent",
        location: "Abu Dhabi",
        start_date: "2016",
        end_date: "Present",
      },
      {
        job_title: "Legal Translator",
        company: "Translation house",
        location: "Dubai",
        start_date: "2012",
        end_date: "2016",
      },
    ],
    education: [
      {
        school: "Université Saint-Joseph, Beirut",
        degree: "MA Legal Translation",
        start_date: "2010",
        end_date: "2012",
      },
      { school: "UAE Ministry of Justice", degree: "Sworn translator registration", start_date: "2013" },
    ],
  },

  "pro-driving": {
    name: "Rashid Khan",
    professional_title: "Driving Instructor · Car, Motorbike & Bus",
    location: "Dubai · Sharjah · Ajman",
    availability: "Morning and evening slots this week · Ladies’ lessons available",
    tagline: "Calm lessons, clear steps, and most of my students pass first time.",
    summary: [
      "I’ve taught over 1,800 people to drive in Dubai, from teenagers on their first day to professionals swapping a foreign licence. Nervous drivers are my favourite: we go at your pace, on quiet roads first.",
      "I teach manual and automatic cars, motorbikes and light buses, and I prepare you for every part of the test: parking, assessment and the road test, with mock tests on the real routes.",
    ],
    email: "rashid@example.com",
    phone: "+971 50 555 0161",
    instagram: "https://www.instagram.com/",
    avatar: p("drive-avatar"),
    cover: p("drive-lesson"),
    skills: ["Al Barsha", "Al Quoz", "Deira", "Mirdif", "Jumeirah", "Sharjah", "Ajman", "Silicon Oasis"],
    projects: [
      {
        title: "First drive, empty car park",
        year: "2026",
        category: "Beginners",
        client: "Week 1",
        role: "Clutch, steering, mirrors",
        description:
          "Everyone starts here: no traffic, no pressure, just getting comfortable behind the wheel.",
        image: p("drive-two"),
      },
      {
        title: "Parking test practice",
        year: "2026",
        category: "Test prep",
        client: "Week 3",
        role: "Parallel, angle, garage",
        description: "The same markings and cones as the test centre, until it feels automatic.",
        image: p("drive-briefing"),
      },
      {
        title: "Mirrors and blind spots",
        year: "2026",
        category: "Road skills",
        client: "Week 4",
        role: "Lane changes on Sheikh Zayed Road",
        description:
          "Mirror, signal, shoulder check, every time. The habit that passes tests and keeps you safe.",
        image: p("drive-mirror"),
      },
      {
        title: "Motorbike cone course",
        year: "2025",
        category: "Motorbike",
        client: "Bike licence",
        role: "Slow control, figure of eight",
        description: "Low-speed balance and the cone course, then real roads once you’re steady.",
        image: p("drive-bike"),
      },
      {
        title: "Sunset road test route",
        year: "2025",
        category: "Mock test",
        client: "Final week",
        role: "The real routes",
        description: "Full mock tests on the routes examiners use, with a written list of what to fix.",
        image: p("drive-golden"),
      },
    ],
    services: [
      {
        title: "Single lesson (car)",
        description: "45 minutes, picked up from home or work.",
        price: "AED 140",
      },
      {
        title: "Beginner package",
        description: "20 lessons, manual or automatic, with two mock tests.",
        price: "AED 2,400",
      },
      {
        title: "Licence swap refresher",
        description: "5 lessons for experienced drivers converting a foreign licence.",
        price: "AED 650",
      },
      { title: "Motorbike course", description: "15 lessons, bike and helmet provided.", price: "AED 1,900" },
    ],
    stats: [
      { value: "87%", label: "pass first time" },
      { value: "1,800+", label: "students taught" },
      { value: "11", label: "years teaching" },
    ],
    highlights: [
      { title: "Certified driving instructor", detail: "Car, motorbike and light bus", year: "2015" },
      { title: "Defensive driving trainer", detail: "Corporate fleet courses", year: "2019" },
      { title: "First aid certified", detail: "Renewed every year", year: "2026" },
    ],
    testimonials: [
      {
        quote:
          "I failed twice with a big school. Rashid found my two bad habits in one lesson and I passed the next week.",
        name: "Priya S.",
        role: "Passed March 2026",
      },
      {
        quote:
          "I was terrified of highways. He started me on empty roads at 6 am. Now I drive to Abu Dhabi alone.",
        name: "Hannah W.",
        role: "Passed January 2026",
      },
    ],
    experience: [
      {
        job_title: "Independent Driving Instructor",
        company: "Rashid Khan Driving",
        location: "Dubai",
        start_date: "2019",
        end_date: "Present",
      },
      {
        job_title: "Senior Instructor",
        company: "City driving school",
        location: "Dubai",
        start_date: "2015",
        end_date: "2019",
      },
    ],
    education: [
      { school: "Driving instructor certification", degree: "Car, motorbike, light bus", start_date: "2015" },
      { school: "Defensive driving", degree: "Trainer certificate", start_date: "2019" },
    ],
  },

  "pro-flight": {
    name: "Noor Al Amiri",
    professional_title: "Flight Instructor · PPL, CPL & Instrument",
    location: "Al Ain & Dubai, UAE",
    availability: "Discovery flights every weekend · New PPL students from November",
    tagline: "From your first take-off to your licence, one calm voice in your headset.",
    summary: [
      "I’ve been a flight instructor for eight years and have sent more than 140 students solo. I teach in single-engine trainers out of Al Ain, with a lot of patience and very clear briefings.",
      "Every lesson starts on the ground: what we’ll do, what to expect, what good looks like. Then we fly it, and debrief with your logbook open. Nothing in the air should be a surprise.",
    ],
    email: "noor@example.com",
    phone: "+971 55 555 0193",
    linkedin: "https://www.linkedin.com/",
    avatar: p("fly-avatar"),
    cover: p("fly-cockpit"),
    skills: [
      "PPL",
      "CPL",
      "Instrument rating",
      "Night rating",
      "Discovery flights",
      "Ground school",
      "Radio work",
      "Navigation",
    ],
    projects: [
      {
        title: "Pre-flight walk-round",
        year: "2026",
        category: "Lesson 1",
        client: "Ground",
        role: "Fuel, oil, controls, tyres",
        description: "Every flight starts with the aircraft, the checklist and twenty careful minutes.",
        image: p("fly-preflight"),
      },
      {
        title: "Taxi and first take-off",
        year: "2026",
        category: "Lesson 2",
        client: "Al Ain",
        role: "You fly, I talk",
        description:
          "Most students take the controls on their first flight. It’s the moment people remember.",
        image: p("fly-taxi"),
      },
      {
        title: "Reading the panel",
        year: "2026",
        category: "Instruments",
        client: "Ground school",
        role: "Six-pack and scan",
        description:
          "Airspeed, attitude, altitude: learning a steady scan so the cockpit stops feeling busy.",
        image: p("fly-gauges"),
      },
      {
        title: "Headset on, radio calls",
        year: "2025",
        category: "Radio",
        client: "Lesson 6",
        role: "Clear, short, confident",
        description: "We practise every call on the ground until it sounds like you’ve done it for years.",
        image: p("fly-headset"),
      },
    ],
    services: [
      {
        title: "Discovery flight",
        description: "30 minutes in the air, you take the controls. Great as a gift.",
        price: "AED 950",
      },
      {
        title: "PPL course",
        description: "45 flight hours, ground school and exam preparation.",
        price: "From AED 42,000",
      },
      {
        title: "Instrument rating coaching",
        description: "Simulator and flight lessons for the IR test.",
        price: "AED 1,100 / hour",
      },
      {
        title: "Ground school (private)",
        description: "One-to-one theory for any of the 9 exams.",
        price: "AED 350 / hour",
      },
    ],
    stats: [
      { value: "3,200", label: "hours flown" },
      { value: "1,900", label: "hours instructing" },
      { value: "140+", label: "students sent solo" },
    ],
    highlights: [
      { title: "Flight Instructor rating (FI)", detail: "Single-engine piston", year: "2018" },
      { title: "Instrument rating instructor (IRI)", detail: "", year: "2021" },
      { title: "Commercial pilot licence (CPL)", detail: "Multi-engine, instrument", year: "2016" },
    ],
    testimonials: [
      {
        quote:
          "Noor’s briefings are so clear that nothing in the air surprised me. I went solo after 14 hours.",
        name: "Karim A.",
        role: "PPL student, 2026",
      },
      {
        quote:
          "Booked a discovery flight for my dad’s birthday. He flew the plane for twenty minutes and hasn’t stopped talking about it.",
        name: "Sarah M.",
        role: "Discovery flight, 2025",
      },
    ],
    experience: [
      {
        job_title: "Flight Instructor (FI/IRI)",
        company: "Flying club, Al Ain",
        location: "Al Ain",
        start_date: "2018",
        end_date: "Present",
      },
      {
        job_title: "First Officer",
        company: "Regional charter operator",
        location: "Dubai",
        start_date: "2016",
        end_date: "2018",
      },
    ],
    education: [
      {
        school: "Flight training academy",
        degree: "Integrated ATPL (frozen)",
        start_date: "2014",
        end_date: "2016",
      },
      { school: "Flight instructor course", degree: "FI rating", start_date: "2018" },
    ],
  },

  "pro-ops": {
    name: "Daniel Kovač",
    professional_title: "Operations Manager · Logistics & Supply Chain",
    location: "Dubai, UAE",
    availability: "Open to Head of Operations roles from January",
    tagline: "I make warehouses, fleets and teams run like clockwork, and I can prove it in numbers.",
    summary: [
      "I’ve run operations for twelve years across e-commerce fulfilment, cold chain and retail distribution in Dubai and Zagreb. Today I lead a 180-person operation at a Jebel Ali fulfilment centre.",
      "My job is mostly invisible when it’s done well: orders that leave on time, trucks that come back full, costs that stay where they should. I like honest dashboards, short daily stand-ups and fixing the process before blaming the people.",
    ],
    email: "daniel@example.com",
    phone: "+971 50 555 0147",
    linkedin: "https://www.linkedin.com/",
    avatar: p("ops-avatar"),
    skills: [
      "Lean & Six Sigma",
      "Warehouse management (WMS)",
      "Fleet & last mile",
      "Budget ownership",
      "S&OP",
      "Supplier management",
      "KPI dashboards",
      "Team leadership",
    ],
    projects: [
      {
        title: "Same-day dispatch at Jebel Ali",
        year: "2025",
        category: "Warehouse",
        client: "Fulfilment centre, 42,000 m²",
        role: "Operations Manager",
        description:
          "Re-slotted 38,000 SKUs by pick frequency and moved packing next to dispatch. Same-day dispatch went from 71% to 96% in five months, with the same headcount.",
        technologies: ["96% same-day", "−22% walking", "Same team"],
      },
      {
        title: "Goods-in automation",
        year: "2025",
        category: "Automation",
        client: "Inbound team",
        role: "Project lead",
        description:
          "Barcode-first receiving with handheld scanners and auto put-away suggestions. Receiving time per pallet fell from 14 to 6 minutes.",
        technologies: ["14 → 6 min", "AED 0.9m saved / yr"],
      },
      {
        title: "Last-mile fleet rebuild",
        year: "2024",
        category: "Fleet",
        client: "62 vans, UAE-wide",
        role: "Owner",
        description:
          "Route optimisation, a new driver scorecard and a shift pattern built around traffic. Failed deliveries halved and fuel per drop fell by a fifth.",
        technologies: ["−50% failed drops", "−19% fuel"],
      },
      {
        title: "AED 4.2m cost programme",
        year: "2024",
        category: "Cost",
        client: "Finance & procurement",
        role: "Programme lead",
        description:
          "Renegotiated packaging and 3PL contracts, cut overtime with better rotas and stopped paying for empty racking.",
        technologies: ["AED 4.2m / yr", "No redundancies"],
      },
      {
        title: "One operations dashboard",
        year: "2023",
        category: "Dashboard",
        client: "Leadership team",
        role: "Designer & owner",
        description:
          "Twelve numbers on one screen, updated every hour, reviewed at a 10-minute stand-up. Problems are now spotted the same morning, not at month end.",
        technologies: ["12 KPIs", "Hourly", "10-min stand-up"],
      },
      {
        title: "Zero lost-time injuries",
        year: "2023",
        category: "Safety",
        client: "All sites",
        role: "Safety champion",
        description:
          "Daily walk-rounds, near-miss reporting in the team chat and forklift refreshers every quarter. 640 days without a lost-time injury.",
        technologies: ["640 days", "ISO 45001"],
      },
    ],
    services: [
      {
        title: "Operations review",
        description: "Two weeks on site, then a written plan with costs and quick wins.",
        price: "AED 28,000",
      },
      {
        title: "Interim operations manager",
        description: "Hands-on cover for three to nine months.",
        price: "From AED 2,800 / day",
      },
      {
        title: "Lean training for team leaders",
        description: "Two practical days on the floor, not in a classroom.",
        price: "AED 9,500",
      },
    ],
    stats: [
      { value: "96%", label: "same-day dispatch" },
      { value: "AED 4.2m", label: "saved a year" },
      { value: "180", label: "people led" },
    ],
    highlights: [
      { title: "Lean Six Sigma Black Belt", detail: "", year: "2021" },
      {
        title: "Logistics Operation of the Year (finalist)",
        detail: "Regional supply chain awards",
        year: "2025",
      },
      { title: "640 days without a lost-time injury", detail: "All sites", year: "2026" },
    ],
    testimonials: [
      {
        quote: "Daniel made our hardest peak season feel calm. Every morning we knew exactly where we stood.",
        name: "Head of E-commerce",
        role: "Retail group, Dubai",
      },
      {
        quote:
          "He fixes the process, not the people. Our team leaders grew more in a year with him than in the five before.",
        name: "HR Director",
        role: "Logistics company",
      },
    ],
    experience: [
      {
        job_title: "Operations Manager",
        company: "Fulfilment centre, Jebel Ali",
        location: "Dubai",
        start_date: "2021",
        end_date: "Present",
      },
      {
        job_title: "Warehouse Operations Lead",
        company: "Cold chain distributor",
        location: "Dubai",
        start_date: "2017",
        end_date: "2021",
      },
      {
        job_title: "Shift Manager",
        company: "Retail distribution centre",
        location: "Zagreb",
        start_date: "2013",
        end_date: "2017",
      },
    ],
    education: [
      {
        school: "University of Zagreb",
        degree: "BSc Logistics & Transport",
        start_date: "2009",
        end_date: "2013",
      },
      { school: "CIPS", degree: "Diploma in Procurement and Supply", start_date: "2020" },
    ],
  },

  "pro-content": {
    name: "Amara Okafor",
    professional_title: "Content Marketing Lead · B2B & SaaS",
    location: "Dubai · working with teams worldwide",
    availability: "Taking two new retainers for Q1",
    tagline:
      "Content that people finish, share and buy from. I write it, film it and prove what it brought in.",
    summary: [
      "I’ve led content for B2B software companies for nine years: guides, case studies, newsletters, video and podcasts. My content has brought in more than AED 30m of pipeline that sales teams could trace back to a page.",
      "I plan from what buyers search for and ask sales calls about, write like a person, and cut anything that doesn’t earn its place. Every piece has one job and one number.",
    ],
    email: "amara@example.com",
    linkedin: "https://www.linkedin.com/",
    instagram: "https://www.instagram.com/",
    avatar: p("content-avatar"),
    skills: [
      "Content strategy",
      "SEO & search intent",
      "Long-form writing",
      "Case studies",
      "Newsletters",
      "Video & podcasts",
      "Editorial calendars",
      "Content analytics",
    ],
    projects: [
      {
        title: "From 4k to 180k monthly readers",
        year: "2025",
        category: "SEO",
        client: "Payroll software",
        role: "Head of content",
        description:
          "A topic map built from sales calls and search data, 120 guides in 14 months and a ruthless refresh routine. Organic sign-ups grew 9×.",
        technologies: ["180k readers / mo", "9× sign-ups"],
      },
      {
        title: "The Friday Ledger newsletter",
        year: "2025",
        category: "Newsletter",
        client: "Fintech, 40,000 subscribers",
        role: "Writer & editor",
        description:
          "One useful idea a week for finance teams, no fluff. 46% open rate and the company’s biggest source of demo requests.",
        technologies: ["46% opens", "40k subscribers"],
      },
      {
        title: "Customer story video series",
        year: "2024",
        category: "Video",
        client: "Logistics SaaS",
        role: "Producer",
        description:
          "Six short films with real customers, shot in their warehouses. Sales now sends them in the first email; win rate rose 11 points.",
        technologies: ["+11 pts win rate", "6 films"],
      },
      {
        title: "The Operators podcast",
        year: "2024",
        category: "Podcast",
        client: "B2B brand",
        role: "Host & producer",
        description:
          "Forty interviews with heads of operations. A third of guests became leads; two became customers within a year.",
        technologies: ["40 episodes", "1/3 guests → leads"],
      },
      {
        title: "Product launch campaign",
        year: "2023",
        category: "Campaign",
        client: "Expense app",
        role: "Content lead",
        description:
          "Launch page, video, 30 social posts and a press kit, all from one message. 2,400 sign-ups in launch week.",
        technologies: ["2,400 sign-ups", "1 message"],
      },
      {
        title: "LinkedIn for the founders",
        year: "2023",
        category: "Social",
        client: "Two founders",
        role: "Ghostwriter",
        description:
          "Three posts a week in their own voice from 20-minute calls. From 3k to 41k followers, and inbound leads every week.",
        technologies: ["3k → 41k", "Weekly inbound"],
      },
    ],
    services: [
      {
        title: "Content strategy sprint",
        description: "Two weeks: research, a topic map and a 90-day calendar.",
        price: "AED 14,000",
      },
      {
        title: "Content retainer",
        description: "Four long-form pieces, a newsletter and repurposing every month.",
        price: "From AED 12,500 / month",
      },
      {
        title: "Customer case study",
        description: "Interview, writing, quotes approved, design brief.",
        price: "AED 3,800",
      },
    ],
    stats: [
      { value: "180k", label: "monthly readers built" },
      { value: "46%", label: "newsletter open rate" },
      { value: "AED 30m+", label: "pipeline from content" },
    ],
    highlights: [
      { title: "Content Marketer of the Year (shortlist)", detail: "B2B marketing awards", year: "2025" },
      { title: "Speaker, content marketing summit", detail: "“Write for the sales call”", year: "2024" },
      { title: "HubSpot Content Marketing certification", detail: "", year: "2022" },
    ],
    testimonials: [
      {
        quote:
          "Amara’s case studies are the first thing our sales team sends. Nothing else we make gets forwarded as much.",
        name: "VP Sales",
        role: "Fintech, Dubai",
      },
      {
        quote: "She writes like us, only better. Our LinkedIn finally sounds like a person.",
        name: "Co-founder",
        role: "Expense app",
      },
    ],
    experience: [
      {
        job_title: "Content Marketing Lead",
        company: "Payroll software company",
        location: "Dubai",
        start_date: "2022",
        end_date: "Present",
      },
      {
        job_title: "Senior Content Marketer",
        company: "Fintech scale-up",
        location: "London",
        start_date: "2019",
        end_date: "2022",
      },
      {
        job_title: "Content Writer",
        company: "B2B agency",
        location: "Lagos",
        start_date: "2016",
        end_date: "2019",
      },
    ],
    education: [
      {
        school: "University of Lagos",
        degree: "BA Mass Communication",
        start_date: "2012",
        end_date: "2016",
      },
    ],
  },
};
