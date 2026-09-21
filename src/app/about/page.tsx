import Stamp from "@/components/Stamp";

const STEPS: [string, string, string][] = [
  ["01", "반려동물 정보 입력", "종, 견종, 체중과 이동장·유모차 보유 여부를 적습니다. 체중으로 소형·중형·대형을 자동 분류하고 맹견 지정 견종은 이름으로 알아챕니다."],
  ["02", "장소 조건과 대조", "장소별 동반 조건 문장에서 체중 상한, 크기 제한, 맹견 제한, 필수 준비물을 뽑아 내 아이의 정보와 하나씩 비교합니다."],
  ["03", "판정과 대안 안내", "결과를 도장으로 찍고 근거를 보여 줍니다. 입장이 어렵다면 반경 10km 안에서 조건을 통과한 장소를 다시 찾아 드립니다."],
];
const APIS: [string, string][] = [
  ["반려동물 동반여행 서비스", "동반 가능 장소 목록과 동반 유형·가능 동물·필요 사항. 판정의 근거"],
  ["국문 관광정보 서비스", "장소 개요, 연락처, 이용시간, 주차, 사진"],
  ["고캠핑 정보 조회서비스", "캠핑장 탭. 반려동물 출입 구분으로 판정"],
  ["관광지 집중률 방문자 추이 예측", "14일 혼잡도 예측과 한산한 날 추천"],
  ["관광사진 정보", "대표 이미지가 없는 장소의 사진 보강"],
  ["두루누비 정보 서비스", "같은 시군구의 코리아둘레길 걷기길"],
  ["반려동물 동반 가능 문화시설 데이터", "가까운 동물병원과 주변 동반 가능 시설"],
  ["기상청 단기예보", "기온·강수 예보와 산책 주의 안내"],
  ["한국천문연구원 특일 정보", "혼잡도 예측에 공휴일 표시"],
];

export default function AboutPage() {
  return (
    <article className="space-y-14 py-4">
      <header className="flex flex-col gap-4">
        <span className="eyebrow">PET TRAVEL CLEARANCE</span>
        <h1 className="font-display text-[34px] font-bold leading-tight sm:text-[46px]">“반려동물 동반 가능”이라더니,<br />우리 아이는 안 된대요.</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted">펫패스는 견종, 체중, 크기를 장소별 동반 조건과 미리 대조합니다. 떠나기 전에 입장 가능 여부를 확인하고, 안 되는 곳은 근처 대안까지 받아 보세요.</p>
      </header>

      <section className="grid gap-8 md:grid-cols-3">
        {STEPS.map(([n, t, b]) => (
          <div key={n} className="flex flex-col gap-3 border-t-2 border-ink pt-5">
            <span className="font-mono text-[13px] tracking-[0.2em] text-pass">STEP {n}</span>
            <h2 className="font-display text-2xl font-bold">{t}</h2>
            <p className="leading-relaxed text-muted">{b}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-display text-3xl font-bold">도장은 세 가지입니다</h2>
        <div className="grid gap-5 md:grid-cols-3">
          <div className="flex flex-col items-start gap-5 rounded-xl bg-ok-bg p-7"><Stamp verdict="OK" size="md" /><p className="leading-relaxed">모든 조건을 통과했습니다. 필수 준비물 체크리스트만 챙겨 출발하면 됩니다.</p></div>
          <div className="flex flex-col items-start gap-5 rounded-xl bg-cond-bg p-7"><Stamp verdict="CONDITIONAL" size="md" rotate={4} /><p className="leading-relaxed">준비물이 빠졌거나 실외만 가능하거나 조건 문장이 모호한 경우입니다. 애매하면 보수적으로 판정하고 원문을 함께 보여 드립니다.</p></div>
          <div className="flex flex-col items-start gap-5 rounded-xl bg-no-bg p-7"><Stamp verdict="NO" size="md" rotate={-7} /><p className="leading-relaxed">체중, 크기, 견종 조건 중 하나라도 맞지 않습니다. 판정 근거와 함께 근처 대체 장소를 바로 추천합니다.</p></div>
        </div>
        <p className="text-sm text-muted">크기 기준은 소형 7kg 미만, 중형 7~25kg, 대형 25kg 초과입니다. 맹견은 동물보호법 지정 5종(도사견, 아메리칸 핏불테리어, 아메리칸 스태퍼드셔 테리어, 스태퍼드셔 불 테리어, 로트와일러)입니다.</p>
      </section>

      <section className="rounded-2xl bg-pass-dk p-7 text-white sm:p-10">
        <span className="font-mono text-[13px] tracking-[0.24em] text-[#BFD9CC]">DATA SOURCE</span>
        <h2 className="mt-3 font-display text-3xl font-bold">공공데이터로 판정합니다</h2>
        <ul className="mt-6 grid gap-x-8 sm:grid-cols-2">
          {APIS.map(([n, d]) => <li key={n} className="border-t border-white/20 py-3.5"><b>{n}</b><p className="text-sm text-[#DCE9E2]">{d}</p></li>)}
        </ul>
        <p className="mt-5 text-sm text-[#BFD9CC]">현장 사정에 따라 조건이 달라질 수 있습니다. 방문 전 전화 확인을 권장합니다.</p>
      </section>
    </article>
  );
}
