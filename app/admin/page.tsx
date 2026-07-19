"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadAdminStats } from "@/lib/admin-client";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setStats(await loadAdminStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="admin-page-head"><p style={{ color: "var(--gray)" }}>Cargando dashboard...</p></div>;
  if (error) return <div className="admin-page-head"><p style={{ color: "var(--red)" }}>Error: {error}</p></div>;
  if (!stats) return null;

  const trainers: any[] = stats.trainers ?? [];
  const clients: any[] = stats.clients ?? [];
  const payments: any[] = stats.payments ?? [];
  const subscriptions: any[] = stats.subscriptions ?? [];
  const leads: any[] = stats.leads ?? [];
  const tickets: any[] = stats.tickets ?? [];
  const gyms: any[] = stats.gyms ?? [];
  const commissions: any[] = stats.commissions ?? [];

  const now = new Date();
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Trainer KPIs
  const totalTrainers = trainers.length;
  const activeTrainers = trainers.filter((t) => t.subscription_status === "active").length;
  const trialTrainers = trainers.filter((t) => t.subscription_status === "trial" && t.trial_ends_at && new Date(t.trial_ends_at) > now).length;
  const expiredTrainers = trainers.filter((t) => t.trial_ends_at && new Date(t.trial_ends_at) < now && t.subscription_status !== "active").length;

  // Client KPIs
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === "activo").length;

  // Revenue
  const paymentsThisMonth = payments.filter((p) => p.period === curMonth);
  const revenueThisMonth = paymentsThisMonth.reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

  // MRR from active subscriptions
  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const mrrSubs = activeSubs.reduce((s, sub) => s + Number(sub.price_usd || 0), 0);

  // Commission
  const commissionMonth = commissions.filter((c) => c.period === curMonth).reduce((s, c) => s + Number(c.commission || 0), 0);

  // Signups last 30d
  const d30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const recentSignups = trainers.filter((t) => t.created_at >= d30).length;

  // Conversion rate
  const convRate = totalTrainers > 0 ? Math.round((activeTrainers / totalTrainers) * 100) : 0;

  // Churn: expired / (active + expired)
  const churnBase = activeTrainers + expiredTrainers;
  const churnRate = churnBase > 0 ? Math.round((expiredTrainers / churnBase) * 100) : 0;

  // Leads KPIs
  const openLeads = leads.filter((l) => !["cliente", "perdido"].includes(l.status)).length;
  const openTickets = tickets.filter((t) => t.status === "abierto").length;

  // Monthly revenue chart (last 6 months)
  const months: { label: string; rev: number; comm: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-UY", { month: "short" });
    const rev = payments.filter((p) => p.period === key).reduce((s, p) => s + Number(p.amount || 0), 0);
    const comm = commissions.filter((c) => c.period === key).reduce((s, c) => s + Number(c.commission || 0), 0);
    months.push({ label, rev, comm });
  }
  const maxRev = Math.max(...months.map((m) => m.rev), 1);

  // Recent signups chart (last 6 months)
  const signupMonths: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = d.toLocaleDateString("es-UY", { month: "short" });
    const count = trainers.filter((t) => {
      const ca = new Date(t.created_at);
      return ca >= d && ca < nextD;
    }).length;
    signupMonths.push({ label, count });
  }
  const maxSignup = Math.max(...signupMonths.map((m) => m.count), 1);

  // Funnel
  const funnel = [
    { label: "Registros", val: totalTrainers },
    { label: "En trial", val: trialTrainers + activeTrainers + expiredTrainers },
    { label: "Trial completado", val: activeTrainers + expiredTrainers },
    { label: "Suscripción activa", val: activeTrainers },
  ];
  const maxFunnel = Math.max(funnel[0].val, 1);

  // Recent activity
  const recentTrainers = [...trainers].sort((a, b) => b.created_at?.localeCompare(a.created_at)).slice(0, 5);

  return (
    <>
      <div className="admin-page-head">
        <h1>Dashboard</h1>
        <p className="sub">Vista ejecutiva de TrainerFlow</p>
      </div>

      {/* KPIs row 1 */}
      <div className="admin-kpis" style={{ marginBottom: 12 }}>
        <div className="admin-kpi">
          <div className="admin-kpi-val">{totalTrainers}</div>
          <div className="admin-kpi-label">Trainers</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val green">{activeTrainers}</div>
          <div className="admin-kpi-label">Suscripción activa</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val violet">{trialTrainers}</div>
          <div className="admin-kpi-label">En trial</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val amber">{expiredTrainers}</div>
          <div className="admin-kpi-label">Expirados</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val cyan">{totalClients}</div>
          <div className="admin-kpi-label">Clientes</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val">{gyms.length}</div>
          <div className="admin-kpi-label">Gimnasios</div>
        </div>
      </div>

      {/* KPIs row 2 - Revenue */}
      <div className="admin-kpis">
        <div className="admin-kpi wide">
          <div className="admin-kpi-val green">${mrrSubs.toLocaleString()}</div>
          <div className="admin-kpi-label">MRR Suscripciones</div>
        </div>
        <div className="admin-kpi wide">
          <div className="admin-kpi-val">${revenueThisMonth.toLocaleString()}</div>
          <div className="admin-kpi-label">Cobros este mes</div>
        </div>
        <div className="admin-kpi wide">
          <div className="admin-kpi-val violet">${commissionMonth.toLocaleString()}</div>
          <div className="admin-kpi-label">Comisión TF mes</div>
        </div>
        <div className="admin-kpi wide">
          <div className="admin-kpi-val cyan">{convRate}%</div>
          <div className="admin-kpi-label">Tasa conversión</div>
        </div>
        <div className="admin-kpi wide">
          <div className="admin-kpi-val red">{churnRate}%</div>
          <div className="admin-kpi-label">Churn rate</div>
        </div>
      </div>

      {/* Charts */}
      <div className="admin-charts-grid" style={{ marginTop: 24 }}>
        {/* Revenue chart */}
        <div className="admin-chart">
          <div className="admin-chart-title">Ingresos últimos 6 meses (UYU)</div>
          <div className="admin-chart-bars">
            {months.map((m, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 11, color: "var(--violet2)", fontWeight: 600 }}>
                  {m.rev > 0 ? `$${(m.rev / 1000).toFixed(0)}k` : ""}
                </div>
                <div
                  className="admin-chart-bar violet"
                  style={{ width: "100%", height: `${(m.rev / maxRev) * 120}px` }}
                />
                <div style={{ fontSize: 10, color: "var(--gray)", marginTop: 4 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Signups chart */}
        <div className="admin-chart">
          <div className="admin-chart-title">Registros últimos 6 meses</div>
          <div className="admin-chart-bars">
            {signupMonths.map((m, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 11, color: "var(--cyan)", fontWeight: 600 }}>
                  {m.count > 0 ? m.count : ""}
                </div>
                <div
                  className="admin-chart-bar cyan"
                  style={{ width: "100%", height: `${(m.count / maxSignup) * 120}px` }}
                />
                <div style={{ fontSize: 10, color: "var(--gray)", marginTop: 4 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Funnel + Quick Stats */}
      <div className="admin-charts-grid" style={{ marginTop: 16 }}>
        {/* Conversion funnel */}
        <div className="admin-chart">
          <div className="admin-chart-title">Funnel de conversión</div>
          <div className="admin-funnel">
            {funnel.map((f, i) => (
              <div key={i} className="admin-funnel-step">
                <div className="admin-funnel-label">{f.label}</div>
                <div style={{ flex: 1 }}>
                  <div className="admin-funnel-bar" style={{ width: `${(f.val / maxFunnel) * 100}%` }} />
                </div>
                <div className="admin-funnel-val">{f.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="admin-chart">
          <div className="admin-chart-title">Estado rápido</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--line)", cursor: "pointer" }} onClick={() => router.push("/admin/leads")}>
              <span style={{ fontSize: 14, color: "var(--ink)" }}>Leads abiertos</span>
              <span style={{ fontWeight: 700, color: "var(--violet2)" }}>{openLeads}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--line)", cursor: "pointer" }} onClick={() => router.push("/admin/soporte")}>
              <span style={{ fontSize: 14, color: "var(--ink)" }}>Tickets abiertos</span>
              <span style={{ fontWeight: 700, color: openTickets > 0 ? "var(--amber)" : "var(--green)" }}>{openTickets}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--line)", cursor: "pointer" }} onClick={() => router.push("/admin/usuarios")}>
              <span style={{ fontSize: 14, color: "var(--ink)" }}>Signups (30d)</span>
              <span style={{ fontWeight: 700, color: "var(--cyan)" }}>{recentSignups}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--line)" }}>
              <span style={{ fontSize: 14, color: "var(--ink)" }}>Revenue total</span>
              <span style={{ fontWeight: 700, color: "var(--green)" }}>${totalRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent trainers */}
      <div className="admin-section">
        <h2>Últimos registros</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {recentTrainers.map((t) => {
                const status = t.subscription_status || "none";
                const trialEnd = t.trial_ends_at ? new Date(t.trial_ends_at) : null;
                const trialExpired = trialEnd && trialEnd < now;
                let badge = status;
                if (status === "trial" && trialExpired) badge = "expired";

                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.full_name || "—"}</td>
                    <td style={{ color: "var(--gray)", fontSize: 13 }}>{t.email || "—"}</td>
                    <td>
                      <span className={`badge ${badge === "active" ? "activo" : badge === "trial" ? "trial" : "baja"}`}>
                        {badge === "active" ? "Activo" : badge === "trial" ? "Trial" : "Expirado"}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--gray)" }}>
                      {new Date(t.created_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
