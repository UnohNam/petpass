/** 반려동물 프로필 (사용자 입력) */
export type PetSpecies = "dog" | "cat" | "other";
export type PetSize = "small" | "medium" | "large";

export interface PetProfile {
  id?: string;
  name: string;
  species: PetSpecies;
  breed: string;
  weightKg: number;
  /** 체중으로 자동 산출되지만 사용자가 덮어쓸 수 있음 */
  size: PetSize;
  /** 동물보호법상 맹견 5종 여부 (견종명으로 자동 판별 + 수동 체크) */
  isRestrictedBreed: boolean;
  hasCarrier: boolean;
  hasStroller: boolean;
}

/** TourAPI 공통 목록 아이템 (KorPetTourService2 / KorService2 공용) */
export interface TourListItem {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1: string;
  addr2?: string;
  firstimage?: string;
  firstimage2?: string;
  mapx: string;
  mapy: string;
  tel?: string;
  areacode?: string;
  sigungucode?: string;
  dist?: string; // locationBasedList2 에서만
  lDongRegnCd?: string;
  lDongSignguCd?: string;
}

/** detailPetTour2 응답 (자연어 필드) */
export interface PetTourDetail {
  contentid: string;
  acmpyTypeCd?: string; // 동반 유형: 전구역 동반가능 / 일부구역 동반가능 / 실외만 가능 ...
  acmpyPsblCpam?: string; // 동반 가능 동물: "10kg 이하 소형견만, 맹견 불가"
  acmpyNeedMtr?: string; // 동반 시 필요사항: "목줄 착용, 배변봉투"
  etcAcmpyInfo?: string; // 기타 동반 정보
  relaPosesFclty?: string; // 구비 시설
  relaFrnshPrdlst?: string; // 비치 품목
  relaRntlPrdlst?: string; // 렌탈 품목
  relaPurcPrdlst?: string; // 구매 품목
  relaAcdntRiskMtr?: string; // 사고 대비 사항
}

/** detailCommon2 (KorService2) */
export interface CommonDetail {
  contentid: string;
  contenttypeid: string;
  title: string;
  overview?: string;
  homepage?: string;
  tel?: string;
  addr1?: string;
  addr2?: string;
  firstimage?: string;
  mapx?: string;
  mapy?: string;
  lDongRegnCd?: string;
  lDongSignguCd?: string;
}

export type Verdict = "OK" | "CONDITIONAL" | "NO" | "UNKNOWN";

export interface MatchResult {
  verdict: Verdict;
  /** 판정 근거 (사용자에게 그대로 노출) */
  reasons: string[];
  /** 필수 준비물 */
  requirements: string[];
  /** 동반 범위 (전구역/일부/실외) */
  zone?: string;
  /** 파싱된 제한값 */
  parsed: {
    maxWeightKg?: number;
    minWeightKg?: number;
    allowedSizes?: PetSize[];
    bannedSizes?: PetSize[];
    restrictedBreedBanned: boolean;
    carrierRequired: boolean;
    strollerRequired: boolean;
    catAllowed?: boolean;
    noLimit: boolean;
  };
}

export interface PlaceWithMatch extends TourListItem {
  pet?: PetTourDetail;
  /** 고캠핑 반려동물 출입 구분 (캠핑장일 때만) */
  campRule?: string;
  match?: MatchResult;
}

export const CONTENT_TYPE_LABEL: Record<string, string> = {
  "12": "관광지",
  "14": "문화시설",
  "15": "축제/행사",
  "25": "여행코스",
  "28": "레포츠",
  "32": "숙박",
  "38": "쇼핑",
  "39": "음식점",
  camp: "캠핑장",
};

export const AREA_CODES: { code: string; name: string }[] = [
  { code: "1", name: "서울" },
  { code: "2", name: "인천" },
  { code: "3", name: "대전" },
  { code: "4", name: "대구" },
  { code: "5", name: "광주" },
  { code: "6", name: "부산" },
  { code: "7", name: "울산" },
  { code: "8", name: "세종" },
  { code: "31", name: "경기" },
  { code: "32", name: "강원" },
  { code: "33", name: "충북" },
  { code: "34", name: "충남" },
  { code: "35", name: "경북" },
  { code: "36", name: "경남" },
  { code: "37", name: "전북" },
  { code: "38", name: "전남" },
  { code: "39", name: "제주" },
];

/** 고캠핑 */
export interface CampingItem {
  contentId: string;
  facltNm: string;
  lineIntro?: string;
  addr1: string;
  mapX: string;
  mapY: string;
  tel?: string;
  homepage?: string;
  induty?: string;
  animalCmgCl?: string; // 가능 / 가능(소형견) / 불가능
  firstImageUrl?: string;
  dist?: string;
}
export interface CampingWithMatch extends CampingItem { match: MatchResult }

/** 상세 화면 부가 정보 (추가 API) */
export interface PlaceExtras {
  crowd?: { date: string; rate: number; holiday?: string }[]; // 관광지 집중률 예측 (0~100)
  crowdName?: string;
  related?: { name: string; category: string; region: string; rank: number }[]; // 연관 관광지
  photos?: { title: string; url: string; location?: string }[]; // 관광사진
  trails?: { name: string; distanceKm: string; duration: string; level: string; summary: string }[];
  vets?: NearbyFacility[]; // 문화시설 데이터의 동물병원·동물약국
  facilities?: NearbyFacility[]; // 문화시설 데이터의 동반 가능 시설 // 두루누비
  weather?: { temp?: number; pop?: number; sky: string; advice: string[] }; // 기상청 단기예보
  air?: { sido: string; pm10?: number; pm25?: number; grade: string; advice?: string }; // 에어코리아
}

export interface NearbyFacility {
  name: string; category: string; address: string; tel?: string; hours?: string;
  distanceKm: number; lat: number; lng: number;
  sizeRule?: string; restriction?: string; extraFee?: string; indoor?: boolean; outdoor?: boolean;
  verdict?: Verdict; // 프로필 기준 (동반 가능 시설만)
}
