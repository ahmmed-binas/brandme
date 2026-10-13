/** Shared by the editor's rating pop-up (browser) and lib/templates/feedback.ts (server). */

/** The quick answers offered as chips. Keep ids stable: they are stored. */
export const FEEDBACK_TAGS = [
  { id: "looks-great", label: "Looks great" },
  { id: "easy", label: "Easy to edit" },
  { id: "fits-my-job", label: "Fits my job" },
  { id: "hard-to-edit", label: "Hard to edit" },
  { id: "more-colours", label: "Want more colours" },
  { id: "missing-section", label: "Missing a section" },
  { id: "slow", label: "Feels slow" },
] as const;

export const tagLabel = (id: string) => FEEDBACK_TAGS.find((tag) => tag.id === id)?.label ?? id;
