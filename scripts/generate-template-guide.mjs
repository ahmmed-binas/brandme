import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const output = resolve("public/guides/formora-template-and-business-guide.pdf");
const pages = [
  ["Formora", "Template & business guide", "A practical guide to adding templates, earning revenue, and safely launching accounts."],
  ["Add a template", "1. Pick a profession and original visual direction.", "2. Give Claude the contract in docs/AI_PORTFOLIO_TEMPLATE_WORKFLOW.md.", "3. Create components/templates/<template-id>/ for all template code and tokens.", "4. Add its id and metadata to lib/templates/types.ts and catalog.ts.", "5. Register it in TemplateRenderer.tsx.", "6. Verify chooser -> preview -> customize -> editor -> save -> full page.", "7. Test long content, empty lists, mobile, keyboard use, and links."],
  ["Keep templates scalable", "The catalog creates chooser cards—never create a second hard-coded card.", "Each template owns its styles, layout, animation, and navigation.", "Users edit content only: text, lists, links, images, and allowed ordering.", "Use storage/database keys prefixed with the template id.", "The preview must use exactly the same renderer as the published portfolio.", "Validate data before saving. Do not permit user CSS or scripts."],
  ["Make money", "Free: one portfolio, a few templates, local editing, Formora branding.", "Pro subscription: premium templates, no branding, multiple portfolios, export, analytics.", "One-time template packs: profession-specific designs before subscription value is proven.", "Custom domains: sell only after publishing, SSL, and DNS support are dependable.", "AI credits: sell clear outcomes such as CV-to-portfolio copy and case-study rewrites.", "Measure activation first: choice, edit, save, share, publish. Talk to early users before pricing."],
  ["Google sign-in & launch", "Google sign-in upserts profiles into PostgreSQL app_users on successful OAuth sign-in.", "Keep AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, and DATABASE_URL private.", "Google redirect URIs: localhost:3000/api/auth/callback/google and your production domain equivalent.", "Next: add portfolios owned by app_users, privacy policy, terms, deletion, monitoring, and a small paid offer.", "Reference: docs/TEMPLATE_AND_BUSINESS_GUIDE.md and docs/GOOGLE_AUTH_SETUP.md."],
];
const document = await PDFDocument.create();
const regular = await document.embedFont(StandardFonts.Helvetica);
const bold = await document.embedFont(StandardFonts.HelveticaBold);
for (const [title, ...lines] of pages) {
  const page = document.addPage([595, 842]); const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 110, width, height: 110, color: rgb(0.07, 0.09, 0.16) });
  page.drawText(title, { x: 48, y: height - 65, size: 27, font: bold, color: rgb(1, 1, 1) });
  let y = height - 155;
  for (const line of lines) {
    const words = line.split(" "); let row = ""; const rows = [];
    for (const word of words) { if ((row + " " + word).length > 74) { rows.push(row); row = word; } else row = `${row}${row ? " " : ""}${word}`; }
    rows.push(row);
    for (const rowText of rows) { page.drawText(rowText, { x: 52, y, size: 12, font: regular, color: rgb(0.15, 0.18, 0.25) }); y -= 21; }
    y -= 9;
  }
  page.drawText("Formora template system", { x: 48, y: 32, size: 9, font: regular, color: rgb(0.35, 0.38, 0.45) });
}
await mkdir(dirname(output), { recursive: true });
await writeFile(output, await document.save());
