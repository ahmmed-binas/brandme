import { verifyEmail } from "@/lib/accounts/passwords";
import { siteUrl } from "@/lib/site";

/** The link in the verification email. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const ok = token.length > 20 && await verifyEmail(token).catch(() => false);
  return Response.redirect(`${siteUrl}/account?verified=${ok ? "1" : "expired"}`, 303);
}
