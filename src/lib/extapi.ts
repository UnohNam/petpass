import "server-only";
import { BASE, call, USE_MOCK } from "./tourapi";
import type { CampingItem, CommonDetail, NearbyFacility, PetProfile, PlaceExtras, Verdict } from "./types";
import { SIZE_LABEL } from "./match";

const DAY = 86400;
const safe = async <T>(fn: () => Promise<T>): Promise<T | undefined> => { try { return await fn(); } catch { return undefined; } };

// ---------------- 고캠핑 ----------------
const CAMP = `${BASE}/GoCamping`;
const MOCK_CAMPS: CampingItem[] = [
  { contentId: "c1", facltNm: "[샘플] 강변 오토캠핑장", lineIntro: "강을 따라 걷기 좋은 오토캠핑장", addr1: "경기도 가평군", mapX: "127.51", mapY: "37.83", induty: "일반야영장,자동차야영장", animalCmgCl: "가능" },
  { contentId: "c2", facltNm: "[샘플] 숲속 글램핑", lineIntro: "소형견과 함께하는 글램핑", addr1: "강원특별자치도 홍천군", mapX: "127.88", mapY: "37.69", induty: "글램핑", animalCmgCl: "가능(소형견)" },
  { contentId: "c3", facltNm: "[샘플] 해변 야영장", lineIntro: "바다 앞 야영장", addr1: "충청남도 태안군", mapX: "126.29", mapY: "36.74", induty: "일반야영장", animalCmgCl: "불가능" },
];
export async function searchCamping(p: { keyword?: string; mapX?: string; mapY?: string; radius?: number; pageNo?: number }): Promise<{ items: CampingItem[]; total: number }> {
  if (USE_MOCK) { const items = MOCK_CAMPS.filter((c) => !p.keyword || c.facltNm.includes(p.keyword) || c.addr1.includes(p.keyword)); return { items, total: items.length }; }
  const common = { numOfRows: 12, pageNo: p.pageNo ?? 1 };
  if (p.keyword) return call<CampingItem>(CAMP, "searchList", { ...common, keyword: p.keyword });
  if (p.mapX && p.mapY) return call<CampingItem>(CAMP, "locationBasedList", { ...common, mapX: p.mapX, mapY: p.mapY, radius: p.radius ?? 20000 });
  return call<CampingItem>(CAMP, "basedList", common);
}

// ---------------- 법정동 코드 ----------------
function codes(c?: CommonDetail): { areaCd: string; signguCd: string } | undefined {
  if (!c?.lDongRegnCd || !c.lDongSignguCd) return undefined;
  const signguCd = c.lDongSignguCd.length >= 5 ? c.lDongSignguCd : `${c.lDongRegnCd}${c.lDongSignguCd}`;
  return { areaCd: c.lDongRegnCd, signguCd };
}
const norm = (s: string) => s.replace(/\s+/g, "").replace(/\(.*?\)/g, "");

// ---------------- 관광지 집중률 방문자 추이 예측 ----------------
interface CrowdRow { baseYmd: string; tAtsNm: string; cnctrRate: string }
async function getCrowd(c?: CommonDetail): Promise<Pick<PlaceExtras, "crowd" | "crowdName">> {
  const cd = codes(c); if (!cd || !c) return {};
  // 시군구 전체는 1,000행을 넘으므로(관광지 수 × 30일) 이름 필터(부분 일치)로 조회
  const name = c.title.replace(/\(.*?\)/g, "").trim();
  const { items } = await call<CrowdRow>(`${BASE}/TatsCnctrRateService`, "tatsCnctrRatedList", { ...cd, tAtsNm: name, numOfRows: 200, pageNo: 1 }, DAY);
  const t = norm(c.title);
  const names = [...new Set(items.map((i) => i.tAtsNm))];
  const hit = names.find((n) => norm(n) === t) ?? names.find((n) => norm(n).includes(t) || t.includes(norm(n)));
  if (!hit) return {};
  const crowd = items.filter((i) => i.tAtsNm === hit).map((i) => ({ date: i.baseYmd, rate: Number(i.cnctrRate) })).filter((x) => !Number.isNaN(x.rate)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 14);
  const hol = await safe(() => getHolidays(crowd.map((x) => x.date)));
  return { crowd: crowd.map((x) => ({ ...x, holiday: hol?.[x.date] })), crowdName: hit };
}

