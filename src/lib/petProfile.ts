"use client";
import { useCallback } from "react";
import type { PetProfile } from "./types";
import { isRestrictedBreed, sizeFromWeight } from "./match";
import { createLocalStore } from "./store";

export const DEFAULT_PROFILE: PetProfile = { id: "default", name: "", species: "dog", breed: "", weightKg: 5, size: "small", isRestrictedBreed: false, hasCarrier: false, hasStroller: false };
export const MAX_PETS = 5;

export function normalizeProfile(p: PetProfile): PetProfile {
  return { ...p, size: sizeFromWeight(p.weightKg), isRestrictedBreed: p.isRestrictedBreed || isRestrictedBreed(p.breed) };
}
export const petLabel = (p: PetProfile, i?: number) => p.name.trim() || p.breed.trim() || (i !== undefined ? `아이 ${i + 1}` : "우리 아이");

/** 프로필을 쿼리스트링으로 (서버 API 로 전달) */
export function profileToQuery(p: PetProfile): string {
  return new URLSearchParams({ species: p.species, breed: p.breed, weight: String(p.weightKg), size: p.size, restricted: p.isRestrictedBreed ? "1" : "0", carrier: p.hasCarrier ? "1" : "0", stroller: p.hasStroller ? "1" : "0" }).toString();
}

export interface PetsState { pets: PetProfile[]; activeId: string; together: boolean }
const LEGACY_KEY = "petpass.profile.v1";
export const petsStore = createLocalStore<PetsState>("petpass.pets.v1", { pets: [DEFAULT_PROFILE], activeId: "default", together: false }, (raw) => {
  const r = raw as Partial<PetsState> | undefined;
  if (r?.pets?.length) return { pets: r.pets.map((p) => normalizeProfile({ ...DEFAULT_PROFILE, ...p })), activeId: r.pets.some((p) => p.id === r.activeId) ? r.activeId! : r.pets[0].id!, together: !!r.together };
  // v1(단일 프로필)에서 이전
  let first = DEFAULT_PROFILE;
  try { const old = localStorage.getItem(LEGACY_KEY); if (old) first = normalizeProfile({ ...DEFAULT_PROFILE, ...JSON.parse(old), id: "default" }); } catch {}
  return { pets: [first], activeId: "default", together: false };
});

export function usePets() {
  const { value, loaded } = petsStore.use();
  const active = value.pets.find((p) => p.id === value.activeId) ?? value.pets[0];
  const updateActive = useCallback((p: PetProfile) => petsStore.set((s) => ({ ...s, pets: s.pets.map((x) => (x.id === s.activeId ? normalizeProfile({ ...p, id: x.id }) : x)) })), []);
  const setActive = useCallback((id: string) => petsStore.set((s) => ({ ...s, activeId: id })), []);
  const add = useCallback(() => petsStore.set((s) => { if (s.pets.length >= MAX_PETS) return s; const id = `p${Date.now().toString(36)}`; return { ...s, pets: [...s.pets, { ...DEFAULT_PROFILE, id }], activeId: id }; }), []);
  const remove = useCallback((id: string) => petsStore.set((s) => { if (s.pets.length <= 1) return s; const pets = s.pets.filter((p) => p.id !== id); return { pets, activeId: s.activeId === id ? pets[0].id! : s.activeId, together: s.together && pets.length > 1 }; }), []);
  const setTogether = useCallback((together: boolean) => petsStore.set((s) => ({ ...s, together })), []);
  return { pets: value.pets, active, activeId: active.id!, together: value.together && value.pets.length > 1, loaded, updateActive, setActive, add, remove, setTogether };
}

/** 기존 화면 호환: 선택된 반려동물 하나 */
export function useProfile() {
  const { active, updateActive, loaded } = usePets();
  return { profile: active, update: updateActive, loaded };
}
