"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ClientTabs({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const base = `/clientes/${clientId}`;
  const tabs = [
    { href: base, label: "Ficha", exact: true },
    { href: `${base}/nutricion`, label: "Nutrición" },
    { href: `${base}/progreso`, label: "Progreso" },
    { href: `${base}/habitos`, label: "Hábitos" },
    { href: `${base}/revisiones`, label: "Revisiones" },
    { href: `${base}/chat`, label: "Chat" },
  ];

  return (
    <div className="client-tabs">
      {tabs.map((t) => {
        const active = t.exact
          ? pathname === t.href
          : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={active ? "active" : ""}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
