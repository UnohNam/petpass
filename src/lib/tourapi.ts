import "server-only";
import type { CommonDetail, PetTourDetail, TourListItem } from "./types";
import { MOCK_COMMON, MOCK_PET, MOCK_PLACES } from "./mock";

export const BASE = "https://apis.data.go.kr/B551011";
/** 반려동반여행 서비스 */
const PET = `${BASE}/KorPetTourService2`;
/** 국문관광정보 서비스 */
const KOR = `${BASE}/KorService2`;

const KEY = process.env.TOUR_API_KEY ?? "";
export const USE_MOCK = !KEY || KEY === "YOUR_KEY_HERE";

type Q = Record<string, string | number | undefined>;

function buildUrl(base: string, op: string, q: Q): string {
  if (!base.startsWith("http")) throw new Error("invalid base");
  const params = new URLSearchParams();
  params.set("MobileOS", "WEB");
  params.set("MobileApp", "PetPass");
  params.set("_type", "json");
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== "") params.set(k, String(v));
  // 공공데이터포털 키: 디코딩 키면 그대로 인코딩, 이미 인코딩된 키(% 포함)면 그대로 붙임
  const key = KEY.includes("%") ? KEY : encodeURIComponent(KEY);
  return `${base}/${op}?serviceKey=${key}&${params.toString()}`;
}

interface TourResponse<T> {
  response?: {
    header?: { resultCode: string; resultMsg: string };
    body?: { items?: { item?: T[] | T } | ""; totalCount?: number; numOfRows?: number; pageNo?: number };
  };
}

export async function call<T>(base: string, op: string, q: Q, revalidate = 86400): Promise<{ items: T[]; total: number }> {
  const url = buildUrl(base, op, q);
  let res: Response;
  try { res = await fetch(url, { next: { revalidate } }); }
  catch { await new Promise((r) => setTimeout(r, 400)); res = await fetch(url, { next: { revalidate } }); } // 일시적 네트워크 실패 1회 재시도
  const text = await res.text();
  if (!res.ok) {
    const msg = text.match(/"returnAuthMsg"\s*:\s*"([^"]+)"/)?.[1] ?? text.match(/<returnAuthMsg>([^<]+)</)?.[1] ?? `HTTP ${res.status}`;
    throw new Error(friendly(`TourAPI ${op} 호출 실패: ${msg}`));
  }
  let json: TourResponse<T>;
  try {
    json = JSON.parse(text);
  } catch {
    // 키 오류 등은 XML 로 내려옴
    const msg = text.match(/<returnAuthMsg>([^<]+)</)?.[1] ?? text.match(/<errMsg>([^<]+)</)?.[1] ?? text.slice(0, 200);
    throw new Error(friendly(`TourAPI ${op} 응답 오류: ${msg}`));
  }
  const header = json.response?.header;
  if (header && !/^0+$/.test(String(header.resultCode))) throw new Error(friendly(`TourAPI ${op}: ${header.resultMsg}`));
  const body = json.response?.body;
  const raw = body && body.items && typeof body.items === "object" ? (Array.isArray(body.items) ? (body.items as unknown as T[]) : body.items.item) : undefined;
  const items = (raw === undefined ? [] : Array.isArray(raw) ? raw : [raw]).map(httpsImages);
  return { items, total: body?.totalCount ?? items.length };
}

