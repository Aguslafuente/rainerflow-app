export function LogoMark({
  size = 36,
  radius = 9,
  monoColor = "#ffffff",
}: {
  size?: number;
  radius?: number;
  monoColor?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "linear-gradient(135deg, #6c5ce7, #a29bfe)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        viewBox="0 0 120 120"
        width={size * 0.72}
        height={size * 0.72}
        aria-hidden
      >
        <path
          d="M20 96 C 44 98, 74 92, 104 74"
          fill="none"
          stroke="#22d3ee"
          strokeWidth={10}
          strokeLinecap="round"
        />
        <g transform="skewX(-10)" fill={monoColor}>
          <rect x="18" y="26" width="80" height="13" rx="4" />
          <rect x="40" y="26" width="13" height="56" rx="4" />
          <rect x="66" y="26" width="13" height="56" rx="4" />
          <rect x="79" y="48" width="22" height="12" rx="4" />
        </g>
      </svg>
    </div>
  );
}

export function LogoLockup({
  size = 34,
  color = "#e4e4e7",
  accent = "#a29bfe",
}: {
  size?: number;
  color?: string;
  accent?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <LogoMark size={size} />
      <span style={{ fontWeight: 700, fontSize: size * 0.55, color }}>
        Trainer<span style={{ color: accent }}>Flow</span>
      </span>
    </div>
  );
}
