import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { ExerciseVideo } from "@/components/ExerciseVideo";
import { normalizeName } from "@/lib/normalize";
import {
  addRoutineExerciseAction,
  deleteRoutineExerciseAction,
  deleteRoutineAction,
  assignRoutineAction,
  unassignRoutineAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function RutinaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: routine } = await supabase
    .from("routines")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!routine) notFound();

  const [{ data: items }, { data: library }, { data: clients }, { data: assigns }] =
    await Promise.all([
      supabase
        .from("routine_exercises")
        .select("*")
        .eq("routine_id", params.id)
        .order("position"),
      supabase.from("exercises").select("name, video_url").order("name"),
      supabase.from("clients").select("id, full_name").order("full_name"),
      supabase
        .from("client_routines")
        .select("id, client_id, clients(full_name)")
        .eq("routine_id", params.id),
    ]);

  const exercises = items ?? [];
  const lib = library ?? [];
  const videoMap = new Map<string, string>();
  for (const e of lib as any[]) {
    if (e.video_url) videoMap.set(normalizeName(e.name), e.video_url);
  }
  const clientList = clients ?? [];
  const assignments = (assigns ?? []) as any[];

  const addExercise = addRoutineExerciseAction.bind(null, params.id);
  const assign = assignRoutineAction.bind(null, params.id);

  return (
    <>
      <Link href="/rutinas" className="back-link">
        ← Volver a rutinas
      </Link>

      <div className="page-head">
        <div>
          <h1>{routine.name}</h1>
          {routine.description && (
            <div className="sub">{routine.description}</div>
          )}
        </div>
        <ConfirmSubmit
          action={deleteRoutineAction.bind(null, params.id)}
          confirmText="¿Eliminar esta rutina? Se quita de todos los clientes."
          className="btn btn-danger btn-sm"
        >
          Eliminar rutina
        </ConfirmSubmit>
      </div>

      <div className="detail-grid">
        {/* Exercises grouped by day */}
        <div className="panel">
          <div className="panel-head">Ejercicios ({exercises.length})</div>
          {exercises.length === 0 ? (
            <div className="empty" style={{ padding: "40px 20px" }}>
              Agregá el primer ejercicio con el formulario de la derecha.
            </div>
          ) : (
            (() => {
              const groups: { label: string; items: any[] }[] = [];
              for (const ex of exercises as any[]) {
                const label = ex.day_label || "General";
                let gr = groups.find((g) => g.label === label);
                if (!gr) {
                  gr = { label, items: [] };
                  groups.push(gr);
                }
                gr.items.push(ex);
              }
              return groups.map((gr) => (
                <div key={gr.label}>
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
                    {gr.label}
                  </div>
                  <table className="list">
                    <thead>
                      <tr>
                        <th>Ejercicio</th>
                        <th>Series × reps</th>
                        <th>RIR</th>
                        <th>Descanso</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {gr.items.map((ex: any) => (
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
                          <td style={{ textAlign: "right" }}>
                            <ConfirmSubmit
                              action={deleteRoutineExerciseAction.bind(
                                null,
                                ex.id,
                                params.id
                              )}
                              className="btn btn-danger btn-sm"
                            >
                              Quitar
                            </ConfirmSubmit>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ));
            })()
          )}
        </div>

        {/* Add exercise + assign */}
        <div>
          <div className="form-card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 17, marginBottom: 16 }}>Agregar ejercicio</h3>
            <form action={addExercise}>
              <input type="hidden" name="position" value={exercises.length} />
              <div className="field">
                <label>Día</label>
                <input
                  name="day_label"
                  list="day-list"
                  placeholder="Día 1 - Torso (empuje)"
                />
                <datalist id="day-list">
                  {Array.from(
                    new Set(
                      (exercises as any[])
                        .map((e) => e.day_label)
                        .filter(Boolean)
                    )
                  ).map((d, i) => (
                    <option key={i} value={d as string} />
                  ))}
                </datalist>
              </div>
              <div className="field">
                <label>Ejercicio *</label>
                <input
                  name="name"
                  list="ex-list"
                  placeholder="Sentadilla"
                  required
                />
                <datalist id="ex-list">
                  {lib.map((e: any, i: number) => (
                    <option key={i} value={e.name} />
                  ))}
                </datalist>
              </div>
              <div className="row3">
                <div className="field">
                  <label>Series</label>
                  <input name="sets" placeholder="4" />
                </div>
                <div className="field">
                  <label>Reps</label>
                  <input name="reps" placeholder="10-12" />
                </div>
                <div className="field">
                  <label>RIR</label>
                  <input name="rir" placeholder="2" />
                </div>
              </div>
              <div className="row2">
                <div className="field">
                  <label>Descanso</label>
                  <input name="rest" placeholder="90 s" />
                </div>
                <div className="field">
                  <label>Peso / carga</label>
                  <input name="weight" placeholder="20 kg / RIR 2" />
                </div>
              </div>
              <div className="field">
                <label>Notas</label>
                <input name="notes" placeholder="Tempo, técnica…" />
              </div>
              <button className="btn btn-primary">Agregar</button>
            </form>
          </div>

          <div className="form-card">
            <h3 style={{ fontSize: 17, marginBottom: 4 }}>Asignar a cliente</h3>
            <p style={{ fontSize: 13, color: "var(--gray)", marginBottom: 14 }}>
              {assignments.length} cliente(s) con esta rutina.
            </p>

            {clientList.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--gray)" }}>
                Primero cargá clientes en la sección Clientes.
              </p>
            ) : (
              <form
                action={assign}
                style={{ display: "flex", gap: 10, marginBottom: 14 }}
              >
                <select name="client_id" required style={{ flex: 1 }}>
                  <option value="">Elegí un cliente…</option>
                  {clientList.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
                <button className="btn btn-primary" style={{ width: "auto" }}>
                  Asignar
                </button>
              </form>
            )}

            {assignments.map((a) => (
              <div key={a.id} className="info-row">
                <span className="val" style={{ textAlign: "left" }}>
                  {a.clients?.full_name ?? "Cliente"}
                </span>
                <ConfirmSubmit
                  action={unassignRoutineAction.bind(null, a.id, {
                    routineId: params.id,
                  })}
                  className="link"
                >
                  Quitar
                </ConfirmSubmit>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