/** 관광공사 이미지 주소는 http:// 로 내려오므로 HTTPS 배포에서 깨지지 않게 https 로 바꿉니다. */
const IMG_KEYS = ["firstimage", "firstimage2", "originimgurl", "smallimageurl", "firstImageUrl", "galWebImageUrl"];
function httpsImages<T>(item: T): T {
  if (!item || typeof item !== "object") return item;
  const o = item as Record<string, unknown>;
  for (const k of IMG_KEYS) if (typeof o[k] === "string") o[k] = (o[k] as string).replace(/^http:\/\//, "https://");
  return item;
}
function friendly(msg: string): string {
  if (/LIMITED_NUMBER_OF_SERVICE_REQUESTS|LIMITED NUMBER|트래픽|초과/.test(msg)) return "오늘 공공데이터 조회 한도를 모두 사용했습니다. 이미 조회한 장소는 계속 볼 수 있고, 자정 이후 다시 검색할 수 있습니다.";
  if (/SERVICE_KEY_IS_NOT_REGISTERED|등록되지 않은/.test(msg)) return "이 데이터는 아직 활용 승인이 반영되지 않았습니다.";
  return msg;
}

export interface SearchParams {
  keyword?: string;
  areaCode?: string;
  sigunguCode?: string;
  contentTypeId?: string;
  mapX?: string;
  mapY?: string;
  radius?: number;
  pageNo?: number;
  numOfRows?: number;
}

/** 장소 목록: 키워드 > 위치 > 지역 우선순위로 반려동반여행 API 호출 */
export async function searchPetPlaces(p: SearchParams): Promise<{ items: TourListItem[]; total: number }> {
  if (USE_MOCK) return mockSearch(p);
  const common = { numOfRows: p.numOfRows ?? 20, pageNo: p.pageNo ?? 1, contentTypeId: p.contentTypeId, arrange: "O" };
  if (p.keyword) {
    return call<TourListItem>(PET, "searchKeyword2", { ...common, keyword: p.keyword, areaCode: p.areaCode, sigunguCode: p.sigunguCode });
  }
  if (p.mapX && p.mapY) {
    return call<TourListItem>(PET, "locationBasedList2", { ...common, mapX: p.mapX, mapY: p.mapY, radius: p.radius ?? 5000, arrange: "S" });
  }
  return call<TourListItem>(PET, "areaBasedList2", { ...common, areaCode: p.areaCode, sigunguCode: p.sigunguCode });
}

/** 반려동물 동반 조건 (자연어) */
export async function getPetDetail(contentId: string): Promise<PetTourDetail | undefined> {
  if (USE_MOCK) return MOCK_PET[contentId];
  const { items } = await call<PetTourDetail>(PET, "detailPetTour2", { contentId });
  return items[0];
}

/** 국문관광정보 공통 상세 (개요/홈페이지/전화) */
export async function getCommonDetail(contentId: string): Promise<CommonDetail | undefined> {
  if (USE_MOCK) return MOCK_COMMON[contentId];
  const { items } = await call<CommonDetail>(KOR, "detailCommon2", { contentId });
  return items[0];
}

/** 국문관광정보 소개 상세 (주차/영업시간 등, 타입별 필드 상이) */
export async function getIntroDetail(contentId: string, contentTypeId: string): Promise<Record<string, string> | undefined> {
  if (USE_MOCK) return undefined;
  try {
    const { items } = await call<Record<string, string>>(KOR, "detailIntro2", { contentId, contentTypeId });
    return items[0];
  } catch {
    return undefined;
  }
}

/** 국문관광정보 이미지 */
export async function getImages(contentId: string): Promise<string[]> {
  if (USE_MOCK) return [];
  try {
    const { items } = await call<{ originimgurl: string }>(KOR, "detailImage2", { contentId, imageYN: "Y", numOfRows: 6 });
    return items.map((i) => i.originimgurl).filter(Boolean);
  } catch {
    return [];
  }
}

/** 반경 내 대체 장소 (반려동반 API, 거리순) */
export async function getNearbyPetPlaces(mapX: string, mapY: string, radius = 10000, excludeId?: string): Promise<TourListItem[]> {
  const { items } = await searchPetPlaces({ mapX, mapY, radius, numOfRows: 30 });
  return items.filter((i) => i.contentid !== excludeId);
}

// ---------------- mock ----------------
function mockSearch(p: SearchParams): { items: TourListItem[]; total: number } {
  let list = MOCK_PLACES;
  if (p.keyword) list = list.filter((x) => x.title.includes(p.keyword!) || x.addr1.includes(p.keyword!));
  if (p.areaCode) list = list.filter((x) => x.areacode === p.areaCode);
  if (p.contentTypeId) list = list.filter((x) => x.contenttypeid === p.contentTypeId);
  if (p.mapX && p.mapY) {
    const x = +p.mapX, y = +p.mapY;
    list = list
      .map((it) => ({ ...it, dist: String(Math.round(Math.hypot((+it.mapx - x) * 88000, (+it.mapy - y) * 111000))) }))
      .filter((it) => +it.dist! <= (p.radius ?? 5000))
      .sort((a, b) => +a.dist! - +b.dist!);
  }
  return { items: list, total: list.length };
}
