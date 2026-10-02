import { checkText, SubmissionError, type Upload } from "./submissions";

const MAX_REQUEST = 40 * 1024 * 1024;

/** Reads the multipart submission form: text fields plus cover, clip and zip files. */
export async function readUpload(request: Request, requireFiles: boolean): Promise<Upload> {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_REQUEST) throw new SubmissionError("The upload is too large. Keep the ZIP under 20 MB and the clip under 12 MB.");
  let form: FormData;
  try { form = await request.formData(); } catch { throw new SubmissionError("The upload didn’t arrive complete. Please try again."); }
  const raw = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string")) as Record<string, string>;
  const file = async (name: string) => {
    const value = form.get(name);
    if (!(value instanceof File) || value.size === 0) return null;
    return { data: new Uint8Array(await value.arrayBuffer()), mime: value.type };
  };
  if (raw.owns !== "yes") throw new SubmissionError("Please confirm the design is your own work and you’re happy to share it.", "owns");
  const [cover, clip, zip] = await Promise.all([file("cover"), file("clip"), file("zip")]);
  if (requireFiles && !cover) throw new SubmissionError("Add a cover image.", "cover");
  if (requireFiles && !zip) throw new SubmissionError("Add the template as a ZIP file.", "zip");
  return { text: checkText(raw), cover, clip, zip: zip?.data ?? null, removeClip: raw.removeClip === "yes" };
}
