"use client";
import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthSnap { user: User | null; ready: boolean }
let snap: AuthSnap = { user: null, ready: !supabase };
const SERVER: AuthSnap = { user: null, ready: false };
const listeners = new Set<() => void>();
let started = false;
const emit = (next: AuthSnap) => { snap = next; listeners.forEach((l) => l()); };
function start() {
  if (started || !supabase) return; started = true;
  supabase.auth.getSession().then(({ data }) => emit({ user: data.session?.user ?? null, ready: true }));
  supabase.auth.onAuthStateChange((_e, session) => emit({ user: session?.user ?? null, ready: true }));
}
const subscribe = (cb: () => void) => { start(); listeners.add(cb); return () => { listeners.delete(cb); }; };
export function useAuth() { return useSyncExternalStore(subscribe, () => snap, () => SERVER); }
export const onAuthChange = (cb: (u: User | null) => void) => subscribe(() => cb(snap.user));
export const currentUser = () => snap.user;

/** 아이디 규칙: 영문 소문자·숫자·밑줄 4~20자. 서버(register_user)와 동일 */
export const USERNAME_RE = /^[a-z0-9_]{4,20}$/;
const DOMAIN = "@id.petpass.local"; // Supabase Auth 내부 식별용. 이 주소로는 메일을 보내지 않습니다.
const toEmail = (username: string) => `${username.trim().toLowerCase()}${DOMAIN}`;
export const usernameOf = (u: User | null) => (u?.user_metadata?.username as string | undefined) ?? u?.email?.replace(DOMAIN, "") ?? "";

const KO: [RegExp, string][] = [
  [/invalid login credentials/i, "아이디 또는 비밀번호가 올바르지 않습니다."],
  [/USERNAME_TAKEN/, "이미 사용 중인 아이디입니다."],
  [/INVALID_USERNAME/, "아이디는 영문 소문자, 숫자, 밑줄(_)로 4~20자여야 합니다."],
  [/WEAK_PASSWORD|password should be at least|weak password/i, "비밀번호는 8자 이상으로 입력해 주세요."],
  [/RATE_LIMIT|rate limit|too many/i, "요청이 많습니다. 잠시 후 다시 시도해 주세요."],
  [/same.*password|different from the old/i, "기존과 다른 비밀번호를 입력해 주세요."],
];
const ko = (m: string) => KO.find(([re]) => re.test(m))?.[1] ?? m;

export async function signIn(username: string, password: string): Promise<string | null> {
  if (!supabase) return "로그인을 사용할 수 없습니다.";
  if (!USERNAME_RE.test(username.trim().toLowerCase())) return "아이디 또는 비밀번호가 올바르지 않습니다.";
  const { error } = await supabase.auth.signInWithPassword({ email: toEmail(username), password });
  return error ? ko(error.message) : null;
}
/** 이메일 없이 아이디·비밀번호로 가입하고 바로 로그인합니다. */
export async function signUp(username: string, password: string): Promise<string | null> {
  if (!supabase) return "로그인을 사용할 수 없습니다.";
  const { error } = await supabase.rpc("register_user", { p_username: username, p_password: password });
  if (error) return ko(error.message);
  return signIn(username, password);
}
export async function changePassword(password: string): Promise<string | null> {
  if (!supabase) return "로그인을 사용할 수 없습니다.";
  if (password.length < 8) return "비밀번호는 8자 이상으로 입력해 주세요.";
  const { error } = await supabase.auth.updateUser({ password });
  return error ? ko(error.message) : null;
}
export async function signOut() { await supabase?.auth.signOut(); }
export async function deleteAccount(): Promise<string | null> {
  if (!supabase) return "로그인을 사용할 수 없습니다.";
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return error.message;
  await supabase.auth.signOut();
  return null;
}
