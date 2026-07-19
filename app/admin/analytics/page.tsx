"use client";

import { useEffect, useState } from "react";
import { loadAdminStats } from "@/lib/admin-client";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-page-head"><p style={{ color: "var(--gray)" }}>Cargando...</p></div>;
  if (!stats) return null;

  const trainers: any[] = stats.trainers ?? [];
  const clients: any[] = stats.clients ?? [];
  const payments: any[] = stats.payments ?? [];
  const subscriptions: any[] = stats.subscriptions ?? [];
  const now = new Date();

  // ── DAU / WAU / MAU (based on last_sign_in_at) ──
  const d1 = new Date(Date.now() - 86400000).toISOString();
  const d7 = new Date(Date.now() - 7 * 86400000).toISOString();
  const d30 = new Date(Date.now() - 30 * 86400000).toISOString();

  const allUsers = [...trainers, ...clients];
  const dau = allUsers.filter((u) => u.last_sign_in_at && u.last_sign_in_at >= d1).length;
  const wau = allUsers.filter((u) => u.last_sign_in_at && u.last_sign_in_at >= d7).length;
  const mau = allUsers.filter((u) => u.last_sign_in_at && u.last_sign_in_at >= d30).length;

  // ── MRR / ARR ──
  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const mrr = activeSubs.reduce((s, sub) => s + Number(sub.price_usd || 0), 0);
  const arr = mrr * 12;

  // ── Churn ──
  const activeTrainers = trainers.filter((t) => t.subscription_status === "active").length;
  const expiredTrainers = trainers.filter((t) => t.trial_ends_at && new Date(t.trial_ends_at) < now && t.subscription_status !== "active").length;
  const churnBase = activeTrainers + expiredTrainers;
  const churnRate = churnBase > 0 ? ((expiredTrainers / churnBase) * 100).toFixed(1) : "0";

  // ── LTV (MRR / churn rate monthly) ──
  const arpu = activeTrainers > 0 ? mrr / activeTrainers : 0;
  const churnDecimal = churnBase > 0 ? expiredTrainers / churnBase : 0;
  const ltv = churnDecimal > 0 ? arpu / churnDecimal : arpu * 24; // if no churn, estimate 24 months

  // ── Conversion funnel ──
  const totalRegistered = trainers.length;
  const trialStarted = trainers.filter((t) => t.trial_ends_at).length;
  const trialCompleted = trainers.filter((t) => t.trial_ends_at && new Date(t.trial_ends_at) < now).length + activeTrainers;
  const subscribed = activeTrainers;
  const funnel = [
    { label: "Registrados", val: totalRegistered },
    { label: "Trial iniciado", val: trialStarted },
    { label: "Trial completado", val: trialCompleted },
    { label: "Suscripción activa", val: subscribed },
  ];
  const maxF = Math.max(funnel[0].val, 1);

  // ── Monthly growth chart ──
  const growthMonths: { label: string; signups: number; conversions: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = d.toLocaleDateString("es-UY", { month: "short" });
    const signups = trainers.filter((t) => { const ca = new Date(t.created_at); return ca >= d && ca < nextD; }).length;
    const conversions = trainers.filter((t) => {
      if (t.subscription_status !== "active" || !t.subscription_expires_at) return false;
      // Approximate conversion date as subscription start
      const subStart = new Date(t.subscription_expires_at);
      subStart.setMonth(subStart.getMonth() - 1); // rough guess
      return subStart >= d && subStart < nextD;
    }).length;
    growthMonths.push({ label, signups, conversions });
  }
  const maxGrowth = Math.max(...growthMonths.map((m) => m.signups), 1);

  // ── Revenue trend ──
  const revMonths: { label: string; rev: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-UY", { month: "short" });
    const rev = payments.filter((p) => p.period === key).reduce((s, p) => s + Number(p.amount || 0), 0);
    revMonths.push({ label, rev });
  }
  const maxRev = Math.max(...revMonths.map((m) => m.rev), 1);

  // ── Engagement: routines & exercises ──
  const routinesCount = Number(stats.routines_count ?? 0);
  const exercisesCount = Number(stats.exercises_count ?? 0);
  const activeClients = clients.filter((c) => c.status === "activo").length;
  const clientsPerTrainer = activeTrainers > 0 ? (activeClients / activeTrainers).toFixed(1) : "0";

  return (
    <>
      <div className="admin-page-head">
        <h1>Analytics</h1>
        <p className="sub">Métricas avanzadas de uso y negocio</p>
      </div>

      {/* Engagement KPIs */}
      <div className="admin-section">
        <h2>Engagement</h2>
        <div className="admin-kpis">
          <div className="admin-kpi">
            <div className="admin-kpi-val green">{dau}</div>
            <div className="admin-kpi-label">DAU</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-val cyan">{wau}</div>
            <div className="admin-kpi-label">WAU</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-val violet">{mau}</div>
            <div className="admin-kpi-label">MAU</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-val">{clientsPerTrainer}</div>
            <div className="admin-kpi-label">Clientes/Trainer</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-val">{routinesCount}</div>
            <div className="admin-kpi-label">Rutinas</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-val">{exercisesCount}</div>
            <div className="admin-kpi-label">Ejercicios</div>
          </div>
        </div>
      </div>

      {/* Revenue KPIs */}
      <div className="admin-section">
        <h2>Revenue</h2>
        <div className="admin-kpis">
          <div className="admin-kpi wide">
            <div className="admin-kpi-val green">${mrr.toLocaleString()}</div>
            <div className="admin-kpi-label">MRR</div>
          </div>
          <div className="admin-kpi wide">
            <div className="admin-kpi-val violet">${arr.toLocaleString()}</div>
            <div className="admin-kpi-label">ARR</div>
          </div>
          <div className="admin-kpi wide">
            <div className="admin-kpi-val cyan">${Math.round(ltv).toLocaleString()}</div>
            <div className="admin-kpi-label">LTV estimado</div>
          </div>
          <div className="admin-kpi wide">
            <div className="admin-kpi-val">${Math.round(arpu).toLocaleString()}</div>
            <div className="admin-kpi-label">ARPU</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-val red">{churnRate}%</div>
            <div className="admin-kpi-label">Churn rate</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="admin-charts-grid" style={{ marginTop: 24 }}>
        {/* Growth chart */}
        <div className="admin-chart">
          <div className="admin-chart-title">Registros mensuales</div>
          <div className="admin-chart-bars">
            {growthMonths.map((m, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 11, color: "var(--cyan)", fontWeight: 600 }}>{m.signups || ""}</div>
                <div className="admin-chart-bar cyan" style={{ width: "100%", height: `${(m.signups / maxGrowth) * 120}px` }} />
                <div style={{ fontSize: 10, color: "var(--gray)", marginTop: 4 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue chart */}
        <div className="admin-chart">
          <div className="admin-chart-title">Revenue mensual (UYU)</div>
          <div className="admin-chart-bars">
            {revMonths.map((m, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 600 }}>{m.rev > 0 ? `$${(m.rev / 1000).toFixed(0)}k` : ""}</div>
                <div className="admin-chart-bar green" style={{ width: "100%", height: `${(m.rev / maxRev) * 120}px` }} />
                <div style={{ fontSize: 10, color: "var(--gray)", marginTop: 4 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversion funnel */}
      <div className="admin-section">
        <h2>Funnel de conversión</h2>
        <div className="admin-funnel" style={{ maxWidth: 600 }}>
          {funnel.map((f, i) => {
            const pct = maxF > 0 ? Math.round((f.val / maxF) * 100) : 0;
            const prevVal = i > 0 ? funnel[i - 1].val : f.val;
            const stepRate = prevVal > 0 ? Math.round((f.val / prevVal) * 100) : 100;
            return (
              <div key={i} className="admin-funnel-step">
                <div className="admin-funnel-label">{f.label}</div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div className="admin-funnel-bar" style={{ width: `${pct}%` }} />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--gray)", minWidth: 40 }}>{stepRate}%</span>
                </div>
                <div className="admin-funnel-val">{f.val}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
