import { matchCamping, matchPet } from "./match";
import type { MatchResult, PetProfile, PlaceWithMatch, Verdict } from "./types";

const RANK: Record<Verdict, number> = { NO: 3, CONDITIONAL: 2, UNKNOWN: 1, OK: 0 };
export const worst = (vs: Verdict[]): Verdict => vs.reduce<Verdict>((a, b) => (RANK[b] > RANK[a] ? b : a), "OK");

/** 장소 하나를 특정 반려동물 기준으로 판정 (브라우저에서도 실행 가능: 서버 응답의 조건 원문만 있으면 됨) */
export function judgeFor(place: PlaceWithMatch, pet: PetProfile): MatchResult {
  return place.contenttypeid === "camp" ? matchCamping(place.campRule, pet) : matchPet(place.pet, pet);
}

export interface GroupJudgement { verdict: Verdict; perPet: { pet: PetProfile; result: MatchResult }[]; requirements: string[] }
/** 여러 마리 함께: 한 마리라도 안 되면 불가. 준비물은 합집합 */
export function judgeTogether(place: PlaceWithMatch, pets: PetProfile[]): GroupJudgement {
  const perPet = pets.map((pet) => ({ pet, result: judgeFor(place, pet) }));
  return { verdict: worst(perPet.map((x) => x.result.verdict)), perPet, requirements: [...new Set(perPet.flatMap((x) => x.result.requirements))] };
}
