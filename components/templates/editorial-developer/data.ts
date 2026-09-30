// ============================================================================
// CENTRAL PORTFOLIO DATA
// ----------------------------------------------------------------------------
// This is the single source of truth for every piece of content rendered on
// the site. Nothing below is imported by design/animation code — components
// only consume this shape. That means this whole file can eventually be
// replaced by a fetch() to an API/database (e.g. output from an AI portfolio
// builder) without touching a single component.
//
// PLACEHOLDER CONVENTION
// Any value the developer hasn't confirmed yet is wrapped as [ADD ...] and
// also listed in `meta.placeholders` so an editor UI (or an AI filler) can
// find every incomplete field programmatically instead of grepping JSX.
// Sections whose backing array is empty are hidden automatically by the
// components that render them — see each component's early return.
// ============================================================================

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  summary: string;
  responsibilities: string[];
  technologies: string[];
  achievements: string[];
  link?: string;
}

export interface ProjectEntry {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  problem: string;
  approach: string;
  architecture?: string;
  challenges?: string;
  results?: string;
  role: string;
  featured: boolean;
  status: "active" | "shipped" | "in-progress";
  technologies: string[];
  keyFeatures: string[];
  github?: string;
  liveUrl?: string;
  date: string;
  image?: string;
}

export interface SkillEntry {
  name: string;
  yearsExperience?: number;
  usedIn?: string[]; // project ids
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  achievements?: string[];
  coursework?: string[];
}

export interface CertificationEntry {
  id: string;
  name: string;
  organization: string;
  date: string;
  credentialUrl?: string;
}

export interface ServiceEntry {
  id: string;
  title: string;
  description: string;
  technologies: string[];
}

export interface TestimonialEntry {
  id: string;
  quote: string;
  person: string;
  role: string;
  company: string;
  photo?: string;
}

export interface ApproachStage {
  id: string;
  stage: string;
  description: string;
}

