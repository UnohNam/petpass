import type { Verdict } from "@/lib/types";
import { VERDICT_STYLE } from "./Stamp";

/** 작은 판정 칩 (주변 시설 목록 등 도장이 들어가기 좁은 곳) */
export default function VerdictBadge({ verdict }: { verdict: Verdict; size?: "sm" | "lg" }) {
  const v = VERDICT_STYLE[verdict];
  return <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${v.bg} ${v.text} ${v.border}`}>{v.ko}</span>;
}
