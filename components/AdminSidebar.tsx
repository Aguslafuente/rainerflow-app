"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogoMark } from "@/components/Logo";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/usuarios", label: "Usuarios", icon: "👥" },
  { href: "/admin/suscripciones", label: "Suscripciones", icon: "💳" },
  { href: "/admin/pagos", label: "Pagos", icon: "💰" },
  { href: "/admin/leads", label: "Leads", icon: "🎯" },
  { href: "/admin/trials", label: "Trials", icon: "⏱️" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
  { href: "/admin/soporte", label: "Soporte", icon: "🎧" },
  { href: "/admin/configuracion", label: "Configuración", icon: "⚙️" },
];

export function AdminSidebar({ notifCount }: { notifCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-top">
        <Link href="/admin" className="admin-sidebar-logo">
          <LogoMark size={32} radius={8} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>TrainerFlow</div>
            <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 1 }}>Admin Panel</div>
          </div>
        </Link>

        <nav className="admin-sidebar-nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-sidebar-link ${isActive(item.href) ? "active" : ""}`}
            >
              <span className="admin-sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.href === "/admin/soporte" && notifCount ? (
                <span className="admin-sidebar-badge">{notifCount}</span>
              ) : null}
            </Link>
          ))}
        </nav>
      </div>

      <div className="admin-sidebar-footer">
        <button onClick={handleLogout} className="admin-sidebar-link" style={{ width: "100%", border: "none", cursor: "pointer", background: "none", textAlign: "left" }}>
          <span className="admin-sidebar-icon">🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
