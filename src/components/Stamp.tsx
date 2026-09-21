import type { Verdict } from "@/lib/types";

export const VERDICT_STYLE: Record<Verdict, { ko: string; en: string; text: string; bg: string; border: string }> = {
  OK: { ko: "동반 가능", en: "APPROVED", text: "text-pass", bg: "bg-ok-bg", border: "border-pass" },
  CONDITIONAL: { ko: "조건부", en: "CONDITIONAL", text: "text-caution", bg: "bg-cond-bg", border: "border-caution" },
  NO: { ko: "입장 불가", en: "DENIED", text: "text-stamp", bg: "bg-no-bg", border: "border-stamp" },
  UNKNOWN: { ko: "정보 없음", en: "NO DATA", text: "text-muted", bg: "bg-paper", border: "border-muted" },
};
const SIZE = {
  sm: { pad: "px-2.5 py-1", en: "text-[8px]", ko: "text-[14px]", bw: "border-2" },
  md: { pad: "px-3 py-1.5", en: "text-[9px]", ko: "text-[17px]", bw: "border-[2.5px]" },
  lg: { pad: "px-6 py-3", en: "text-[14px]", ko: "text-[30px]", bw: "border-4" },
};

/** 판정 도장 (Figma 컴포넌트 Stamp / Verdict=OK|COND|NO) */
export default function Stamp({ verdict, size = "md", rotate = -5 }: { verdict: Verdict; size?: keyof typeof SIZE; rotate?: number }) {
  const v = VERDICT_STYLE[verdict], s = SIZE[size];
  return (
    <span role="img" aria-label={`판정: ${v.ko}`} className={`inline-flex flex-col items-center whitespace-nowrap rounded-md border-current outline outline-1 outline-offset-2 outline-current ${s.bw} ${s.pad} ${v.text}`} style={{ transform: `rotate(${rotate}deg)` }}>
      <span className={`font-mono font-medium tracking-[0.2em] ${s.en}`}>{v.en}</span>
      <span className={`font-display font-bold leading-tight ${s.ko}`}>{v.ko}</span>
    </span>
  );
}
