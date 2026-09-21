import type { MatchResult, PetProfile, PetSize, PetTourDetail } from "./types";

/** 동물보호법 시행규칙상 맹견 5종 (+ 흔한 표기 변형) */
export const RESTRICTED_BREEDS = [
  "도사", "도사견", "tosa",
  "핏불", "핏불테리어", "아메리칸 핏불", "pit bull", "pitbull",
  "스태퍼드셔", "스테퍼드셔", "staffordshire",
  "로트와일러", "로트바일러", "rottweiler",
];

export function isRestrictedBreed(breed: string): boolean {
  const b = breed.toLowerCase().replace(/\s+/g, "");
  return RESTRICTED_BREEDS.some((k) => b.includes(k.toLowerCase().replace(/\s+/g, "")));
}

/** 체중 → 크기 (국내 통용 기준: 소형 <7kg, 중형 7~25kg, 대형 >25kg) */
export function sizeFromWeight(kg: number): PetSize {
  if (kg < 7) return "small";
  if (kg <= 25) return "medium";
  return "large";
}

export const SIZE_LABEL: Record<PetSize, string> = {
  small: "소형견",
  medium: "중형견",
  large: "대형견",
};

const SIZE_ORDER: PetSize[] = ["small", "medium", "large"];

function splitList(s?: string): string[] {
  if (!s) return [];
  return s
    .split(/[,，/·\n]|\s{2,}|(?<=[요음됨])\s/)
    .map((x) => x.trim().replace(/\.$/, ""))
    .filter((x) => x && x !== "없음" && x !== "-");
}

function num(s: string): number {
  return parseFloat(s.replace(/,/g, ""));
}

/**
 * detailPetTour2 의 자연어 조건 텍스트 + 사용자 프로필 → 판정.
 * 실제 응답 문구 분포(2026-09 조사)에 맞춘 규칙. 모호하면 CONDITIONAL.
 *  - 가장 흔한 값: "전 견종 동반 가능", "Nkg 이하 동반 가능", "맹견 제외 …", 공란
 *  - etcAcmpyInfo 에는 거의 항상 "맹견의 경우, 입마개 착용 필수"가 들어 있음 → 맹견에게만 적용
 */
