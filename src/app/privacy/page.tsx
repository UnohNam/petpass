export const metadata = { title: "개인정보 처리방침 — 펫패스" };

const ROWS: [string, string][] = [
  ["수집 항목", "아이디, 비밀번호와 복구 코드(둘 다 암호화되어 저장되며 운영자도 볼 수 없음), 이용자가 입력한 반려동물 정보(이름, 종, 견종, 체중, 이동장·유모차 보유 여부, 맹견 여부), 저장한 장소 목록과 준비물 체크 상태"],
  ["수집 목적", "계정 식별과 로그인, 여러 기기에서 반려동물 정보와 저장한 곳을 동일하게 제공"],
  ["보유 기간", "회원 탈퇴 시 즉시 삭제. 내 계정 화면의 회원 탈퇴로 직접 삭제할 수 있습니다."],
  ["처리 위탁", "Supabase Inc. (인증과 데이터베이스 호스팅, 서울 리전)"],
  ["제3자 제공", "제공하지 않습니다."],
  ["수집하지 않는 것", "이메일, 전화번호, 실명은 받지 않습니다. 비밀번호를 잊으면 가입 때 발급한 복구 코드로 다시 설정합니다. 위치 정보는 '내 주변' 검색 시 브라우저에서 한 번 읽어 장소 조회에만 쓰고 저장하지 않습니다. 로그인하지 않으면 모든 정보는 이용자의 브라우저에만 저장됩니다."],
  ["이용자의 권리", "언제든지 정보를 수정하거나 회원 탈퇴로 삭제할 수 있습니다."],
  ["문의", "[운영자 이메일]"],
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6 py-6">
      <header className="flex flex-col gap-2"><span className="eyebrow">PRIVACY</span><h1 className="font-display text-[32px] font-bold">개인정보 처리방침</h1><p className="text-sm text-muted">펫패스는 서비스 제공에 필요한 최소한의 정보만 수집합니다. 시행일 2026-09-21</p></header>
      <dl className="rounded-xl border border-line bg-card px-6 text-sm">
        {ROWS.map(([k, v]) => <div key={k} className="grid gap-1 border-b border-dashed border-line py-4 last:border-0 sm:grid-cols-[8rem_1fr] sm:gap-4"><dt className="font-semibold">{k}</dt><dd className="leading-relaxed text-ink/85">{v}</dd></div>)}
      </dl>
    </article>
  );
}
