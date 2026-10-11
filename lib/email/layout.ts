import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/site";

/**
 * The look of every Fuccura email: a dark band with the logo, a light card,
 * and a small footer. Email apps ignore most modern CSS, so this is plain
 * tables with inline styles (works in Gmail, Outlook, Apple Mail, and Gmail's
 * dark mode, because the logo sits on its own dark band).
 *
 * The logo is public/brand/email-logo.png (cream wordmark, 2x for sharp screens).
 */

export const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );

const COLOURS = {
  ink: "#15140f",
  paper: "#f4f0e8",
  card: "#fffdf8",
  rule: "#e3ddd0",
  soft: "#6b665a",
  gold: "#e0a43a",
};

export interface EmailParts {
  /** The grey preview line inboxes show next to the subject. */
  preheader: string;
  /** Already-escaped HTML for the card's body. */
  body: string;
  /** Plain text shown under the card (escaped here). */
  footer: string;
  /** An optional link under the footer text, e.g. email preferences. */
  footerLink?: { label: string; url: string };
}

export function renderEmail({ preheader, body, footer, footerLink }: EmailParts): string {
  const { ink, paper, card, rule, soft } = COLOURS;
  const link = footerLink
    ? ` <a href="${escape(footerLink.url)}" style="color:${soft}">${escape(footerLink.label)}</a>`
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${paper};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${ink}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escape(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${paper}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate">
<tr><td style="background:${ink};border-radius:16px 16px 0 0;padding:22px 28px">
<a href="${siteUrl}" style="text-decoration:none"><img src="${siteUrl}/brand/email-logo.png" width="148" height="40" alt="${escape(brand.name.toLowerCase())}" style="display:block;border:0"></a>
</td></tr>
<tr><td style="background:${card};border:1px solid ${rule};border-top:0;border-radius:0 0 16px 16px;padding:30px 28px 26px;font-size:15px;line-height:1.6">
${body}
</td></tr>
<tr><td style="padding:18px 8px 0;font-size:12px;line-height:1.55;color:${soft};text-align:center">
${escape(footer)}${link}<br><a href="${siteUrl}" style="color:${soft}">fuccura.com</a> · Dubai, UAE
</td></tr>
</table></td></tr></table></body></html>`;
}

/** A paragraph of escaped text. */
export const paragraph = (text: string) => `<p style="margin:0 0 16px">${linkify(escape(text))}</p>`;

/** A rounded dark button. */
export const button = (label: string, url: string) =>
  `<p style="margin:24px 0 6px"><a href="${escape(url)}" style="display:inline-block;background:${COLOURS.ink};color:${COLOURS.paper};text-decoration:none;padding:13px 22px;border-radius:999px;font-size:14px;font-weight:600">${escape(label)}</a></p>`;

/** Makes web addresses in already-escaped text clickable. */
function linkify(html: string): string {
  return html.replace(
    /(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g,
    (url) => `<a href="${url}" style="color:${COLOURS.ink}">${url}</a>`,
  );
}

/**
 * Turns plain text (as the owner's agent writes it) into email HTML:
 * blank lines separate paragraphs; lines starting with "1." or "-"/"•"
 * become lists; short lines ending in ":" become small headings.
 */
export function textToHtml(text: string): string {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trimEnd());
      const items = (pattern: RegExp) => lines.filter((line) => pattern.test(line.trim()));
      const numbered = /^\d+[.)]\s+/;
      const bulleted = /^[-•*]\s+/;
      const heading = lines.length > 1 && /^[^.]{2,60}:$/.test(lines[0]!.trim()) ? lines.shift()! : null;
      const title = heading
        ? `<p style="margin:22px 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${COLOURS.soft};font-weight:600">${escape(heading.replace(/:$/, ""))}</p>`
        : "";
      const listOf = (tag: "ol" | "ul", pattern: RegExp) => {
        // Indented lines belong to the item above them.
        const merged: string[] = [];
        for (const line of lines) {
          if (pattern.test(line.trim()) || !merged.length) merged.push(line.trim().replace(pattern, ""));
          else merged[merged.length - 1] += `<br>${linkify(escape(line.trim()))}`;
        }
        return `${title}<${tag} style="margin:0 0 16px;padding-left:22px">${merged
          .map(
            (item) =>
              `<li style="margin:0 0 8px">${item.includes("<br>") ? linkifyFirst(item) : linkify(escape(item))}</li>`,
          )
          .join("")}</${tag}>`;
      };
      if (lines.length && items(numbered).length && numbered.test(lines[0]!.trim()))
        return listOf("ol", numbered);
      if (lines.length && items(bulleted).length && bulleted.test(lines[0]!.trim()))
        return listOf("ul", bulleted);
      return `${title}<p style="margin:0 0 16px">${lines.map((line) => linkify(escape(line))).join("<br>")}</p>`;
    })
    .join("\n");
}

/** For a merged list item: escape the first line only (later lines were escaped when merged). */
function linkifyFirst(item: string): string {
  const [first, ...rest] = item.split("<br>");
  return [linkify(escape(first!)), ...rest].join("<br>");
}
