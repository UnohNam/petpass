import { NextRequest, NextResponse } from "next/server";
import { getCommonDetail, getImages, getIntroDetail, getNearbyPetPlaces, getPetDetail, USE_MOCK } from "@/lib/tourapi";
import { matchPet } from "@/lib/match";
import { getPlaceExtras } from "@/lib/extapi";
import { profileFromQuery } from "@/lib/profileFromQuery";
import type { PlaceWithMatch } from "@/lib/types";

// 공공데이터포털 첫 응답이 느릴 수 있어 서버리스 실행 제한을 넉넉히 둡니다.
export const maxDuration = 60;

/**
 * GET /api/places/:id?contentTypeId=&[profile...]
 * 국문관광정보(detailCommon2/detailIntro2/detailImage2) + 반려동반(detailPetTour2) + 판정
 * 입장 불가/조건부이면 반경 10km 내 대체 장소를 판정해 함께 반환
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sp = req.nextUrl.searchParams;
  const profile = profileFromQuery(sp);
  try {
    const [common, pet] = await Promise.all([getCommonDetail(id), getPetDetail(id)]);
    if (!common && !pet) return NextResponse.json({ error: "장소를 찾을 수 없습니다." }, { status: 404 });
    const contentTypeId = sp.get("contentTypeId") ?? common?.contenttypeid ?? "12";
    const [intro, images] = await Promise.all([getIntroDetail(id, contentTypeId), getImages(id)]);
    const extras = await getPlaceExtras(common, !common?.firstimage && images.length === 0, profile);
    const match = matchPet(pet, profile);

    let alternatives: PlaceWithMatch[] = [];
    const mapx = common?.mapx, mapy = common?.mapy;
    if (match.verdict !== "OK" && mapx && mapy) {
      const nearby = await getNearbyPetPlaces(mapx, mapy, 10000, id);
      const evaluated = await Promise.all(
        nearby.slice(0, 12).map(async (it) => {
          const p = await getPetDetail(it.contentid).catch(() => undefined);
          return { ...it, pet: p, match: matchPet(p, profile) } as PlaceWithMatch;
        }),
      );
      alternatives = evaluated
        .filter((a) => a.match?.verdict === "OK" || a.match?.verdict === "CONDITIONAL")
        .sort((a, b) => (a.match!.verdict === "OK" ? 0 : 1) - (b.match!.verdict === "OK" ? 0 : 1))
        .slice(0, 6);
    }
    return NextResponse.json({ common, pet, intro, images, match, alternatives, extras, mock: USE_MOCK });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, mock: USE_MOCK }, { status: 502 });
  }
}
