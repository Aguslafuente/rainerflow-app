"use client";

import { useEffect, useState } from "react";
import { loadAdminStats } from "@/lib/admin-client";

export default function PagosPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState("todos");

  useEffect(() => {
    loadAdminStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-page-head"><p style={{ color: "var(--gray)" }}>Cargando...</p></div>;
  if (!stats) return null;

  const payments: any[] = stats.payments ?? [];
  const commissions: any[] = stats.commissions ?? [];
  const now = new Date();
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // KPIs
  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const revenueMonth = payments.filter((p) => p.period === curMonth).reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalCommission = commissions.reduce((s, c) => s + Number(c.commission || 0), 0);
  const commissionMonth = commissions.filter((c) => c.period === curMonth).reduce((s, c) => s + Number(c.commission || 0), 0);

  // Get unique periods for filter
  const periods = Array.from(
    new Set(payments.map((p) => String(p.period || "")).filter(Boolean))
  ).sort().reverse();

  let filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    if (q && !(p.trainer_name || "").toLowerCase().includes(q) && !(p.client_name || "").toLowerCase().includes(q)) return false;
    if (periodFilter !== "todos" && p.period !== periodFilter) return false;
    return true;
  });

  // Sort by date descending
  filtered.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

  // Monthly revenue chart
  const months: { label: string; rev: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-UY", { month: "short" });
    const rev = payments.filter((p) => p.period === key).reduce((s, p) => s + Number(p.amount || 0), 0);
    months.push({ label, rev });
  }
  const maxRev = Math.max(...months.map((m) => m.rev), 1);

  return (
    <>
      <div className="admin-page-head">
        <h1>Pagos</h1>
        <p className="sub">{payments.length} pagos procesados</p>
      </div>

      <div className="admin-kpis" style={{ marginBottom: 24 }}>
        <div className="admin-kpi wide">
          <div className="admin-kpi-val green">${revenueMonth.toLocaleString()}</div>
          <div className="admin-kpi-label">Cobros este mes</div>
        </div>
        <div className="admin-kpi wide">
          <div className="admin-kpi-val violet">${commissionMonth.toLocaleString()}</div>
          <div className="admin-kpi-label">Comisión TF mes</div>
        </div>
        <div className="admin-kpi wide">
          <div className="admin-kpi-val">${totalRevenue.toLocaleString()}</div>
          <div className="admin-kpi-label">Cobros totales</div>
        </div>
        <div className="admin-kpi wide">
          <div className="admin-kpi-val cyan">${totalCommission.toLocaleString()}</div>
          <div className="admin-kpi-label">Comisión TF total</div>
        </div>
      </div>

      {/* Chart */}
      <div className="admin-chart" style={{ marginBottom: 24 }}>
        <div className="admin-chart-title">Cobros últimos 6 meses</div>
        <div className="admin-chart-bars">
          {months.map((m, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 600 }}>
                {m.rev > 0 ? `$${(m.rev / 1000).toFixed(0)}k` : ""}
              </div>
              <div className="admin-chart-bar green" style={{ width: "100%", height: `${(m.rev / maxRev) * 120}px` }} />
              <div style={{ fontSize: 10, color: "var(--gray)", marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-filters">
        <input placeholder="Buscar por trainer o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
          <option value="todos">Todos los períodos</option>
          {periods.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Trainer</th>
              <th>Cliente</th>
              <th>Monto</th>
              <th>Comisión TF</th>
              <th>Período</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--gray)" }}>Sin resultados</td></tr>
            ) : filtered.map((p) => {
              const comm = Number(p.amount || 0) * (p.commission_rate || 0.05);
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.trainer_name || "—"}</td>
                  <td style={{ color: "var(--gray)" }}>{p.client_name || "—"}</td>
                  <td style={{ fontWeight: 600, color: "var(--green)" }}>${Number(p.amount || 0).toLocaleString()}</td>
                  <td style={{ color: "var(--violet2)" }}>${Math.round(comm).toLocaleString()}</td>
                  <td style={{ fontSize: 13 }}>{p.period || "—"}</td>
                  <td>
                    <span className={`badge ${p.status === "paid" || p.status === "approved" ? "activo" : "pausa"}`}>
                      {p.status === "paid" || p.status === "approved" ? "Pagado" : p.status || "—"}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--gray)" }}>
                    {p.created_at ? new Date(p.created_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short" }) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
