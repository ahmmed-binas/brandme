import { getAsset } from "@/lib/assets/repository";
import { databaseConfigured } from "@/utils/db-schema";

const FILE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpg|png|webp|gif)$/;

/** Serves an uploaded image. Ids are unguessable and images never change, so they cache forever. */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const match = FILE.exec((await params).file);
  if (!match || !databaseConfigured()) return new Response("Not found", { status: 404 });
  const asset = await getAsset(match[1]!).catch(() => null);
  if (!asset) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
