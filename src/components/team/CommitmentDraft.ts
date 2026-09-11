"use client";

import { useEffect, useState, type SetStateAction } from "react";

function matchesDraftShape(stored: unknown, initial: unknown, field?: string): boolean {
  if (field && ["ownerUserId", "dueDate", "nextCheckInDate"].includes(field)) return stored === null || typeof stored === "string";
  if (field === "status") return typeof stored === "string" && ["not_started", "in_progress", "blocked", "done"].includes(stored);
  if (initial === null) return stored === null || typeof stored === "string";
  if (typeof initial === "number") return typeof stored === "number" && Number.isInteger(stored) && stored >= 0;
  if (typeof initial !== "object") return typeof stored === typeof initial;
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return false;
  const fields = Object.entries(initial as Record<string, unknown>);
  return Object.keys(stored).length === fields.length && fields.every(([key, value]) =>
    Object.hasOwn(stored, key) && matchesDraftShape((stored as Record<string, unknown>)[key], value, key));
}

/** Forms mount only when opened, so restoring a tab-local draft does not change server-rendered HTML. */
export function useCommitmentDraft<T extends object>(key: string, initial: T) {
  const storageKey = `trita:commitment-draft:${key}`;
  const [draft, setDraft] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const stored: unknown = JSON.parse(window.sessionStorage.getItem(storageKey) ?? "null");
      if (matchesDraftShape(stored, initial)) return stored as T;
    } catch { /* Storage can be unavailable; the in-memory draft still works. */ }
    return initial;
  });
  useEffect(() => {
    try { window.sessionStorage.setItem(storageKey, JSON.stringify(draft)); } catch { /* Keep the draft in memory. */ }
  }, [draft, storageKey]);
  function clear() {
    try { window.sessionStorage.removeItem(storageKey); } catch { /* Storage is optional. */ }
  }
  function update(value: SetStateAction<T>) { setDraft(value); }
  return [draft, update, clear] as const;
}
