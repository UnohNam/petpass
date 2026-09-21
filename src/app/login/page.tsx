"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signUp, useAuth, usernameOf, USERNAME_RE } from "@/lib/auth";
import { AUTH_ENABLED } from "@/lib/supabase";

const INPUT = "h-12 w-full rounded-md border border-line bg-card px-3.5 text-[15px] text-ink outline-none focus:border-pass";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  if (!AUTH_ENABLED) return <p className="py-20 text-center text-muted">이 배포에서는 로그인을 사용하지 않습니다.</p>;
  if (user) return <div className="py-16 text-center"><p>{usernameOf(user)} 계정으로 로그인되어 있습니다.</p><Link href="/account" className="mt-4 inline-flex h-11 items-center rounded-lg bg-pass px-6 font-semibold text-white">내 계정</Link></div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    const id = username.trim().toLowerCase();
    if (mode === "up" && !USERNAME_RE.test(id)) return setMsg({ kind: "error", text: "아이디는 영문 소문자, 숫자, 밑줄(_)로 4~20자여야 합니다." });
    if (mode === "up" && password.length < 8) return setMsg({ kind: "error", text: "비밀번호는 8자 이상으로 입력해 주세요." });
    if (mode === "up" && !agree) return setMsg({ kind: "error", text: "개인정보 처리방침에 동의해 주세요." });
    setBusy(true);
    const r = mode === "in" ? await signIn(id, password) : await signUp(id, password);
    setBusy(false);
    if (r === null) return router.push("/");
    setMsg({ kind: "error", text: r });
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-8">
      <header className="flex flex-col gap-2">
        <span className="eyebrow">PET PASSPORT ACCOUNT</span>
        <h1 className="font-display text-[32px] font-bold">{mode === "in" ? "로그인" : "계정 만들기"}</h1>
        <p className="text-sm leading-relaxed text-muted">아이디와 비밀번호만으로 가입합니다. 이메일은 받지 않습니다. 로그인하면 반려동물 정보와 저장한 곳을 다른 기기에서도 그대로 쓸 수 있고, 로그인 없이도 모든 기능을 사용할 수 있습니다.</p>
      </header>
      <div className="flex gap-1 rounded-lg border border-line bg-card p-1 text-sm font-medium" role="tablist">
        {([["in", "로그인"], ["up", "가입"]] as const).map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => { setMode(k); setMsg(null); }} className={`min-h-10 flex-1 rounded-md ${mode === k ? "bg-ink text-white" : "text-muted"}`}>{l}</button>)}
      </div>
      {/* 표준 name/autocomplete 속성: 브라우저·기기 비밀번호 관리자가 저장과 자동 입력을 처리합니다 */}
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-line bg-card p-6" method="post">
        <label className="flex flex-col gap-1"><span className="field-label">ID / 아이디{mode === "up" ? " (영문 소문자·숫자·밑줄 4~20자)" : ""}</span>
          <input className={INPUT} type="text" name="username" id="username" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={20} required value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1"><span className="field-label">PASSWORD / 비밀번호{mode === "up" ? " (8자 이상)" : ""}</span>
          <input className={INPUT} type="password" name="password" id="password" autoComplete={mode === "in" ? "current-password" : "new-password"} minLength={mode === "up" ? 8 : undefined} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {mode === "up" && <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-[18px] w-[18px] accent-pass" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> <span><Link href="/privacy" target="_blank" className="text-pass underline">개인정보 처리방침</Link>에 동의합니다.</span></label>}
        {msg && <p role="alert" className={`rounded-md border px-3 py-2 text-sm ${msg.kind === "error" ? "border-stamp bg-no-bg text-stamp" : "border-pass bg-ok-bg text-pass"}`}>{msg.text}</p>}
        <button type="submit" disabled={busy} className="h-12 rounded-lg bg-pass font-semibold text-white hover:bg-pass-dk disabled:opacity-60">{busy ? "처리 중…" : mode === "in" ? "로그인" : "가입하고 시작하기"}</button>
        <p className="text-xs leading-relaxed text-muted">아이디와 비밀번호는 브라우저나 기기의 비밀번호 관리자에 저장해 두면 다음부터 자동으로 입력됩니다. 이메일을 받지 않아 비밀번호를 잊으면 찾을 수 없으니 꼭 저장해 두세요.</p>
      </form>
    </div>
  );
}
