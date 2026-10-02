import { jsonError, route } from "@/lib/api/http";
import { MAX_ASSET_BYTES, saveAsset } from "@/lib/assets/repository";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

/** Uploads one image (the raw bytes as the request body). Returns its URL. */
export const POST = route(async (request: Request) => {
  if (!databaseConfigured()) return jsonError(503, "Image uploads are not configured on this server.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to upload images.");
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_ASSET_BYTES) return jsonError(413, "That image is too large. Try a smaller one.");
  const bytes = Buffer.from(await request.arrayBuffer());
  if (!bytes.length) return jsonError(422, "No image was received.");
  const result = await saveAsset(user, bytes);
  if (!result.ok) return jsonError(result.status, result.error);
  return Response.json({ url: result.url }, { status: 201 });
});
