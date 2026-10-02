import type { ReactNode } from "react";

/**
 * A small Markdown renderer for blog posts. It builds React elements (never
 * raw HTML), so anything a writer types is shown as text and cannot run as
 * script. Supported: ## and ### headings, paragraphs, - and 1. lists,
 * > quotes, --- rules, ![alt](image), **bold**, *italic*, `code` and
 * [links](https://…). Unsafe link targets are dropped.
 */

const SAFE_URL = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i;
export const safeUrl = (url: string) => (SAFE_URL.test(url.trim()) ? url.trim() : null);

const INLINE = /(\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|_([^_\s][^_]*)_|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\))/g;

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const k = `${key}-${index++}`;
    if (match[2] !== undefined) out.push(<strong key={k}>{inline(match[2], k)}</strong>);
    else if (match[3] !== undefined || match[4] !== undefined) out.push(<em key={k}>{inline(match[3] ?? match[4]!, k)}</em>);
    else if (match[5] !== undefined) out.push(<code key={k}>{match[5]}</code>);
    else {
      const href = safeUrl(match[7]!);
      const external = href && /^https?:/i.test(href);
      out.push(href ? <a key={k} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{inline(match[6]!, k)}</a> : match[6]);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { kind: "h2" | "h3" | "p" | "quote"; text: string }
  | { kind: "ul" | "ol"; items: string[] }
  | { kind: "img"; alt: string; src: string }
  | { kind: "hr" };

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  let paragraph: string[] = [];
  const flush = () => { if (paragraph.length) blocks.push({ kind: "p", text: paragraph.join(" ") }); paragraph = []; };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) { flush(); continue; }
    let match: RegExpMatchArray | null;
    if ((match = line.match(/^(#{2,3})\s+(.*)$/))) { flush(); blocks.push({ kind: match[1]!.length === 2 ? "h2" : "h3", text: match[2]! }); continue; }
    if (/^#\s+/.test(line)) { flush(); blocks.push({ kind: "h2", text: line.replace(/^#\s+/, "") }); continue; }
    if (/^(-{3,}|\*{3,})$/.test(line)) { flush(); blocks.push({ kind: "hr" }); continue; }
    if ((match = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) { flush(); const src = safeUrl(match[2]!); if (src) blocks.push({ kind: "img", alt: match[1]!, src }); continue; }
    if (/^>\s?/.test(line)) {
      flush();
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i]!.trim())) quote.push(lines[i++]!.trim().replace(/^>\s?/, ""));
      i--;
      blocks.push({ kind: "quote", text: quote.join(" ") });
      continue;
    }
    const bullet = /^[-*•]\s+/;
    const numbered = /^\d+[.)]\s+/;
    if (bullet.test(line) || numbered.test(line)) {
      flush();
      const pattern = bullet.test(line) ? bullet : numbered;
      const items: string[] = [];
      while (i < lines.length && pattern.test(lines[i]!.trim())) items.push(lines[i++]!.trim().replace(pattern, ""));
      i--;
      blocks.push({ kind: pattern === bullet ? "ul" : "ol", items });
      continue;
    }
    paragraph.push(line);
  }
  flush();
  return blocks;
}

/** Renders Markdown as React. Style it with the `prose-post` class or the parent's CSS. */
export function Markdown({ source, className = "" }: { source: string; className?: string }) {
  return <div className={className}>{parseBlocks(source).map((block, index) => {
    const key = String(index);
    switch (block.kind) {
      case "h2": return <h2 key={key}>{inline(block.text, key)}</h2>;
      case "h3": return <h3 key={key}>{inline(block.text, key)}</h3>;
      case "quote": return <blockquote key={key}><p>{inline(block.text, key)}</p></blockquote>;
      case "ul": return <ul key={key}>{block.items.map((item, i) => <li key={i}>{inline(item, `${key}-${i}`)}</li>)}</ul>;
      case "ol": return <ol key={key}>{block.items.map((item, i) => <li key={i}>{inline(item, `${key}-${i}`)}</li>)}</ol>;
      // eslint-disable-next-line @next/next/no-img-element -- writers' images from many origins
      case "img": return <figure key={key}><img src={block.src} alt={block.alt} loading="lazy" decoding="async" />{block.alt && <figcaption>{block.alt}</figcaption>}</figure>;
      case "hr": return <hr key={key} />;
      default: return <p key={key}>{inline(block.text, key)}</p>;
    }
  })}</div>;
}

/** Plain text of a Markdown body, for excerpts, meta descriptions and reading time. */
export function plainText(source: string): string {
  return parseBlocks(source)
    .map((block) => ("text" in block ? block.text : "items" in block ? block.items.join(" ") : ""))
    .join(" ")
    .replace(/\*\*|__|[*_`]/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export const readingMinutes = (source: string) => Math.max(1, Math.ceil(plainText(source).split(" ").length / 220));

/** “how-to-write-a-bio” from “How to write a bio!” */
export const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
