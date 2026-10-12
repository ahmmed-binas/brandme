import { brand } from "@/lib/brand";
import { PRICES, aed } from "@/lib/offers";
import { siteUrl } from "@/lib/site";
import { getTemplate } from "@/lib/templates/catalog";
import { ROLES } from "@/lib/templates/roles";
import type { Role } from "@/lib/templates/roles";
import { PROFESSIONS } from "@/lib/templates/types";

/**
 * Search-engine and AI-answer extras for a template's gallery article: the
 * profession it was made for, the job titles it suits, a plain-language FAQ
 * and breadcrumbs, each with matching structured data (schema.org).
 */

/** The profession a studio template was drawn for, e.g. "Real estate". */
export function professionOf(templateId: string): string | null {
  const first = getTemplate(templateId)?.professions?.[0];
  return PROFESSIONS.find((profession) => profession.id === first)?.label ?? null;
}

/** Job titles that suit a template, best fit first (up to 12), for links to /for/<role>. */
export function jobsFor(templateId: string): Role[] {
  const professions = getTemplate(templateId)?.professions ?? [];
  const recommended = ROLES.filter((role) => role.templates?.includes(templateId));
  const sameField = ROLES.filter(
    (role) => role.profession === professions[0] && !role.templates?.includes(templateId),
  );
  return [...recommended, ...sameField].slice(0, 12);
}

export interface FaqEntry {
  question: string;
  answer: string;
}

/** Questions people ask about a template, answered for this one. */
export function templateFaq(input: {
  title: string;
  audience: string;
  fonts: string[];
  palettes: Array<{ name: string }>;
  editable: boolean;
}): FaqEntry[] {
  const { title, audience, fonts, palettes, editable } = input;
  const proPrice = `${aed(PRICES.proMonth)} a month`;
  const faq: FaqEntry[] = [
    {
      question: `Is the ${title} template free?`,
      answer: editable
        ? `Yes. You can download ${title} free (MIT licence) and host it yourself, or customise it in ${brand.name} and publish it free at a ${brand.name} address. Your own domain comes with Pro, from ${proPrice}.`
        : `Yes. ${title} is free to download and use under its licence.`,
    },
    { question: `Who is ${title} for?`, answer: audience },
  ];
  if (editable) {
    faq.push(
      {
        question: `Can I use ${title} without coding?`,
        answer: `Yes. In the ${brand.name} editor you click any text or photo on ${title} to change it, import your CV or LinkedIn, and publish in a few minutes. No code is needed.`,
      },
      {
        question: `Does ${title} work on phones?`,
        answer: `Yes. ${title} adapts to any screen size and was tested on phones, tablets and desktops, and with reduced motion.`,
      },
    );
  }
  if (fonts.length || palettes.length) {
    faq.push({
      question: `Can I change the colours and fonts of ${title}?`,
      answer: [
        palettes.length
          ? `It comes with ${palettes.length} colour schemes (${palettes.map((palette) => palette.name).join(", ")}).`
          : "",
        fonts.length ? `Font pairings: ${fonts.join(", ")}.` : "",
        editable ? "You switch them in the editor's Design panel." : "",
      ]
        .filter(Boolean)
        .join(" "),
    });
  }
  if (editable) {
    faq.push({
      question: `Can I switch from ${title} to another template later?`,
      answer: `Yes. Your content is kept separately from the design, so you can move to any other ${brand.name} template without retyping anything.`,
    });
  }
  return faq;
}

/** schema.org FAQPage for the questions above. */
export const faqSchema = (faq: FaqEntry[]) => ({
  "@type": "FAQPage",
  mainEntity: faq.map((entry) => ({
    "@type": "Question",
    name: entry.question,
    acceptedAnswer: { "@type": "Answer", text: entry.answer },
  })),
});

/** schema.org BreadcrumbList: Home › Templates › <template>. */
export const breadcrumbSchema = (title: string, slug: string) => ({
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: brand.name, item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Templates", item: `${siteUrl}/templatechooser` },
    { "@type": "ListItem", position: 3, name: title, item: `${siteUrl}/gallery/${slug}` },
  ],
});
