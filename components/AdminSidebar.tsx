"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogoMark } from "@/components/Logo";

const NAV_GROUPS = [
  {
    label: "General",
    items: [
      { href: "/admin", label: "Resumen", icon: "OV" },
      { href: "/admin/analytics", label: "Analytics", icon: "AN" },
    ],
  },
  {
    label: "Operación",
    items: [
      { href: "/admin/usuarios", label: "Usuarios", icon: "US" },
      { href: "/admin/suscripciones", label: "Suscripciones", icon: "SU" },
      { href: "/admin/pagos", label: "Pagos", icon: "$" },
      { href: "/admin/trials", label: "Trials", icon: "TR" },
    ],
  },
  {
    label: "Crecimiento",
    items: [
      { href: "/admin/leads", label: "Leads", icon: "LE" },
      { href: "/admin/soporte", label: "Soporte", icon: "SO" },
    ],
  },
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
        <Link href="/admin" className="admin-sidebar-logo" aria-label="TrainerFlow Admin">
          <LogoMark size={34} radius={9} />
          <div className="admin-sidebar-brand">
            <strong>TrainerFlow</strong>
            <span>Business OS</span>
          </div>
        </Link>

        <div className="admin-sidebar-workspace">
          <span className="admin-workspace-mark">TF</span>
          <span>
            <small>Workspace</small>
            <strong>Producción</strong>
          </span>
          <i className="admin-workspace-status" title="Sistema operativo" />
        </div>

        <nav className="admin-sidebar-nav" aria-label="Navegación administrativa">
          {NAV_GROUPS.map((group) => (
            <div className="admin-sidebar-group" key={group.label}>
              <span className="admin-sidebar-group-label">{group.label}</span>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-sidebar-link ${isActive(item.href) ? "active" : ""}`}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  title={item.label}
                >
                  <span className="admin-sidebar-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.href === "/admin/soporte" && notifCount ? (
                    <span className="admin-sidebar-badge">{notifCount}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </div>

      <div className="admin-sidebar-footer">
        <Link href="/admin/configuracion" className={`admin-sidebar-link ${isActive("/admin/configuracion") ? "active" : ""}`}>
          <span className="admin-sidebar-icon">CF</span>
          <span>Configuración</span>
        </Link>
        <div className="admin-sidebar-profile">
          <span className="admin-profile-avatar">AL</span>
          <span className="admin-profile-copy">
            <strong>Agustín Lafuente</strong>
            <small>Administrador</small>
          </span>
          <button onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión">↗</button>
        </div>
      </div>
    </aside>
  );
}
