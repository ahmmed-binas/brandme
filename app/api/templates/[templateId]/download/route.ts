import { jsonError, route } from "@/lib/api/http";
import { isTemplateAvailable } from "@/lib/templates/approval";
import { getTemplate } from "@/lib/templates/catalog";
import { templateZip } from "@/lib/templates/export";
import { countDownload } from "@/lib/templates/ratings";

/** The free download: a ready-to-run project for one approved template. */
export const GET = route(async (_request: Request, { params }: { params: Promise<{ templateId: string }> }) => {
  const template = getTemplate((await params).templateId);
  if (!template || template.collection !== "studio" || !(await isTemplateAvailable(template))) return jsonError(404, "That template isn’t available to download.");
  const zip = await templateZip(template);
  if (!zip) return jsonError(404, "That template isn’t available to download.");
  await countDownload(template.id).catch(() => undefined);
  return new Response(new Blob([zip as BlobPart]), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${template.id}-portfolio-template.zip"`,
      "Content-Length": String(zip.length),
      "Cache-Control": "no-store",
    },
  });
});
