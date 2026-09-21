import { NextRequest, NextResponse } from "next/server";
import { getPetDetail, searchPetPlaces, USE_MOCK } from "@/lib/tourapi";
import { matchPet } from "@/lib/match";
import { profileFromQuery } from "@/lib/profileFromQuery";
import type { PlaceWithMatch } from "@/lib/types";

// 공공데이터포털 첫 응답이 느릴 수 있어 서버리스 실행 제한을 넉넉히 둡니다.
export const maxDuration = 60;

/**
 * GET /api/places?keyword=&areaCode=&contentTypeId=&mapX=&mapY=&radius=&pageNo=&[profile...]
 * 반려동반여행 API 목록 + 각 항목의 detailPetTour2 → 판정 결과를 붙여 반환
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const profile = profileFromQuery(sp);
  try {
    const { items, total } = await searchPetPlaces({
      keyword: sp.get("keyword") ?? undefined,
      areaCode: sp.get("areaCode") ?? undefined,
      sigunguCode: sp.get("sigunguCode") ?? undefined,
      contentTypeId: sp.get("contentTypeId") ?? undefined,
      mapX: sp.get("mapX") ?? undefined,
      mapY: sp.get("mapY") ?? undefined,
      radius: sp.get("radius") ? Number(sp.get("radius")) : undefined,
      pageNo: sp.get("pageNo") ? Number(sp.get("pageNo")) : 1,
      numOfRows: 12,
    });
    const places: PlaceWithMatch[] = await Promise.all(
      items.map(async (it) => {
        const pet = await getPetDetail(it.contentid).catch(() => undefined);
        return { ...it, pet, match: matchPet(pet, profile) };
      }),
    );
    return NextResponse.json({ places, total, mock: USE_MOCK });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, mock: USE_MOCK }, { status: 502 });
  }
}
