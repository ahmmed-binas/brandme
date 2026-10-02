import { revalidatePath } from "next/cache";
import { readJson, route } from "@/lib/api/http";
import { refusal, requireViewer } from "@/lib/community/http";
import { createPost, decodeImages } from "@/lib/community/repository";
import { isPostKind } from "@/lib/community/rules";

/** Create a suggestion, review or design submission. Refusals return 422/429 with a reason and code. */
export const POST = route(async (request: Request) => {
  const viewer = await requireViewer();
  if (viewer instanceof Response) return viewer;
  const body = await readJson(request, 4_200_000);
  if (body instanceof Response) return body;
  const { kind, title, body: text, rating, link, images } = (body ?? {}) as Record<string, unknown>;
  if (!isPostKind(kind)) return refusal(422, "invalid", "Choose what you’re posting: a suggestion, a review or a design.");
  const decoded = decodeImages(images);
  if (!decoded) return refusal(422, "invalid", "Images must be PNG, JPEG, WebP or GIF, at most 3, each under about 1 MB after compression.");
  const result = await createPost(viewer, { kind, title: String(title ?? ""), body: String(text ?? ""), rating: typeof rating === "number" ? rating : null, link: typeof link === "string" ? link : null }, decoded);
  if (!result.ok) return refusal(result.status, result.code, result.error);
  if (result.post.status === "published") revalidatePath("/community");
  return Response.json({ post: result.post, held: result.verdict.outcome === "hold" ? result.verdict.reason : null }, { status: 201 });
});
