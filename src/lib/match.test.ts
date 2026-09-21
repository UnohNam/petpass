/**
 * 판별 엔진 회귀 테스트. 문구는 한국관광공사 detailPetTour2 실제 응답(2026-09 조사)에서 가져왔습니다.
 * 실행: npm test
 */
import assert from "node:assert/strict";
import { matchCamping, matchPet, sizeFromWeight, isRestrictedBreed } from "./match";
import type { PetProfile, Verdict } from "./types";

const P = (w: number, o: Partial<PetProfile> = {}): PetProfile => ({ name: "", species: "dog", breed: "", weightKg: w, size: sizeFromWeight(w), isRestrictedBreed: false, hasCarrier: false, hasStroller: false, ...o });
const pet = (cpam: string, need = "목줄 착용", type = "전구역 동반가능", etc = "- 맹견의 경우, 입마개 착용 필수\n- 배변봉투 지참 및 배변처리 필수") => ({ contentid: "t", acmpyPsblCpam: cpam, acmpyNeedMtr: need, acmpyTypeCd: type, etcAcmpyInfo: etc });

const CASES: [string, ReturnType<typeof pet> | undefined, PetProfile, Verdict][] = [
  ["최빈값: 전 견종", pet("전 견종 동반 가능"), P(30), "OK"],
  ["오타: 전 견동", pet("전 견동 동반 가능"), P(30), "OK"],
  ["붙여쓰기: 전견종", pet("전견종 동반가능"), P(30), "OK"],
  ["일부구역은 감점 없음", pet("전 견종 동반 가능", "목줄 착용", "일부구역 동반가능"), P(12), "OK"],
  ["9kg 이하 통과", pet("9kg 이하 동반 가능"), P(9), "OK"],
  ["9kg 이하 초과", pet("9kg 이하 동반 가능"), P(12), "NO"],
  ["10kg미만 경계", pet("10kg미만의 애견"), P(10), "NO"],
  ["대문자 KG", pet("훈련된 5KG 이하 반려견"), P(4), "OK"],
  ["괄호 속 이상+불가는 상한 (회귀)", pet("중소형견(8Kg 미만), (8Kg이상 대형견은 입실이 불가합니다.)", ""), P(4), "OK"],
  ["괄호 속 이상+불가는 상한 (초과)", pet("중소형견(8Kg 미만), (8Kg이상 대형견은 입실이 불가합니다.)", ""), P(9), "NO"],
  ["중소형견은 중형 허용", pet("이동장(켄넬) 사용이 가능한 중소형견", "이동장(켄넬)사용"), P(12, { hasCarrier: true }), "OK"],
  ["중소형견은 대형 불가", pet("이동장(켄넬) 사용이 가능한 중소형견", "이동장(켄넬)사용"), P(30, { hasCarrier: true }), "NO"],
  ["소형견만", pet("소형견"), P(12), "NO"],
  ["맹견 및 대형견 제외 - 중형 통과", pet("맹견 및 대형견 제외 동반 가능"), P(12), "OK"],
  ["맹견 및 대형견 제외 - 대형 불가", pet("맹견 및 대형견 제외 동반 가능"), P(30), "NO"],
  ["맹견 제외 - 맹견 불가", pet("맹견 제외 전 견종 동반 가능"), P(40, { isRestrictedBreed: true }), "NO"],
  ["맹견 제외 - 일반견 통과", pet("맹견 제외 전 견종 동반 가능"), P(40), "OK"],
  ["안내견만", pet("시각 장애인 안내견"), P(4), "NO"],
  ["안내견만 가능", pet("안내견만 가능", ""), P(4), "NO"],
  ["이동장 또는 유모차 - 미보유", pet("전 견종 동반 가능", "목줄 착용,반려동물 유모차 탑승,이동장(켄넬)사용"), P(4), "CONDITIONAL"],
  ["이동장 또는 유모차 - 유모차 보유", pet("전 견종 동반 가능", "목줄 착용,반려동물 유모차 탑승,이동장(켄넬)사용"), P(4, { hasStroller: true }), "OK"],
  ["이동장 필수 - 보유", pet("5kg 이하 동반 가능(이동장 이용 필수)", "목줄 착용,이동장(켄넬)사용"), P(4, { hasCarrier: true }), "OK"],
  ["조건 공란 + 유형 있음", pet("", "목줄 착용"), P(12), "OK"],
  ["단독 '반려견'", pet("반려견", ""), P(12), "OK"],
  ["가능(강아지, 고양이) - 고양이", pet("가능(강아지, 고양이)", "", ""), P(4, { species: "cat" }), "OK"],
  ["고양이 불가 안내", pet("전 견종 동반 가능", "목줄 착용", "일부구역 동반가능", "- 고양이는 불가능"), P(4, { species: "cat" }), "NO"],
  ["견 기준만 있는 곳의 고양이", pet("전 견종 동반 가능"), P(4, { species: "cat" }), "CONDITIONAL"],
  ["동반 정보 없음", undefined, P(4), "UNKNOWN"],
];

let fail = 0;
for (const [name, p, prof, expected] of CASES) {
  const r = matchPet(p, prof);
  if (r.verdict !== expected) { fail++; console.log(`FAIL ${name}: ${r.verdict} (expected ${expected}) — ${r.reasons.join(" / ")}`); }
  else console.log(`PASS ${name}`);
}

// 입마개: etc 의 "맹견의 경우 입마개"는 맹견에게만 적용
assert.ok(!matchPet(pet("전 견종 동반 가능"), P(12)).requirements.includes("입마개"), "일반견에게 입마개를 요구하면 안 됨");
assert.ok(matchPet(pet("전 견종 동반 가능"), P(40, { isRestrictedBreed: true })).requirements.includes("입마개"), "맹견에게는 입마개 필요");
assert.ok(matchPet(pet("전 견종 동반 가능", "입마개 착용,목줄 착용"), P(12)).requirements.includes("입마개"), "필요사항에 명시되면 모두에게 필요");
// 준비물 정규화와 중복 제거
assert.deepEqual(matchPet(pet("전 견종 동반 가능", "목줄 착용,기타"), P(12)).requirements, ["목줄(리드줄)", "배변봉투"]);
// 캠핑장
assert.equal(matchCamping("가능(소형견)", P(12)).verdict, "NO");
assert.equal(matchCamping("가능(소형견)", P(4)).verdict, "OK");
assert.equal(matchCamping("불가능", P(4)).verdict, "NO");
assert.equal(matchCamping("", P(4)).verdict, "UNKNOWN");
// 유틸
assert.equal(sizeFromWeight(6.9), "small"); assert.equal(sizeFromWeight(7), "medium"); assert.equal(sizeFromWeight(25.1), "large");
assert.ok(isRestrictedBreed("아메리칸 핏불테리어")); assert.ok(!isRestrictedBreed("푸들"));

console.log(fail ? `\n${fail} FAILED` : `\nALL ${CASES.length} CASES + assertions PASSED`);
process.exit(fail ? 1 : 0);
