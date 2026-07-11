import { HelpButton } from "@/components/HelpButton";
import { createClient } from "@/lib/supabase/server";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import {
  createAppointmentAction,
  setAppointmentStatusAction,
  deleteAppointmentAction,
} from "./actions";
import {
  fmtTime,
  fmtDayLabel,
  dayKey,
  waLink,
  APPT_STATUS,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const supabase = createClient();

  const now = new Date();
  const startToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString();

  const [{ data: clients }, { data: appts }] = await Promise.all([
    supabase.from("clients").select("id, full_name, phone").order("full_name"),
    supabase
      .from("appointments")
      .select("id, title, starts_at, duration_min, status, client_id, clients(full_name, phone)")
      .gte("starts_at", startToday)
      .order("starts_at", { ascending: true })
      .limit(80),
  ]);

  const clientList = clients ?? [];
  const list = (appts ?? []) as any[];

  // Agrupar por día
  const groups: { key: string; label: string; items: any[] }[] = [];
  for (const a of list) {
    const k = dayKey(a.starts_at);
    let g = groups.find((x) => x.key === k);
    if (!g) {
      g = { key: k, label: fmtDayLabel(a.starts_at), items: [] };
      groups.push(g);
    }
    g.items.push(a);
  }

  const nowDate = new Date().toISOString().slice(0, 16);

  return (
    <>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h1>Agenda</h1><HelpButton page="agenda" /></div>
          <div className="sub">
            {list.length} {list.length === 1 ? "sesión próxima" : "sesiones próximas"}.
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Lista de sesiones */}
        <div className="panel">
          <div className="panel-head">Próximas sesiones</div>
          {groups.length === 0 ? (
            <div className="empty" style={{ padding: "40px 20px" }}>
              <div className="big">No tenés sesiones agendadas</div>
              Creá tu primera sesión con el formulario de la derecha.
            </div>
          ) : (
            <div style={{ padding: "6px 0" }}>
              {groups.map((g) => (
                <div key={g.key}>
                  <div
                    style={{
                      padding: "12px 20px 6px",
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--violet)",
                    }}
                  >
                    {g.label}
                  </div>
                  {g.items.map((a) => {
                    const name = a.clients?.full_name ?? a.title ?? "Sesión";
                    const phone = a.clients?.phone as string | undefined;
                    const reminder =
                      phone &&
                      waLink(
                        phone,
                        `Hola ${(a.clients?.full_name ?? "").split(" ")[0]}! Te recuerdo tu sesión el ${fmtDayLabel(
                          a.starts_at
                        )} a las ${fmtTime(a.starts_at)}. ¡Nos vemos! 💪`
                      );
                    const done = a.status !== "programado";
                    return (
                      <div
                        key={a.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 20px",
                          borderTop: "1px solid var(--light)",
                          opacity: a.status === "cancelado" ? 0.55 : 1,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 15,
                            width: 52,
                            flexShrink: 0,
                          }}
                        >
                          {fmtTime(a.starts_at)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500 }}>{name}</div>
                          <div style={{ fontSize: 12, color: "var(--gray)" }}>
                            {a.title && a.clients?.full_name ? a.title + " · " : ""}
                            {a.duration_min} min
                            {a.status !== "programado"
                              ? " · " + APPT_STATUS[a.status]
                              : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          {reminder && (
                            <a
                              href={reminder}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-ghost btn-sm"
                              title="Recordatorio por WhatsApp"
                            >
                              WhatsApp
                            </a>
                          )}
                          {!done && (
                            <ConfirmSubmit
                              action={setAppointmentStatusAction.bind(
                                null,
                                a.id,
                                "completado",
                                a.client_id
                              )}
                              className="btn btn-ghost btn-sm"
                            >
                              ✓ Hecho
                            </ConfirmSubmit>
                          )}
                          <ConfirmSubmit
                            action={deleteAppointmentAction.bind(
                              null,
                              a.id,
                              a.client_id
                            )}
                            confirmText="¿Eliminar esta sesión?"
                            className="btn btn-danger btn-sm"
                          >
                            ✕
                          </ConfirmSubmit>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nueva sesión */}
        <div>
          <div className="form-card">
            <h3 style={{ fontSize: 17, marginBottom: 16 }}>Nueva sesión</h3>
            <form action={createAppointmentAction}>
              <div className="field">
                <label>Cliente</label>
                <select name="client_id" defaultValue="">
                  <option value="">Sin cliente / general</option>
                  {clientList.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Título (opcional)</label>
                <input name="title" placeholder="Entrenamiento personal" />
              </div>
              <div className="row2">
                <div className="field">
                  <label>Fecha y hora *</label>
                  <input
                    type="datetime-local"
                    name="starts_at"
                    defaultValue={nowDate}
                    required
                  />
                </div>
                <div className="field">
                  <label>Duración (min)</label>
                  <input
                    name="duration_min"
                    inputMode="numeric"
                    defaultValue="60"
                  />
                </div>
              </div>
              <div className="field">
                <label>Notas</label>
                <input name="notes" placeholder="Opcional" />
              </div>
              <button className="btn btn-primary">Agendar sesión</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
