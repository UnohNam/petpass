import Link from "next/link";
import type { PlaceWithMatch, Verdict } from "@/lib/types";
import { CONTENT_TYPE_LABEL } from "@/lib/types";
import Stamp, { VERDICT_STYLE } from "./Stamp";

/** 절취선이 있는 티켓형 장소 카드 (Figma: Ticket) */
export interface CardJudgement { verdict: Verdict; requirements: string[]; perPet?: { label: string; verdict: Verdict }[] }
const SHORT: Record<Verdict, string> = { OK: "가능", CONDITIONAL: "조건부", NO: "불가", UNKNOWN: "정보 없음" };

export default function PlaceCard({ place, query, judgement }: { place: PlaceWithMatch; query: string; judgement?: CardJudgement }) {
  const m = judgement ?? place.match;
  const img = place.firstimage2 || place.firstimage;
  const isCamp = place.contenttypeid === "camp";
  const href = isCamp ? `https://map.kakao.com/link/map/${encodeURIComponent(place.title)},${place.mapy},${place.mapx}` : `/places/${place.contentid}?contentTypeId=${place.contenttypeid}&${query}`;
  const verdict = m?.verdict ?? "UNKNOWN";
  return (
    <Link href={href} target={isCamp ? "_blank" : undefined} className="group flex min-h-[128px] overflow-hidden rounded-[10px] border border-line bg-card text-ink transition hover:border-ink">
      <div className="photo-ph relative hidden w-24 shrink-0 sm:block">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] tracking-[0.14em] text-pass">{CONTENT_TYPE_LABEL[place.contenttypeid] ?? "장소"}</span>
          {place.dist && <span className="font-mono text-[11px] text-muted">{(+place.dist / 1000).toFixed(1)}km</span>}
        </div>
        <h3 className="truncate font-display text-[18px] font-bold leading-snug group-hover:underline">{place.title}</h3>
        <p className="truncate text-[13px] text-muted">{place.addr1}</p>
        {place.pet?.acmpyPsblCpam && <p className="line-clamp-1 text-[13px]">{place.pet.acmpyPsblCpam}</p>}
        {judgement?.perPet ? <p className="line-clamp-1 text-xs">{judgement.perPet.map((x) => <span key={x.label} className={`mr-2 ${VERDICT_STYLE[x.verdict].text}`}>{x.label} {SHORT[x.verdict]}</span>)}</p> : null}
        {m?.requirements.length ? <p className="line-clamp-1 text-xs text-muted">준비물 · {m.requirements.join(", ")}</p> : null}
      </div>
      <div className={`flex w-[116px] shrink-0 items-center justify-center border-l-2 border-dashed border-line ${VERDICT_STYLE[verdict].bg}`}>
        <Stamp verdict={verdict} size="sm" />
      </div>
    </Link>
  );
}
