"use client";
import Link from "next/link";
import PlaceCard, { type CardJudgement } from "@/components/PlaceCard";
import PetSwitcher from "@/components/PetSwitcher";
import Icon from "@/components/Icon";
import { judgeTogether } from "@/lib/judge";
import { petLabel, profileToQuery, usePets } from "@/lib/petProfile";
import { useSaved } from "@/lib/saved";

/** 저장한 곳: 현재 반려동물 기준으로 다시 판정하고, 갈 수 있는 곳의 준비물을 합쳐 체크리스트로 제공 */
export default function SavedPage() {
  const { pets, active, together, loaded } = usePets();
  const { items, checks, setCheck, toggle } = useSaved();
  const group = together ? pets : [active];
  const judged = items.map((place) => {
    const g = judgeTogether(place, group);
    const j: CardJudgement = { verdict: g.verdict, requirements: g.requirements, perPet: together ? g.perPet.map((x, i) => ({ label: petLabel(x.pet, i), verdict: x.result.verdict })) : undefined };
    return { place, j };
  });
  const go = judged.filter((x) => x.j.verdict !== "NO");
  const reqCount = new Map<string, number>();
  for (const x of go) for (const r of x.j.requirements) reqCount.set(r, (reqCount.get(r) ?? 0) + 1);
  const reqs = [...reqCount.entries()].sort((a, b) => b[1] - a[1]);
  const blocked = judged.length - go.length;

  if (!loaded) return <p className="py-20 text-center text-muted">불러오는 중…</p>;
  return (
    <div className="space-y-7 pt-4">
      <header className="flex flex-col gap-3">
        <span className="eyebrow">MY ITINERARY</span>
        <h1 className="font-display text-[32px] font-bold leading-tight sm:text-[40px]">저장한 곳</h1>
        <p className="text-muted">반려동물을 바꾸면 저장한 장소 전체를 다시 판정합니다. 이 브라우저에만 저장됩니다.</p>
        <PetSwitcher />
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-card p-10 text-center">
          <p className="text-muted">아직 저장한 곳이 없습니다. 장소 상세에서 저장 버튼을 눌러 보세요.</p>
          <Link href="/" className="mt-4 inline-flex h-11 items-center rounded-lg bg-pass px-6 font-semibold text-white hover:bg-pass-dk">장소 찾으러 가기</Link>
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-line bg-card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Icon name="bag" size={20} className="text-pass" /> 합산 준비물</h2>
            <p className="mt-1 text-sm text-muted">{together ? `${pets.length}마리 모두 함께` : petLabel(active)} 기준으로 갈 수 있는 {go.length}곳의 준비물을 합쳤습니다.{blocked > 0 && ` 입장 불가 ${blocked}곳은 제외했습니다.`}</p>
            {reqs.length ? (
              <ul className="mt-2 grid gap-x-6 sm:grid-cols-2">
                {reqs.map(([r, n]) => <li key={r}><label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]"><input type="checkbox" className="h-[18px] w-[18px] accent-pass" checked={!!checks[r]} onChange={(e) => setCheck(r, e.target.checked)} /> <span className={checks[r] ? "text-muted line-through" : ""}>{r}</span> <span className="font-mono text-[11px] text-muted">{n}곳</span></label></li>)}
              </ul>
            ) : <p className="mt-2 text-sm text-muted">명시된 준비물이 없습니다. 목줄과 배변봉투는 기본으로 챙기세요.</p>}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {judged.map(({ place, j }) => (
              <div key={place.contentid} className="flex min-w-0 flex-col gap-1">
                <PlaceCard place={place} judgement={j} query={profileToQuery(active)} />
                <button type="button" onClick={() => toggle(place)} className="flex min-h-11 items-center gap-1 self-end px-2 text-xs text-muted hover:text-stamp"><Icon name="trash" size={14} /> 저장 해제</button>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