// ---------------- 관광지별 연관 관광지 ----------------
interface RelRow { tAtsNm: string; rlteTatsNm: string; rlteRegnNm?: string; rlteSignguNm?: string; rlteCtgryLclsNm?: string; rlteRank: string }
async function getRelated(c?: CommonDetail): Promise<PlaceExtras["related"]> {
  const cd = codes(c); if (!cd || !c) return undefined;
  // 데이터 제공 기간 안의 기준월을 최근부터 시도
  for (const baseYm of ["202504", "202503"]) {
    const { items } = await call<RelRow>(`${BASE}/TarRlteTarService1`, "searchKeyword1", { ...cd, baseYm, keyword: c.title, numOfRows: 30, pageNo: 1 }, DAY);
    if (items.length) return items.sort((a, b) => Number(a.rlteRank) - Number(b.rlteRank)).slice(0, 6).map((i) => ({ name: i.rlteTatsNm, category: i.rlteCtgryLclsNm ?? "", region: [i.rlteRegnNm, i.rlteSignguNm].filter(Boolean).join(" "), rank: Number(i.rlteRank) }));
  }
  return undefined;
}

// ---------------- 관광사진 ----------------
interface PhotoRow { galTitle: string; galWebImageUrl: string; galPhotographyLocation?: string }
async function getPhotos(title: string): Promise<PlaceExtras["photos"]> {
  const { items } = await call<PhotoRow>(`${BASE}/PhotoGalleryService1`, "gallerySearchList1", { keyword: title, numOfRows: 6, pageNo: 1, arrange: "A" }, DAY);
  return items.filter((i) => i.galWebImageUrl).map((i) => ({ title: i.galTitle, url: i.galWebImageUrl.replace(/^http:/, "https:"), location: i.galPhotographyLocation }));
}

// ---------------- 두루누비 ----------------
interface CourseRow { crsKorNm: string; crsDstnc?: string; crsTotlRqrmHour?: string; crsLevel?: string; crsSummary?: string; sigun?: string }
const LEVEL: Record<string, string> = { "1": "쉬움", "2": "보통", "3": "어려움" };
const mins = (m?: string) => { const n = Number(m); if (!n) return ""; const h = Math.floor(n / 60), r = n % 60; return `약 ${h ? `${h}시간 ` : ""}${r ? `${r}분` : ""}`.trim(); };
async function getTrails(addr?: string): Promise<PlaceExtras["trails"]> {
  const [sidoFull, sigungu] = (addr ?? "").split(/\s+/); if (!sigungu) return undefined;
  const sido = SIDO.find(([re]) => re.test(sidoFull))?.[1];
  const { items } = await call<CourseRow>(`${BASE}/Durunubi`, "courseList", { numOfRows: 400, pageNo: 1 }, DAY);
  // sigun 예: "경남 남해군", "부산 서구"
  return items.filter((i) => i.sigun && (!sido || i.sigun.startsWith(sido)) && i.sigun.includes(sigungu)).slice(0, 3)
    .map((i) => ({ name: i.crsKorNm, distanceKm: i.crsDstnc ?? "", duration: mins(i.crsTotlRqrmHour), level: LEVEL[i.crsLevel ?? ""] ?? "", summary: (i.crsSummary ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 90) }));
}

// ---------------- 특일 정보 (공휴일) ----------------
interface HolidayRow { dateName: string; isHoliday: string; locdate: number | string }
async function getHolidays(ymds: string[]): Promise<Record<string, string>> {
  const months = [...new Set(ymds.map((d) => d.slice(0, 6)))];
  const out: Record<string, string> = {};
  for (const ym of months) {
    const { items } = await call<HolidayRow>("https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService", "getRestDeInfo", { solYear: ym.slice(0, 4), solMonth: ym.slice(4, 6), numOfRows: 30 }, DAY);
    for (const h of items) if (h.isHoliday === "Y") out[String(h.locdate)] = h.dateName;
  }
  return out;
}

