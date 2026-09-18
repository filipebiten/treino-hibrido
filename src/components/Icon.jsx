// ══════════════════════ ÍCONES — geométricos, sem emoji na interface ══════════════════════
const PATHS = {
  foot: "M9 3c-2 0-3 2-3 5 0 2-1 3-3 4v2c0 3 2 5 5 5h4c3 0 5-2 5-6 0-3-1-5-3-7-1-1-2-2-2-3 0-1-1-1-1-0z",
  drop: "M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z",
  moon: "M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 1 0 10.5 10.5z",
  run: "M13 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 21l2.5-5 3-2-1-4 3 1 2 4 3 2M9 14l2-5 3 1",
  dumbbell: "M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10",
  chevronLeft: "M15 5l-7 7 7 7",
  chevronRight: "M9 5l7 7-7 7",
  check: "M5 13l4 4L19 7",
  flag: "M6 3v18M6 4h11l-3 4 3 4H6",
  flame: "M12 3c1 4-4 5-4 9a4 4 0 0 0 8 0c0-2-1-3-1-5 2 1 3 3 3 6a6 6 0 0 1-12 0c0-5 4-6 6-10z",
  scale: "M12 3v18M6 6h12M6 6L3 12a3 3 0 0 0 6 0zM18 6l-3 6a3 3 0 0 0 6 0z",
  chart: "M4 20V10M11 20V4M18 20v-7",
  history: "M4 12a8 8 0 1 1 3 6.2M4 12V6M4 12h6",
  snow: "M12 2v20M4.5 6l15 12M19.5 6l-15 12",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z",
  pause: "M7 4h3v16H7zM14 4h3v16h-3z",
  play: "M6 4l14 8-14 8z",
};

export default function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.8 }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
