"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadAdminStats } from "@/lib/admin-client";

type DashboardRange = 3 | 6 | 12;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function initials(name?: string | null) {
  if (!name) return "TF";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatUyi(value: number) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function compactMoney(value: number) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(value)}`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState<DashboardRange>(6);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    setError("");
    try {
      setStats(await loadAdminStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="admin2-loading" aria-label="Cargando dashboard">
        <div className="admin2-skeleton admin2-skeleton-title" />
        <div className="admin2-skeleton-grid">
          <div className="admin2-skeleton admin2-skeleton-hero" />
          <div className="admin2-skeleton admin2-skeleton-hero" />
        </div>
        <div className="admin2-skeleton-grid four">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="admin2-skeleton admin2-skeleton-card" key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin2-state-card">
        <span className="admin2-state-icon">!</span>
        <h1>No pudimos cargar el panel</h1>
        <p>{error}</p>
        <button className="admin2-button primary" onClick={() => loadStats()}>
          Reintentar
        </button>
      </div>
    );
  }

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
  const todayLabel = now.toLocaleDateString("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const currentMonth = monthKey(now);
  const previousMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const totalTrainers = trainers.length;
  const activeTrainers = trainers.filter((trainer) => trainer.subscription_status === "active").length;
  const trialTrainers = trainers.filter(
    (trainer) =>
      trainer.subscription_status === "trial" &&
      trainer.trial_ends_at &&
      new Date(trainer.trial_ends_at) > now
  );
  const expiredTrainers = trainers.filter(
    (trainer) =>
      trainer.trial_ends_at &&
      new Date(trainer.trial_ends_at) < now &&
      trainer.subscription_status !== "active"
  );
  const activeClients = clients.filter((client) => client.status === "activo").length;

  const trialsExpiringSoon = trialTrainers
    .filter((trainer) => {
      const days = Math.ceil((new Date(trainer.trial_ends_at).getTime() - now.getTime()) / 86400000);
      return days <= 7;
    })
    .sort((a, b) => String(a.trial_ends_at).localeCompare(String(b.trial_ends_at)));

  const paymentsThisMonth = payments.filter((payment) => payment.period === currentMonth);
  const paymentsPreviousMonth = payments.filter((payment) => payment.period === previousMonth);
  const revenueThisMonth = paymentsThisMonth.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const revenuePreviousMonth = paymentsPreviousMonth.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );
  const revenueGrowth =
    revenuePreviousMonth > 0
      ? Math.round(((revenueThisMonth - revenuePreviousMonth) / revenuePreviousMonth) * 100)
      : revenueThisMonth > 0
        ? 100
        : 0;
  const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "active");
  const mrr = activeSubscriptions.reduce(
    (sum, subscription) => sum + Number(subscription.price_usd || 0),
    0
  );
  const commissionThisMonth = commissions
    .filter((commission) => commission.period === currentMonth)
    .reduce((sum, commission) => sum + Number(commission.commission || 0), 0);

  const date30DaysAgo = new Date(now.getTime() - 30 * 86400000);
  const date60DaysAgo = new Date(now.getTime() - 60 * 86400000);
  const newTrainers30d = trainers.filter((trainer) => new Date(trainer.created_at) >= date30DaysAgo).length;
  const previousTrainers30d = trainers.filter((trainer) => {
    const createdAt = new Date(trainer.created_at);
    return createdAt >= date60DaysAgo && createdAt < date30DaysAgo;
  }).length;
  const signupGrowth =
    previousTrainers30d > 0
      ? Math.round(((newTrainers30d - previousTrainers30d) / previousTrainers30d) * 100)
      : newTrainers30d > 0
        ? 100
        : 0;

  const conversionRate = totalTrainers > 0 ? Math.round((activeTrainers / totalTrainers) * 100) : 0;
  const openLeads = leads.filter((lead) => !["cliente", "perdido"].includes(lead.status)).length;
  const openTickets = tickets.filter((ticket) => ticket.status === "abierto").length;

  const monthlyData = Array.from({ length: range }, (_, index) => {
    const distance = range - index - 1;
    const date = new Date(now.getFullYear(), now.getMonth() - distance, 1);
    const key = monthKey(date);
    return {
      key,
      label: date.toLocaleDateString("es-UY", { month: "short" }).replace(".", ""),
      revenue: payments
        .filter((payment) => payment.period === key)
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      commission: commissions
        .filter((commission) => commission.period === key)
        .reduce((sum, commission) => sum + Number(commission.commission || 0), 0),
    };
  });
  const maxRevenue = Math.max(...monthlyData.map((month) => month.revenue), 1);

  const trainerStatusTotal = Math.max(totalTrainers, 1);
  const activePct = (activeTrainers / trainerStatusTotal) * 100;
  const trialPct = (trialTrainers.length / trainerStatusTotal) * 100;
  const expiredPct = (expiredTrainers.length / trainerStatusTotal) * 100;
  const statusChart = `conic-gradient(
    var(--green) 0% ${activePct}%,
    var(--violet) ${activePct}% ${activePct + trialPct}%,
    var(--amber) ${activePct + trialPct}% ${activePct + trialPct + expiredPct}%,
    rgba(255,255,255,.06) ${activePct + trialPct + expiredPct}% 100%
  )`;

  const recentTrainers = [...trainers]
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 6);
  const recentPayments = [...payments]
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 4);

  function trainerStatus(trainer: any) {
    if (trainer.subscription_status === "active") return { label: "Activo", className: "active" };
    if (trainer.subscription_status === "trial" && new Date(trainer.trial_ends_at) > now) {
      return { label: "Trial", className: "trial" };
    }
    return { label: "Expirado", className: "expired" };
  }

  return (
    <div className="admin2-dashboard">
      <header className="admin2-header">
        <div>
          <div className="admin2-eyebrow">
            <span className="admin2-live-dot" />
            Control center · {todayLabel}
          </div>
          <h1>Panorama del negocio</h1>
          <p>Ingresos, crecimiento y prioridades de TrainerFlow en un solo lugar.</p>
        </div>
        <div className="admin2-header-actions">
          <Link className="admin2-button" href="/admin/usuarios">
            Ver usuarios
          </Link>
          <button
            className="admin2-button primary"
            onClick={() => loadStats(true)}
            disabled={refreshing}
          >
            <span className={refreshing ? "admin2-refresh spinning" : "admin2-refresh"}>↻</span>
            {refreshing ? "Actualizando" : "Actualizar"}
          </button>
        </div>
      </header>

      <section className="admin2-hero-grid">
        <article className="admin2-revenue-card">
          <div className="admin2-card-topline">
            <div>
              <span className="admin2-card-kicker">Ingresos del mes</span>
              <div className="admin2-revenue-value">{formatUyi(revenueThisMonth)}</div>
            </div>
            <span className={`admin2-trend ${revenueGrowth < 0 ? "negative" : ""}`}>
              {revenueGrowth >= 0 ? "↑" : "↓"} {Math.abs(revenueGrowth)}%
            </span>
          </div>
          <p className="admin2-revenue-context">
            Comparado con {formatUyi(revenuePreviousMonth)} el mes anterior
          </p>
          <div className="admin2-revenue-details">
            <div>
              <span>MRR</span>
              <strong>{formatUsd(mrr)}</strong>
            </div>
            <div>
              <span>Comisión TF</span>
              <strong>{formatUyi(commissionThisMonth)}</strong>
            </div>
            <div>
              <span>Pagos</span>
              <strong>{paymentsThisMonth.length}</strong>
            </div>
            <div>
              <span>Histórico</span>
              <strong>{formatUyi(totalRevenue)}</strong>
            </div>
          </div>
          <div className="admin2-glow-orb" />
        </article>

        <article className="admin2-attention-card">
          <div className="admin2-section-heading compact">
            <div>
              <span className="admin2-card-kicker">Prioridades</span>
              <h2>Atención hoy</h2>
            </div>
            <span className="admin2-priority-count">
              {trialsExpiringSoon.length + openTickets + expiredTrainers.length}
            </span>
          </div>
          <div className="admin2-priority-list">
            <Link href="/admin/trials" className="admin2-priority-row">
              <span className="admin2-priority-icon amber">T</span>
              <span>
                <strong>{trialsExpiringSoon.length} trials por vencer</strong>
                <small>Próximos 7 días</small>
              </span>
              <span className="admin2-row-arrow">→</span>
            </Link>
            <Link href="/admin/soporte" className="admin2-priority-row">
              <span className="admin2-priority-icon violet">S</span>
              <span>
                <strong>{openTickets} tickets abiertos</strong>
                <small>Requieren seguimiento</small>
              </span>
              <span className="admin2-row-arrow">→</span>
            </Link>
            <Link href="/admin/leads" className="admin2-priority-row">
              <span className="admin2-priority-icon cyan">L</span>
              <span>
                <strong>{openLeads} leads en pipeline</strong>
                <small>Oportunidades activas</small>
              </span>
              <span className="admin2-row-arrow">→</span>
            </Link>
          </div>
        </article>
      </section>

      <section className="admin2-kpi-grid" aria-label="Indicadores principales">
        <article className="admin2-kpi-card">
          <div className="admin2-kpi-top">
            <span className="admin2-kpi-icon green">A</span>
            <span className="admin2-kpi-note">de {totalTrainers}</span>
          </div>
          <strong>{activeTrainers}</strong>
          <span>Trainers activos</span>
          <div className="admin2-progress"><i style={{ width: `${conversionRate}%` }} /></div>
        </article>
        <article className="admin2-kpi-card">
          <div className="admin2-kpi-top">
            <span className="admin2-kpi-icon violet">N</span>
            <span className={`admin2-kpi-note ${signupGrowth < 0 ? "negative" : "positive"}`}>
              {signupGrowth >= 0 ? "+" : ""}{signupGrowth}%
            </span>
          </div>
          <strong>{newTrainers30d}</strong>
          <span>Nuevos en 30 días</span>
          <small>{trialTrainers.length} se encuentran en trial</small>
        </article>
        <article className="admin2-kpi-card">
          <div className="admin2-kpi-top">
            <span className="admin2-kpi-icon cyan">C</span>
            <span className="admin2-kpi-note">de {clients.length}</span>
          </div>
          <strong>{activeClients}</strong>
          <span>Clientes activos</span>
          <small>{totalTrainers ? (activeClients / totalTrainers).toFixed(1) : "0"} por trainer registrado</small>
        </article>
        <article className="admin2-kpi-card">
          <div className="admin2-kpi-top">
            <span className="admin2-kpi-icon amber">%</span>
            <span className="admin2-kpi-note">{activeTrainers} convertidos</span>
          </div>
          <strong>{conversionRate}%</strong>
          <span>Conversión a pago</span>
          <div className="admin2-progress amber"><i style={{ width: `${Math.min(conversionRate, 100)}%` }} /></div>
        </article>
      </section>

      <section className="admin2-insights-grid">
        <article className="admin2-panel admin2-revenue-chart-panel">
          <div className="admin2-section-heading">
            <div>
              <span className="admin2-card-kicker">Performance</span>
              <h2>Evolución de ingresos</h2>
            </div>
            <div className="admin2-range" aria-label="Rango del gráfico">
              {([3, 6, 12] as DashboardRange[]).map((value) => (
                <button
                  key={value}
                  className={range === value ? "active" : ""}
                  onClick={() => setRange(value)}
                >
                  {value}m
                </button>
              ))}
            </div>
          </div>
          <div className="admin2-chart-legend">
            <span><i className="revenue" /> Cobros</span>
            <span><i className="commission" /> Comisión</span>
          </div>
          <div className="admin2-bars">
            {monthlyData.map((month) => (
              <div className="admin2-bar-column" key={month.key}>
                <div className="admin2-bar-value">
                  {month.revenue > 0 ? compactMoney(month.revenue) : ""}
                </div>
                <div className="admin2-bar-track">
                  <div
                    className="admin2-bar-fill revenue"
                    style={{ height: `${Math.max((month.revenue / maxRevenue) * 100, month.revenue ? 5 : 1)}%` }}
                  />
                  <div
                    className="admin2-bar-fill commission"
                    style={{ height: `${Math.max((month.commission / maxRevenue) * 100, month.commission ? 3 : 0)}%` }}
                  />
                </div>
                <span>{month.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="admin2-panel admin2-status-panel">
          <div className="admin2-section-heading">
            <div>
              <span className="admin2-card-kicker">Base de trainers</span>
              <h2>Estado actual</h2>
            </div>
            <Link href="/admin/usuarios" className="admin2-text-link">Ver todos →</Link>
          </div>
          <div className="admin2-donut-wrap">
            <div className="admin2-donut" style={{ background: statusChart }}>
              <div>
                <strong>{totalTrainers}</strong>
                <span>Total</span>
              </div>
            </div>
          </div>
          <div className="admin2-status-list">
            <div><span><i className="green" /> Activos</span><strong>{activeTrainers}</strong></div>
            <div><span><i className="violet" /> En trial</span><strong>{trialTrainers.length}</strong></div>
            <div><span><i className="amber" /> Expirados</span><strong>{expiredTrainers.length}</strong></div>
            <div><span><i className="neutral" /> Gimnasios</span><strong>{gyms.length}</strong></div>
          </div>
        </article>
      </section>

      <section className="admin2-bottom-grid">
        <article className="admin2-panel admin2-table-panel">
          <div className="admin2-section-heading">
            <div>
              <span className="admin2-card-kicker">Adquisición</span>
              <h2>Últimos registros</h2>
            </div>
            <Link href="/admin/usuarios" className="admin2-text-link">Gestionar usuarios →</Link>
          </div>
          <div className="admin2-table-scroll">
            <table className="admin2-table">
              <thead>
                <tr>
                  <th>Trainer</th>
                  <th>Estado</th>
                  <th>Clientes</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {recentTrainers.map((trainer) => {
                  const status = trainerStatus(trainer);
                  const trainerClients = clients.filter((client) => client.trainer_id === trainer.id).length;
                  return (
                    <tr key={trainer.id}>
                      <td>
                        <div className="admin2-person">
                          <span className="admin2-avatar">{initials(trainer.full_name)}</span>
                          <span>
                            <strong>{trainer.full_name || "Sin nombre"}</strong>
                            <small>{trainer.email || "Sin email"}</small>
                          </span>
                        </div>
                      </td>
                      <td><span className={`admin2-status ${status.className}`}>{status.label}</span></td>
                      <td>{trainerClients}</td>
                      <td>
                        {trainer.created_at
                          ? new Date(trainer.created_at).toLocaleDateString("es-UY", {
                              day: "2-digit",
                              month: "short",
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="admin2-panel admin2-activity-panel">
          <div className="admin2-section-heading">
            <div>
              <span className="admin2-card-kicker">Caja</span>
              <h2>Pagos recientes</h2>
            </div>
            <Link href="/admin/pagos" className="admin2-text-link">Ver pagos →</Link>
          </div>
          <div className="admin2-payment-list">
            {recentPayments.length > 0 ? recentPayments.map((payment) => (
              <div className="admin2-payment-row" key={payment.id}>
                <span className="admin2-payment-icon">$</span>
                <span className="admin2-payment-copy">
                  <strong>{payment.trainer_name || "Pago procesado"}</strong>
                  <small>
                    {payment.client_name || payment.period || "TrainerFlow"}
                    {payment.created_at
                      ? ` · ${new Date(payment.created_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short" })}`
                      : ""}
                  </small>
                </span>
                <span className="admin2-payment-amount">{formatUyi(Number(payment.amount || 0))}</span>
              </div>
            )) : (
              <div className="admin2-empty">
                <span>$</span>
                <strong>Todavía no hay pagos</strong>
                <small>Los cobros procesados aparecerán acá.</small>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
