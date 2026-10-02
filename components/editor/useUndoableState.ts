"use client";

import { useCallback, useRef, useState } from "react";

const MAX_HISTORY = 50;
/** Keystrokes closer together than this are undone as one step. */
const COALESCE_MS = 800;

/** useState with an undo stack, so a deleted project or an unwanted AI rewrite is one click away. */
export function useUndoableState<T>(initial: T) {
  const [store, setStore] = useState<{ present: T; past: T[] }>({ present: initial, past: [] });
  const lastChange = useRef(0);

  const update = useCallback((change: (current: T) => T, options?: { checkpoint?: boolean }) => {
    const now = Date.now();
    const startsNewStep = options?.checkpoint || now - lastChange.current > COALESCE_MS;
    lastChange.current = options?.checkpoint ? 0 : now;
    setStore((current) => {
      const next = change(current.present);
      if (next === current.present) return current;
      return { present: next, past: startsNewStep ? [...current.past.slice(-(MAX_HISTORY - 1)), current.present] : current.past };
    });
  }, []);

  /** Replace state without recording history (used when loading saved content). */
  const reset = useCallback((value: T) => setStore({ present: value, past: [] }), []);

  const undo = useCallback(() => {
    lastChange.current = 0;
    setStore((current) => current.past.length ? { present: current.past[current.past.length - 1], past: current.past.slice(0, -1) } : current);
  }, []);

  return { state: store.present, update, reset, undo, canUndo: store.past.length > 0 };
}
