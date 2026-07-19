import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtMoney, fmtTime, fmtDayLabel, currentPeriod, periodLabel } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { HelpButton } from "@/components/HelpButton";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, business_name")
    .single();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, goal, status, monthly_fee, currency, created_at, avatar_url")
    .order("created_at", { ascending: false });

  const all = clients ?? [];
  const activos = all.filter((c) => c.status === "activo");
  const pausa = all.filter((c) => c.status === "pausa").length;

  /* ---------- Ingresos del mes ---------- */
  const period = currentPeriod();
  const prevDate = new Date();
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const { data: paymentsThisMonth } = await supabase
    .from("payments")
    .select("amount, currency, client_id")
    .eq("period", period);
  const payments = paymentsThisMonth ?? [];
  const ingresosMes = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

  const { data: paymentsPrevMonth } = await supabase
    .from("payments")
    .select("amount")
    .eq("period", prevPeriod);
  const ingresosPrev = (paymentsPrevMonth ?? []).reduce(
    (s, p) => s + Number(p.amount || 0),
    0
  );
  const variacion =
    ingresosPrev > 0
      ? Math.round(((ingresosMes - ingresosPrev) / ingresosPrev) * 100)
      : null;

  /* ---------- Cuotas pendientes ---------- */
  const paidClientIds = new Set(payments.map((p) => p.client_id));
  const pendientes = activos.filter(
    (c) => Number(c.monthly_fee || 0) > 0 && !paidClientIds.has(c.id)
  );
  const montoPendiente = pendientes.reduce(
    (s, c) => s + Number(c.monthly_fee || 0),
    0
  );

  /* ---------- Mensajes sin responder ---------- */
  // Mensajes del cliente sin respuesta del trainer en las últimas 48h
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: recentClientMsgs } = await supabase
    .from("messages")
    .select("client_id, created_at")
    .eq("sender_role", "client")
    .gte("created_at", twoDaysAgo)
    .order("created_at", { ascending: false });

  const { data: recentTrainerMsgs } = await supabase
    .from("messages")
    .select("client_id, created_at")
    .eq("sender_role", "trainer")
    .gte("created_at", twoDaysAgo);

  const trainerLastReply = new Map<string, string>();
  for (const m of recentTrainerMsgs ?? []) {
    const existing = trainerLastReply.get(m.client_id);
    if (!existing || m.created_at > existing) {
      trainerLastReply.set(m.client_id, m.created_at);
    }
  }
  const unansweredIds = new Set<string>();
  for (const m of recentClientMsgs ?? []) {
    const lastReply = trainerLastReply.get(m.client_id);
    if (!lastReply || lastReply < m.created_at) {
      unansweredIds.add(m.client_id);
    }
  }
  const unansweredClients = activos.filter((c) => unansweredIds.has(c.id));
  const mensajesSinResponder = unansweredClients.length;

  /* ---------- Adherencia: clientes que no entrenan (últimos 7 días) ---------- */
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysIso = sevenDaysAgo.toISOString().slice(0, 10);

  const { data: recentHabits } = await supabase
    .from("habit_logs")
    .select("client_id, entrenamiento")
    .gte("date", sevenDaysIso)
    .eq("entrenamiento", true);

  const trainedClients = new Set(
    (recentHabits ?? []).map((h) => h.client_id)
  );
  const lowAdherence = activos.filter((c) => !trainedClients.has(c.id));

  /* ---------- Revisiones pendientes (mes actual) ---------- */
  const { data: reviewsThisMonth } = await supabase
    .from("reviews")
    .select("client_id")
    .eq("period", period);
  const reviewedIds = new Set(
    (reviewsThisMonth ?? []).map((r) => r.client_id)
  );
  const revisionesPendientes = activos.filter(
    (c) => !reviewedIds.has(c.id)
  ).length;

  /* ---------- Próximas sesiones ---------- */
  const now = new Date();
  const startToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString();
  const { data: upcoming } = await supabase
    .from("appointments")
    .select("id, starts_at, title, status, client_id, clients(full_name)")
    .gte("starts_at", startToday)
    .neq("status", "cancelado")
    .order("starts_at", { ascending: true })
    .limit(5);
  const sessions = (upcoming ?? []) as any[];

  const { count: routinesCount } = await supabase
    .from("routines")
    .select("id", { count: "exact", head: true });

  const recientes = all.slice(0, 5);
  const hello =
    profile?.full_name?.split(" ")[0] ||
    profile?.business_name ||
    "Entrenador";

  // Determine primary currency from active clients
  const mainCurrency =
    activos.find((c) => c.currency)?.currency || "UYU";

  return (
    <>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h1>¡Hola, {hello}!</h1><HelpButton page="dashboard" /></div>
          <div className="sub">
            Salud de tu negocio · {periodLabel(period)}
          </div>
        </div>
        <Link
          href="/clientes/nuevo"
          className="btn btn-primary btn-sm"
          style={{ width: "auto" }}
        >
          + Nuevo cliente
        </Link>
      </div>

      {/* ---------- KPIs principales ---------- */}
      <div className="stats">
        <StatCard
          icon="wallet"
          tone="green"
          value={fmtMoney(ingresosMes, mainCurrency)}
          label="Cobrado este mes"
          hint={
            variacion != null
              ? `${variacion >= 0 ? "+" : ""}${variacion}% vs ${periodLabel(prevPeriod)}`
              : `vs ${periodLabel(prevPeriod)}: sin datos`
          }
          valueColor={undefined}
          href="/pagos"
        />
        <StatCard
          icon="users"
          tone="violet"
          value={activos.length}
          label="Clientes activos"
          hint={pausa > 0 ? `${pausa} en pausa` : "en tu cartera"}
          href="/clientes"
        />
        <StatCard
          icon="alert"
          tone="amber"
          value={pendientes.length}
          label="Cuotas pendientes"
          hint={
            montoPendiente > 0
              ? fmtMoney(montoPendiente, mainCurrency) + " por cobrar"
              : "todo al día"
          }
          valueColor={pendientes.length > 0 ? "var(--amber)" : undefined}
          href="/pagos"
        />
        <StatCard
          icon="receipt"
          tone="cyan"
          value={mensajesSinResponder}
          label="Mensajes sin responder"
          hint="últimas 48h"
          valueColor={mensajesSinResponder > 0 ? "var(--red)" : undefined}
          href="/clientes"
        />
      </div>

      {/* ---------- Alertas ---------- */}
      {(lowAdherence.length > 0 ||
        pendientes.length > 0 ||
        mensajesSinResponder > 0) && (
        <div className="panel dash-alerts">
          <div className="panel-head">
            Atención
            <span className="dash-alert-count">
              {pendientes.length + unansweredClients.length + lowAdherence.length}
            </span>
          </div>
          <div className="dash-alert-list">
            {/* Cuotas pendientes */}
            {pendientes.length > 0 && (
              <div className="dash-alert-group">
                <div className="dash-alert-header amber">
                  <span className="dash-alert-icon">💰</span>
                  <strong>{pendientes.length} cuota{pendientes.length > 1 ? "s" : ""} sin pagar</strong>
                </div>
                {pendientes.map((c) => (
                  <Link key={c.id} href={`/clientes/${c.id}`} className="dash-alert-sub">
                    {c.avatar_url ? (
                      <span className="avatar-sm" style={{ backgroundImage: `url(${c.avatar_url})`, backgroundSize: "cover", backgroundPosition: "center", fontSize: 0 }}>.</span>
                    ) : (
                      <span className="avatar-sm">{initials(c.full_name)}</span>
                    )}
                    <span className="dash-alert-sub-name">{c.full_name}</span>
                    <span className="dash-alert-sub-detail">
                      {fmtMoney(Number(c.monthly_fee || 0), c.currency || "UYU")}
                    </span>
                    <span className="dash-alert-arrow">›</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Mensajes sin responder */}
            {unansweredClients.length > 0 && (
              <div className="dash-alert-group">
                <div className="dash-alert-header blue">
                  <span className="dash-alert-icon">💬</span>
                  <strong>{unansweredClients.length} chat{unansweredClients.length > 1 ? "s" : ""} sin responder</strong>
                </div>
                {unansweredClients.map((c) => (
                  <Link key={c.id} href={`/clientes/${c.id}/chat`} className="dash-alert-sub">
                    {c.avatar_url ? (
                      <span className="avatar-sm" style={{ backgroundImage: `url(${c.avatar_url})`, backgroundSize: "cover", backgroundPosition: "center", fontSize: 0 }}>.</span>
                    ) : (
                      <span className="avatar-sm">{initials(c.full_name)}</span>
                    )}
                    <span className="dash-alert-sub-name">{c.full_name}</span>
                    <span className="dash-alert-sub-detail">Ir al chat</span>
                    <span className="dash-alert-arrow">›</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Baja adherencia */}
            {lowAdherence.length > 0 && (
              <div className="dash-alert-group">
                <div className="dash-alert-header red">
                  <span className="dash-alert-icon">🔥</span>
                  <strong>{lowAdherence.length} sin entrenar</strong>
                  <span style={{ fontWeight: 400, fontSize: 12, color: "var(--gray)" }}> · última semana</span>
                </div>
                {lowAdherence.map((c) => (
                  <Link key={c.id} href={`/clientes/${c.id}/habitos`} className="dash-alert-sub">
                    {c.avatar_url ? (
                      <span className="avatar-sm" style={{ backgroundImage: `url(${c.avatar_url})`, backgroundSize: "cover", backgroundPosition: "center", fontSize: 0 }}>.</span>
                    ) : (
                      <span className="avatar-sm">{initials(c.full_name)}</span>
                    )}
                    <span className="dash-alert-sub-name">{c.full_name}</span>
                    <span className="dash-alert-sub-detail">Ver hábitos</span>
                    <span className="dash-alert-arrow">›</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- Grilla inferior ---------- */}
      <div className="detail-grid">
        {/* Clientes recientes */}
        <div className="panel">
          <div className="panel-head">
            Clientes recientes
            <Link href="/clientes" className="link" style={{ fontSize: 13 }}>
              Ver todos
            </Link>
          </div>
          {recientes.length === 0 ? (
            <div className="empty">
              <div className="big">Todavía no tenés clientes</div>
              Empezá agregando tu primer cliente.
              <div style={{ marginTop: 16 }}>
                <Link
                  href="/clientes/nuevo"
                  className="btn btn-primary btn-sm"
                  style={{ width: "auto", display: "inline-flex" }}
                >
                  + Agregar cliente
                </Link>
              </div>
            </div>
          ) : (
            <table className="list clickable-rows">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Objetivo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recientes.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/clientes/${c.id}`} className="cell-name row-link">
                        {c.avatar_url ? (
                          <span className="avatar" style={{ backgroundImage: `url(${c.avatar_url})`, backgroundSize: "cover", backgroundPosition: "center", fontSize: 0 }}>.</span>
                        ) : (
                          <span className="avatar">{initials(c.full_name)}</span>
                        )}
                        {c.full_name}
                      </Link>
                    </td>
                    <td style={{ color: "var(--gray)" }}>{c.goal || "—"}</td>
                    <td>
                      <span className={`badge ${c.status}`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Próximas sesiones */}
        <div className="panel">
          <div className="panel-head">
            Próximas sesiones
            <Link href="/agenda" className="link" style={{ fontSize: 13 }}>
              Ver agenda
            </Link>
          </div>
          {sessions.length === 0 ? (
            <div className="empty" style={{ padding: "40px 20px" }}>
              No tenés sesiones agendadas.
            </div>
          ) : (
            <div style={{ padding: "6px 0" }}>
              {sessions.map((s) => (
                <Link
                  key={s.id}
                  href={s.client_id ? `/clientes/${s.client_id}` : "/agenda"}
                  className="dash-session-row"
                >
                  <div style={{ fontWeight: 700, width: 52, flexShrink: 0 }}>
                    {fmtTime(s.starts_at)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>
                      {s.clients?.full_name ?? s.title ?? "Sesión"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--gray)" }}>
                      {fmtDayLabel(s.starts_at)}
                    </div>
                  </div>
                  <span className="dash-alert-arrow">›</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Resumen rápido ---------- */}
      <div className="stats" style={{ marginTop: 24 }}>
        <StatCard
          icon="dumbbell"
          tone="violet"
          value={routinesCount ?? 0}
          label="Rutinas"
          hint="plantillas creadas"
          href="/rutinas"
        />
        <StatCard
          icon="check"
          tone="green"
          value={activos.length - revisionesPendientes}
          label="Revisiones completas"
          hint={
            revisionesPendientes > 0
              ? `${revisionesPendientes} pendiente${revisionesPendientes > 1 ? "s" : ""}`
              : "todas al día"
          }
          href="/clientes"
        />
        <StatCard
          icon="layers"
          tone="cyan"
          value={all.length}
          label="Total clientes"
          hint="histórico"
          href="/clientes"
        />
        <StatCard
          icon="users"
          tone="amber"
          value={lowAdherence.length}
          label="Baja adherencia"
          hint="sin entrenar 7 días"
          valueColor={lowAdherence.length > 0 ? "var(--amber)" : undefined}
          href="/clientes"
        />
      </div>
    </>
  );
}
