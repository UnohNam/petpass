"use client";
import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";
import { onAuthChange, currentUser } from "./auth";
import { petsStore, type PetsState } from "./petProfile";
import { savedStore, type SavedState, MAX_SAVED } from "./saved";

/**
 * 계정 동기화. 브라우저 저장(localStorage)이 항상 기준이고, 로그인 중에는 같은 내용을 계정에도 저장합니다.
 *  - 로그인 직후: 계정에 데이터가 있으면 반려동물은 계정 것을 쓰고, 저장한 곳은 기기 것과 합칩니다. 없으면 기기 데이터를 올립니다.
 *  - 이후: 기기에서 바뀔 때마다 0.8초 뒤에 계정으로 올립니다.
 */
type Status = "off" | "syncing" | "synced" | "error";
let status: { state: Status; at?: number; message?: string } = { state: "off" };
const listeners = new Set<() => void>();
const setStatus = (s: typeof status) => { status = s; listeners.forEach((l) => l()); };
export const useSyncStatus = () => useSyncExternalStore((cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => status, () => status);

let timer: ReturnType<typeof setTimeout> | undefined;
let pulling = false;
async function push() {
  const user = currentUser(); if (!supabase || !user || pulling) return;
  setStatus({ state: "syncing" });
  const { error } = await supabase.from("user_state").upsert({ user_id: user.id, pets: petsStore.get().value, saved: savedStore.get().value });
  setStatus(error ? { state: "error", message: error.message } : { state: "synced", at: Date.now() });
}
const schedule = () => { if (!currentUser() || pulling) return; clearTimeout(timer); timer = setTimeout(push, 800); };

async function pull(userId: string) {
  if (!supabase) return;
  pulling = true; setStatus({ state: "syncing" });
  try {
    const { data, error } = await supabase.from("user_state").select("pets, saved").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    const rp = data?.pets as Partial<PetsState> | undefined, rs = data?.saved as Partial<SavedState> | undefined;
    if (rp?.pets?.length) petsStore.set({ pets: rp.pets, activeId: rp.activeId ?? rp.pets[0].id ?? "default", together: !!rp.together });
    if (rs?.items) {
      const local = savedStore.get().value; const seen = new Set<string>();
      const items = [...local.items, ...rs.items].filter((x) => (seen.has(x.contentid) ? false : (seen.add(x.contentid), true))).sort((a, b) => b.savedAt - a.savedAt).slice(0, MAX_SAVED);
      savedStore.set({ items, checks: { ...(rs.checks ?? {}), ...local.checks } });
    }
  } catch (e) { pulling = false; setStatus({ state: "error", message: (e as Error).message }); return; }
  pulling = false;
  await push(); // 합친 결과(또는 첫 로그인의 기기 데이터)를 계정에 반영
}

let started = false;
export function startSync() {
  if (started || !supabase) return; started = true;
  let lastUser: string | null = null;
  const onUser = (id: string | null) => { if (id === lastUser) return; lastUser = id; if (id) void pull(id); else { clearTimeout(timer); setStatus({ state: "off" }); } };
  onAuthChange((u) => onUser(u?.id ?? null));
  petsStore.subscribe(schedule); savedStore.subscribe(schedule);
}
