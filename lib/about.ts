/**
 * Content for the About page. Replace the placeholders with your own story,
 * then set `placeholder` to false (it hides the "edit me" note admins see).
 * A portrait can go in public/about/ and be referenced as "/about/you.jpg".
 */
export const about = {
  placeholder: true,
  founder: {
    name: "Your Name",
    role: "Founder",
    location: "Your city",
    portrait: "" as string, // e.g. "/about/portrait.jpg"
    email: "hello@yourdomain.com",
    links: [{ label: "LinkedIn", url: "https://www.linkedin.com/" }, { label: "GitHub", url: "https://github.com/" }],
  },
  headline: "I built Formora because a good portfolio shouldn’t be a weekend project every year.",
  letter: [
    "Write a few paragraphs here about why you started Formora: the moment you realised updating a portfolio was a chore everyone put off, and what you wanted instead.",
    "Say who it’s for, in plain words: developers, designers, photographers, researchers, anyone whose work deserves a proper home on the web.",
    "End with a promise you intend to keep, for example that prices stay low, that people’s work is never held hostage, and that a person answers every support message.",
  ],
  principles: [
    { title: "Cheap enough to forget", body: "One small payment a year, or five years at once. Your portfolio shouldn’t be a monthly bill." },
    { title: "Your work, your address", body: "Your own domain, your own words, and an export of everything whenever you want it." },
    { title: "It keeps itself current", body: "New projects, talks and roles are found for you. You approve them with one click." },
    { title: "A person replies", body: "Support is answered by the people who build the product." },
  ],
  timeline: [
    { year: "2025", text: "The first version, built for a handful of friends." },
    { year: "2026", text: "Thirty-five templates for different professions, custom domains and automatic updates." },
  ],
} as const;
