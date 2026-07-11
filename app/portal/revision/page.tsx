import { createClient } from "@/lib/supabase/server";
import { REVIEW_QUESTIONS } from "@/lib/reviewFields";
import { periodLabel } from "@/lib/format";
import { portalAddReview } from "../actions";

export const dynamic = "force-dynamic";

export default async function PortalRevision() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("client_id", client!.id)
    .order("created_at", { ascending: false });
  const list = (reviews ?? []) as any[];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Revisión mensual</h1>
          <div className="sub">
            Al cierre de cada mes, contame cómo venís. Ayuda a ajustar tu plan.
          </div>
        </div>
      </div>

      <div className="form-card" style={{ maxWidth: "100%", marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Nueva revisión</h3>
        <form action={portalAddReview}>
          {REVIEW_QUESTIONS.map((q) => (
            <div className="field" key={q.name}>
              <label>{q.label}</label>
              <textarea name={q.name} placeholder="Tu respuesta…" />
            </div>
          ))}
          <button className="btn btn-primary">Enviar revisión</button>
        </form>
      </div>

      {list.length > 0 && (
        <div className="panel">
          <div className="panel-head">Mis revisiones anteriores</div>
          <div style={{ padding: "4px 20px 16px" }}>
            {list.map((r) => (
              <div key={r.id} style={{ paddingTop: 16 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "var(--violet)",
                    marginBottom: 6,
                  }}
                >
                  {periodLabel(r.period)}
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
        </div>
      )}
    </>
  );
}
