import { MAX_IMAGE_DATA_URL_LENGTH } from "@/lib/portfolio/schema";

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_EDGE = 1600;

/**
 * Downscales and re-encodes an uploaded image in the browser so portfolios
 * stay small enough to save. Phone photos are often 5–10 MB; the result is
 * typically 150–400 KB. Re-encoding also strips EXIF metadata such as GPS.
 */
export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") throw new Error("Choose a PNG, JPEG, WebP, or GIF image.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("That image is larger than 15 MB. Choose a smaller one.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not process that image.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.82, 0.7, 0.55, 0.4]) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH) return dataUrl;
  }
  throw new Error("That image is too detailed to store. Try a smaller or simpler image.");
}

/**
 * Downsizes an image and, for signed-in users, uploads it so the portfolio
 * stores a short URL instead of the image itself. Signed-out drafts keep the
 * image inline (they live only in this browser until the person signs in).
 */
export async function prepareImage(file: File, signedIn: boolean): Promise<string> {
  const dataUrl = await compressImage(file);
  if (!signedIn) return dataUrl;
  const blob = await (await fetch(dataUrl)).blob();
  const response = await fetch("/api/assets", { method: "POST", headers: { "Content-Type": blob.type }, body: blob });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) return dataUrl;
  if (!response.ok) throw new Error(body.error ?? "That image couldn’t be uploaded. Please try again.");
  return body.url as string;
}
