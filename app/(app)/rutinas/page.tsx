import { HelpButton } from "@/components/HelpButton";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RutinasPage() {
  const supabase = createClient();
  const { data: routines } = await supabase
    .from("routines")
    .select(
      "id, name, description, routine_exercises(count), client_routines(count)"
    )
    .order("created_at", { ascending: false });

  const all = routines ?? [];

  const countOf = (arr: { count: number }[] | null | undefined) =>
    arr && arr.length ? arr[0].count : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h1>Rutinas</h1><HelpButton page="rutinas" /></div>
          <div className="sub">
            {all.length} {all.length === 1 ? "rutina" : "rutinas"} creadas.
          </div>
        </div>
        <Link
          href="/rutinas/nuevo"
          className="btn btn-primary btn-sm"
          style={{ width: "auto" }}
        >
          + Nueva rutina
        </Link>
      </div>

      <div className="panel">
        {all.length === 0 ? (
          <div className="empty">
            <div className="big">Todavía no tenés rutinas</div>
            Creá tu primera rutina y asignala a tus clientes.
            <div style={{ marginTop: 16 }}>
              <Link
                href="/rutinas/nuevo"
                className="btn btn-primary btn-sm"
                style={{ width: "auto", display: "inline-flex" }}
              >
                + Crear rutina
              </Link>
            </div>
          </div>
        ) : (
          <table className="list">
            <thead>
              <tr>
                <th>Rutina</th>
                <th>Ejercicios</th>
                <th>Asignada a</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {all.map((r: any) => (
                <tr key={r.id} className="row">
                  <td>
                    <Link
                      href={`/rutinas/${r.id}`}
                      style={{ fontWeight: 500, display: "block" }}
                    >
                      {r.name}
                    </Link>
                    {r.description && (
                      <span style={{ color: "var(--gray)", fontSize: 13 }}>
                        {r.description}
                      </span>
                    )}
                  </td>
                  <td style={{ color: "var(--gray)" }}>
                    {countOf(r.routine_exercises)} ejercicios
                  </td>
                  <td style={{ color: "var(--gray)" }}>
                    {countOf(r.client_routines)} clientes
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link
                      href={`/rutinas/${r.id}`}
                      className="link"
                      style={{ fontSize: 13 }}
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
