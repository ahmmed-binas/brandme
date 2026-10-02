import { readFile } from "node:fs/promises";
import path from "node:path";
import { strToU8, zipSync, type Zippable } from "fflate";
import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/site";
import type { StandardContent } from "@/lib/portfolio/schema";
import { sampleFor } from "./samples";
import type { TemplateDefinition } from "./types";

/**
 * Turns a studio template into a free, standalone project anyone can download:
 * Vite + React + Tailwind, the template's own component, the shared kit, its
 * sample content as JSON and the images it uses. No Formora account, server or
 * database is needed to run it. Zips are built on first request and cached.
 */

const ROOT = process.cwd();
const STUDIO = path.join(ROOT, "components/templates/studio");
const cache = new Map<string, Uint8Array>();

export const LICENSE_NAME = "MIT";

/** "./realestate/Residence" for a template id, read from the registry so it never drifts. */
async function componentPath(id: string): Promise<string | null> {
  const registry = await readFile(path.join(STUDIO, "registry.tsx"), "utf8");
  const match = registry.match(new RegExp(`["']?${id}["']?:\\s*load\\(\\(\\) => import\\("\\./([^"]+)"\\)\\)`));
  return match ? match[1]! : null;
}

const stripClient = (source: string) => source.replace(/^"use client";\n+/, "");

/** The few app types the kit needs, so the download has no other dependencies. */
const TYPES = `/** Content and design types used by the template. */
export type SectionKey = "about" | "projects" | "experience" | "skills" | "education" | "services" | "testimonials" | "highlights" | "gallery" | "stats" | "contact";

export interface Palette { id: string; name: string; bg: string; fg: string; accent: string; muted: string; surface: string }
export interface FontPairing { id: string; name: string; display: string; text: string; mono?: string }

/** Which sections the template shows, and its colour and type options. */
export interface TemplateDefinition { id: string; name: string; sections?: SectionKey[]; palettes?: Palette[]; fonts?: FontPairing[] }

type Item<T> = Partial<T>;
export interface StandardContent {
  name?: string; professional_title?: string; tagline?: string; summary?: string[];
  email?: string; phone?: string; location?: string; availability?: string;
  avatar?: string; cover?: string; website?: string; github?: string; linkedin?: string; instagram?: string;
  skills?: string[];
  projects?: Item<{ title: string; description: string; client: string; year: string; role: string; category: string; image: string; technologies: string[]; live_url: string; github: string }>[];
  experience?: Item<{ job_title: string; company: string; location: string; start_date: string; end_date: string; description: string; technologies: string[]; website: string }>[];
  education?: Item<{ school: string; degree: string; start_date: string; end_date: string; description: string }>[];
  services?: Item<{ title: string; description: string; price: string }>[];
  testimonials?: Item<{ quote: string; name: string; role: string }>[];
  highlights?: Item<{ title: string; detail: string; year: string; url: string }>[];
  gallery?: Item<{ image: string; caption: string; year: string }>[];
  stats?: Item<{ value: string; label: string }>[];
  links?: Item<{ label: string; url: string }>[];
  design?: { palette?: string; font?: string; accent?: string; hidden?: SectionKey[]; labels?: Partial<Record<SectionKey, string>> };
}
`;

function readme(template: TemplateDefinition, componentName: string) {
  return `# ${template.name}: a free portfolio template

${template.description}

Designed by ${brand.name} Studio. Free to use for yourself or your clients under the ${LICENSE_NAME} licence (see LICENSE).

Want it without touching code? Open it in the ${brand.name} editor, click any text to change it, and publish on your own domain:
${siteUrl}/editor/${template.id}

## Run it

You need Node.js 20 or newer (nodejs.org).

\`\`\`bash
npm install
npm run dev        # opens http://localhost:5173
\`\`\`

## Make it yours

1. **Your words:** edit \`src/content.json\` (name, title, introduction, projects, services, contact…). Leave a section empty and it disappears.
2. **Your images:** put them in \`public/\` and use their path, e.g. \`"/me.jpg"\`, or any https:// image link.
3. **Colours and fonts:** in \`src/content.json\` set \`design.palette\` to one of the ids in \`src/template.json\` (\`${(template.palettes ?? []).map((palette) => palette.id).join("`, `")}\`) and \`design.font\` to one of (\`${(template.fonts ?? []).map((font) => font.id).join("`, `")}\`). \`design.accent\` takes any hex colour, e.g. \`"#d4380d"\`.
4. **Hide a section:** add its name to \`design.hidden\`, e.g. \`["testimonials"]\`.
5. **The layout itself** lives in \`src/template/${componentName}.tsx\` (React + Tailwind CSS).

## Put it online (free)

\`\`\`bash
npm run build      # creates the dist/ folder
\`\`\`

Upload \`dist/\` to any static host: Netlify Drop (drag the folder onto app.netlify.com/drop), Cloudflare Pages, GitHub Pages or Vercel. Then connect your domain in that host's settings.

Prefer us to host it, keep it updated and handle the domain? ${siteUrl}/pricing
`;
}