// ---------------- 전국 반려동물 동반 가능 문화시설 위치 데이터 (한국문화정보원) ----------------
const FAC_URL = "https://api.odcloud.kr/api/15111389/v1/uddi:41944402-8249-4e45-9e9d-a52d0a7db1cc";
type FacRow = Record<string, string | number | null>;
const km = (lat1: number, lon1: number, lat2: number, lon2: number) => { const R = 6371, d = Math.PI / 180, a = Math.sin(((lat2 - lat1) * d) / 2) ** 2 + Math.cos(lat1 * d) * Math.cos(lat2 * d) * Math.sin(((lon2 - lon1) * d) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(a)); };
export function facilityVerdict(sizeRule: string, restriction: string, allowed: string, profile: PetProfile): Verdict {
  if (allowed === "N") return "NO";
  const sizes = /소형|중형|대형/.test(sizeRule);
  if (profile.species === "dog" && sizes && !sizeRule.includes(SIZE_LABEL[profile.size].replace("견", ""))) return "NO";
  if (profile.species === "cat" && !/모두|고양이/.test(sizeRule)) return "CONDITIONAL";
  if (!/모두|소형|중형|대형/.test(sizeRule)) return "UNKNOWN";
  return restriction && !/제한사항\s*없음|해당\s*없음/.test(restriction) ? "CONDITIONAL" : "OK";
}
async function getFacilities(c: CommonDetail, profile: PetProfile): Promise<Pick<PlaceExtras, "vets" | "facilities">> {
  const lat = Number(c.mapy), lon = Number(c.mapx); const [sidoFull, sigungu] = (c.addr1 ?? "").split(/\s+/);
  if (!lat || !lon || !sigungu) return {};
  const key = process.env.TOUR_API_KEY ?? ""; const k = key.includes("%") ? key : encodeURIComponent(key);
  const q = new URLSearchParams({ page: "1", perPage: "1000" }); q.set("cond[시군구 명칭::LIKE]", sigungu); q.set("cond[시도 명칭::EQ]", sidoFull);
  const res = await fetch(`${FAC_URL}?serviceKey=${k}&${q}`, { next: { revalidate: DAY } });
  const json = (await res.json()) as { data?: FacRow[] }; if (!json.data) throw new Error("facility api");
  const rows: NearbyFacility[] = json.data.map((r) => {
    const la = Number(r["위도"]), lo = Number(r["경도"]); const S = (k2: string) => { const v = r[k2]; return v == null || v === "정보없음" ? undefined : String(v); };
    const sizeRule = S("입장 가능 동물 크기") ?? "", restriction = S("반려동물 제한사항") ?? "";
    const cat = S("카테고리3") ?? "";
    return { name: String(r["시설명"]), category: cat, address: S("도로명주소") ?? S("지번주소") ?? "", tel: S("전화번호"), hours: S("운영시간"), distanceKm: km(lat, lon, la, lo), lat: la, lng: lo,
      sizeRule, restriction, extraFee: S("애견 동반 추가 요금"), indoor: r["장소(실내) 여부"] === "Y", outdoor: r["장소(실외)여부"] === "Y",
      verdict: /동물병원|동물약국/.test(cat) ? undefined : facilityVerdict(sizeRule, restriction, String(r["반려동물 동반 가능정보"] ?? ""), profile) };
  }).filter((f) => f.lat && f.distanceKm <= 15).sort((a, b) => a.distanceKm - b.distanceKm);
  // 동물병원 우선(가까운 3곳) + 동물약국 1곳
  const vets = [...rows.filter((f) => f.category === "동물병원").slice(0, 3), ...rows.filter((f) => f.category === "동물약국").slice(0, 1)];
  // 방문형 시설(카페·식당·여행지·문화시설·숙박)을 용품점·미용보다 앞에
  const spots = rows.filter((f) => !/동물병원|동물약국/.test(f.category) && f.verdict !== "NO" && f.distanceKm <= 5);
  const minor = (f: NearbyFacility) => /용품|미용|위탁|장묘|호텔링/.test(f.category);
  const facilities = [...spots.filter((f) => !minor(f)), ...spots.filter(minor)].slice(0, 6);
  return { vets, facilities };
}

