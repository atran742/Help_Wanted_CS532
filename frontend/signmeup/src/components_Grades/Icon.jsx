const ICONS = {
  overview: ["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h6v6h-6z"],
  grades: [
    "M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z",
    "M6 6h12v14H6z",
    "M9 11h6",
    "M9 15h4",
  ],
  faculty: [
    "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    "M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6",
    "M16 5.2a3 3 0 0 1 0 5.6",
    "M18 14.4c1.8.9 3 2.8 3 5.6",
  ],
  reports: ["M5 20V10", "M12 20V4", "M19 20v-7"],
  help: [
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
    "M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7",
    "M12 17h.01",
  ],
  info: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 11v5", "M12 8h.01"],
  warn: ["M12 4l9 16H3z", "M12 10v4", "M12 17h.01"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  note: ["M6 4h9l3 3v13H6z", "M9 12h6", "M9 16h4"],
  print: ["M7 9V4h10v5", "M7 17H5v-6h14v6h-2", "M7 14h10v6H7z"],
  arrow: ["M5 12h14", "M13 6l6 6-6 6"],
};

export default function Icon({ name, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {(ICONS[name] || []).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
