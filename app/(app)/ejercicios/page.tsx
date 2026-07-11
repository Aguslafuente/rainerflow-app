import { HelpButton } from "@/components/HelpButton";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { ExerciseVideo } from "@/components/ExerciseVideo";
import { createExerciseAction, deleteExerciseAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function EjerciciosPage() {
  const supabase = createClient();
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, notes, video_url")
    .order("name");

  const all = exercises ?? [];
  const conVideo = all.filter((e: any) => e.video_url).length;

  return (
    <>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h1>Biblioteca de ejercicios</h1><HelpButton page="ejercicios" /></div>
          <div className="sub">
            Tu catálogo de ejercicios. {conVideo} con video.
          </div>
        </div>
        <Link
          href="/ejercicios/subir-videos"
          className="btn btn-primary btn-sm"
          style={{ width: "auto" }}
        >
          Subir videos
        </Link>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <div className="panel-head">
            Ejercicios ({all.length})
          </div>
          {all.length === 0 ? (
            <div className="empty">
              <div className="big">Todavía no cargaste ejercicios</div>
              Agregá tus ejercicios habituales acá al lado.
            </div>
          ) : (
            <table className="list">
              <thead>
                <tr>
                  <th>Ejercicio</th>
                  <th>Grupo muscular</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {all.map((e: any) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 500 }}>
                      <span
                        style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
                      >
                        {e.name}
                        {e.video_url && (
                          <ExerciseVideo url={e.video_url} label={e.name} small />
                        )}
                      </span>
                    </td>
                    <td style={{ color: "var(--gray)" }}>
                      {e.muscle_group || "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <ConfirmSubmit
                        action={deleteExerciseAction.bind(null, e.id)}
                        confirmText="¿Eliminar este ejercicio?"
                        className="btn btn-danger btn-sm"
                      >
                        Eliminar
                      </ConfirmSubmit>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <div className="form-card">
            <h3 style={{ fontSize: 17, marginBottom: 16 }}>Nuevo ejercicio</h3>
            <form action={createExerciseAction}>
              <div className="field">
                <label>Nombre *</label>
                <input name="name" placeholder="Sentadilla" autoFocus required />
              </div>
              <div className="field">
                <label>Grupo muscular</label>
                <input name="muscle_group" placeholder="Piernas" />
              </div>
              <div className="field">
                <label>Notas</label>
                <textarea name="notes" placeholder="Técnica, tips…" />
              </div>
              <button className="btn btn-primary">Agregar ejercicio</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
