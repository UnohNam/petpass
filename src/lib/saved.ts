"use client";
import { useCallback } from "react";
import { createLocalStore } from "./store";
import type { PlaceWithMatch } from "./types";

export interface SavedPlace extends Pick<PlaceWithMatch, "contentid" | "contenttypeid" | "title" | "addr1" | "firstimage" | "firstimage2" | "mapx" | "mapy" | "pet"> { savedAt: number }
export interface SavedState { items: SavedPlace[]; checks: Record<string, boolean> }
export const savedStore = createLocalStore<SavedState>("petpass.saved.v1", { items: [], checks: {} });
export const MAX_SAVED = 30;

export function useSaved() {
  const { value, loaded } = savedStore.use();
  const toggle = useCallback((p: Omit<SavedPlace, "savedAt">) => savedStore.set((s) => s.items.some((x) => x.contentid === p.contentid) ? { ...s, items: s.items.filter((x) => x.contentid !== p.contentid) } : { ...s, items: [{ ...p, savedAt: Date.now() }, ...s.items].slice(0, MAX_SAVED) }), []);
  const setCheck = useCallback((req: string, on: boolean) => savedStore.set((s) => ({ ...s, checks: { ...s.checks, [req]: on } })), []);
  const isSaved = (id: string) => value.items.some((x) => x.contentid === id);
  return { items: value.items, checks: value.checks, loaded, toggle, setCheck, isSaved };
}
