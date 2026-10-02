"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import type { TemplateId } from "@/lib/templates/types";
import { draftKeys, readDraft, writeDraft } from "@/lib/portfolio/browser-storage";

export type SaveState =
  | { kind: "loading" }
  | { kind: "local" }
  | { kind: "saving" }
  | { kind: "cloud"; at: number }
  | { kind: "error"; message: string };

export interface PublishInfo { slug: string | null; publishedAt: string | null; hasUnpublishedChanges: boolean }

interface RemoteDraft extends PublishInfo { content: unknown; theme: string | null; updatedAt: string }

const LOCAL_DELAY_MS = 300;
const CLOUD_DELAY_MS = 1500;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body.error ?? "Something went wrong."), { status: response.status });
  return body as T;
}

/**
 * Loads and autosaves an editor's content.
 *
 * Every change is written to this browser immediately. Signed-in users also get
 * a debounced save to their account, which is what publishing reads from.
 * On load, whichever copy (browser or account) was saved last wins.
 */
export function usePortfolioPersistence<T>({ templateId, content, theme, apply, parse }: {
  templateId: TemplateId;
  content: T;
  theme?: string | null;
  /** Replace the editor's state with loaded content. */
  apply: (content: T, theme: string | null) => void;
  /** Validate stored data; return null to ignore it. */
  parse: (raw: unknown) => T | null;
}) {
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const keys = useMemo(() => draftKeys(templateId), [templateId]);
  const [loaded, setLoaded] = useState(false);
  const [save, setSave] = useState<SaveState>({ kind: "loading" });
  const [publishInfo, setPublishInfo] = useState<PublishInfo>({ slug: null, publishedAt: null, hasUnpublishedChanges: false });
  const skipNextSave = useRef(true);
  const localTimer = useRef<number | undefined>(undefined);
  const cloudTimer = useRef<number | undefined>(undefined);
  const latest = useRef({ content, theme });
  const applyRef = useRef(apply);
  const parseRef = useRef(parse);
  useLayoutEffect(() => {
    latest.current = { content, theme };
    applyRef.current = apply;
    parseRef.current = parse;
  });

  // Load once the session is known, so the browser and account copies can be compared.
  useEffect(() => {
    if (status === "loading" || loaded) return;
    let cancelled = false;
    (async () => {
      const local = readDraft(keys);
      const localContent = local ? parseRef.current(local.content) : null;
      let chosen: { content: T; theme: string | null } | null = localContent ? { content: localContent, theme: local!.theme } : null;
      let localIsNewer = Boolean(chosen);
      if (signedIn) {
        try {
          const { draft } = await request<{ draft: RemoteDraft | null }>(`/api/portfolios/${templateId}`);
          if (draft) {
            setPublishInfo({ slug: draft.slug, publishedAt: draft.publishedAt, hasUnpublishedChanges: draft.hasUnpublishedChanges });
            const remoteContent = parseRef.current(draft.content);
            if (remoteContent && (!chosen || Date.parse(draft.updatedAt) >= (local?.savedAt ?? 0))) {
              chosen = { content: remoteContent, theme: draft.theme };
              localIsNewer = false;
            }
          }
        } catch {
          // Account storage unavailable: keep working from this browser.
        }
      }
      if (cancelled) return;
      if (chosen) applyRef.current(chosen.content, chosen.theme);
      // Upload a newer browser copy straight away; otherwise wait for the first edit.
      skipNextSave.current = !(signedIn && localIsNewer);
      setSave(signedIn ? { kind: "cloud", at: Date.now() } : { kind: "local" });
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [status, signedIn, loaded, templateId, keys]);

  const saveToCloud = useCallback(async () => {
    window.clearTimeout(cloudTimer.current);
    setSave({ kind: "saving" });
    try {
      const { draft } = await request<{ draft: RemoteDraft }>(`/api/portfolios/${templateId}`, {
        method: "PUT",
        body: JSON.stringify({ content: latest.current.content, theme: latest.current.theme ?? null }),
      });
      setPublishInfo({ slug: draft.slug, publishedAt: draft.publishedAt, hasUnpublishedChanges: draft.hasUnpublishedChanges });
      setSave({ kind: "cloud", at: Date.now() });
      return true;
    } catch (error) {
      setSave({ kind: "error", message: `${(error as Error).message} Your changes are still saved on this device.` });
      return false;
    }
  }, [templateId]);

  const writeLocal = useCallback(() => {
    window.clearTimeout(localTimer.current);
    localTimer.current = undefined;
    const ok = writeDraft(keys, latest.current.content, latest.current.theme);
    if (!ok) setSave({ kind: "error", message: "This browser is out of storage space. Remove or replace large images." });
    else if (!signedIn) setSave({ kind: "local" });
    return ok;
  }, [keys, signedIn]);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    window.clearTimeout(localTimer.current);
    localTimer.current = window.setTimeout(() => {
      writeLocal();
      if (!signedIn) return;
      setSave({ kind: "saving" });
      window.clearTimeout(cloudTimer.current);
      cloudTimer.current = window.setTimeout(() => void saveToCloud(), CLOUD_DELAY_MS);
    }, LOCAL_DELAY_MS);
  }, [content, theme, loaded, signedIn, writeLocal, saveToCloud]);

  useEffect(() => () => { window.clearTimeout(localTimer.current); window.clearTimeout(cloudTimer.current); }, []);

  // Flush pending saves if the tab is hidden or closed.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState !== "hidden") return;
      const pending = Boolean(localTimer.current || cloudTimer.current);
      if (localTimer.current) writeLocal();
      if (!pending || !signedIn) return;
      window.clearTimeout(cloudTimer.current);
      cloudTimer.current = undefined;
      void fetch(`/api/portfolios/${templateId}`, { method: "PUT", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: latest.current.content, theme: latest.current.theme ?? null }) });
    };
    document.addEventListener("visibilitychange", flush);
    return () => document.removeEventListener("visibilitychange", flush);
  }, [signedIn, templateId, writeLocal]);

  const publish = useCallback(async (slug: string) => {
    if (!(await saveToCloud())) throw new Error("Save your portfolio before publishing.");
    const result = await request<{ draft: RemoteDraft; url: string }>(`/api/portfolios/${templateId}/publish`, { method: "POST", body: JSON.stringify({ slug }) });
    setPublishInfo({ slug: result.draft.slug, publishedAt: result.draft.publishedAt, hasUnpublishedChanges: result.draft.hasUnpublishedChanges });
    return result.url;
  }, [saveToCloud, templateId]);

  const unpublish = useCallback(async () => {
    const result = await request<{ draft: RemoteDraft }>(`/api/portfolios/${templateId}/publish`, { method: "DELETE" });
    setPublishInfo({ slug: result.draft.slug, publishedAt: result.draft.publishedAt, hasUnpublishedChanges: result.draft.hasUnpublishedChanges });
  }, [templateId]);

  /** Write now without waiting for the debounce (used before opening the full preview). */
  const flushLocal = writeLocal;

  return { loaded, save, signedIn, sessionLoading: status === "loading", publishInfo, publish, unpublish, saveToCloud, flushLocal };
}
