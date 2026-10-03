import { getCurrentUser } from "@/utils/user-account";
import { databaseConfigured } from "@/utils/db-schema";
import type { Viewer } from "./repository";

/** The signed-in visitor as the community board sees them, or null. */
export async function getViewer(): Promise<(Viewer & { email: string | null }) | null> {
  if (!databaseConfigured()) return null;
  const user = await getCurrentUser();
  return user ? { id: user.id, email: user.email, isModerator: user.isAdmin } : null;
}
