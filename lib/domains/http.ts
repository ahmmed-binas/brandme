import { jsonError } from "@/lib/api/http";
import { DomainError } from "./service";
import { VercelError } from "./vercel";

/** Turns domain-layer failures into user-facing JSON errors. */
export function domainErrorResponse(error: unknown): Response {
  if (error instanceof DomainError) return jsonError(error.status, error.message);
  if (error instanceof VercelError) {
    console.error("Vercel domain API error", error.status, error.code, error.message);
    return jsonError(error.status === 409 || error.status === 400 ? 409 : 502, error.status === 409 || error.status === 400 ? error.message : "The domain service is unavailable right now. Please try again.");
  }
  throw error;
}
