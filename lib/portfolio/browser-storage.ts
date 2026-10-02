import type { TemplateId } from "@/lib/templates/types";

/**
 * Browser draft storage, one draft per template so editing one template never
 * changes another template's saved portfolio.
 *
 * Standard templates share a content shape, so the most recent standard draft
 * is also kept under a shared key ("portfolioData", the original key). A
 * template opened for the first time starts from it, letting people try a
 * different design without retyping. The shared copy never overrides a draft
 * saved in the person's account.
 */
export interface DraftKeys { content: string; theme: string; savedAt: string; shared?: { content: string; theme: string } }

const SHARED_STANDARD = { content: "portfolioData", theme: "portfolioTheme" };

export function draftKeys(templateId: TemplateId): DraftKeys {
  return {
    content: `template:${templateId}:data`,
    theme: `template:${templateId}:theme`,
    savedAt: `formora:savedAt:${templateId}`,
    shared: templateId === "editorial-developer" ? undefined : SHARED_STANDARD,
  };
}

const read = (key: string) => localStorage.getItem(key) ?? sessionStorage.getItem(key);

/** Returns the template's own draft, else the shared standard draft with savedAt 0 (an account copy wins). */
export function readDraft(keys: DraftKeys): { content: unknown; theme: string | null; savedAt: number } | null {
  try {
    const own = read(keys.content);
    if (own) return { content: JSON.parse(own), theme: read(keys.theme), savedAt: Number(localStorage.getItem(keys.savedAt) ?? 0) };
    const shared = keys.shared && read(keys.shared.content);
    if (shared) return { content: JSON.parse(shared), theme: read(keys.shared!.theme), savedAt: 0 };
    return null;
  } catch {
    return null;
  }
}

/** Writes a draft; returns false when the browser refuses (storage full or blocked). */
export function writeDraft(keys: DraftKeys, content: unknown, theme?: string | null): boolean {
  try {
    const serialized = JSON.stringify(content);
    localStorage.setItem(keys.content, serialized);
    if (theme) localStorage.setItem(keys.theme, theme);
    localStorage.setItem(keys.savedAt, String(Date.now()));
    if (keys.shared) {
      // Best effort: the template's own copy above is the one that matters.
      try { localStorage.setItem(keys.shared.content, serialized); if (theme) localStorage.setItem(keys.shared.theme, theme); } catch { /* shared seed is optional */ }
    }
    return true;
  } catch {
    return false;
  }
}

/** The draft a full-page preview tab should show for a template. */
export function readPreviewDraft(templateId: TemplateId): { content: unknown; theme: string | null } | null {
  const draft = readDraft(draftKeys(templateId));
  return draft && { content: draft.content, theme: draft.theme };
}
