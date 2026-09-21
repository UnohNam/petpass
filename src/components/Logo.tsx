import { Paw } from "./Icon";

export default function Logo({ dark = false }: { dark?: boolean }) {
  const fg = dark ? "text-white" : "text-pass", tx = dark ? "text-white" : "text-ink";
  return (
    <span className="flex items-center gap-2.5">
      <span className={`flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-current outline outline-1 outline-offset-2 outline-current ${fg}`}><Paw size={20} /></span>
      <span className={`flex flex-col gap-px ${tx}`}>
        <span className="font-display text-[21px] font-bold leading-none">펫패스</span>
        <span className="font-mono text-[9px] tracking-[0.22em] opacity-75">PETPASS</span>
      </span>
    </span>
  );
}
