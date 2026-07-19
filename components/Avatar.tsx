"use client";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  radius?: number;
  className?: string;
}

export function Avatar({ src, name, size = 36, radius = 10, className }: AvatarProps) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.38,
    fontWeight: 600,
    color: "var(--violet2)",
    background: src ? `url(${src}) center/cover no-repeat` : "var(--violet-bg)",
    border: "1px solid rgba(124,108,240,0.15)",
  };

  return (
    <div className={className} style={style}>
      {!src && <span>{initials}</span>}
    </div>
  );
}
