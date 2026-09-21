"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PetProfileForm from "@/components/PetProfileForm";
import PlaceCard, { type CardJudgement } from "@/components/PlaceCard";
import PetSwitcher from "@/components/PetSwitcher";
import { judgeTogether } from "@/lib/judge";
import Icon from "@/components/Icon";
import { petLabel, profileToQuery, usePets } from "@/lib/petProfile";
import { AREA_CODES, CONTENT_TYPE_LABEL, type CampingWithMatch, type PlaceWithMatch, type Verdict } from "@/lib/types";

type Filter = "ALL" | Verdict;
interface Criteria { source: "place" | "camp"; keyword: string; areaCode: string; contentTypeId: string; geo: { x: string; y: string } | null; page: number }
interface Result { key: string; places: PlaceWithMatch[]; total: number; mock: boolean; error?: string }

export default function HomePage() {
  return <Suspense><Home /></Suspense>;
}

function Home() {
  const initialKeyword = useSearchParams().get("keyword") ?? "";
  const { active: profile, updateActive: update, loaded, pets, together } = usePets();
  // 입력 중 값
  const [keyword, setKeyword] = useState(initialKeyword);
  const [areaCode, setAreaCode] = useState("");
  const [contentTypeId, setContentTypeId] = useState("");
  // 확정된 검색 조건 (검색 버튼/내 주변/페이지 이동 시 갱신)
  const [criteria, setCriteria] = useState<Criteria>({ source: "place", keyword: initialKeyword, areaCode: "", contentTypeId: "", geo: null, page: 1 });
  const [result, setResult] = useState<Result | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");

  const key = useMemo(() => {
    if (!loaded) return null;
    const q = new URLSearchParams(profileToQuery(profile));
    if (criteria.keyword) q.set("keyword", criteria.keyword);
    if (criteria.areaCode) q.set("areaCode", criteria.areaCode);
    if (criteria.contentTypeId) q.set("contentTypeId", criteria.contentTypeId);
    if (criteria.geo && !criteria.keyword && !criteria.areaCode) { q.set("mapX", criteria.geo.x); q.set("mapY", criteria.geo.y); q.set("radius", "10000"); }
    q.set("pageNo", String(criteria.page));
    return `${criteria.source}|${q.toString()}`;
  }, [loaded, profile, criteria]);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const [src, qs] = key.split("|");
    fetch(`${src === "camp" ? "/api/camping" : "/api/places"}?${qs}`)
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error ?? "조회 실패"); return d; })
      .then((d) => {
        if (cancelled) return;
        const places: PlaceWithMatch[] = d.places ?? (d.camps as CampingWithMatch[]).map((c) => ({ contentid: c.contentId, contenttypeid: "camp", title: c.facltNm, addr1: c.addr1, firstimage: c.firstImageUrl, mapx: c.mapX, mapy: c.mapY, dist: c.dist, campRule: c.animalCmgCl, pet: { contentid: c.contentId, acmpyPsblCpam: [c.animalCmgCl && `반려동물 출입: ${c.animalCmgCl}`, c.induty].filter(Boolean).join(" · ") }, match: c.match }));
        setResult({ key, places, total: d.total, mock: d.mock });
      })
      .catch((e) => { if (!cancelled) setResult({ key, places: [], total: 0, mock: false, error: (e as Error).message }); });
    return () => { cancelled = true; };
  }, [key]);

  const loading = key !== null && result?.key !== key;
  const places = result?.places ?? [];
  const total = result?.total ?? 0;
  const error = result?.error;
  const mock = result?.mock ?? false;

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("이 브라우저는 위치 정보를 지원하지 않습니다.");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setKeyword(""); setAreaCode(""); setCriteria({ source: criteria.source, keyword: "", areaCode: "", contentTypeId, geo: { x: String(pos.coords.longitude), y: String(pos.coords.latitude) }, page: 1 }); },
      () => alert("위치 권한을 허용해 주세요."),
    );
  };
  const submit = () => setCriteria({ source: criteria.source, keyword, areaCode, contentTypeId, geo: null, page: 1 });
  const setSource = (source: Criteria["source"]) => setCriteria({ source, keyword, areaCode: "", contentTypeId: "", geo: null, page: 1 });
  const goPage = (page: number) => setCriteria((c) => ({ ...c, page }));

  // 모두 함께 모드: 서버가 준 조건 원문으로 브라우저에서 아이별로 다시 판정
  const judged = places.map((p) => {
    if (!together) return { place: p, j: undefined as CardJudgement | undefined, verdict: (p.match?.verdict ?? "UNKNOWN") as Verdict };
    const g = judgeTogether(p, pets);
    return { place: p, j: { verdict: g.verdict, requirements: g.requirements, perPet: g.perPet.map((x, i) => ({ label: petLabel(x.pet, i), verdict: x.result.verdict })) } as CardJudgement, verdict: g.verdict };
  });
  const shown = filter === "ALL" ? judged : judged.filter((x) => x.verdict === filter);
  const count = (v: Verdict) => judged.filter((x) => x.verdict === v).length;
  const PAGE = 12;

  const FILTERS: [Filter, string][] = [["ALL", `전체 ${places.length}`], ["OK", `동반 가능 ${count("OK")}`], ["CONDITIONAL", `조건부 ${count("CONDITIONAL")}`], ["NO", `입장 불가 ${count("NO")}`], ["UNKNOWN", `정보 없음 ${count("UNKNOWN")}`]];
  const FIELD = "h-12 rounded-lg border border-line bg-card px-3.5 text-[15px] text-ink outline-none focus:border-pass";

  return (
    <div className="space-y-7">
      <section className="grid items-center gap-8 pt-4 md:grid-cols-[1fr_minmax(0,460px)]">
        <div className="flex flex-col gap-4">
          <span className="eyebrow">PET TRAVEL CLEARANCE</span>
          <h1 className="font-display text-[34px] font-bold leading-tight tracking-tight sm:text-[44px]">우리 아이, 여기<br />들어갈 수 있을까?</h1>
          <p className="max-w-lg text-base leading-relaxed text-muted">견종과 체중을 적어 두면, 한국관광공사 반려동반여행 데이터의 장소별 조건과 대조해 입장 가능 여부를 바로 도장 찍어 드립니다.</p>
        </div>
        <div className="flex flex-col gap-3">
          <PetSwitcher />
          <PetProfileForm value={profile} onChange={update} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex gap-1 rounded-lg border border-line bg-card p-1 text-sm font-medium sm:w-fit" role="tablist" aria-label="검색 대상">
          {([["place", "관광지·시설"], ["camp", "캠핑장"]] as const).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={criteria.source === k} onClick={() => setSource(k)} className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-5 ${criteria.source === k ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
              <Icon name={k === "camp" ? "tent" : "compass"} size={16} /> {label}
            </button>
          ))}
        </div>
        <form className="flex flex-wrap gap-2.5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <label className={`flex min-w-0 flex-1 basis-64 items-center gap-2.5 ${FIELD} text-muted`}>
            <Icon name="search" />
            <input aria-label="검색어" className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted" placeholder={criteria.source === "camp" ? "캠핑장명, 지역 (예: 가평, 글램핑)" : "장소명, 키워드 (예: 해수욕장, 카페)"} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </label>
          {criteria.source === "place" && (
            <>
              <select aria-label="지역" className={FIELD} value={areaCode} onChange={(e) => setAreaCode(e.target.value)}>
                <option value="">전국</option>
                {AREA_CODES.map((a) => <option key={a.code} value={a.code}>{a.name}</option>)}
              </select>
              <select aria-label="유형" className={FIELD} value={contentTypeId} onChange={(e) => setContentTypeId(e.target.value)}>
                <option value="">전체 유형</option>
                {Object.entries(CONTENT_TYPE_LABEL).filter(([k]) => k !== "camp").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </>
          )}
          <button type="submit" className="h-12 rounded-lg bg-pass px-7 text-[15px] font-semibold text-white hover:bg-pass-dk disabled:opacity-60" disabled={loading}>{loading ? "조회 중…" : "검색"}</button>
          <button type="button" onClick={useMyLocation} className="flex h-12 items-center gap-1.5 rounded-lg border border-line bg-card px-4 text-sm hover:border-ink"><Icon name="pin" size={16} /> 내 주변</button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.filter(([f]) => f !== "UNKNOWN" || count("UNKNOWN") > 0).map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className={`h-11 rounded-full border px-4 text-sm font-medium ${filter === f ? "border-ink bg-ink text-white" : "border-line bg-card text-ink hover:border-ink"}`}>{label}</button>
          ))}
          <span className="ml-auto font-mono text-[11px] text-muted">{together ? `${pets.length}마리 모두 함께` : `${petLabel(profile)} · ${profile.weightKg}kg`} 기준 판정{criteria.geo ? " · 내 주변 10km" : ""}</span>
        </div>
        {mock && <p className="rounded-md border border-caution bg-cond-bg px-3 py-2 text-xs text-caution">샘플 데이터 모드입니다. .env.local 에 TOUR_API_KEY 를 넣으면 실데이터로 전환됩니다.</p>}
      </section>

      {error && <div className="rounded-lg border border-stamp bg-no-bg p-4 text-sm text-stamp">{error}</div>}

      <section className="grid gap-4 md:grid-cols-2">
        {shown.map((x) => <PlaceCard key={x.place.contentid} place={x.place} judgement={x.j} query={profileToQuery(profile)} />)}
        {loading && places.length === 0 && <p className="col-span-full py-12 text-center text-muted">장소별 동반 조건을 대조하는 중…</p>}
        {!loading && shown.length === 0 && !error && <p className="col-span-full py-12 text-center text-muted">조건에 맞는 장소가 없습니다. 검색어나 필터를 바꿔 보세요.</p>}
      </section>

      {total > PAGE && (
        <nav className="flex items-center justify-center gap-4 text-sm" aria-label="페이지">
          <button disabled={criteria.page <= 1 || loading} onClick={() => goPage(criteria.page - 1)} className="h-11 rounded-lg border border-line bg-card px-4 disabled:opacity-40">이전</button>
          <span className="font-mono text-muted">{criteria.page} / {Math.ceil(total / PAGE)}</span>
          <button disabled={criteria.page * PAGE >= total || loading} onClick={() => goPage(criteria.page + 1)} className="h-11 rounded-lg border border-line bg-card px-4 disabled:opacity-40">다음</button>
        </nav>
      )}
    </div>
  );
}
