"use client";

import { useEffect, useState } from "react";
import { loadAdminStats } from "@/lib/admin-client";

export default function SuscripcionesPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [planFilter, setPlanFilter] = useState("todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadAdminStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-page-head"><p style={{ color: "var(--gray)" }}>Cargando...</p></div>;
  if (!stats) return null;

  const subscriptions: any[] = stats.subscriptions ?? [];
  const now = new Date();

  // KPIs
  const active = subscriptions.filter((s) => s.status === "active");
  const mrrTotal = active.reduce((acc, s) => acc + Number(s.price_usd || 0), 0);
  const arrTotal = mrrTotal * 12;
  const proCount = active.filter((s) => s.account_type === "trainer").length;
  const teamCount = active.filter((s) => s.account_type === "gym").length;

  // Filter
  let filtered = subscriptions.filter((s) => {
    const q = search.toLowerCase();
    if (q && !(s.trainer_name || "").toLowerCase().includes(q)) return false;
    if (statusFilter !== "todos" && s.status !== statusFilter) return false;
    if (planFilter !== "todos" && s.account_type !== planFilter) return false;
    return true;
  });

  return (
    <>
      <div className="admin-page-head">
        <h1>Suscripciones</h1>
        <p className="sub">{subscriptions.length} suscripciones registradas</p>
      </div>

      <div className="admin-kpis" style={{ marginBottom: 24 }}>
        <div className="admin-kpi wide">
          <div className="admin-kpi-val green">${mrrTotal.toLocaleString()}</div>
          <div className="admin-kpi-label">MRR</div>
        </div>
        <div className="admin-kpi wide">
          <div className="admin-kpi-val violet">${arrTotal.toLocaleString()}</div>
          <div className="admin-kpi-label">ARR estimado</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val">{active.length}</div>
          <div className="admin-kpi-label">Activas</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val cyan">{proCount}</div>
          <div className="admin-kpi-label">Plan Pro</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val amber">{teamCount}</div>
          <div className="admin-kpi-label">Plan Team</div>
        </div>
      </div>

      <div className="admin-filters">
        <input placeholder="Buscar por nombre..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="todos">Todos los estados</option>
          <option value="active">Activa</option>
          <option value="expired">Expirada</option>
          <option value="cancelled">Cancelada</option>
        </select>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
          <option value="todos">Todos los planes</option>
          <option value="trainer">Pro</option>
          <option value="gym">Team</option>
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Plan</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Inicio</th>
              <th>Vencimiento</th>
              <th>MP ID</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--gray)" }}>Sin resultados</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.trainer_name || "—"}</td>
                <td>
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 8,
                    background: s.account_type === "gym" ? "rgba(56,217,240,0.12)" : "rgba(124,108,240,0.12)",
                    color: s.account_type === "gym" ? "var(--cyan)" : "var(--violet2)"
                  }}>
                    {s.account_type === "gym" ? "Team" : "Pro"}
                  </span>
                </td>
                <td>${Number(s.price_usd || 0).toLocaleString()}</td>
                <td>
                  <span className={`badge ${s.status === "active" ? "activo" : s.status === "expired" ? "baja" : "pausa"}`}>
                    {s.status === "active" ? "Activa" : s.status === "expired" ? "Expirada" : s.status || "—"}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: "var(--gray)" }}>
                  {s.created_at ? new Date(s.created_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                </td>
                <td style={{ fontSize: 13, color: "var(--gray)" }}>
                  {s.expires_at ? new Date(s.expires_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                </td>
                <td style={{ fontSize: 12, color: "var(--gray)" }}>
                  <code>{s.mp_subscription_id ? s.mp_subscription_id.slice(0, 12) + "..." : "—"}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
