"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest, loadAdminStats } from "@/lib/admin-client";

export default function ConfiguracionPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await loadAdminStats<any>();
      setStats(data);
      setNotifications(data?.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }

  // Global search
  useEffect(() => {
    if (!searchQuery.trim() || !stats) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    const results: any[] = [];

    // Search trainers
    (stats.trainers ?? []).forEach((t: any) => {
      if ((t.full_name || "").toLowerCase().includes(q) || (t.email || "").toLowerCase().includes(q)) {
        results.push({ type: "Trainer", label: t.full_name || t.email, href: "/admin/usuarios" });
      }
    });

    // Search clients
    (stats.clients ?? []).forEach((c: any) => {
      if ((c.full_name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q)) {
        results.push({ type: "Cliente", label: c.full_name || c.email, href: "/admin/usuarios" });
      }
    });

    // Search leads
    (stats.leads ?? []).forEach((l: any) => {
      const name = `${l.first_name || ""} ${l.last_name || ""}`;
      if (name.toLowerCase().includes(q) || (l.email || "").toLowerCase().includes(q)) {
        results.push({ type: "Lead", label: name, href: `/admin/leads/${l.id}` });
      }
    });

    // Search tickets
    (stats.tickets ?? []).forEach((t: any) => {
      if ((t.subject || "").toLowerCase().includes(q)) {
        results.push({ type: "Ticket", label: t.subject, href: "/admin/soporte" });
      }
    });

    setSearchResults(results.slice(0, 15));
  }, [searchQuery, stats]);

  async function markRead(id: string) {
    await adminRequest("notifications_mark_read", { ids: [id] });
    setNotifications(notifications.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await adminRequest("notifications_mark_read", { ids: unreadIds });
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  }

  // Keyboard shortcut for search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "Escape") setShowSearch(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (loading) return <div className="admin-page-head"><p style={{ color: "var(--gray)" }}>Cargando...</p></div>;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <div className="admin-page-head">
        <h1>Configuración</h1>
        <p className="sub">Admin panel settings</p>
      </div>

      {/* Global search bar */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">Buscador global</div>
        <div style={{ padding: 16 }}>
          <div
            onClick={() => setShowSearch(true)}
            style={{
              padding: "12px 16px", borderRadius: 10, border: "1px solid var(--line)",
              background: "var(--card)", cursor: "pointer", display: "flex",
              justifyContent: "space-between", alignItems: "center",
            }}
          >
            <span style={{ color: "var(--gray)", fontSize: 14 }}>Buscar trainers, clientes, leads, tickets...</span>
            <kbd style={{ fontSize: 11, color: "var(--gray)", background: "var(--panel)", padding: "2px 8px", borderRadius: 4, border: "1px solid var(--line)" }}>Cmd+K</kbd>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Notificaciones {unreadCount > 0 && <span className="admin-sidebar-badge">{unreadCount}</span>}</span>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ background: "none", border: "none", color: "var(--violet2)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              Marcar todas como leídas
            </button>
          )}
        </div>
        <div style={{ padding: 16 }}>
          {notifications.length === 0 ? (
            <p style={{ color: "var(--gray)", fontSize: 14 }}>Sin notificaciones</p>
          ) : (
            <div className="admin-notif-list">
              {notifications.map((n) => (
                <div key={n.id} className={`admin-notif-item ${!n.read ? "unread" : ""}`} onClick={() => { markRead(n.id); if (n.link) router.push(n.link); }}>
                  <span className="admin-notif-icon">
                    {n.type === "signup" ? "👤" : n.type === "payment" ? "💰" : n.type === "trial_expiring" ? "⏰" : n.type === "ticket" ? "🎧" : "🔔"}
                  </span>
                  <div className="admin-notif-body">
                    <div className="admin-notif-title">{n.title}</div>
                    <div className="admin-notif-desc">{n.body}</div>
                  </div>
                  <span className="admin-notif-time">
                    {new Date(n.created_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System info */}
      <div className="panel">
        <div className="panel-head">Sistema</div>
        <div style={{ padding: 16, fontSize: 13 }}>
          {[
            { label: "App", val: "TrainerFlow" },
            { label: "Framework", val: "Next.js 14" },
            { label: "Base de datos", val: "Supabase (PostgreSQL)" },
            { label: "Pagos", val: "MercadoPago Checkout Pro" },
            { label: "Plan Pro", val: "$1.200 UYU/mes (5% comisión)" },
            { label: "Plan Team", val: "$2.500 UYU/mes (3% comisión)" },
            { label: "Deploy", val: "Netlify" },
          ].map((f) => (
            <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <span style={{ color: "var(--gray)" }}>{f.label}</span>
              <span style={{ fontWeight: 500, color: "var(--ink)" }}>{f.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Global search overlay */}
      {showSearch && (
        <div className="admin-search-overlay" onClick={() => setShowSearch(false)}>
          <div className="admin-search-box" onClick={(e) => e.stopPropagation()}>
            <input
              className="admin-search-input"
              placeholder="Buscar en todo el sistema..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="admin-search-results">
              {searchResults.length === 0 && searchQuery.trim() && (
                <div style={{ padding: "20px 22px", color: "var(--gray)", fontSize: 14 }}>Sin resultados</div>
              )}
              {searchResults.map((r, i) => (
                <div
                  key={i}
                  className="admin-search-result"
                  onClick={() => { router.push(r.href); setShowSearch(false); setSearchQuery(""); }}
                >
                  <span className="admin-search-result-type">{r.type}</span>
                  <span style={{ fontSize: 14, color: "var(--ink)" }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
