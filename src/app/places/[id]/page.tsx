"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PetProfileForm from "@/components/PetProfileForm";
import PlaceCard from "@/components/PlaceCard";
import Stamp, { VERDICT_STYLE } from "@/components/Stamp";
import Icon from "@/components/Icon";
import ExtrasPanel from "@/components/ExtrasPanel";
import { petLabel, profileToQuery, usePets } from "@/lib/petProfile";
import { useSaved } from "@/lib/saved";
import { matchPet } from "@/lib/match";
import PetSwitcher from "@/components/PetSwitcher";
import VerdictBadge from "@/components/VerdictBadge";
import type { CommonDetail, MatchResult, PetTourDetail, PlaceExtras, PlaceWithMatch } from "@/lib/types";
import { CONTENT_TYPE_LABEL } from "@/lib/types";

interface DetailData {
  common?: CommonDetail;
  pet?: PetTourDetail;
  intro?: Record<string, string>;
  images: string[];
  match: MatchResult;
  alternatives: PlaceWithMatch[];
  extras?: PlaceExtras;
  mock: boolean;
}

const INTRO_FIELDS: [string, string][] = [
  ["usetime", "이용시간"], ["opentime", "영업시간"], ["opentimefood", "영업시간"], ["restdate", "휴무일"], ["restdatefood", "휴무일"],
  ["parking", "주차"], ["parkingfood", "주차"], ["parkinglodging", "주차"], ["checkintime", "체크인"], ["checkouttime", "체크아웃"],
  ["chkpet", "반려동물(소개)"], ["chkpetculture", "반려동물(소개)"], ["infocenter", "문의"], ["infocenterfood", "문의"], ["firstmenu", "대표메뉴"],
];

