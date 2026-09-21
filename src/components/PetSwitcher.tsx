"use client";
import { MAX_PETS, petLabel, usePets } from "@/lib/petProfile";
import Icon, { Paw } from "./Icon";

/** 다견 가정: 반려동물 전환, 추가, 삭제, "모두 함께" 판정 토글 */
export default function PetSwitcher({ onDark = false }: { onDark?: boolean }) {
  const { pets, activeId, together, setActive, add, remove, setTogether } = usePets();
  const chip = (on: boolean) => `flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium ${on ? "border-pass bg-pass text-white" : onDark ? "border-white/40 text-white" : "border-line bg-card text-ink hover:border-ink"}`;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="반려동물 선택">
        {pets.map((p, i) => (
          <button key={p.id} type="button" aria-pressed={p.id === activeId} onClick={() => setActive(p.id!)} className={chip(p.id === activeId)}>
            <Paw size={14} /> {petLabel(p, i)} <span className="font-mono text-[11px] opacity-80">{p.weightKg}kg</span>
          </button>
        ))}
        {pets.length < MAX_PETS && <button type="button" onClick={add} className={chip(false)}><Icon name="plus" size={15} /> 아이 추가</button>}
        {pets.length > 1 && <button type="button" onClick={() => remove(activeId)} aria-label="선택한 반려동물 삭제" className="flex min-h-11 items-center gap-1 px-2 text-xs text-muted hover:text-stamp"><Icon name="trash" size={14} /> 삭제</button>}
      </div>
      {pets.length > 1 && (
        <label className="flex min-h-11 w-fit cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="h-[18px] w-[18px] accent-pass" checked={together} onChange={(e) => setTogether(e.target.checked)} />
          <Icon name="users" size={16} className="text-pass" /> 모두 함께 갈 수 있는 곳으로 판정 <span className="text-muted">(한 마리라도 안 되면 불가)</span>
        </label>
      )}
    </div>
  );
}
