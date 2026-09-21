"use client";
import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/auth";
import { AUTH_ENABLED } from "@/lib/supabase";
import RecoveryCodeCard from "@/components/RecoveryCodeCard";

const INPUT = "h-12 w-full rounded-md border border-line bg-card px-3.5 text-[15px] text-ink outline-none focus:border-pass";

/** 비밀번호 찾기: 아이디 + 복구 코드 → 새 비밀번호 */
export default function ResetPage() {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState<string | null>(null);

  if (!AUTH_ENABLED) return <p className="py-20 text-center text-muted">이 배포에서는 로그인을 사용하지 않습니다.</p>;
  if (newCode) return (
    <div className="mx-auto flex max-w-md flex-col gap-5 py-8">
      <p role="status" className="rounded-md border border-pass bg-ok-bg px-3 py-2 text-sm text-pass">비밀번호를 바꿨습니다. 사용한 복구 코드는 폐기되고 아래 새 코드가 발급됐습니다.</p>
      <RecoveryCodeCard code={newCode} />
      <Link href="/login" className="flex h-12 items-center justify-center rounded-lg bg-pass font-semibold text-white hover:bg-pass-dk">새 비밀번호로 로그인</Link>
    </div>
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (password.length < 8) return setError("비밀번호는 8자 이상으로 입력해 주세요.");
    setBusy(true); const r = await resetPassword(username, code, password); setBusy(false);
    if (r.ok) setNewCode(r.code); else setError(r.error);
  };
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-8">
      <header className="flex flex-col gap-2"><span className="eyebrow">PASSWORD RESET</span><h1 className="font-display text-[32px] font-bold">비밀번호 찾기</h1>
        <p className="text-sm leading-relaxed text-muted">가입할 때 받은 복구 코드로 새 비밀번호를 설정합니다. 복구 코드도 잃어버렸다면 계정을 되찾을 수 없습니다. 이 기기에 저장된 반려동물 정보와 저장한 곳은 그대로 쓸 수 있으니 새 아이디로 가입해 주세요.</p></header>
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-line bg-card p-6" method="post">
        <label className="flex flex-col gap-1"><span className="field-label">ID / 아이디</span>
          <input className={INPUT} type="text" name="username" id="username" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={20} required value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        <label className="flex flex-col gap-1"><span className="field-label">RECOVERY CODE / 복구 코드</span>
          <input className={`${INPUT} font-mono uppercase tracking-[0.1em]`} type="text" name="recovery-code" id="recovery-code" autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="XXXX-XXXX-XXXX-XXXX" maxLength={24} required value={code} onChange={(e) => setCode(e.target.value)} /></label>
        <label className="flex flex-col gap-1"><span className="field-label">NEW PASSWORD / 새 비밀번호 (8자 이상)</span>
          <input className={INPUT} type="password" name="new-password" id="new-password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p role="alert" className="rounded-md border border-stamp bg-no-bg px-3 py-2 text-sm text-stamp">{error}</p>}
        <button type="submit" disabled={busy} className="h-12 rounded-lg bg-pass font-semibold text-white hover:bg-pass-dk disabled:opacity-60">{busy ? "확인 중…" : "비밀번호 다시 설정"}</button>
        <Link href="/login" className="flex min-h-11 items-center justify-center text-sm text-muted underline">로그인으로 돌아가기</Link>
      </form>
    </div>
  );
}