// ---------------- 기상청 단기예보 ----------------
function toGrid(lat: number, lon: number) {
  const RE = 6371.00877, GRID = 5.0, SLAT1 = 30.0, SLAT2 = 60.0, OLON = 126.0, OLAT = 38.0, XO = 43, YO = 136, D = Math.PI / 180;
  const re = RE / GRID, s1 = SLAT1 * D, s2 = SLAT2 * D, olon = OLON * D, olat = OLAT * D;
  let sn = Math.tan(Math.PI * 0.25 + s2 * 0.5) / Math.tan(Math.PI * 0.25 + s1 * 0.5); sn = Math.log(Math.cos(s1) / Math.cos(s2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + s1 * 0.5); sf = (Math.pow(sf, sn) * Math.cos(s1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5); ro = (re * sf) / Math.pow(ro, sn);
  let ra = Math.tan(Math.PI * 0.25 + lat * D * 0.5); ra = (re * sf) / Math.pow(ra, sn);
  let th = lon * D - olon; if (th > Math.PI) th -= 2 * Math.PI; if (th < -Math.PI) th += 2 * Math.PI; th *= sn;
  return { nx: Math.floor(ra * Math.sin(th) + XO + 0.5), ny: Math.floor(ro - ra * Math.cos(th) + YO + 0.5) };
}
function kmaBase(now = new Date()) {
  const k = new Date(now.getTime() + 9 * 3600e3 - 15 * 60e3); // KST, 발표 후 15분 여유
  const slots = [23, 20, 17, 14, 11, 8, 5, 2]; let h = slots.find((s) => s <= k.getUTCHours());
  const d = new Date(k); if (h === undefined) { d.setUTCDate(d.getUTCDate() - 1); h = 23; }
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return { base_date: ymd, base_time: `${String(h).padStart(2, "0")}00` };
}
const SKY: Record<string, string> = { "1": "맑음", "3": "구름많음", "4": "흐림" };
const PTY: Record<string, string> = { "1": "비", "2": "비/눈", "3": "눈", "4": "소나기" };
export function weatherAdvice(temp?: number, pty?: string, pop?: number): string[] {
  const a: string[] = [];
  if (temp !== undefined && temp >= 28) a.push("기온이 높습니다. 한낮 아스팔트는 발바닥 화상 위험이 있어 이른 아침이나 저녁 산책을 권합니다.");
  if (temp !== undefined && temp <= 0) a.push("기온이 낮습니다. 소형견·단모종은 방한 의류를 챙기세요.");
  if (pty && pty !== "0") a.push("비 또는 눈 예보가 있습니다. 실내 동반이 가능한 장소를 우선 확인하세요.");
  else if ((pop ?? 0) >= 60) a.push("강수 확률이 높습니다. 우비와 수건을 챙기세요.");
  return a;
}
interface FcstRow { category: string; fcstDate: string; fcstTime: string; fcstValue: string }
async function getWeather(lat: number, lon: number): Promise<PlaceExtras["weather"]> {
  const { nx, ny } = toGrid(lat, lon);
  const { items } = await call<FcstRow>("https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0", "getVilageFcst", { ...kmaBase(), nx, ny, numOfRows: 120, pageNo: 1, dataType: "JSON" }, 1800);
  if (!items.length) return undefined;
  const first = `${items[0].fcstDate}${items[0].fcstTime}`;
  const at = (cat: string) => items.find((i) => i.category === cat && `${i.fcstDate}${i.fcstTime}` === first)?.fcstValue;
  const temp = at("TMP") !== undefined ? Number(at("TMP")) : undefined;
  const pops = items.filter((i) => i.category === "POP" && i.fcstDate === items[0].fcstDate).map((i) => Number(i.fcstValue));
  const pop = pops.length ? Math.max(...pops) : undefined; const pty = at("PTY");
  return { temp, pop, sky: pty && pty !== "0" ? PTY[pty] ?? "강수" : SKY[at("SKY") ?? ""] ?? "", advice: weatherAdvice(temp, pty, pop) };
}

// ---------------- 에어코리아 ----------------
const SIDO: [RegExp, string][] = [[/^서울/, "서울"], [/^부산/, "부산"], [/^대구/, "대구"], [/^인천/, "인천"], [/^광주/, "광주"], [/^대전/, "대전"], [/^울산/, "울산"], [/^세종/, "세종"], [/^경기/, "경기"], [/^강원/, "강원"], [/^충청북|^충북/, "충북"], [/^충청남|^충남/, "충남"], [/^전라북|^전북/, "전북"], [/^전라남|^전남/, "전남"], [/^경상북|^경북/, "경북"], [/^경상남|^경남/, "경남"], [/^제주/, "제주"]];
export function airGrade(pm10?: number, pm25?: number): string {
  const g10 = pm10 === undefined ? 0 : pm10 <= 30 ? 1 : pm10 <= 80 ? 2 : pm10 <= 150 ? 3 : 4;
  const g25 = pm25 === undefined ? 0 : pm25 <= 15 ? 1 : pm25 <= 35 ? 2 : pm25 <= 75 ? 3 : 4;
  return ["정보없음", "좋음", "보통", "나쁨", "매우나쁨"][Math.max(g10, g25)];
}
interface AirRow { pm10Value: string; pm25Value: string }
async function getAir(addr?: string): Promise<PlaceExtras["air"]> {
  const sido = SIDO.find(([re]) => re.test(addr ?? ""))?.[1]; if (!sido) return undefined;
  const { items } = await call<AirRow>("https://apis.data.go.kr/B552584/ArpltnInforInqireSvc", "getCtprvnRltmMesureDnsty", { sidoName: sido, numOfRows: 100, pageNo: 1, returnType: "json", ver: "1.0" }, 1800);
  const avg = (k: keyof AirRow) => { const v = items.map((i) => Number(i[k])).filter((n) => !Number.isNaN(n)); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : undefined; };
  if (!items.length) return undefined;
  const pm10 = avg("pm10Value"), pm25 = avg("pm25Value"), grade = airGrade(pm10, pm25);
  return { sido, pm10, pm25, grade, advice: /나쁨/.test(grade) ? "미세먼지가 나쁩니다. 실외 활동 시간을 줄이고 산책 후 발과 털을 닦아 주세요." : undefined };
}

// ---------------- 묶음 ----------------
function mockExtras(): PlaceExtras {
  const today = new Date();
  const crowd = Array.from({ length: 14 }, (_, i) => { const d = new Date(today.getTime() + i * DAY * 1000); const wk = d.getDay() === 0 || d.getDay() === 6; return { date: `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`, rate: wk ? 78 + (i % 3) * 7 : 32 + (i % 4) * 6 }; });
  return {
    crowd, crowdName: "[샘플] 집중률 예측",
    related: [{ name: "[샘플] 연관 관광지 1", category: "관광지", region: "", rank: 1 }, { name: "[샘플] 연관 음식점", category: "음식", region: "", rank: 2 }, { name: "[샘플] 연관 숙박", category: "숙박", region: "", rank: 3 }],
    trails: [{ name: "[샘플] 걷기길 코스", distanceKm: "8.5", duration: "약 2시간 30분", level: "쉬움", summary: "샘플 코스 설명입니다." }],
    vets: [{ name: "[샘플] 동물병원", category: "동물병원", address: "", tel: "", distanceKm: 0.8, lat: 0, lng: 0 }],
    facilities: [{ name: "[샘플] 동반 가능 카페", category: "카페", address: "", distanceKm: 0.5, lat: 0, lng: 0, sizeRule: "모두 가능", restriction: "제한사항 없음", verdict: "OK" }],
    weather: { temp: 24, pop: 20, sky: "구름많음", advice: weatherAdvice(24, "0", 20) },
    air: { sido: "[샘플]", pm10: 38, pm25: 17, grade: "보통" },
  };
}
export async function getPlaceExtras(c: CommonDetail | undefined, needPhotos: boolean, profile: PetProfile): Promise<PlaceExtras> {
  if (USE_MOCK) return mockExtras();
  if (!c) return {};
  const lat = Number(c.mapy), lon = Number(c.mapx);
  const [crowd, related, photos, trails, weather, air, fac] = await Promise.all([
    safe(() => getCrowd(c)), safe(() => getRelated(c)), needPhotos ? safe(() => getPhotos(c.title)) : Promise.resolve(undefined),
    safe(() => getTrails(c.addr1)), lat && lon ? safe(() => getWeather(lat, lon)) : Promise.resolve(undefined), safe(() => getAir(c.addr1)), safe(() => getFacilities(c, profile)),
  ]);
  return { ...(crowd ?? {}), related, photos, trails, weather, air, ...(fac ?? {}) };
}
