import { brand } from "@/lib/brand";
import { FREE_DOMAIN_UP_TO, PRICES, aed } from "@/lib/offers";
import { siteUrl } from "@/lib/site";
import type { Role } from "@/lib/templates/roles";

/**
 * Search-engine extras for the job-title pages (/for and /for/<role>): a plain FAQ
 * written from each job's real sample content, and the matching structured data.
 * Search Console showed /for earning its first impressions (October 2026).
 */

export interface FaqEntry {
  question: string;
  answer: string;
}

const list = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/**
 * “How to make a <job> portfolio website”, as five short steps. Shown on the
 * page and summed up in the FAQ, so search and AI answers can quote it.
 */
export function roleSteps(role: Role): string[] {
  const credentials = role.starter.education.slice(0, 2).map(([title]) => title);
  return [
    `Pick a design made for ${role.plural}. Each one opens with sample content written for the job, so you start from a full page, not a blank one.`,
    `Replace the sample with your own words: one line on what you do, your services and prices, and two or three results in numbers.`,
    `Add proof: reviews from people you’ve worked with${credentials.length ? `, and credentials such as ${list(credentials)}` : ", and your qualifications"}.`,
    `Give people one clear way to reach you, like WhatsApp, email or a booking link.`,
    `Publish free at a ${brand.name} address and share the link on your CV, LinkedIn and email signature. Add your own domain with Pro whenever you like.`,
  ];
}

/** Extra questions for real estate jobs, with what clients in the UAE look for. */
function realEstateFaq(role: Role): FaqEntry[] {
  if (role.profession !== "realestate") return [];
  return [
    {
      question: `What should a ${role.label.toLowerCase()} website in Dubai include?`,
      answer: `Your name, photo and agency; your RERA broker number (BRN); the areas and property types you cover; current listings with a WhatsApp button on each; reviews from buyers, sellers or tenants; and the languages you speak. ${brand.name} has five real estate designs built around listings, and the Agent plan (${aed(PRICES.agentMonth)} a month) adds listing pages and changes done for you.`,
    },
  ];
}

/** Questions people search about a portfolio for this job, answered from its sample content. */
export function roleFaq(role: Role): FaqEntry[] {
  const services = role.starter.services.slice(0, 3).map(([title]) => title.toLowerCase());
  const skills = role.starter.skills.split(" · ").slice(0, 4);
  const credentials = role.starter.education.slice(0, 2).map(([title]) => title);
  return [
    {
      question: `What should a ${role.label.toLowerCase()} portfolio include?`,
      answer: `Lead with what you do and who it’s for, then your services (for example ${list(services)}), your credentials${credentials.length ? ` (${list(credentials)})` : ""}, key skills such as ${list(skills)}, reviews from people you’ve worked with, and one clear way to contact you, like WhatsApp or a booking link.`,
    },
    {
      question: `Do ${role.plural} need a personal website?`,
      answer: `It helps. A website is the one link you can share everywhere, it shows up when people search your name, and it says more than a CV or a social profile: what you offer, what it costs and why people trust you. ${brand.name} makes one in minutes, written for ${role.plural}.`,
    },
    {
      question: `Is a ${role.label.toLowerCase()} portfolio website free?`,
      answer: `Yes. The standard designs are free, and your website stays online at a free ${brand.name} address. Pro unlocks the 3D designs and puts your site on your own domain for ${aed(PRICES.proMonth)} a month, or ${aed(PRICES.proYear)} a year with the first year’s domain free (up to ${aed(FREE_DOMAIN_UP_TO)}).`,
    },
    {
      question: `How do I make a ${role.label.toLowerCase()} portfolio website?`,
      answer: `In five steps: pick a design made for ${role.plural}, replace the sample with your own services and results, add reviews and credentials, add one clear way to contact you, then publish free and share the link.`,
    },
    {
      question: `How do recruiters find a ${role.label.toLowerCase()} portfolio?`,
      answer: `Many search Google for the job title with words like “portfolio” and “open to work”. ${brand.name} titles your published page with your name and job (for example “Sara Khan, ${role.label}: Portfolio”), and the “Open to work” switch in the editor adds a badge and puts “Open to work” in that title.`,
    },
    ...realEstateFaq(role),
    {
      question: "Can I edit it without coding?",
      answer: `Yes. Click any text or photo to change it, pick colours and fonts, and publish. The sample content for ${role.plural} gets you most of the way; you replace it with your own.`,
    },
  ];
}

export const faqSchema = (faq: FaqEntry[]) => ({
  "@type": "FAQPage",
  mainEntity: faq.map((entry) => ({
    "@type": "Question",
    name: entry.question,
    acceptedAnswer: { "@type": "Answer", text: entry.answer },
  })),
});

/** Home › Job titles › <job>, or Home › Job titles. */
export const roleBreadcrumbs = (role?: Role) => ({
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: brand.name, item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Portfolio websites by job", item: `${siteUrl}/for` },
    ...(role
      ? [
          {
            "@type": "ListItem",
            position: 3,
            name: `Portfolio website for ${role.plural}`,
            item: `${siteUrl}/for/${role.id}`,
          },
        ]
      : []),
  ],
});

/** Home › Portfolio websites by job › <job> › <template>, for /for/<job>/<template>. */
export const roleTemplateBreadcrumbs = (role: Role, templateTitle: string, templateSlug: string) => ({
  "@type": "BreadcrumbList",
  itemListElement: [
    ...roleBreadcrumbs(role).itemListElement,
    {
      "@type": "ListItem",
      position: 4,
      name: `${templateTitle} for ${role.plural}`,
      item: `${siteUrl}/for/${role.id}/${templateSlug}`,
    },
  ],
});
