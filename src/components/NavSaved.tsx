"use client";
import Link from "next/link";
import { useSaved } from "@/lib/saved";

export default function NavSaved() {
  const { items } = useSaved();
  return <Link href="/saved" className="flex min-h-11 items-center gap-1 text-muted hover:text-pass">저장한 곳{items.length > 0 && <span className="rounded-full bg-pass px-1.5 font-mono text-[11px] text-white">{items.length}</span>}</Link>;
}