export const portfolioData = {
  meta: {
    // Fields still needing real input. An "Edit portfolio" mode or an AI
    // filler can read this list directly instead of scanning the tree.
    placeholders: [
      "personal.email",
      "personal.avatar",
      "social.github",
      "social.linkedin",
      "projects[mysql-backup-app].github",
      "projects[ai-portfolio-builder].github",
      "projects[ai-portfolio-builder].liveUrl",
      "resume.fileUrl",
    ],
  },

  personal: {
    name: "Ahmmed Binas",
    title: "Software Developer",
    subtitle: "Full-Stack Developer",
    location: "Kielce, Poland",
    email: "[ADD EMAIL]",
    availability: "Open to select opportunities",
    avatar: "[ADD AVATAR IMAGE URL]",
    positioning:
      "I build backend systems and full-stack applications — from internal tooling in C# and SQL to web products in React and Node.js.",
  },

  about: {
    introduction:
      "I'm a Computer Science student at Kielce University of Technology and a full-stack developer working across the .NET and JavaScript ecosystems. My background is backend-leaning — I like the parts of software that most people never see: data models, migrations, the boring service that has to run correctly every night.",
    philosophy:
      "I try to understand a system before I add to it. Most of the work I enjoy is reducing the number of moving parts, not adding new ones — which is also why I'm currently building a tool to automate the part of software work that's pure repetition: assembling a portfolio from a developer's own project history.",
    currentlyExploring: ["C#", "React", "Node.js", "AI-assisted tooling"],
  },

  experience: [
    {
      id: "kaizen-star",
      company: "Kaizen Star Technologies",
      role: "Software Developer Intern",
      location: "[ADD LOCATION]",
      startDate: "2024-07",
      endDate: "2024-09",
      summary:
        "Backend-focused internship working with C# and SQL, including building MySQLBackupApp, a tool for automating MySQL database backups.",
      responsibilities: [
        "Developed features in C# for internal tooling",
        "Wrote and maintained SQL for data handling and backup workflows",
        "Built MySQLBackupApp end-to-end",
      ],
      technologies: ["C#", "SQL", "MySQL"],
      achievements: ["[ADD SPECIFIC OUTCOME OR METRIC IF AVAILABLE]"],
      link: undefined,
    },
  ] as ExperienceEntry[],

  projects: [
    {
      id: "ai-portfolio-builder",
      slug: "ai-portfolio-builder",
      name: "AI Portfolio Builder",
      tagline: "Generates a developer's portfolio data from their own project history.",
      description:
        "A SaaS tool currently in development that takes a developer's projects, experience, and skills and produces structured portfolio data — the same shape this site's own portfolioData object uses — ready to render into a site like this one automatically.",
      problem:
        "[ADD PROJECT DESCRIPTION — what specifically triggered building this: e.g. how long a manual portfolio update takes, or a gap in existing tools]",
      approach:
        "[ADD PROJECT DESCRIPTION — architecture/approach once finalized]",
      architecture: "[ADD ARCHITECTURE DETAILS]",
      challenges: "[ADD CHALLENGES]",
      results: "[ADD RESULTS ONCE AVAILABLE]",
      role: "Founder / Developer",
      featured: true,
      status: "in-progress",
      technologies: ["React", "Node.js", "Firebase"],
      keyFeatures: [
        "[ADD KEY FEATURE]",
        "[ADD KEY FEATURE]",
      ],
      github: "[ADD GITHUB URL]",
      liveUrl: "[ADD LIVE URL]",
      date: "2026",
      image: undefined,
    },
    {
      id: "mysql-backup-app",
      slug: "mysql-backup-app",
      name: "MySQLBackupApp",
      tagline: "Automates MySQL database backups.",
      description:
        "Built during a Software Developer internship at Kaizen Star Technologies to automate the manual process of backing up MySQL databases.",
      problem:
        "[ADD PROJECT DESCRIPTION — what the manual process looked like before this]",
      approach:
        "[ADD PROJECT DESCRIPTION — how the app is structured, scheduling, storage, etc.]",
      architecture: "[ADD ARCHITECTURE DETAILS]",
      challenges: "[ADD CHALLENGES]",
      results: "[ADD RESULTS]",
      role: "Developer",
      featured: false,
      status: "shipped",
      technologies: ["C#", "SQL", "MySQL"],
      keyFeatures: ["[ADD KEY FEATURE]"],
      github: "[ADD GITHUB URL]",
      liveUrl: undefined,
      date: "2024",
      image: undefined,
    },
  ] as ProjectEntry[],

  skills: {
    frontend: [{ name: "React" }, { name: "JavaScript" }] as SkillEntry[],
    backend: [
      { name: "C#" },
      { name: "ASP.NET" },
      { name: "Node.js" },
    ] as SkillEntry[],
    database: [{ name: "MySQL" }, { name: "Firebase" }] as SkillEntry[],
    devops: [] as SkillEntry[],
    ai: [] as SkillEntry[],
    tools: [] as SkillEntry[],
  },

  education: [
    {
      id: "kielce",
      institution: "Kielce University of Technology",
      degree: "Bachelor's Degree",
      field: "Computer Science",
      location: "Kielce, Poland",
      startDate: "[ADD START DATE]",
      endDate: "In progress",
      achievements: [],
      coursework: [],
    },
  ] as EducationEntry[],

  // Empty on purpose — component hides this section until real ones exist.
  certifications: [] as CertificationEntry[],

  engineeringApproach: [
    { id: "discover", stage: "Discover", description: "Understand the actual problem and constraints before writing anything." },
    { id: "design", stage: "Design", description: "Shape the data model and the interfaces around it first." },
    { id: "architect", stage: "Architect", description: "Decide what has to be correct, and what can be simple." },
    { id: "build", stage: "Build", description: "Implement in small, working increments." },
    { id: "test", stage: "Test", description: "Verify the parts that would be expensive to get wrong in production." },
    { id: "ship", stage: "Ship", description: "Release deliberately, with a way to observe what happens next." },
    { id: "improve", stage: "Improve", description: "Treat the first version as a draft, not a finish line." },
  ] as ApproachStage[],

  // Empty on purpose — hidden until real GitHub data or repos are wired in.
  openSource: {
    githubUsername: "[ADD GITHUB USERNAME]",
    repositories: [] as { name: string; description: string; url: string; language: string }[],
  },

  // Empty on purpose — component hides this section entirely if empty.
  services: [] as ServiceEntry[],

  // Empty on purpose — never populate with fabricated testimonials.
  testimonials: [] as TestimonialEntry[],

  resume: {
    fileUrl: "[ADD RESUME FILE URL]",
    lastUpdated: "[ADD DATE]",
  },

  social: {
    github: "[ADD GITHUB URL]",
    linkedin: "[ADD LINKEDIN URL]",
    instagram: undefined as string | undefined,
  },

  contact: {
    channel: "email" as "email" | "whatsapp" | "smtp",
    email: "[ADD EMAIL]",
    whatsappNumber: "",
    subjectPrefix: "Portfolio enquiry",
    smtpProfile: "server-default" as const,
  },

  snapshot: {
    yearsBuilding: "[ADD YEARS]",
    projectsCount: "2",
    coreTechnologies: "6",
    focus: "AI-assisted developer tooling",
  },
};

export type PortfolioData = typeof portfolioData;
