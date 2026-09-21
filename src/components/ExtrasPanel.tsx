import type { NearbyFacility, PlaceExtras } from "@/lib/types";
import VerdictBadge from "./VerdictBadge";
import Icon from "./Icon";

const fmt = (ymd: string) => `${Number(ymd.slice(4, 6))}/${Number(ymd.slice(6, 8))}`;
const dow = (ymd: string) => "일월화수목금토"[new Date(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8))).getDay()];
const barColor = (r: number) => (r >= 70 ? "bg-stamp" : r >= 40 ? "bg-caution" : "bg-pass");
const airColor: Record<string, string> = { 좋음: "text-pass", 보통: "text-ink", 나쁨: "text-caution", 매우나쁨: "text-stamp" };
const CARD = "rounded-xl border border-line bg-card p-5 text-sm sm:p-6";

function Head({ icon, title, source }: { icon: string; title: string; source: string }) {
  return <h2 className="flex flex-wrap items-center gap-x-2 font-display text-xl font-bold"><Icon name={icon} size={20} className="text-pass" /> {title} <span className="font-mono text-[11px] font-normal text-muted">{source}</span></h2>;
}

export default function ExtrasPanel({ extras }: { extras?: PlaceExtras }) {
  if (!extras) return null;
  const { weather, air, crowd, crowdName, related, trails, photos, vets, facilities } = extras;
  const calm = crowd?.length ? [...crowd].filter((c) => !c.holiday).sort((a, b) => a.rate - b.rate).slice(0, 3) : [];
  const holidays = crowd?.filter((c) => c.holiday) ?? [];
  return (
    <div className="space-y-5">
      {(weather || air) && (
        <section className={CARD}>
          <Head icon="sun" title="오늘의 산책 컨디션" source={air ? "기상청 단기예보 · 에어코리아" : "기상청 단기예보"} />
          <div className="mt-3 flex flex-wrap items-baseline gap-x-8 gap-y-2">
            {weather && <p><b className="font-display text-3xl">{weather.temp ?? "-"}°C</b> <span className="text-[15px]">{weather.sky} · 강수확률 {weather.pop ?? "-"}%</span></p>}
            {air && <p>미세먼지 <b className={airColor[air.grade] ?? ""}>{air.grade}</b> <span className="text-muted">({air.sido} 평균 PM10 {air.pm10 ?? "-"} · PM2.5 {air.pm25 ?? "-"})</span></p>}
          </div>
          <ul className="mt-2 flex flex-col gap-1.5">
            {[...(weather?.advice ?? []), ...(air?.advice ? [air.advice] : [])].map((a) => <li key={a} className="flex gap-2"><Icon name="alert" size={16} className="mt-0.5 shrink-0 text-caution" /> {a}</li>)}
            {!weather?.advice.length && !air?.advice && <li className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-pass" /> 산책하기 무난한 날씨입니다.</li>}
          </ul>
        </section>
      )}

      {crowd && crowd.length > 0 && (
        <section className={CARD}>
          <Head icon="chart" title="방문 혼잡도 예측" source={`관광지 집중률 예측 · ${crowdName}`} />
          <p className="mt-2 leading-relaxed text-muted">사람이 덜 몰리는 날이 반려동물과 다니기 편합니다. {holidays.length > 0 && <>공휴일({holidays.map((c) => `${fmt(c.date)} ${c.holiday}`).join(", ")})은 붐빌 수 있습니다. </>}<span className="text-ink">한산한 날 · <b>{calm.map((c) => `${fmt(c.date)}(${dow(c.date)})`).join(", ")}</b></span></p>
          <div className="mt-4 flex h-32 items-end gap-1.5 overflow-x-auto">
            {crowd.map((c) => (
              <div key={c.date} className="flex w-9 shrink-0 flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-muted">{Math.round(c.rate)}</span>
                <div className={`w-full rounded-t-sm ${barColor(c.rate)}`} style={{ height: `${Math.max(4, c.rate * 0.75)}px` }} />
                <span className={`text-center font-mono text-[10px] leading-tight ${c.holiday || dow(c.date) === "일" ? "text-stamp" : "text-muted"}`} title={c.holiday}>{fmt(c.date)}<br />{c.holiday ? "휴일" : dow(c.date)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {vets && vets.length > 0 && (
        <section className={CARD}>
          <Head icon="cross" title="가까운 동물병원·동물약국" source="한국문화정보원 문화시설 데이터" />
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">{vets.map((v) => <FacilityRow key={v.name + v.address} f={v} />)}</ul>
        </section>
      )}

      {facilities && facilities.length > 0 && (
        <section className={CARD}>
          <Head icon="cup" title="주변 동반 가능 시설" source="반경 5km · 우리 아이 기준 판정" />
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">{facilities.map((v) => <FacilityRow key={v.name + v.address} f={v} />)}</ul>
        </section>
      )}

      {related && related.length > 0 && (
        <section className={CARD}>
          <Head icon="compass" title="함께 많이 찾는 곳" source="관광지별 연관 관광지" />
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
            {related.map((r) => (
              <li key={`${r.rank}-${r.name}`}><a className="flex min-h-11 items-center gap-2.5 hover:underline" href={`/?keyword=${encodeURIComponent(r.name)}`}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line font-mono text-xs">{r.rank}</span>
                <span className="truncate">{r.name}</span><span className="shrink-0 text-xs text-muted">{r.category}</span></a></li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted">이름을 누르면 우리 아이 기준 동반 가능 여부를 검색합니다.</p>
        </section>
      )}

      {trails && trails.length > 0 && (
        <section className={CARD}>
          <Head icon="trail" title="근처 걷기길" source="두루누비 코리아둘레길" />
          <ul className="mt-3 flex flex-col gap-3">
            {trails.map((t) => <li key={t.name}><b>{t.name}</b> <span className="font-mono text-xs text-muted">{[t.distanceKm && `${t.distanceKm}km`, t.duration, t.level].filter(Boolean).join(" · ")}</span>{t.summary && <p className="text-muted">{t.summary}</p>}</li>)}
          </ul>
        </section>
      )}

      {photos && photos.length > 0 && (
        <section className={CARD}>
          <Head icon="camera" title="관광사진" source="한국관광공사 관광사진 정보" />
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.url} src={p.url} alt={p.title} className="h-28 w-40 shrink-0 rounded-lg object-cover" loading="lazy" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FacilityRow({ f }: { f: NearbyFacility }) {
  const map = f.lat ? `https://map.kakao.com/link/map/${encodeURIComponent(f.name)},${f.lat},${f.lng}` : undefined;
  return (
    <li className="rounded-lg border border-line bg-paper/50 p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        {f.verdict && <VerdictBadge verdict={f.verdict} />}
        <span className="font-mono text-[11px] text-muted">{f.category} · {f.distanceKm.toFixed(1)}km</span>
      </div>
      <p className="mt-1.5 font-display text-[16px] font-bold">{map ? <a href={map} target="_blank" rel="noreferrer" className="hover:underline">{f.name}</a> : f.name}</p>
      {f.address && <p className="truncate text-xs text-muted">{f.address}</p>}
      {(f.tel || f.hours) && <p className="mt-0.5 text-xs">{f.tel && <a href={`tel:${f.tel}`} className="text-pass underline">{f.tel}</a>}{f.tel && f.hours ? " · " : ""}{f.hours}</p>}
      {f.verdict && <p className="mt-0.5 text-xs text-muted">크기 {f.sizeRule || "-"}{f.restriction && !/없음/.test(f.restriction) ? ` · ${f.restriction}` : ""}{f.extraFee && !/없음/.test(f.extraFee) ? ` · 추가요금 ${f.extraFee}` : ""}</p>}
    </li>
  );
}
