import { HelpButton } from "@/components/HelpButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientTabs } from "@/components/ClientTabs";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import {
  toggleHabitAction,
  addCheckinAction,
  deleteCheckinAction,
} from "./actions";

export const dynamic = "force-dynamic";

const HABITS = [
  { field: "entrenamiento", label: "Entreno" },
  { field: "alimentacion", label: "Alim." },
  { field: "hidratacion", label: "Hidrat." },
  { field: "descanso", label: "Descanso" },
  { field: "mindset", label: "Mindset" },
] as const;

function dayLabel(iso: string, todayIso: string): string {
  if (iso === todayIso) return "Hoy";
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("es-UY", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    timeZone: "UTC",
  });
}

export default async function HabitosPage({
  params,
}: {
  params: { id: string };
}) {
  const clientId = params.id;
  const supabase = createClient();

  const { data: c } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("id", clientId)
    .single();
  if (!c) notFound();

  // Últimos 7 días (UTC)
  const base = new Date();
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(
      Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() - i)
    );
    days.push(d.toISOString().slice(0, 10));
  }
  const todayIso = days[0];

  const { data: logs } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("client_id", clientId)
    .gte("date", days[6]);
  const byDate = new Map<string, any>();
  for (const l of logs ?? []) byDate.set(l.date, l);

  const { data: checkins } = await supabase
    .from("checkins")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: false })
    .limit(12);
  const checkinList = (checkins ?? []) as any[];

  const today = new Date().toISOString().slice(0, 10);
  const scores = [
    { name: "energia", label: "Energía" },
    { name: "motivacion", label: "Motivación" },
    { name: "estres", label: "Estrés" },
    { name: "sueno", label: "Sueño" },
  ];

  return (
    <>
      <Link href="/clientes" className="back-link">
        ← Volver a clientes
      </Link>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h1>{c.full_name}</h1><HelpButton page="habitos" /></div>
          <div className="sub">Hábitos y check-in semanal</div>
        </div>
      </div>
      <ClientTabs clientId={clientId} />

      {/* Grilla de hábitos */}
      <div className="panel" style={{ marginBottom: 22 }}>
        <div className="panel-head">Hábitos · últimos 7 días</div>
        <div className="habit-grid-wrap">
          <div
            className="habit-grid"
            style={{ gridTemplateColumns: `92px repeat(${HABITS.length}, 1fr)` }}
          >
            <div className="hg-corner" />
            {HABITS.map((h) => (
              <div className="hg-head" key={h.field}>
                {h.label}
              </div>
            ))}
            {days.map((iso) => {
              const row = byDate.get(iso) || {};
              return (
                <div key={iso} style={{ display: "contents" }}>
                  <div className="hg-day">{dayLabel(iso, todayIso)}</div>
                  {HABITS.map((h) => {
                    const on = !!row[h.field];
                    return (
                      <div className="hg-cell" key={h.field}>
                        <ConfirmSubmit
                          action={toggleHabitAction.bind(
                            null,
                            clientId,
                            iso,
                            h.field,
                            !on
                          )}
                          className={`habit-btn ${on ? "on" : "off"}`}
                        >
                          {on ? "✓" : ""}
                        </ConfirmSubmit>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Check-in semanal */}
      <div className="detail-grid">
        <div className="panel">
          <div className="panel-head">Check-ins</div>
          {checkinList.length === 0 ? (
            <div className="empty" style={{ padding: "40px 20px" }}>
              Sin check-ins todavía.
            </div>
          ) : (
            <div style={{ padding: "6px 0" }}>
              {checkinList.map((ci) => (
                <div
                  key={ci.id}
                  style={{
                    padding: "14px 20px",
                    borderTop: "1px solid var(--line-soft)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <strong style={{ fontSize: 14 }}>
                      {new Date(ci.date + "T00:00:00Z").toLocaleDateString(
                        "es-UY",
                        { timeZone: "UTC" }
                      )}
                    </strong>
                    <ConfirmSubmit
                      action={deleteCheckinAction.bind(null, ci.id, clientId)}
                      confirmText="¿Eliminar este check-in?"
                      className="btn btn-danger btn-sm"
                    >
                      ✕
                    </ConfirmSubmit>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    {scores.map((s) =>
                      ci[s.name] != null ? (
                        <span key={s.name} className="score-chip">
                          {s.label}: <b>{ci[s.name]}</b>/10
                        </span>
                      ) : null
                    )}
                  </div>
                  {ci.logro && (
                    <div style={{ fontSize: 13, marginBottom: 3 }}>
                      <span style={{ color: "var(--gray)" }}>Logro: </span>
                      {ci.logro}
                    </div>
                  )}
                  {ci.dificultad && (
                    <div style={{ fontSize: 13, marginBottom: 3 }}>
                      <span style={{ color: "var(--gray)" }}>Dificultad: </span>
                      {ci.dificultad}
                    </div>
                  )}
                  {ci.foco && (
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: "var(--gray)" }}>Foco: </span>
                      {ci.foco}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="form-card">
            <h3 style={{ fontSize: 16, marginBottom: 14 }}>Nuevo check-in</h3>
            <form action={addCheckinAction.bind(null, clientId)}>
              <div className="field">
                <label>Fecha</label>
                <input type="date" name="date" defaultValue={today} />
              </div>
              <div className="row2">
                {scores.map((s) => (
                  <div className="field" key={s.name}>
                    <label>{s.label} (1-10)</label>
                    <input
                      name={s.name}
                      inputMode="numeric"
                      placeholder="7"
                    />
                  </div>
                ))}
              </div>
              <div className="field">
                <label>Logro de la semana</label>
                <input name="logro" placeholder="Opcional" />
              </div>
              <div className="field">
                <label>Dificultad / obstáculo</label>
                <input name="dificultad" placeholder="Opcional" />
              </div>
              <div className="field">
                <label>Foco próxima semana</label>
                <input name="foco" placeholder="Opcional" />
              </div>
              <button className="btn btn-primary">Guardar check-in</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
