# 🐾 펫패스 (PetPass) — 반려동물 동반 여행 조건 매칭 가이드

한국관광공사 **반려동물 동반여행 API**와 **국문 관광정보 API**를 활용하여, 반려동물의 견종·체중·크기 등 세부 특성을 입력하면 동반 입장 가능 여부를 즉시 판별하고, 입장 불가 시 인근 대체 장소와 필수 준비물까지 안내하는 웹 서비스입니다.

**서비스 주소: https://petpass-pi.vercel.app**

## 실행

```bash
npm install
cp .env.local.example .env.local   # TOUR_API_KEY 입력
npm run dev                        # http://localhost:3000
```

`TOUR_API_KEY`가 없으면 **샘플 데이터 모드**로 동작합니다 (UI/판정 로직 확인용).

### API 키 발급 (공공데이터포털 data.go.kr)
같은 인증키로 아래 서비스들의 **활용신청**이 필요합니다. 위 두 개가 필수이고, 나머지 7종(고캠핑, 관광지 집중률 예측, 연관 관광지, 관광사진, 두루누비, 기상청 단기예보, 에어코리아 대기오염정보)은 신청한 것만 화면에 나타납니다. `.env.local`에는 **Decoding 키**를 넣으세요.
- 한국관광공사_반려동물 동반여행 서비스 → `KorPetTourService2`
- 한국관광공사_국문 관광정보 서비스_GW → `KorService2`

## 주요 기능

- **입장 판정**: 반려동물 프로필과 장소별 동반 조건을 대조해 동반 가능 / 조건부 / 입장 불가 도장으로 표시
- **다견 가정 지원**: 반려동물을 최대 5마리 등록해 전환하고, "모두 함께" 모드에서는 한 마리라도 안 되면 불가로 판정하며 아이별 결과를 함께 표시
- **저장한 곳**: 장소를 저장해 두고 현재 반려동물 기준으로 일괄 재판정, 갈 수 있는 곳의 준비물을 합산 체크리스트로 제공
- **대체 장소, 캠핑장, 날씨, 혼잡도 예측, 주변 동물병원·동반 시설, 걷기길**

프로필과 저장 목록은 로그인 없이 브라우저(localStorage)에 저장됩니다. 저장 계층(`src/lib/store.ts`)을 분리해 두어 이후 계정 동기화를 붙일 수 있습니다.

## 로그인과 동기화 (선택)

