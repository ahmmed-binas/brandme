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
  | { kind: "error"; message: string }
  /** Another tab or device saved a newer version; the user chooses which to keep. */
  | { kind: "conflict" }
  /** The plan has no room for another portfolio; the user can move their content to this design. */
  | { kind: "full" };

export interface Room { canStart: boolean; max: number; planName: string; others: { templateId: string; name: string; switchable: boolean }[] }

export interface PublishInfo { slug: string | null; publishedAt: string | null; hasUnpublishedChanges: boolean }

interface RemoteDraft extends PublishInfo { content: unknown; theme: string | null; updatedAt: string; version: number }

const publishInfoOf = (draft: RemoteDraft): PublishInfo => ({ slug: draft.slug, publishedAt: draft.publishedAt, hasUnpublishedChanges: draft.hasUnpublishedChanges });

const LOCAL_DELAY_MS = 300;
const CLOUD_DELAY_MS = 1500;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body.error ?? "Something went wrong."), { status: response.status, body });
  return body as T;
}

/**
 * Loads and autosaves an editor's content.
 *
 * Every change is written to this browser immediately. Signed-in users also get
 * a debounced save to their account, which is what publishing reads from.
 * On load, whichever copy (browser or account) was saved last wins.
 *
 * Account saves are versioned: if another tab or device saved in the meantime,
 * the save is refused and the user picks which version to keep, instead of
 * one silently overwriting the other.
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
  const [room, setRoom] = useState<Room | null>(null);
  /** True while the plan has no room for this portfolio: edits stay on this device only. */
  const full = useRef(false);
  const skipNextSave = useRef(true);
  /** The account version this editor last loaded or saved; sent with every save. */
  const serverVersion = useRef<number | null>(null);
  const conflict = useRef<RemoteDraft | null>(null);
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
          const { draft, room: plan } = await request<{ draft: RemoteDraft | null; room?: Room }>(`/api/portfolios/${templateId}`);
          if (plan) setRoom(plan);
          if (!draft && plan && !plan.canStart) full.current = true;
          if (draft) {
            serverVersion.current = draft.version;
            setPublishInfo(publishInfoOf(draft));
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
      setSave(full.current ? { kind: "full" } : signedIn ? { kind: "cloud", at: Date.now() } : { kind: "local" });
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [status, signedIn, loaded, templateId, keys]);

  const saveToCloud = useCallback(async (force = false) => {
    window.clearTimeout(cloudTimer.current);
    cloudTimer.current = undefined;
    if ((conflict.current && !force) || full.current) return false;
    setSave({ kind: "saving" });
    try {
      const { draft } = await request<{ draft: RemoteDraft }>(`/api/portfolios/${templateId}`, {
        method: "PUT",
        body: JSON.stringify({ content: latest.current.content, theme: latest.current.theme ?? null, baseVersion: serverVersion.current, force }),
      });
      serverVersion.current = draft.version;
      conflict.current = null;
      setPublishInfo(publishInfoOf(draft));
      setSave({ kind: "cloud", at: Date.now() });
      return true;
    } catch (error) {
      const { status, body } = error as { status?: number; body?: { draft?: RemoteDraft } };
      if (status === 409 && body?.draft) {
        conflict.current = body.draft;
        setSave({ kind: "conflict" });
      } else if (status === 402 && (body as { room?: Room } | undefined)?.room) {
        full.current = true;
        setRoom((body as { room: Room }).room);
        setSave({ kind: "full" });
      } else {
        const message = (error as Error).message;
        setSave({ kind: "error", message: /this device/i.test(message) ? message : `${message} Your changes are still saved on this device.` });
      }
      return false;
    }
  }, [templateId]);

  /** Resolve a conflict by loading the version saved elsewhere. */
  const loadOtherVersion = useCallback(() => {
    const remote = conflict.current;
    if (!remote) return;
    const content = parseRef.current(remote.content);
    conflict.current = null;
    serverVersion.current = remote.version;
    setPublishInfo(publishInfoOf(remote));
    if (content) { skipNextSave.current = true; applyRef.current(content, remote.theme); }
    setSave({ kind: "cloud", at: Date.now() });
  }, []);

  /** Resolve a conflict by overwriting the other version with this editor's content. */
  const keepThisVersion = useCallback(() => saveToCloud(true), [saveToCloud]);

  const writeLocal = useCallback(() => {
    window.clearTimeout(localTimer.current);
    localTimer.current = undefined;
    const ok = writeDraft(keys, latest.current.content, latest.current.theme);
    if (!ok) setSave({ kind: "error", message: "This browser is out of storage space. Remove or replace large images." });
    else if (!signedIn) setSave({ kind: "local" });
    else if (full.current) setSave({ kind: "full" });
    return ok;
  }, [keys, signedIn]);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    window.clearTimeout(localTimer.current);
    localTimer.current = window.setTimeout(() => {
      writeLocal();
      if (!signedIn || conflict.current || full.current) return;
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
      if (!pending || !signedIn || conflict.current || full.current) return;
      window.clearTimeout(cloudTimer.current);
      cloudTimer.current = undefined;
      void fetch(`/api/portfolios/${templateId}`, { method: "PUT", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: latest.current.content, theme: latest.current.theme ?? null, baseVersion: serverVersion.current }) });
    };
    document.addEventListener("visibilitychange", flush);
    return () => document.removeEventListener("visibilitychange", flush);
  }, [signedIn, templateId, writeLocal]);

  /** Moves the owner's portfolio from another design to this one, then reloads with it. */
  const moveHere = useCallback(async (from: string) => {
    await request(`/api/portfolios/${templateId}/switch`, { method: "POST", body: JSON.stringify({ from }) });
    window.location.reload();
  }, [templateId]);

  const publish = useCallback(async (slug: string) => {
    if (full.current) throw new Error("Move your content to this design first.");
    if (conflict.current) throw new Error("Choose which version to keep before publishing.");
    if (!(await saveToCloud())) throw new Error("Save your portfolio before publishing.");
    const result = await request<{ draft: RemoteDraft; url: string }>(`/api/portfolios/${templateId}/publish`, { method: "POST", body: JSON.stringify({ slug }) });
    setPublishInfo(publishInfoOf(result.draft));
    return result.url;
  }, [saveToCloud, templateId]);

  const unpublish = useCallback(async () => {
    const result = await request<{ draft: RemoteDraft }>(`/api/portfolios/${templateId}/publish`, { method: "DELETE" });
    setPublishInfo(publishInfoOf(result.draft));
  }, [templateId]);

  /** Write now without waiting for the debounce (used before opening the full preview). */
  const flushLocal = writeLocal;

  return { loaded, save, signedIn, sessionLoading: status === "loading", publishInfo, publish, unpublish, saveToCloud, flushLocal, loadOtherVersion, keepThisVersion, room, moveHere };
}