export function matchPet(pet: PetTourDetail | undefined, profile: PetProfile): MatchResult {
  const reasons: string[] = [];
  const parsed: MatchResult["parsed"] = { restrictedBreedBanned: false, carrierRequired: false, strollerRequired: false, noLimit: false };
  const requirements = new Set<string>();
  if (!pet) return { verdict: "UNKNOWN", reasons: ["반려동물 동반 정보가 등록되지 않은 장소입니다."], requirements: [], parsed };

  const cpam = (pet.acmpyPsblCpam ?? "").trim();
  const type = (pet.acmpyTypeCd ?? "").trim();
  const need = (pet.acmpyNeedMtr ?? "").trim();
  const etc = (pet.etcAcmpyInfo ?? "").trim();
  const all = `${cpam} ${need} ${etc}`;

  let verdict: MatchResult["verdict"] = "OK";
  const fail = (r: string) => { verdict = "NO"; reasons.push(r); };
  const cond = (r: string) => { if (verdict !== "NO") verdict = "CONDITIONAL"; reasons.push(r); };

  // ---------- 동반 범위 ----------
  let zone: string | undefined;
  if (type) {
    zone = type;
    if (/불가/.test(type)) fail(`동반 유형: ${type}`);
    else if (/실외|야외|외부/.test(type)) cond(`동반 범위: ${type}`);
    else if (/일부/.test(type)) reasons.push(`동반 범위: ${type} (구역별 제한은 아래 안내 확인)`);
    else reasons.push(`동반 범위: ${type}`);
  }

  // ---------- 동반 가능 동물 ----------
  const NEG = /불가|제외|금지|안\s*됨/;
  if (!cpam || /정보\s*없음|해당\s*없음/.test(cpam)) {
    if (!type) cond("동반 가능 동물 조건이 명시되지 않았습니다. 방문 전 전화 확인을 권장합니다.");
    else reasons.push("동반 가능 동물 조건은 따로 명시되지 않았습니다.");
  } else if (/안내견|보조견/.test(cpam) && !/전\s*견|반려|kg|애견/i.test(cpam)) {
    fail(`안내견만 동반 가능 (${cpam})`);
  } else if (/제한\s*없음|전\s*견[종동]|모든\s*(견종|반려동물|동물)|무관|전부\s*가능|크기\s*상관/.test(cpam) && !NEG.test(cpam)) {
    parsed.noLimit = true;
    reasons.push(`동반 가능: ${cpam}`);
  } else {
    const KG = "(?:kg|㎏|키로|킬로)";
    const upper = cpam.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${KG}\\s*(?:이하|미만|이내|까지|내외)`, "i")) ?? cpam.match(new RegExp(`~\\s*(\\d+(?:\\.\\d+)?)\\s*${KG}`, "i"));
    // "8Kg이상 대형견은 입실이 불가" 처럼 사이에 다른 말이 끼어도 같은 절 안의 금지어면 상한으로 해석
    const upperByBan = cpam.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${KG}\\s*(?:이상|초과)[^,.]*?(?:불가|금지|제한|제외)`, "i"));
    const lower = cpam.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${KG}\\s*(?:이상|초과)(?![^,.]*(?:불가|금지|제한|제외|문의))`, "i"));
    if (upper) parsed.maxWeightKg = num(upper[1]);
    if (upperByBan) parsed.maxWeightKg = Math.min(parsed.maxWeightKg ?? Infinity, num(upperByBan[1]));
    if (lower && !upperByBan) parsed.minWeightKg = num(lower[1]);

    if (parsed.maxWeightKg !== undefined) {
      const strict = /미만/.test(cpam);
      const ok = strict ? profile.weightKg < parsed.maxWeightKg : profile.weightKg <= parsed.maxWeightKg;
      if (ok) reasons.push(`체중 조건 통과 (${profile.weightKg}kg ${strict ? "<" : "≤"} ${parsed.maxWeightKg}kg)`);
      else fail(`체중 초과: ${profile.weightKg}kg > 허용 ${parsed.maxWeightKg}kg${strict ? " 미만" : " 이하"}`);
      if (/합쳐서|합산|마리/.test(cpam)) reasons.push(`마릿수 조건 있음: ${cpam}`);
    }
    if (parsed.minWeightKg !== undefined && profile.weightKg < parsed.minWeightKg) fail(`체중 미달: 허용 ${parsed.minWeightKg}kg 이상`);

    const banned: PetSize[] = [], allowed: PetSize[] = [];
    for (const s of SIZE_ORDER) {
      const label = SIZE_LABEL[s].replace("견", "");
      if (new RegExp(`${label}(?:견|묘|동물)?[^,.()]*?(?:불가|제외|금지|안\\s*됨)`).test(cpam)) banned.push(s);
      else if (cpam.includes(SIZE_LABEL[s])) allowed.push(s);
    }
    if (/중소형/.test(cpam)) { for (const x of ["small", "medium"] as PetSize[]) if (!allowed.includes(x)) allowed.push(x); if (!banned.includes("large")) banned.push("large"); }
    if (/(?<!중)소형견?\s*만|(?<!중)소형\s*견?\s*까지|(?<!중)소형견\s*이하/.test(cpam)) banned.push("medium", "large");
    if (/중형견?\s*(?:까지|이하)|소형\s*[~∼-]\s*중형/.test(cpam)) banned.push("large");
    if (allowed.length && !banned.length && parsed.maxWeightKg === undefined) for (const s of SIZE_ORDER) if (!allowed.includes(s)) banned.push(s);
    parsed.allowedSizes = allowed.length ? allowed : undefined;
    parsed.bannedSizes = banned.length ? [...new Set(banned)] : undefined;
    if (parsed.bannedSizes?.includes(profile.size) && profile.species !== "cat") fail(`${SIZE_LABEL[profile.size]} 입장 불가 (${cpam})`);
    else if (parsed.allowedSizes?.length && parsed.maxWeightKg === undefined) reasons.push(`크기 조건 통과 (${SIZE_LABEL[profile.size]})`);

    if (/맹견|공격성|사나운/.test(cpam) && NEG.test(cpam)) {
      parsed.restrictedBreedBanned = true;
      if (profile.isRestrictedBreed) fail("맹견(동물보호법 지정 견종) 입장 불가");
    }

    const nothingParsed = parsed.maxWeightKg === undefined && parsed.minWeightKg === undefined && !parsed.allowedSizes && !parsed.bannedSizes && !parsed.restrictedBreedBanned;
    if (verdict === "OK" && nothingParsed) {
      if (/가능|반려견|반려동물|애견|강아지/.test(cpam) && !NEG.test(cpam)) reasons.push(`동반 가능: ${cpam}`);
      else cond(`조건 확인 필요: "${cpam}"`);
    } else if (verdict === "OK" && parsed.restrictedBreedBanned && parsed.maxWeightKg === undefined && !parsed.bannedSizes) {
      reasons.push(`동반 가능: ${cpam}`);
    }
  }

  // ---------- 고양이 ----------
  if (profile.species === "cat") {
    const t = `${cpam} ${etc}`;
    if (/고양이[^,.\n-]*(불가|제외|금지)/.test(t)) { parsed.catAllowed = false; fail("고양이 동반 불가"); }
    else if (/고양이|반려묘|반려동물|모든\s*동물/.test(t)) parsed.catAllowed = true;
    else if ((verdict as string) !== "NO") cond("고양이 동반 가능 여부가 명시되지 않았습니다 (견 기준 안내).");
  }

  // ---------- 준비물 / 필요사항 ----------
  for (const item of splitList(need)) if (!/^(기타|자유이용)$/.test(item)) requirements.add(item);
  const carrierInNeed = /이동장|켄넬|캐리어/.test(`${cpam} ${need}`);
  const carrierInEtc = /(이동장|이동가방|켄넬)[^\n-]*(필수|으로만|만\s*가능)/.test(etc);
  const strollerInNeed = /유모차/.test(`${cpam} ${need}`);
  if (carrierInNeed || carrierInEtc) {
    parsed.carrierRequired = true;
    const either = strollerInNeed && !/이동장[^,)]*필수/.test(cpam);
    if (either) {
      requirements.add("이동장(켄넬) 또는 유모차");
      if (!profile.hasCarrier && !profile.hasStroller) cond("이동장(켄넬) 또는 유모차 이용이 필요합니다.");
    } else {
      requirements.add("이동장(켄넬)");
      if (!profile.hasCarrier) cond(carrierInEtc && !carrierInNeed ? "실내 구역은 이동장(이동가방) 이용이 필요합니다." : "이동장(켄넬) 이용이 필요합니다.");
    }
  } else if (strollerInNeed) {
    parsed.strollerRequired = true; requirements.add("반려동물 유모차");
    if (!profile.hasStroller) cond("반려동물 유모차 탑승이 필요합니다.");
  }
  if (/목줄|리드줄|리쉬/.test(all)) requirements.add("목줄(리드줄)");
  if (/입마개/.test(need)) { requirements.add("입마개"); reasons.push("입마개 착용 요구 (필요사항에 명시)"); }
  else if (/입마개/.test(all)) {
    const forLarge = /대형견[^\n-]*입마개/.test(all);
    if (profile.isRestrictedBreed || (forLarge && profile.size === "large")) { requirements.add("입마개"); reasons.push(forLarge ? "맹견·대형견은 입마개 착용 필수" : "맹견은 입마개 착용 필수"); }
  }
  if (/배변/.test(all)) requirements.add("배변봉투");
  if (/예방\s*접종|접종\s*증명|광견병/.test(all)) requirements.add("예방접종 증명서");
  if (/동물\s*등록|등록증|인식표/.test(all)) requirements.add("동물등록증/인식표");
  if (/매너벨트/.test(all)) requirements.add("매너벨트");

  // 기타 안내: 맹견 입마개·배변봉투 상투 문구는 위에서 처리했으므로 제외하고 노출
  const notes = etc.split(/\n|(?:^|\s)-\s*/).map((x) => x.replace(/^[-'\s]+/, "").trim()).filter((x) => x && !/^맹견(\s*및\s*대형견)?의 경우,?\s*입마개 착용 필수$/.test(x) && !/^배변봉투 지참 및 (배변처리|수거)\s*필수$/.test(x));
  for (const n of notes.slice(0, 4)) reasons.push(`안내: ${n}`);

  if (verdict === "OK" && reasons.length === 0) reasons.push("입력한 조건으로 동반 입장이 가능합니다.");

  const CANON: [RegExp, string][] = [
    [/이동장|켄넬|유모차/, "이동장(켄넬) 또는 유모차"], [/이동장|켄넬|케이지|캐리어|유모차/, "이동장(켄넬)"], [/유모차/, "반려동물 유모차"], [/목줄|리드줄|리쉬/, "목줄(리드줄)"],
    [/입마개/, "입마개"], [/배변/, "배변봉투"], [/접종|광견병/, "예방접종 증명서"], [/등록|인식표/, "동물등록증/인식표"], [/매너벨트/, "매너벨트"],
  ];
  const deduped = [...requirements].filter((r) => !CANON.some(([re, canon]) => r !== canon && re.test(r) && requirements.has(canon)));
  return { verdict, reasons, requirements: deduped, zone, parsed };
}

/** 고캠핑 animalCmgCl(가능 / 가능(소형견) / 불가능) → 판정 */
export function matchCamping(animalCmgCl: string | undefined, profile: PetProfile): MatchResult {
  const parsed: MatchResult["parsed"] = { restrictedBreedBanned: false, carrierRequired: false, strollerRequired: false, noLimit: false };
  const v = (animalCmgCl ?? "").trim();
  const requirements = ["목줄(리드줄)", "배변봉투"];
  if (!v) return { verdict: "UNKNOWN", reasons: ["반려동물 출입 구분이 등록되지 않은 캠핑장입니다."], requirements: [], parsed };
  if (/불가/.test(v)) return { verdict: "NO", reasons: [`반려동물 출입: ${v}`], requirements: [], parsed };
  if (/소형/.test(v)) {
    parsed.allowedSizes = ["small"]; parsed.bannedSizes = ["medium", "large"];
    if (profile.species === "dog" && profile.size !== "small") return { verdict: "NO", reasons: [`소형견만 출입 가능 (${SIZE_LABEL[profile.size]} 불가)`], requirements: [], parsed };
    return { verdict: profile.species === "dog" ? "OK" : "CONDITIONAL", reasons: [`반려동물 출입: ${v}`, profile.species === "dog" ? "크기 조건 통과 (소형견)" : "견 기준 안내입니다. 방문 전 확인하세요."], requirements, parsed };
  }
  parsed.noLimit = true;
  const reasons = [`반려동물 출입: ${v}`];
  if (profile.isRestrictedBreed) { reasons.push("맹견 지정 견종은 캠핑장별 제한이 있을 수 있어 전화 확인이 필요합니다."); return { verdict: "CONDITIONAL", reasons, requirements: [...requirements, "입마개"], parsed }; }
  return { verdict: "OK", reasons, requirements, parsed };
}
