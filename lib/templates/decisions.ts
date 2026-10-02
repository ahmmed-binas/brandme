import type { ReviewStatus } from "./approval";

/**
 * The owner's review decisions, shipped with the code so a fresh deployment
 * starts with the same gallery. A decision recorded on /templates/review
 * (stored in the database) always overrides the one here.
 * Templates the owner rejected are removed from the catalog entirely; ones sent
 * back for changes (Broadsheet) wait here as pending until reviewed again.
 */
export const OWNER_DECISIONS: Record<string, { status: Exclude<ReviewStatus, "pending">; note?: string }> = {
  terminal: { status: "approved" }, blueprint: { status: "approved" }, contributions: { status: "approved" },
  swiss: { status: "approved" }, specimen: { status: "approved" },
  salon: { status: "approved" }, sketchbook: { status: "approved" }, riso: { status: "approved" },
  darkroom: { status: "approved" }, horizon: { status: "approved" }, monograph: { status: "approved" },
  quarterly: { status: "approved" },
  "plan-section": { status: "approved" }, material: { status: "approved" },
  seminar: { status: "approved" }, notebook: { status: "approved" }, signal: { status: "approved" },
  campaign: { status: "approved" }, pitch: { status: "approved" }, practice: { status: "approved" },
  "liner-notes": { status: "approved" }, "tour-poster": { status: "approved" },
  credits: { status: "approved" }, storyboard: { status: "approved" },
  "annual-report": { status: "approved" }, keynote: { status: "approved" },
  syllabus: { status: "approved" }, sanctuary: { status: "approved" }, "training-log": { status: "approved" },
};
