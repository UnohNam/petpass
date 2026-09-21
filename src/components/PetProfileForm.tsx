"use client";
import type { PetProfile } from "@/lib/types";
import { isRestrictedBreed, SIZE_LABEL, sizeFromWeight } from "@/lib/match";
import { Paw } from "./Icon";

const BREEDS = ["말티즈", "푸들", "포메라니안", "치와와", "시츄", "비숑 프리제", "요크셔테리어", "닥스훈트", "웰시코기", "비글", "시바견", "보더콜리", "진돗개", "골든 리트리버", "래브라도 리트리버", "사모예드", "허스키", "로트와일러", "도사견", "믹스견"];
const INPUT = "h-11 w-full rounded-md border border-line bg-card px-3 text-[15px] font-medium text-ink outline-none focus:border-pass";

/** 여권 정보면 스타일의 프로필 입력 (Figma: Passport card) */
export default function PetProfileForm({ value, onChange }: { value: PetProfile; onChange: (p: PetProfile) => void; compact?: boolean }) {
  const p = value;
  const set = (patch: Partial<PetProfile>) => {
    const next = { ...p, ...patch };
    if (patch.weightKg !== undefined) next.size = sizeFromWeight(patch.weightKg);
    if (patch.breed !== undefined) next.isRestrictedBreed = isRestrictedBreed(patch.breed) || (patch.breed === p.breed ? p.isRestrictedBreed : false);
    onChange(next);
  };
  const check = (label: string, key: "hasCarrier" | "hasStroller" | "isRestrictedBreed") => (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" className="h-[18px] w-[18px] accent-pass" checked={p[key]} onChange={(e) => set({ [key]: e.target.checked })} /> {label}
    </label>
  );
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-card shadow-[0_14px_30px_-18px_rgba(28,38,33,0.35)]" aria-label="반려동물 정보">
      <div className="flex items-center justify-between bg-pass px-5 py-3 text-white">
        <span className="font-mono text-[11px] tracking-[0.22em]">PET PASSPORT</span>
        <span className="font-mono text-[11px] tracking-[0.1em]">반려동물 정보</span>
      </div>
      <div className="flex flex-col gap-3.5 p-5">
        <label className="flex flex-col gap-1"><span className="field-label">NAME / 이름</span>
          <input className={INPUT} placeholder="예: 콩이" maxLength={12} value={p.name} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1"><span className="field-label">SPECIES / 종</span>
            <select className={INPUT} value={p.species} onChange={(e) => set({ species: e.target.value as PetProfile["species"] })}>
              <option value="dog">강아지</option><option value="cat">고양이</option><option value="other">기타</option>
            </select>
          </label>
          <label className="flex flex-col gap-1"><span className="field-label">BREED / 견종</span>
            <input list="breeds" className={INPUT} placeholder="예: 말티즈" value={p.breed} onChange={(e) => set({ breed: e.target.value })} />
            <datalist id="breeds">{BREEDS.map((b) => <option key={b} value={b} />)}</datalist>
          </label>
        </div>
        <div className="grid grid-cols-2 items-end gap-3">
          <label className="flex flex-col gap-1"><span className="field-label">WEIGHT / 체중 (kg)</span>
            <input type="number" min={0.5} max={100} step={0.5} className={INPUT} value={p.weightKg} onChange={(e) => set({ weightKg: Math.max(0.5, parseFloat(e.target.value) || 0.5) })} />
          </label>
          <div className="flex h-11 items-center gap-2 rounded-md border border-dashed border-pass px-3 text-sm font-semibold text-pass"><Paw size={16} /> {p.species === "dog" ? `${SIZE_LABEL[p.size]}으로 분류` : "체중 기준 판정"}</div>
        </div>
        <div className="flex flex-wrap gap-x-5 border-t border-dashed border-line pt-1.5">
          {check("이동장 있음", "hasCarrier")}{check("유모차 있음", "hasStroller")}{check("맹견 지정 견종", "isRestrictedBreed")}
        </div>
      </div>
    </section>
  );
}
