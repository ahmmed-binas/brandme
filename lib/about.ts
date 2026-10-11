/**
 * Content for the About page, written from an interview with the founder
 * (October 2026). A portrait goes in public/about/ and is referenced as
 * "/about/portrait.jpg"; links appear once they have a URL.
 */
export const about = {
  placeholder: false,
  founder: {
    name: "Ahmed Binas",
    role: "Founder",
    location: "Dubai, UAE",
    origin: "From Kerala, India · Graduated in Poland",
    portrait: "" as string, // e.g. "/about/portrait.jpg"
    links: [
      { label: "TikTok", url: "" },
      { label: "Instagram", url: "" },
    ],
  },
  headline: "My career started with a portfolio I built myself.",
  letter: [
    "Hi, I’m Ahmed. I’m originally from Kerala, India, I studied computer science in Poland, and today I live in Dubai, where I build software and lead a team.",
    "My career didn’t start with a CV. It started with a portfolio website I built by hand, and it opened doors a CV never could. That made me wonder: why doesn’t everyone have one? Most people I meet still send a CV, but I believe the future is links: one page that shows who you are and what you’ve done, that you can share anywhere.",
    "The hard part is keeping it alive. Building a website is difficult if you don’t code, and updating it is the job everyone puts off. When I first had the idea, the technology to make that easy didn’t exist. Now it does, so I built Fuccura with it: designs drawn for every kind of work, an editor where you just click and type, and AI helpers that keep your site up to date while the words stay yours.",
    "Fuccura is for people who don’t want to code. You should be able to see your website live, for free, in minutes, and update it as easily as sending a message. Seeing your own site live is a different feeling. I want everyone to have it.",
    "My promise: the templates stay free to download, a basic site stays free, and I’ll always be straight with you about what costs money and why. AI and servers cost real money, and paid plans keep Fuccura independent and growing. Have an idea or need something custom? Get in touch. I take on personal and custom projects too.",
  ],
  principles: [
    {
      title: "Free to start, fair after",
      body: "Every template is free to download, and a basic site is free. Pro is one small payment for a year.",
    },
    {
      title: "Your work, your address",
      body: "Your own domain, your own words, and an export of everything whenever you want it.",
    },
    {
      title: "It keeps itself current",
      body: "New projects, talks and roles are found for you. You approve them with one click.",
    },
    { title: "A person replies", body: "Messages are answered by the person who builds the product: me." },
  ],
  timeline: [
    { year: "Before", text: "My career began with a portfolio I built by hand." },
    {
      year: "2026",
      text: "Fuccura launches: 50+ designs drawn for different jobs, AI helpers, and your own domain.",
    },
  ],
} as const;
