import { bookingUrl } from "@/lib/booking";
import { brand, toolGroups } from "@/lib/brand";
import { siteUrl } from "@/lib/site";
import { OFFERS, FOUNDING_SPOTS, PRICES, aed } from "@/lib/offers";
import { availableTemplates } from "@/lib/templates/approval";
import { ROLES } from "@/lib/templates/roles";
import { PROFESSIONS } from "@/lib/templates/types";

/**
 * /llms.txt: a plain summary of Kitefolio for AI assistants and answer engines
 * (ChatGPT, Claude, Perplexity, Google's AI answers). Format: llmstxt.org.
 *
 * Built from the same sources as the site (prices from lib/offers.ts, tools
 * from lib/brand.ts, job titles from lib/templates/roles), so it never drifts
 * from what the pages say. Only state facts that are true today.
 */
export const revalidate = 3600;

const url = (path: string) => `${siteUrl}${path}`;
const item = (label: string, path: string, note: string) => `- [${label}](${url(path)}): ${note}`;

function plans(): string[] {
  return OFFERS.map((offer) => {
    const price = `${offer.price} ${offer.per}${offer.alternative ? ` (${offer.alternative})` : ""}`;
    return `- **${offer.name}**, ${price}: ${offer.pitch} Includes: ${offer.features.join("; ")}.`;
  });
}

function tools(): string[] {
  return toolGroups.flatMap((group) =>
    group.items
      .filter((tool) => tool.href.startsWith("/tools"))
      .map((tool) => item(tool.label, tool.href, tool.hint)),
  );
}

async function text(): Promise<string> {
  const templates = await availableTemplates();
  const professions = PROFESSIONS.map((profession) => profession.label).join(", ");
  return [
    `# ${brand.name}`,
    "",
    `> ${brand.name} is a website and portfolio builder for professionals, based in Dubai, UAE. ` +
      `People pick a template designed for their job, fill it by clicking the text in a live preview, ` +
      `and publish free at a ${brand.name} address, or on their own domain with Pro. ` +
      `It is built first for UAE real estate agents, and has job-specific templates for ${ROLES.length} job titles.`,
    "",
    "Key facts:",
    `- Free plan: one live website with a blog, every template, colour and font. A small “Made with ${brand.name}” link is shown.`,
    `- Prices are in UAE dirhams (AED). Paid plans currently start on WhatsApp; there is no online checkout yet.`,
    `- ${templates.length} website templates are live, including a real estate collection for UAE agents.`,
    `- Published portfolios can show an “Open to work” badge for recruiters.`,
    `- Contact: ${url("/contact")} or WhatsApp +${brand.whatsapp}.`,
    "",
    "## Plans and prices",
    "",
    ...plans(),
    `- **Founding members**: the first ${FOUNDING_SPOTS} customers get Pro for ${aed(PRICES.foundingYear)} a year, price locked.`,
    item("Pricing", "/pricing", "every plan compared, with competitors' prices"),
    "",
    "## Build a website",
    "",
    item("Templates", "/templatechooser", "choose a design and start editing, free"),
    item("Websites by job title", "/for", `portfolio templates and examples for ${professions}`),
    item("Free template gallery", "/gallery", "templates to download free"),
    item("Done for you", "/pricing", `we build the whole site in 48 hours for ${aed(PRICES.doneForYou)}`),
    // Only when Cal.com is set up; otherwise /book just redirects to /contact.
    ...(bookingUrl()
      ? [item("Book a free call", "/book", "a free video call to talk through your website")]
      : []),
    "",
    "## Free tools",
    "",
    ...tools(),
    "",
    "## About",
    "",
    item("About", "/about", `who runs ${brand.name} and why`),
    item("Journal", "/blog", "articles on portfolios, personal websites and getting found"),
    item(
      "Inspector Iqbal",
      "/agents/investigator",
      "checks your own public profiles and keeps your site up to date",
    ),
    "",
    "## Optional",
    "",
    item("Community", "/community", "questions and answers from users"),
    item("Domains", "/domains", "buy or connect your own domain"),
    item("Privacy", "/privacy", "what we collect and why"),
    item("Terms", "/terms", "terms of service"),
    "",
  ].join("\n");
}

export async function GET() {
  return new Response(await text(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
