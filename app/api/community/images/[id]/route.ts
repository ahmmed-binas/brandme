import { route } from "@/lib/api/http";
import { getImage } from "@/lib/community/repository";
import { getViewer } from "@/lib/community/viewer";

/** Serves a design image. Images of unpublished posts are visible only to their author and moderators. */
export const GET = route(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const image = await getImage((await params).id, await getViewer());
  if (!image) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mime,
      "Cache-Control": image.isPublic ? "public, max-age=86400" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
});
