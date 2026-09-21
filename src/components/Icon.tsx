const PATHS: Record<string, React.ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  pin: <><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  alert: <><path d="M12 4l9 16H3z" /><path d="M12 10v4.5M12 17.5v.5" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  phone: <path d="M6 3h4l1.5 5-2 1.5a12 12 0 0 0 5 5l1.5-2 5 1.5v4a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2z" />,
  map: <><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>,
  bag: <><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  doc: <><path d="M7 3h8l4 4v14H7z" /><path d="M10 12h6M10 16h6" /></>,
  swap: <path d="M4 8h14l-3-3M20 16H6l3 3" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />,
  cross: <><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M12 8v8M8 12h8" /></>,
  cup: <><path d="M5 8h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z" /><path d="M17 10h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2" /></>,
  trail: <path d="M5 20c2-5 4-3 6-8s4-3 8-8M4 12l3-1M14 20l3-1" />,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  tent: <path d="M12 4L3 20h18zM12 4v16M9 20l3-6 3 6" />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  bookmark: <path d="M6 4h12v17l-6-4-6 4z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  users: <><circle cx="9" cy="9" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5.5a3.5 3.5 0 0 1 0 7M18 14.5a6 6 0 0 1 3.5 5.5" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
};
export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 18, className, strokeWidth = 1.8 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {PATHS[name]}
    </svg>
  );
}

export function Paw({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="currentColor" aria-hidden="true" className={className}>
      <ellipse cx="24" cy="32" rx="10.5" ry="8.5" /><ellipse cx="10.5" cy="22" rx="4.2" ry="5.6" /><ellipse cx="19" cy="13.5" rx="4.2" ry="5.8" /><ellipse cx="29" cy="13.5" rx="4.2" ry="5.8" /><ellipse cx="37.5" cy="22" rx="4.2" ry="5.6" />
    </svg>
  );
}
