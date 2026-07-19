import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GymDashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: gym } = await supabase
    .from("gyms")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!gym) return <p style={{ padding: 32, color: "var(--gray)" }}>No se encontró tu gimnasio.</p>;

  const { count: trainersCount } = await supabase
    .from("gym_trainers")
    .select("id", { count: "exact", head: true })
    .eq("gym_id", gym.id)
    .eq("status", "active");

  const { count: pendingCount } = await supabase
    .from("gym_trainers")
    .select("id", { count: "exact", head: true })
    .eq("gym_id", gym.id)
    .eq("status", "pending");

  const { data: trainerRows } = await supabase
    .from("gym_trainers")
    .select("trainer_id")
    .eq("gym_id", gym.id)
    .eq("status", "active");

  const allTrainerIds = [user.id, ...(trainerRows?.map((t) => t.trainer_id).filter(Boolean) || [])];

  const { count: clientsCount } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .in("trainer_id", allTrainerIds);

  const { count: activeClientsCount } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .in("trainer_id", allTrainerIds)
    .eq("is_active", true);

  // Recent clients (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentClients } = await supabase
    .from("clients")
    .select("id, full_name, trainer_id, created_at")
    .in("trainer_id", allTrainerIds)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(5);

  // Build trainer name map for recent activity
  const { data: trainerProfiles } = await supabase
    .from("gym_trainers")
    .select("trainer_id, email, profiles:trainer_id(full_name)")
    .eq("gym_id", gym.id)
    .eq("status", "active");

  const trainerMap: Record<string, string> = { [user.id]: "Yo (dueño)" };
  trainerProfiles?.forEach((t) => {
    if (t.trainer_id) {
      trainerMap[t.trainer_id] = (t.profiles as any)?.full_name || t.email;
    }
  });

  const hasTrainers = (trainersCount ?? 0) > 0;
  const hasClients = (clientsCount ?? 0) > 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="sub">{gym.name}</p>
        </div>
      </div>

      <div className="stats" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Link href="/gym/entrenadores" className="stat-card tone-violet stat-link">
          <div className="stat-label">Entrenadores</div>
          <div className="stat-value">{trainersCount ?? 0}</div>
          <div className="stat-hint">activos en tu gym</div>
        </Link>
        <div className="stat-card tone-cyan">
          <div className="stat-label">Invitaciones</div>
          <div className="stat-value">{pendingCount ?? 0}</div>
          <div className="stat-hint">pendientes</div>
        </div>
        <Link href="/gym/clientes" className="stat-card tone-green stat-link">
          <div className="stat-label">Clientes activos</div>
          <div className="stat-value">{activeClientsCount ?? 0}</div>
          <div className="stat-hint">de {clientsCount ?? 0} total</div>
        </Link>
        <div className="stat-card tone-amber">
          <div className="stat-label">Nuevos (7 días)</div>
          <div className="stat-value">{recentClients?.length ?? 0}</div>
          <div className="stat-hint">clientes recientes</div>
        </div>
      </div>

      {/* Recent activity */}
      {recentClients && recentClients.length > 0 && (
        <div className="panel" style={{ marginBottom: 24 }}>
          <div className="panel-head">
            <span>Actividad reciente</span>
          </div>
          <div style={{ padding: "4px 0" }}>
            {recentClients.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 22px",
                  borderBottom: "1px solid var(--line)",
                  fontSize: 14,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "var(--violet-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--violet2)",
                  }}
                >
                  {c.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: "var(--ink)", fontWeight: 500 }}>{c.full_name}</span>
                  <span style={{ color: "var(--gray)", margin: "0 6px" }}>·</span>
                  <span style={{ color: "var(--gray)" }}>{trainerMap[c.trainer_id] || "—"}</span>
                </div>
                <span style={{ color: "var(--gray)", fontSize: 12 }}>
                  {new Date(c.created_at).toLocaleDateString("es-UY", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onboarding checklist */}
      <div className="panel">
        <div className="panel-head">
          <span>Primeros pasos</span>
        </div>
        <div style={{ padding: "16px 22px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <StepItem done={hasTrainers} text="Invitá a tu primer entrenador" href="/gym/entrenadores" linkText="Ir a Entrenadores" />
            <StepItem done={hasClients} text="Tus entrenadores cargan sus clientes desde su panel" />
            <StepItem done={false} text="Personalizá tu gimnasio" href="/gym/configuracion" linkText="Ir a Configuración" />
            <StepItem done={false} text="Conectá MercadoPago para recibir pagos" href="/gym/configuracion" linkText="Conectar" />
          </div>
        </div>
      </div>
    </>
  );
}

function StepItem({ done, text, href, linkText }: { done: boolean; text: string; href?: string; linkText?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 28, height: 28, borderRadius: 8,
          background: done ? "var(--green-bg)" : "rgba(255,255,255,0.04)",
          border: done ? "1px solid rgba(52,211,153,0.3)" : "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0,
        }}
      >
        {done ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gray-light)" }} />
        )}
      </div>
      <span style={{ fontSize: 14, color: done ? "var(--gray)" : "var(--ink)", fontWeight: 500, flex: 1 }}>{text}</span>
      {href && !done && (
        <Link href={href} className="link" style={{ fontSize: 13, flexShrink: 0 }}>{linkText} →</Link>
      )}
    </div>
  );
}
