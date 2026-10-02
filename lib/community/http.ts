import { jsonError } from "@/lib/api/http";
import { databaseConfigured } from "@/utils/db-schema";
import { getViewer } from "./viewer";

/** Signed-in viewer, or the response explaining why not. */
export async function requireViewer({ moderator = false } = {}) {
  if (!databaseConfigured()) return jsonError(503, "The community board isn’t set up on this server yet.");
  const viewer = await getViewer();
  if (!viewer) return jsonError(401, "Sign in to take part.");
  if (moderator && !viewer.isModerator) return jsonError(403, "Only moderators can do that.");
  return viewer;
}

/** Refusals carry a machine-readable code so the UI can keep the author's text and explain. */
export const refusal = (status: number, code: string, error: string) => Response.json({ error, code }, { status });
