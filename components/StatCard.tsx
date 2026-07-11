import Link from "next/link";

export function StatCard({
  label,
  value,
  hint,
  tone = "violet",
  valueColor,
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: string;
  tone?: "violet" | "green" | "amber" | "cyan";
  valueColor?: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
      {hint && <div className="stat-hint">{hint}</div>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`stat-card tone-${tone}`}>
        {content}
      </Link>
    );
  }

  return <div className={`stat-card tone-${tone}`}>{content}</div>;
}