function strip(html?: string) { return (html ?? "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""); }

export default function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const sp = useSearchParams();
  const { active: profile, updateActive: update, loaded, pets } = usePets();
  const saved = useSaved();
  const [result, setResult] = useState<{ key: string; data?: DetailData; error?: string } | null>(null);

  const ct = sp.get("contentTypeId");
  const key = loaded ? `${id}|${ct ?? ""}|${profileToQuery(profile)}` : null;

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const q = new URLSearchParams(profileToQuery(profile));
    if (ct) q.set("contentTypeId", ct);
    fetch(`/api/places/${id}?${q}`)
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d as DetailData; })
      .then((d) => { if (!cancelled) setResult({ key, data: d }); })
      .catch((e) => { if (!cancelled) setResult({ key, error: (e as Error).message }); });
    return () => { cancelled = true; };
  }, [key, id, ct, profile]);

  const current = result?.key === key ? result : null;
  if (current?.error) return <div className="rounded-lg border border-stamp bg-no-bg p-4 text-stamp">{current.error}</div>;
  const data = current?.data ?? result?.data; // 재판정 중엔 이전 데이터 유지
  if (!data) return <p className="py-20 text-center text-muted">장소 정보와 동반 조건을 불러오는 중…</p>;

  const { common, pet, intro, images, match, alternatives, extras } = data;
  const img = common?.firstimage || images[0] || extras?.photos?.[0]?.url;
  const mapUrl = common?.mapx && common?.mapy ? `https://map.kakao.com/link/map/${encodeURIComponent(common.title)},${common.mapy},${common.mapx}` : undefined;
  const tel = strip(common?.tel || intro?.infocenter || intro?.infocenterfood).split("\n")[0].trim();
  const home = common?.homepage?.match(/href="([^"]+)"/)?.[1];
  const vs = VERDICT_STYLE[match.verdict];
  const others = pets.filter((x) => x.id !== profile.id).map((x) => ({ pet: x, result: matchPet(pet, x) }));
  const isSaved = common ? saved.isSaved(common.contentid) : false;
  const toggleSave = () => common && saved.toggle({ contentid: common.contentid, contenttypeid: common.contenttypeid, title: common.title, addr1: common.addr1 ?? "", firstimage: common.firstimage, mapx: common.mapx ?? "", mapy: common.mapy ?? "", pet });
  const reasonIcon = (r: string) => /초과|불가|미달/.test(r) ? ["x", "text-stamp"] : /필요|확인|안내:|조건|범위: (실외|야외)/.test(r) ? ["alert", "text-caution"] : ["check", "text-pass"];
  const ACTION = "inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-card px-4 text-sm text-ink hover:border-ink";
  const CARD = "rounded-xl border border-line bg-card p-5 sm:p-6";
  const rows = ([["동반 유형", pet?.acmpyTypeCd], ["동반 가능 동물", pet?.acmpyPsblCpam], ["필요 사항", pet?.acmpyNeedMtr], ["기타", pet?.etcAcmpyInfo], ["구비 시설", pet?.relaPosesFclty], ["비치 품목", pet?.relaFrnshPrdlst], ["렌탈 품목", pet?.relaRntlPrdlst], ["구매 품목", pet?.relaPurcPrdlst], ["사고 대비", pet?.relaAcdntRiskMtr]] as [string, string | undefined][]).filter(([, v]) => v && v.trim());

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-ink"><Icon name="back" size={16} /> 목록으로</Link>

      <section className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
        <div className="photo-ph relative h-52 w-full shrink-0 overflow-hidden rounded-xl sm:h-auto sm:min-h-56 sm:w-[340px]">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : <div className="flex h-full items-center justify-center"><span className="rounded bg-card px-2 py-0.5 font-mono text-[11px] text-muted">등록된 사진 없음</span></div>}
        </div>
        <div className="flex flex-1 flex-col justify-center gap-2.5">
          <span className="eyebrow">{CONTENT_TYPE_LABEL[common?.contenttypeid ?? ""] ?? "장소"}</span>
          <h1 className="font-display text-[30px] font-bold leading-tight sm:text-[38px]">{common?.title}</h1>
          <p className="text-[15px] text-muted">{common?.addr1} {common?.addr2}</p>
          <div className="mt-1 flex flex-wrap gap-2.5">
            {tel && <a href={`tel:${tel}`} className={ACTION}><Icon name="phone" size={16} /> {tel}</a>}
            {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className={ACTION}><Icon name="map" size={16} /> 지도 보기</a>}
            {home && <a href={home} target="_blank" rel="noreferrer" className={ACTION}><Icon name="link" size={16} /> 홈페이지</a>}
            <button type="button" onClick={toggleSave} aria-pressed={isSaved} className={`${ACTION} ${isSaved ? "!border-pass !bg-pass !text-white" : ""}`}><Icon name="bookmark" size={16} /> {isSaved ? "저장됨" : "저장"}</button>
          </div>
        </div>
      </section>

      {/* 판정: 절취선 + 도장 */}
      <section className={`flex flex-col overflow-hidden rounded-xl border bg-card sm:flex-row ${vs.border}`} aria-label="판정 결과">
        <div className="flex flex-1 flex-col gap-3.5 p-5 sm:p-7">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-display text-2xl font-bold">판정 결과</h2>
            <span className="font-mono text-xs text-muted">{petLabel(profile)} · {profile.weightKg}kg{profile.hasCarrier ? " · 이동장 있음" : ""}{profile.hasStroller ? " · 유모차 있음" : ""}</span>
          </div>
          <ul className="flex flex-col gap-2">
            {match.reasons.map((r, i) => { const [ic, c] = reasonIcon(r); return <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed"><Icon name={ic} className={`mt-1 shrink-0 ${c}`} strokeWidth={2.2} /><span>{r}</span></li>; })}
          </ul>
          {others.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t border-dashed border-line pt-3">
              <span className="field-label">함께 가는 아이들</span>
              {others.map(({ pet: o, result }, i) => <p key={o.id} className="flex flex-wrap items-center gap-2 text-sm"><VerdictBadge verdict={result.verdict} /> <b>{petLabel(o, i + 1)}</b> <span className="font-mono text-xs text-muted">{o.weightKg}kg</span> <span className="text-muted">{result.reasons.find((r) => /초과|불가|미달|필요/.test(r)) ?? ""}</span></p>)}
            </div>
          )}
          <details className="text-sm">
            <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-paper px-3.5"><Icon name="swap" size={16} /> 반려동물 정보 바꿔서 다시 판정</summary>
            <div className="mt-3 flex max-w-lg flex-col gap-3"><PetSwitcher /><PetProfileForm value={profile} onChange={update} /></div>
          </details>
        </div>
        <div className={`flex shrink-0 items-center justify-center border-t-2 border-dashed p-8 sm:w-[280px] sm:border-l-2 sm:border-t-0 ${vs.bg} ${vs.border}`}>
          <Stamp verdict={match.verdict} size="lg" rotate={-8} />
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className={CARD}>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Icon name="bag" size={20} className="text-pass" /> 필수 준비물</h2>
          {match.requirements.length ? (
            <ul className="mt-2 grid gap-x-4 sm:grid-cols-2">{match.requirements.map((r) => <li key={r}><label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]"><input type="checkbox" className="h-[18px] w-[18px] accent-pass" /> {r}</label></li>)}</ul>
          ) : <p className="mt-2 text-sm text-muted">명시된 준비물이 없습니다. 목줄과 배변봉투는 기본으로 챙기세요.</p>}
        </div>
        <div className={CARD}>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Icon name="doc" size={20} className="text-pass" /> 동반 조건 원문</h2>
          <dl className="mt-1">
            {rows.map(([k, v]) => <div key={k} className="grid grid-cols-[6rem_1fr] gap-3 border-b border-dashed border-line py-2.5 text-sm"><dt className="text-muted">{k}</dt><dd className="whitespace-pre-line">{v}</dd></div>)}
            {!rows.length && <p className="py-2 text-sm text-muted">등록된 반려동물 동반 정보가 없습니다.</p>}
          </dl>
          <p className="mt-2.5 font-mono text-[11px] text-muted">출처 · 한국관광공사 반려동물 동반여행 서비스</p>
        </div>
      </section>

      {match.verdict !== "OK" && (
        <section className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-baseline gap-x-3"><h2 className="font-display text-2xl font-bold">대신 여기는 어때요</h2><span className="text-sm text-muted">반경 10km 안에서 {petLabel(profile)} {profile.weightKg}kg 기준으로 다시 판정했습니다.</span></div>
          {alternatives.length ? <div className="grid gap-4 md:grid-cols-2">{alternatives.map((a) => <PlaceCard key={a.contentid} place={a} query={profileToQuery(profile)} />)}</div> : <p className="text-sm text-muted">반경 내 동반 가능 대체 장소를 찾지 못했습니다.</p>}
        </section>
      )}

      <ExtrasPanel extras={extras} />

      <section className={`${CARD} text-sm`}>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Icon name="info" size={20} className="text-pass" /> 장소 정보</h2>
        {common?.overview && <p className="mt-2 whitespace-pre-line leading-relaxed text-ink/85">{strip(common.overview)}</p>}
        {intro && (
          <dl className="mt-3 grid gap-x-6 sm:grid-cols-2">
            {INTRO_FIELDS.filter(([k]) => intro[k]).map(([k, label]) => <div key={k} className="grid grid-cols-[5rem_1fr] gap-2 border-b border-dashed border-line py-2"><dt className="text-muted">{label}</dt><dd className="whitespace-pre-line">{strip(intro[k])}</dd></div>)}
          </dl>
        )}
        {images.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {images.slice(1).map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u} src={u} alt="" className="h-24 w-32 shrink-0 rounded-lg object-cover" loading="lazy" />
            ))}
          </div>
        )}
        <p className="mt-3 font-mono text-[11px] text-muted">출처 · 한국관광공사 국문 관광정보 서비스</p>
      </section>
    </div>
  );
}
