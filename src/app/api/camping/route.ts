import { NextRequest, NextResponse } from "next/server";
import { searchCamping } from "@/lib/extapi";
import { USE_MOCK } from "@/lib/tourapi";
import { matchCamping } from "@/lib/match";
import { profileFromQuery } from "@/lib/profileFromQuery";

// 공공데이터포털 첫 응답이 느릴 수 있어 서버리스 실행 제한을 넉넉히 둡니다.
export const maxDuration = 60;

/** GET /api/camping?keyword=&mapX=&mapY=&pageNo=&[profile...] — 고캠핑 목록 + 반려동물 출입 구분 판정 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const profile = profileFromQuery(sp);
  try {
    const { items, total } = await searchCamping({ keyword: sp.get("keyword") ?? undefined, mapX: sp.get("mapX") ?? undefined, mapY: sp.get("mapY") ?? undefined, pageNo: sp.get("pageNo") ? Number(sp.get("pageNo")) : 1 });
    return NextResponse.json({ camps: items.map((c) => ({ ...c, match: matchCamping(c.animalCmgCl, profile) })), total, mock: USE_MOCK });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, mock: USE_MOCK }, { status: 502 });
  }
}
