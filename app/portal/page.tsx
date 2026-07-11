import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtMoney, fmtTime, fmtDayLabel, currentPeriod, periodLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

const HABITS = [
  { field: "entrenamiento", emoji: "🏋️", label: "Entreno" },
  { field: "alimentacion", emoji: "🥗", label: "Alim." },
  { field: "hidratacion", emoji: "💧", label: "Hidrat." },
  { field: "descanso", emoji: "😴", label: "Descanso" },
  { field: "mindset", emoji: "🧠", label: "Mindset" },
] as const;

export default async function PortalHome() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name, trainer_id, monthly_fee, currency, goal")
    .eq("user_id", user!.id)
    .single();

  const { data: trainer } = await supabase
    .from("profiles")
    .select("full_name, business_name")
    .eq("id", client!.trainer_id)
    .maybeSingle();

  const trainerName =
    trainer?.business_name || trainer?.full_name || "tu entrenador";
  const firstName = client!.full_name?.split(" ")[0] ?? "";

  /* ---------- cuota ---------- */
  const period = currentPeriod();
  const fee = Number(client!.monthly_fee) || 0;
  let paidThisMonth = false;
  if (fee > 0) {
    const { data: pays } = await supabase
      .from("payments")
      .select("id")
      .eq("client_id", client!.id)
      .eq("period", period)
      .limit(1);
    paidThisMonth = (pays ?? []).length > 0;
  }

  /* ---------- próxima sesión ---------- */
  const now = new Date();
  const startToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString();
  const { data: upcomingRaw } = await supabase
    .from("appointments")
    .select("id, starts_at, title, status")
    .eq("client_id", client!.id)
    .gte("starts_at", startToday)
    .neq("status", "cancelado")
    .order("starts_at", { ascending: true })
    .limit(1);
  const nextSession = (upcomingRaw ?? [])[0] as any | undefined;

  /* ---------- tiene rutina / nutrición ---------- */
  const { count: routineCount } = await supabase
    .from("client_routines")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client!.id);

  const { data: nutPlan } = await supabase
    .from("nutrition_plans")
    .select("id")
    .eq("client_id", client!.id)
    .maybeSingle();

  /* ---------- hábitos últimos 7 días ---------- */
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i)
    );
    days.push(d.toISOString().slice(0, 10));
  }
  const { data: habitLogs } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("client_id", client!.id)
    .gte("date", days[6]);
  const logs = habitLogs ?? [];
  // count per habit
  const habitCounts: Record<string, number> = {};
  for (const h of HABITS) {
    habitCounts[h.field] = logs.filter((l: any) => l[h.field]).length;
  }

  /* ---------- último peso ---------- */
  const { data: lastMeasure } = await supabase
    .from("measurements")
    .select("weight, date")
    .eq("client_id", client!.id)
    .not("weight", "is", null)
    .order("date", { ascending: false })
    .limit(1);
  const lastWeight = (lastMeasure ?? [])[0] as any | undefined;

  /* ---------- mensajes sin leer (simplificado: últimos del trainer) ---------- */
  const { count: unreadCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client!.id)
    .eq("sender_role", "trainer")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const hasRoutine = (routineCount ?? 0) > 0;
  const hasNutrition = !!nutPlan;

  return (
    <>
      {/* ---------- Saludo ---------- */}
      <div className="page-head">
        <div>
          <h1>¡Hola, {firstName}!</h1>
          <div className="sub">Tu espacio con {trainerName}</div>
        </div>
      </div>

      {/* ---------- Cuota ---------- */}
      {fee > 0 && (
        <div className="panel portal-fee-card">
          <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--gray)" }}>
                Cuota de {periodLabel(period)}
              </div>
              <div style={{ fontSize: 22, fontWeight: 640 }}>
                {fmtMoney(fee, client!.currency || "UYU")}
              </div>
            </div>
            {paidThisMonth ? (
              <span className="badge activo">Al día ✓</span>
            ) : (
              <a className="mp-btn" href="/api/mp/checkout">
                Pagar con MercadoPago
              </a>
            )}
          </div>
        </div>
      )}

      {/* ---------- Próxima sesión ---------- */}
      {nextSession && (
        <div className="panel portal-next-session">
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div className="portal-session-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "var(--gray)" }}>Próxima sesión</div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {fmtDayLabel(nextSession.starts_at)} · {fmtTime(nextSession.starts_at)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Accesos rápidos ---------- */}
      <div className="portal-shortcuts">
        <Link href="/portal/rutina" className="portal-shortcut">
          <div className="portal-shortcut-icon violet">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 6.5v11M17.5 6.5v11M6.5 12h11M3.5 9v6M20.5 9v6" />
            </svg>
          </div>
          <span className="portal-shortcut-label">Rutina</span>
          {hasRoutine ? (
            <span className="portal-shortcut-hint">Ver mi plan</span>
          ) : (
            <span className="portal-shortcut-hint muted">Sin asignar</span>
          )}
        </Link>
        <Link href="/portal/nutricion" className="portal-shortcut">
          <div className="portal-shortcut-icon green">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
            </svg>
          </div>
          <span className="portal-shortcut-label">Nutrición</span>
          {hasNutrition ? (
            <span className="portal-shortcut-hint">Ver mi plan</span>
          ) : (
            <span className="portal-shortcut-hint muted">Sin asignar</span>
          )}
        </Link>
        <Link href="/portal/progreso" className="portal-shortcut">
          <div className="portal-shortcut-icon cyan">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span className="portal-shortcut-label">Progreso</span>
          {lastWeight ? (
            <span className="portal-shortcut-hint">{lastWeight.weight} kg</span>
          ) : (
            <span className="portal-shortcut-hint muted">Sin registros</span>
          )}
        </Link>
        <Link href="/portal/chat" className="portal-shortcut">
          <div className={`portal-shortcut-icon amber${(unreadCount ?? 0) > 0 ? " has-badge" : ""}`}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="portal-shortcut-label">Chat</span>
          {(unreadCount ?? 0) > 0 ? (
            <span className="portal-shortcut-hint" style={{ color: "var(--violet)" }}>
              {unreadCount} nuevo{(unreadCount ?? 0) > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="portal-shortcut-hint">Mensajes</span>
          )}
        </Link>
      </div>

      {/* ---------- Resumen hábitos semana ---------- */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          Hábitos de la semana
          <Link href="/portal/habitos" className="link" style={{ fontSize: 13 }}>
            Ver todo
          </Link>
        </div>
        <div className="portal-habit-summary">
          {HABITS.map((h) => (
            <div className="portal-habit-item" key={h.field}>
              <span className="portal-habit-emoji">{h.emoji}</span>
              <span className="portal-habit-bar-wrap">
                <span
                  className="portal-habit-bar"
                  style={{ width: `${Math.round((habitCounts[h.field] / 7) * 100)}%` }}
                />
              </span>
              <span className="portal-habit-count">{habitCounts[h.field]}/7</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Objetivo ---------- */}
      {client!.goal && (
        <div className="panel">
          <div style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 13, color: "var(--gray)", marginBottom: 4 }}>Mi objetivo</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{client!.goal}</div>
          </div>
        </div>
      )}
    </>
  );
}
