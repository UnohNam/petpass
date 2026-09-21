"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AUTH_ENABLED } from "@/lib/supabase";
import { startSync } from "@/lib/sync";

export default function NavAuth() {
  const { user, ready } = useAuth();
  useEffect(() => { startSync(); }, []);
  if (!AUTH_ENABLED) return null;
  if (!ready) return <span className="flex min-h-11 w-12 items-center" aria-hidden />;
  return user
    ? <Link href="/account" className="flex min-h-11 items-center text-pass hover:text-pass-dk">내 계정</Link>
    : <Link href="/login" className="flex min-h-11 items-center text-muted hover:text-pass">로그인</Link>;
}
