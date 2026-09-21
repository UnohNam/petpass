"use client";
import { useSyncExternalStore } from "react";

/**
 * localStorage 기반 외부 스토어. 나중에 로그인을 붙일 때는 read/write 만 서버 동기화로 바꾸면 됩니다.
 */
export function createLocalStore<T>(key: string, fallback: T, load?: (raw: unknown) => T) {
  let snap: { value: T; loaded: boolean } | null = null;
  const server = { value: fallback, loaded: false };
  const listeners = new Set<() => void>();
  const get = () => {
    if (!snap) {
      let value = fallback;
      try { const raw = localStorage.getItem(key); if (raw != null) value = load ? load(JSON.parse(raw)) : (JSON.parse(raw) as T); else if (load) value = load(undefined); } catch {}
      snap = { value, loaded: true };
    }
    return snap;
  };
  const set = (next: T | ((prev: T) => T)) => {
    const value = typeof next === "function" ? (next as (p: T) => T)(get().value) : next;
    snap = { value, loaded: true };
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    listeners.forEach((l) => l());
  };
  const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
  const use = () => useSyncExternalStore(subscribe, get, () => server);
  return { use, set, get, subscribe };
}
