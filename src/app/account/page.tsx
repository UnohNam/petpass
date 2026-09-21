"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { changePassword, deleteAccount, regenerateRecoveryCode, signOut, useAuth, usernameOf } from "@/lib/auth";
import RecoveryCodeCard from "@/components/RecoveryCodeCard";
import { useSyncStatus } from "@/lib/sync";
import { usePets } from "@/lib/petProfile";
import { useSaved } from "@/lib/saved";

export default function AccountPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const sync = useSyncStatus();
  const { pets } = usePets();
  const { items } = useSaved();
  const [err, setErr] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!ready) return <p className="py-20 text-center text-muted">불러오는 중…</p>;
  if (!user) return <div className="py-16 text-center"><p className="text-muted">로그인이 필요합니다.</p><Link href="/login" className="mt-4 inline-flex h-11 items-center rounded-lg bg-pass px-6 font-semibold text-white">로그인</Link></div>;

  const SYNC = { off: "대기 중", syncing: "동기화 중…", synced: `동기화 완료${sync.at ? ` · ${new Date(sync.at).toLocaleTimeString("ko-KR")}` : ""}`, error: `동기화 실패: ${sync.message ?? ""}` }[sync.state];
  const remove = async () => {
    if (!confirm("계정과 계정에 저장된 반려동물 정보, 저장한 곳을 모두 삭제합니다. 이 기기에 저장된 내용은 남습니다. 계속할까요?")) return;
    const e = await deleteAccount(); if (e) return setErr(e); router.push("/");
  };
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-8">
      <header className="flex flex-col gap-2"><span className="eyebrow">PET PASSPORT ACCOUNT</span><h1 className="font-display text-[32px] font-bold">내 계정</h1></header>
      <dl className="rounded-xl border border-line bg-card p-6 text-sm">
        {([["아이디", usernameOf(user)], ["반려동물", `${pets.length}마리`], ["저장한 곳", `${items.length}곳`], ["동기화", SYNC]] as const).map(([k, v]) => <div key={k} className="grid grid-cols-[7rem_1fr] gap-3 border-b border-dashed border-line py-3 last:border-0"><dt className="text-muted">{k}</dt><dd className={sync.state === "error" && k === "동기화" ? "text-stamp" : ""}>{v}</dd></div>)}
      </dl>
      <form className="flex flex-col gap-3 rounded-xl border border-line bg-card p-6" onSubmit={async (e) => { e.preventDefault(); const r = await changePassword(pw); setPwMsg(r ? { ok: false, text: r } : { ok: true, text: "비밀번호를 바꿨습니다. 비밀번호 관리자에도 새 비밀번호를 저장해 주세요." }); if (!r) setPw(""); }}>
        <input type="text" name="username" autoComplete="username" value={usernameOf(user)} readOnly hidden />
        <label className="flex flex-col gap-1"><span className="field-label">NEW PASSWORD / 새 비밀번호 (8자 이상)</span>
          <input className="h-12 w-full rounded-md border border-line bg-card px-3.5 text-[15px] outline-none focus:border-pass" type="password" name="new-password" autoComplete="new-password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} />
        </label>
        {pwMsg && <p role="status" className={`rounded-md border px-3 py-2 text-sm ${pwMsg.ok ? "border-pass bg-ok-bg text-pass" : "border-stamp bg-no-bg text-stamp"}`}>{pwMsg.text}</p>}
        <button type="submit" className="h-11 rounded-lg border border-line bg-paper font-medium hover:border-ink">비밀번호 변경</button>
      </form>
      {code ? <RecoveryCodeCard code={code} /> : (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-card p-6">
          <h2 className="font-display text-lg font-bold">복구 코드</h2>
          <p className="text-sm leading-relaxed text-muted">비밀번호를 잊었을 때 쓰는 코드입니다. 잃어버렸다면 새로 발급하세요. 새로 발급하면 이전 코드는 쓸 수 없게 됩니다.</p>
          <button type="button" onClick={async () => { if (!confirm("새 복구 코드를 발급하면 이전 코드는 쓸 수 없습니다. 계속할까요?")) return; const r = await regenerateRecoveryCode(); if (r.ok) setCode(r.code); else setErr(r.error); }} className="mt-1 h-11 rounded-lg border border-line bg-paper font-medium hover:border-ink">복구 코드 새로 발급</button>
        </div>
      )}
      {err && <p role="alert" className="rounded-md border border-stamp bg-no-bg px-3 py-2 text-sm text-stamp">{err}</p>}
      <div className="flex flex-col gap-2.5">
        <button type="button" onClick={async () => { await signOut(); router.push("/"); }} className="h-12 rounded-lg border border-line bg-card font-medium hover:border-ink">로그아웃</button>
        <button type="button" onClick={remove} className="h-11 text-sm text-muted hover:text-stamp">회원 탈퇴</button>
      </div>
      <p className="text-xs text-muted">로그아웃해도 이 기기에 저장된 반려동물 정보와 저장한 곳은 그대로 남습니다. <Link href="/privacy" className="underline">개인정보 처리방침</Link></p>
    </div>
  );
}
