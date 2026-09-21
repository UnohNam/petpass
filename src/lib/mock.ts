import type { CommonDetail, PetTourDetail, TourListItem } from "./types";

/**
 * API 키가 없을 때 사용하는 샘플 데이터.
 * 실제 detailPetTour2 응답 문체를 최대한 흉내냈습니다.
 */
export const MOCK_PLACES: TourListItem[] = [
  { contentid: "m1", contenttypeid: "12", title: "한강공원 뚝섬지구", addr1: "서울특별시 광진구 강변북로 139", mapx: "127.0666", mapy: "37.5311", areacode: "1", firstimage: "" },
  { contentid: "m2", contenttypeid: "39", title: "댕댕카페 성수", addr1: "서울특별시 성동구 연무장길 12", mapx: "127.0557", mapy: "37.5447", areacode: "1", firstimage: "" },
  { contentid: "m3", contenttypeid: "14", title: "서울숲 곤충식물원", addr1: "서울특별시 성동구 뚝섬로 273", mapx: "127.0375", mapy: "37.5443", areacode: "1", firstimage: "" },
  { contentid: "m4", contenttypeid: "32", title: "펫프렌들리 호텔 강변", addr1: "서울특별시 광진구 광나루로56길 85", mapx: "127.0949", mapy: "37.5350", areacode: "1", firstimage: "" },
  { contentid: "m5", contenttypeid: "38", title: "스타필드 하남", addr1: "경기도 하남시 미사대로 750", mapx: "127.2237", mapy: "37.5453", areacode: "31", firstimage: "" },
  { contentid: "m6", contenttypeid: "12", title: "갈음이해수욕장", addr1: "충청남도 태안군 근흥면 정죽리", mapx: "126.15", mapy: "36.69", areacode: "34", firstimage: "" },
  { contentid: "m7", contenttypeid: "28", title: "제주 애견 동반 요트투어", addr1: "제주특별자치도 서귀포시 대포로 172", mapx: "126.4250", mapy: "33.2400", areacode: "39", firstimage: "" },
  { contentid: "m8", contenttypeid: "12", title: "함덕해수욕장", addr1: "제주특별자치도 제주시 조천읍 조함해안로 525", mapx: "126.6690", mapy: "33.5434", areacode: "39", firstimage: "" },
];

export const MOCK_PET: Record<string, PetTourDetail> = {
  m1: { contentid: "m1", acmpyTypeCd: "전구역 동반가능", acmpyPsblCpam: "제한없음(맹견 불가)", acmpyNeedMtr: "목줄 착용, 배변봉투 지참", etcAcmpyInfo: "2m 이내 목줄 유지", relaPosesFclty: "음수대, 배변봉투함", relaAcdntRiskMtr: "자전거도로 주의" },
  m2: { contentid: "m2", acmpyTypeCd: "전구역 동반가능", acmpyPsblCpam: "10kg 이하 소형견, 중형견 동반 가능", acmpyNeedMtr: "목줄 착용", relaPurcPrdlst: "수제간식, 펫음료", relaRntlPrdlst: "식기" },
  m3: { contentid: "m3", acmpyTypeCd: "동반불가", acmpyPsblCpam: "반려동물 동반 불가", acmpyNeedMtr: "" },
  m4: { contentid: "m4", acmpyTypeCd: "일부구역 동반가능", acmpyPsblCpam: "15kg 미만 동반 가능(이동장 이용 필수), 맹견 불가", acmpyNeedMtr: "목줄 착용, 이동장(켄넬) 사용, 예방접종 증명서", etcAcmpyInfo: "객실 내 배변패드 제공, 로비 이동 시 이동장 필수", relaFrnshPrdlst: "배변패드, 식기, 방석", relaPurcPrdlst: "간식" },
  m5: { contentid: "m5", acmpyTypeCd: "일부구역 동반가능", acmpyPsblCpam: "5kg 이하 동반 가능(이동장 이용 필수)", acmpyNeedMtr: "목줄 착용, 반려동물 유모차 탑승, 이동장(켄넬)사용", etcAcmpyInfo: "식당가 및 식품관 출입 불가" },
  m6: { contentid: "m6", acmpyTypeCd: "전구역 동반가능", acmpyPsblCpam: "제한없음", acmpyNeedMtr: "목줄 착용, 배변봉투", etcAcmpyInfo: "성수기(7~8월) 백사장 출입 제한" },
  m7: { contentid: "m7", acmpyTypeCd: "전구역 동반가능", acmpyPsblCpam: "소형견만 가능, 대형견 불가", acmpyNeedMtr: "목줄 착용, 구명조끼(현장 대여)", relaRntlPrdlst: "반려견 구명조끼" },
  m8: { contentid: "m8", acmpyTypeCd: "실외만 동반가능", acmpyPsblCpam: "제한없음", acmpyNeedMtr: "목줄 착용, 배변봉투", etcAcmpyInfo: "물놀이 구역 일부 제한" },
};

export const MOCK_COMMON: Record<string, CommonDetail> = Object.fromEntries(
  MOCK_PLACES.map((p) => [
    p.contentid,
    { contentid: p.contentid, contenttypeid: p.contenttypeid, title: p.title, addr1: p.addr1, mapx: p.mapx, mapy: p.mapy, overview: `${p.title}의 샘플 개요입니다. 실제 서비스에서는 한국관광공사 국문 관광정보의 장소 개요, 홈페이지, 전화번호가 이 자리에 표시됩니다.`, tel: "" },
  ]),
);
