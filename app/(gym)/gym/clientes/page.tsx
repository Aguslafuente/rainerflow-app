import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GymClientsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: gym } = await supabase
    .from("gyms")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!gym) return null;

  const { data: gymTrainers } = await supabase
    .from("gym_trainers")
    .select("trainer_id, email, profiles:trainer_id(full_name)")
    .eq("gym_id", gym.id)
    .eq("status", "active");

  const trainerIds = [user.id, ...(gymTrainers?.map((t) => t.trainer_id).filter(Boolean) || [])];

  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, email, phone, is_active, trainer_id, created_at, avatar_url")
    .in("trainer_id", trainerIds)
    .order("created_at", { ascending: false });

  const trainerMap: Record<string, string> = { [user.id]: "Yo (dueño)" };
  gymTrainers?.forEach((t) => {
    if (t.trainer_id) {
      trainerMap[t.trainer_id] = (t.profiles as any)?.full_name || t.email;
    }
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Clientes</h1>
          <p className="sub">Todos los clientes de tu gimnasio</p>
        </div>
      </div>

      {!clients || clients.length === 0 ? (
        <div className="panel">
          <div className="empty">
            <div className="empty-ico">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="big">Sin clientes</div>
            Los entrenadores pueden cargar clientes desde su panel.
          </div>
        </div>
      ) : (
        <div className="panel">
          <table className="list">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Email</th>
                <th>Entrenador</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 600, color: "var(--violet2)",
                        background: c.avatar_url ? `url(${c.avatar_url}) center/cover no-repeat` : "var(--violet-bg)",
                        border: "1px solid rgba(124,108,240,0.15)",
                      }}>
                        {!c.avatar_url && (c.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?")}
                      </div>
                      <span style={{ color: "var(--ink)", fontWeight: 500 }}>{c.full_name}</span>
                    </div>
                  </td>
                  <td>{c.email || "—"}</td>
                  <td>{trainerMap[c.trainer_id] || "—"}</td>
                  <td>
                    <span className={`badge ${c.is_active ? "activo" : "baja"}`}>
                      {c.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