const LICENSE = (year: number) => `MIT License

Copyright (c) ${year} ${brand.name}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

/** Every local image the sample content points at ("/samples/x.webp"). */
function localImages(content: StandardContent): string[] {
  const found = new Set<string>();
  const visit = (value: unknown) => {
    if (typeof value === "string") { if (/^\/[\w./-]+\.(webp|png|jpe?g|gif|svg)$/i.test(value)) found.add(value); }
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") Object.values(value).forEach(visit);
  };
  visit(content);
  return [...found];
}

export async function templateZip(template: TemplateDefinition): Promise<Uint8Array | null> {
  if (template.collection !== "studio") return null;
  const cached = cache.get(template.id);
  if (cached) return cached;
  const relative = await componentPath(template.id);
  if (!relative) return null;
  const componentName = path.basename(relative);
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8")) as { dependencies: Record<string, string> };
  const source = await readFile(path.join(STUDIO, `${relative}.tsx`), "utf8");
  const fonts = [...new Set([...source.matchAll(/import "(@fontsource(?:-variable)?\/[^/"]+)[^"]*";/g)].map((match) => match[1]!))];
  const usesMotion = source.includes('from "../motion"');
  const content = sampleFor(template);
  const folder = `${template.id}-portfolio-template`;
  const files: Zippable = {};
  const add = (name: string, data: string | Uint8Array) => { files[`${folder}/${name}`] = typeof data === "string" ? strToU8(data) : data; };

  add("package.json", JSON.stringify({
    name: `${template.id}-portfolio`, private: true, version: "1.0.0", type: "module", license: LICENSE_NAME,
    scripts: { dev: "vite --open", build: "vite build", preview: "vite preview" },
    dependencies: { react: pkg.dependencies.react, "react-dom": pkg.dependencies["react-dom"], ...Object.fromEntries(fonts.map((name) => [name, pkg.dependencies[name] ?? "^5.3.0"])) },
    devDependencies: { "@tailwindcss/vite": "^4.1.0", "@types/react": "^19.0.0", "@types/react-dom": "^19.0.0", "@vitejs/plugin-react": "^5.0.0", tailwindcss: "^4.1.0", typescript: "^5.6.0", vite: "^7.0.0" },
  }, null, 2) + "\n");
  add("vite.config.ts", `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({ plugins: [react(), tailwindcss()] });\n`);
  add("tsconfig.json", JSON.stringify({ compilerOptions: { target: "ES2022", lib: ["ES2022", "DOM", "DOM.Iterable"], module: "ESNext", moduleResolution: "bundler", jsx: "react-jsx", strict: true, resolveJsonModule: true, skipLibCheck: true, noEmit: true, allowImportingTsExtensions: false }, include: ["src"] }, null, 2) + "\n");
  add("index.html", `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <link rel="icon" href="data:," />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${content.name ?? template.name} — ${content.professional_title ?? "Portfolio"}</title>\n    <meta name="description" content="${(content.tagline ?? template.description).replace(/"/g, "&quot;")}" />\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`);
  add("src/index.css", `@import "tailwindcss";\n\nhtml, body, #root { margin: 0; min-height: 100%; }\n`);
  add("src/main.tsx", `import { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport "./index.css";\nimport Template from "./template/${componentName}";\nimport content from "./content.json";\nimport template from "./template.json";\nimport type { StandardContent, TemplateDefinition } from "./template/types";\n\ncreateRoot(document.getElementById("root")!).render(\n  <StrictMode>\n    <Template content={content as StandardContent} template={template as TemplateDefinition} />\n  </StrictMode>,\n);\n`);
  add("src/content.json", JSON.stringify(content, null, 2) + "\n");
  add("src/template.json", JSON.stringify({ id: template.id, name: template.name, sections: template.sections, palettes: template.palettes, fonts: template.fonts }, null, 2) + "\n");
  add("src/template/types.ts", TYPES);
  add(`src/template/${componentName}.tsx`, stripClient(source).replace(/from "\.\.\/(kit|motion)"/g, 'from "./$1"'));
  add("src/template/kit.tsx", stripClient(await readFile(path.join(STUDIO, "kit.tsx"), "utf8")).replace(/from "@\/lib\/portfolio\/schema"|from "@\/lib\/templates\/types"/g, 'from "./types"'));
  if (usesMotion) add("src/template/motion.tsx", stripClient(await readFile(path.join(STUDIO, "motion.tsx"), "utf8")));
  add("src/template/studio.css", await readFile(path.join(STUDIO, "studio.css"), "utf8"));
  for (const image of localImages(content)) {
    try { add(`public${image}`, new Uint8Array(await readFile(path.join(ROOT, "public", image)))); } catch { /* a missing sample image just shows the placeholder */ }
  }
  add("README.md", readme(template, componentName));
  add("LICENSE", LICENSE(new Date().getFullYear()));
  // Images are already compressed; store them, deflate the text.
  const zip = zipSync(files, { level: 6, mtime: new Date("2026-10-01T00:00:00Z") });
  cache.set(template.id, zip);
  return zip;
}
