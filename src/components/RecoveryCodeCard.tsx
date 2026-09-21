"use client";
import { useState } from "react";

/** 복구 코드는 이 화면에서 한 번만 보여 줍니다. 서버에는 해시만 저장됩니다. */
export default function RecoveryCodeCard({ code, onDone, doneLabel = "저장했습니다. 계속하기" }: { code: string; onDone?: () => void; doneLabel?: string }) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); } catch { setCopied(false); } };
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-caution bg-cond-bg p-6" aria-label="복구 코드">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[11px] tracking-[0.2em] text-caution">RECOVERY CODE</span>
        <h2 className="font-display text-2xl font-bold">복구 코드를 꼭 저장하세요</h2>
        <p className="text-sm leading-relaxed">이메일을 받지 않기 때문에, 비밀번호를 잊었을 때 이 코드가 계정을 되찾는 유일한 방법입니다. 이 화면을 닫으면 다시 볼 수 없습니다.</p>
      </div>
      <output className="select-all rounded-lg border-2 border-dashed border-caution bg-card px-4 py-4 text-center font-mono text-[19px] font-medium tracking-[0.12em] sm:text-[22px]" data-testid="recovery-code">{code}</output>
      <div className="flex flex-wrap gap-2.5">
        <button type="button" onClick={copy} className="h-11 rounded-lg border border-ink bg-card px-4 text-sm font-medium">{copied ? "복사했습니다" : "코드 복사"}</button>
        <span className="flex items-center text-xs text-muted">메모 앱이나 비밀번호 관리자의 메모 칸에 붙여 넣어 두세요.</span>
      </div>
      {onDone && (
        <>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-[18px] w-[18px] accent-pass" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /> 복구 코드를 안전한 곳에 저장했습니다.</label>
          <button type="button" disabled={!confirmed} onClick={onDone} className="h-12 rounded-lg bg-pass font-semibold text-white hover:bg-pass-dk disabled:opacity-40">{doneLabel}</button>
        </>
      )}
    </section>
  );
}
