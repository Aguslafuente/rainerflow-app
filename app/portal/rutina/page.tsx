import { createClient } from "@/lib/supabase/server";
import { ExerciseVideo } from "@/components/ExerciseVideo";
import { normalizeName } from "@/lib/normalize";

export const dynamic = "force-dynamic";

export default async function PortalRutina() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const { data: assigns } = await supabase
    .from("client_routines")
    .select("routines(id, name, description, routine_exercises(*))")
    .eq("client_id", client!.id);

  const routines = (assigns ?? [])
    .map((a: any) => a.routines)
    .filter(Boolean);

  const { data: exLib } = await supabase
    .from("exercises")
    .select("name, video_url");
  const videoMap = new Map<string, string>();
  for (const e of (exLib ?? []) as any[]) {
    if (e.video_url) videoMap.set(normalizeName(e.name), e.video_url);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mi rutina</h1>
          <div className="sub">Tu plan de entrenamiento</div>
        </div>
      </div>

      {routines.length === 0 ? (
        <div className="panel">
          <div className="empty" style={{ padding: "48px 20px" }}>
            <div className="big">Todavía no tenés una rutina asignada</div>
            Tu entrenador te la va a asignar pronto.
          </div>
        </div>
      ) : (
        routines.map((r: any) => {
          const exs = (r.routine_exercises ?? []).sort(
            (a: any, b: any) => a.position - b.position
          );
          const groups: { label: string; items: any[] }[] = [];
          for (const ex of exs) {
            const label = ex.day_label || "General";
            let g = groups.find((x) => x.label === label);
            if (!g) {
              g = { label, items: [] };
              groups.push(g);
            }
            g.items.push(ex);
          }
          return (
            <div className="panel" style={{ marginBottom: 20 }} key={r.id}>
              <div className="panel-head">
                {r.name}
                {r.description && (
                  <span style={{ fontSize: 13, color: "var(--gray)", fontWeight: 400 }}>
                    {r.description}
                  </span>
                )}
              </div>
              {groups.map((g) => (
                <div key={g.label}>
                  <div
                    style={{
                      padding: "12px 20px 4px",
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--violet)",
                    }}
                  >
                    {g.label}
                  </div>
                  <table className="list">
                    <thead>
                      <tr>
                        <th>Ejercicio</th>
                        <th>Series × reps</th>
                        <th>RIR</th>
                        <th>Descanso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map((ex: any) => (
                        <tr key={ex.id}>
                          <td>
                            <div
                              style={{
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              {ex.name}
                              {videoMap.get(normalizeName(ex.name)) && (
                                <ExerciseVideo
                                  url={videoMap.get(normalizeName(ex.name))!}
                                  label={ex.name}
                                  small
                                />
                              )}
                            </div>
                            {(ex.weight || ex.notes) && (
                              <div style={{ color: "var(--gray)", fontSize: 12 }}>
                                {[ex.weight, ex.notes].filter(Boolean).join(" · ")}
                              </div>
                            )}
                          </td>
                          <td style={{ color: "var(--gray)" }}>
                            {(ex.sets || "—") + " × " + (ex.reps || "—")}
                          </td>
                          <td style={{ color: "var(--gray)" }}>{ex.rir || "—"}</td>
                          <td style={{ color: "var(--gray)" }}>{ex.rest || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          );
        })
      )}
    </>
  );
}
