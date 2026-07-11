import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientTabs } from "@/components/ClientTabs";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { REVIEW_QUESTIONS } from "@/lib/reviewFields";
import { periodLabel } from "@/lib/format";
import { addReviewAction, deleteReviewAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function RevisionesPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: c } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("id", params.id)
    .single();
  if (!c) notFound();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("client_id", params.id)
    .order("created_at", { ascending: false });
  const list = (reviews ?? []) as any[];

  return (
    <>
      <Link href="/clientes" className="back-link">
        ← Volver a clientes
      </Link>
      <div className="page-head">
        <div>
          <h1>{c.full_name}</h1>
          <div className="sub">Revisiones mensuales</div>
        </div>
      </div>
      <ClientTabs clientId={params.id} />

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          Revisiones ({list.length})
        </div>
        {list.length === 0 ? (
          <div className="empty" style={{ padding: "40px 20px" }}>
            Todavía no hay revisiones. Tu cliente puede completarlas desde su
            portal, o podés cargar una vos abajo.
          </div>
        ) : (
          <div style={{ padding: "4px 20px 16px" }}>
            {list.map((r) => (
              <div
                key={r.id}
                style={{ paddingTop: 16, borderTop: "1px solid var(--line-soft)", marginTop: 12 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--violet)",
                    }}
                  >
                    {periodLabel(r.period)}
                  </span>
                  <ConfirmSubmit
                    action={deleteReviewAction.bind(null, r.id, params.id)}
                    confirmText="¿Eliminar esta revisión?"
                    className="btn btn-danger btn-sm"
                  >
                    Eliminar
                  </ConfirmSubmit>
                </div>
                {REVIEW_QUESTIONS.filter((q) => r[q.name]).map((q) => (
                  <div key={q.name} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 13, color: "var(--gray)" }}>
                      {q.label}
                    </div>
                    <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
                      {r[q.name]}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <details className="intake-section">
        <summary>Cargar una revisión</summary>
        <div className="intake-body">
          <form action={addReviewAction.bind(null, params.id)}>
            {REVIEW_QUESTIONS.map((q) => (
              <div className="field" key={q.name}>
                <label>{q.label}</label>
                <textarea name={q.name} placeholder="Respuesta…" />
              </div>
            ))}
            <button className="btn btn-primary" style={{ width: "auto", marginBottom: 12 }}>
              Guardar revisión
            </button>
          </form>
        </div>
      </details>
    </>
  );
}