- 이메일 없는 아이디·비밀번호 로그인(Supabase Auth). SNS 연동 없음. 로그인 없이도 모든 기능을 쓸 수 있습니다.
- 가입은 DB 함수 `register_user`가 처리합니다. 아이디를 내부 전용 주소로 바꿔 Supabase Auth에 저장하고 가입 즉시 확인 처리하므로 메일이 발송되지 않습니다. 비밀번호 찾기는 가입 시 한 번 보여 주는 복구 코드(16자, 해시 저장, 5회 오류 시 15분 잠금)로 합니다. 사용한 코드는 폐기되고 새 코드가 발급됩니다.
- 로그인하면 반려동물 정보와 저장한 곳이 계정(`public.user_state`, 본인 행만 접근 가능한 RLS)에 동기화됩니다.
- 로그인 폼은 표준 `autocomplete` 속성(username, current-password, new-password)을 써서 브라우저·기기 비밀번호 관리자가 저장과 자동 입력을 처리합니다.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY` 가 없으면 로그인 메뉴가 숨겨집니다.

## 구조

```
src/lib/match.ts           판별 엔진: detailPetTour2 자연어 조건 → 가능/조건부/불가 + 근거 + 준비물
src/lib/tourapi.ts         TourAPI 클라이언트 (서버 전용, 키 노출 없음, 1시간 캐시)
src/lib/mock.ts            키 없을 때 쓰는 샘플 데이터
src/app/api/places         GET 목록+판정  (areaBasedList2 / searchKeyword2 / locationBasedList2 + detailPetTour2)
src/app/api/places/[id]    GET 상세+판정+대체장소 (detailCommon2 / detailIntro2 / detailImage2 + detailPetTour2 + locationBasedList2)
src/app/page.tsx           프로필 입력 · 검색 · 판정 필터
src/app/places/[id]        상세 · 판정 근거 · 준비물 체크리스트 · 대체 장소
```

## 사용 API 엔드포인트

| 서비스 | 엔드포인트 | 용도 |
|---|---|---|
| KorPetTourService2 | areaBasedList2, searchKeyword2, locationBasedList2 | 동반 가능 장소 목록 / 반경 대체 장소 |
| KorPetTourService2 | detailPetTour2 | 동반 유형·동반 가능 동물·필요사항·렌탈/비치 품목 |
| KorService2 | detailCommon2, detailIntro2, detailImage2 | 개요·연락처·이용시간·주차·사진 |
| GoCamping (고캠핑) | basedList, searchList, locationBasedList | 캠핑장 탭. 반려동물 출입 구분(animalCmgCl)으로 판정 |
| TatsCnctrRateService (관광지 집중률 예측) | tatsCnctrRatedList | 상세 화면 14일 혼잡도 예측, 한산한 날 추천 |
| TarRlteTarService1 (연관 관광지) | searchKeyword1 | 함께 많이 찾는 곳. 누르면 같은 프로필로 재검색 |
| PhotoGalleryService1 (관광사진) | gallerySearchList1 | 대표 이미지가 없는 장소의 사진 보강 |
| Durunubi (두루누비) | courseList | 같은 시군구의 코리아둘레길 걷기길 안내 |
| 기상청 VilageFcstInfoService_2.0 | getVilageFcst | 장소 좌표의 기온·강수 예보, 산책 주의 안내 |
| 에어코리아 ArpltnInforInqireSvc | getCtprvnRltmMesureDnsty | 시도 평균 미세먼지 등급, 실외 활동 주의 안내 |
| 한국천문연구원 SpcdeInfoService (특일 정보) | getRestDeInfo | 혼잡도 그래프에 공휴일 표시, 한산한 날 추천에서 제외 |
| 한국문화정보원 반려동물 동반 가능 문화시설 (odcloud 15111389) | 시군구 조건 조회 | 가까운 동물병원·동물약국, 반경 5km 동반 가능 시설 판정 |

2026-09-21 실제 키로 검증: 11종 모두 정상 응답 (한국관광공사 7종: 반려동물 동반여행, 국문 관광정보, 고캠핑, 관광사진, 집중률 예측, 연관 관광지, 두루누비 / 그 외 4종: 문화시설 데이터, 기상청, 에어코리아, 특일 정보).

추가 API는 모두 `src/lib/extapi.ts`에 있으며 같은 공공데이터포털 인증키(`TOUR_API_KEY`)를 씁니다. 각 호출은 독립적으로 실패 처리되어, 활용신청이 안 된 API가 있어도 해당 영역만 숨겨지고 페이지는 정상 동작합니다.

## 판정 규칙 요약
- 크기: 소형 <7kg · 중형 7~25kg · 대형 >25kg (체중으로 자동 산출)
- 체중 상한 파싱: `5kg 이하`, `15kg 미만`, `10kg 이상 불가`
- 크기 키워드: `소형견만`, `대형견 불가`, `중형견까지`
- 맹견: 동물보호법 지정 5종 (견종명으로 자동 감지 + 수동 체크)
- 이동장/유모차 필수 여부와 사용자 보유 여부 대조
- 동반 유형이 `일부구역/실외만`이거나 텍스트가 모호하면 **조건부**로 보수적 판정

## 배포 (Vercel)

1. GitHub 저장소를 Vercel에 연결합니다. 프레임워크는 Next.js로 자동 인식됩니다.
2. 환경 변수 `TOUR_API_KEY`에 공공데이터포털 일반 인증키(Decoding)를 넣습니다.
3. `vercel.json`이 서버 함수를 서울 리전(icn1)에서 실행하도록 지정합니다. 공공데이터포털은 국내 서버이고 응답이 간헐적으로 느려서, 가까운 리전과 60초 실행 제한(`maxDuration`)을 씁니다.

개발계정은 API당 하루 1,000건 제한이 있습니다. 목록 1회 조회에 상세 12건이 붙으므로 모든 응답을 24시간 캐시합니다.

## 테스트

```bash
npm test   # 판별 엔진 회귀 테스트 (실제 조건 문구 28건)
```
