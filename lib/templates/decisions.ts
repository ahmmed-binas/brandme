import type { ReviewStatus } from "./approval";

/**
 * The owner's review decisions, shipped with the code so a fresh deployment
 * starts with the same gallery. A decision recorded on /templates/review
 * (stored in the database) always overrides the one here.
 * Templates the owner rejected are removed from the catalog entirely; ones not
 * listed here stay pending until the owner reviews them.
 */
export const OWNER_DECISIONS: Record<string, { status: Exclude<ReviewStatus, "pending">; note?: string }> = {
  terminal: { status: "approved" }, blueprint: { status: "approved" }, contributions: { status: "approved" },
  swiss: { status: "approved" }, specimen: { status: "approved" },
  salon: { status: "approved" }, sketchbook: { status: "approved" }, riso: { status: "approved" },
  darkroom: { status: "approved" }, horizon: { status: "approved" }, monograph: { status: "approved" },
  broadsheet: { status: "approved", note: "Masthead made readable after review." }, quarterly: { status: "approved" },
  "plan-section": { status: "approved" }, material: { status: "approved" },
  seminar: { status: "approved" }, notebook: { status: "approved" }, signal: { status: "approved" },
  campaign: { status: "approved" }, pitch: { status: "approved" }, practice: { status: "approved" },
  "liner-notes": { status: "approved" }, "tour-poster": { status: "approved" },
  credits: { status: "approved" }, storyboard: { status: "approved" },
  "annual-report": { status: "approved" }, keynote: { status: "approved" },
  syllabus: { status: "approved" }, sanctuary: { status: "approved" }, "training-log": { status: "approved" },
  // Round two: everyday professions.
  brief: { status: "approved" }, "open-house": { status: "approved" }, clinic: { status: "approved" },
  "exercise-book": { status: "approved" }, prospectus: { status: "approved" }, "site-board": { status: "approved" },
  carte: { status: "approved" }, datasheet: { status: "approved" }, lookbook: { status: "approved" }, quota: { status: "approved" }, "field-report": { status: "approved" },
  // Approved by the owner on 8 October 2026: the Motion collection and the real estate collection.
  residence: { status: "approved" }, "margin-notes": { status: "approved" }, pulse: { status: "approved" }, counsel: { status: "approved" }, mise: { status: "approved" },
  skyline: { status: "approved" }, manor: { status: "approved" }, "front-door": { status: "approved" }, shoreline: { status: "approved" }, "off-plan": { status: "approved" },
};
