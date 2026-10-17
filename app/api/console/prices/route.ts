import { revalidatePath } from "next/cache";
import { jsonError, readJson, route } from "@/lib/api/http";
import { savePrices } from "@/lib/settings/prices";
import { getCurrentUser } from "@/utils/user-account";

/**
 * Superadmin only: saves the plan prices (Console > Catalog). Send the prices as
 * { proMonth, proYear, … } in AED; anything missing or out of range keeps its default.
 * Every page shows the new prices straight away.
 */
export const POST = route(async (request: Request) => {
  const user = await getCurrentUser();
  if (!user?.isSuperadmin) return jsonError(404, "Not found.");
  const body = await readJson(request, 2_000);
  if (body instanceof Response) return body;
  const prices = await savePrices(body, user.id);
  revalidatePath("/", "layout");
  return Response.json({ prices });
});
