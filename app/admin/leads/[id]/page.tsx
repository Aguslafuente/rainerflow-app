"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminRequest } from "@/lib/admin-client";

const PIPELINE_STATUSES = [
  { key: "nuevo", label: "Nuevo" },
  { key: "contactado", label: "Contactado" },
  { key: "demo_agendada", label: "Demo agendada" },
  { key: "demo_realizada", label: "Demo realizada" },
  { key: "prueba_gratuita", label: "Prueba gratuita" },
  { key: "negociacion", label: "Negociación" },
  { key: "cliente", label: "Cliente" },
  { key: "embajador", label: "Embajador" },
  { key: "perdido", label: "Perdido" },
];

const NOTE_TYPES = [
  { key: "nota", label: "Nota", icon: "📝" },
  { key: "llamada", label: "Llamada", icon: "📞" },
  { key: "email", label: "Email", icon: "📧" },
  { key: "demo", label: "Demo", icon: "🖥️" },
  { key: "seguimiento", label: "Seguimiento", icon: "🔄" },
  { key: "otro", label: "Otro", icon: "📌" },
];

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState({ type: "nota", body: "" });
  const [newTask, setNewTask] = useState("");
  const [followup, setFollowup] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const result = await adminRequest<{
        lead: any;
        notes: any[];
        tasks: any[];
      }>("lead_detail", { id: leadId });
      setLead(result.lead);
      setNotes(result.notes);
      setTasks(result.tasks);
      setFollowup(
        result.lead?.next_followup_at
          ? result.lead.next_followup_at.slice(0, 10)
          : ""
      );
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function addNote() {
    if (!newNote.body.trim()) return;
    setSaving(true);
    await adminRequest("lead_add_note", { leadId, note: newNote });
    setNewNote({ type: "nota", body: "" });
    setSaving(false);
    await loadAll();
  }

  async function addTask() {
    if (!newTask.trim()) return;
    await adminRequest("lead_add_task", { leadId, title: newTask });
    setNewTask("");
    await loadAll();
  }

  async function toggleTask(taskId: string, completed: boolean) {
    await adminRequest("lead_task_status", { id: taskId, completed });
    await loadAll();
  }

  async function changeStatus(status: string) {
    await adminRequest("lead_status", { id: leadId, status });
    setLead({ ...lead, status });
  }

  async function saveFollowup() {
    await adminRequest("lead_followup", { id: leadId, nextFollowup: followup });
  }

  async function deleteLead() {
    if (!confirm("Eliminar este lead?")) return;
    await adminRequest("lead_delete", { id: leadId });
    router.push("/admin/leads");
  }

  if (loading) return <div className="admin-page-head"><p style={{ color: "var(--gray)" }}>Cargando...</p></div>;
  if (!lead) return <div className="admin-page-head"><p style={{ color: "var(--red)" }}>Lead no encontrado</p></div>;

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => router.push("/admin/leads")} style={{ background: "none", border: "none", color: "var(--violet2)", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
          ← Volver a leads
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        {/* Left column */}
        <div>
          <div className="admin-page-head" style={{ marginBottom: 20 }}>
            <h1>{lead.first_name} {lead.last_name}</h1>
            <p className="sub">{lead.email || "Sin email"} {lead.phone ? `· ${lead.phone}` : ""}</p>
          </div>

          {/* Status pipeline */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
            {PIPELINE_STATUSES.map((s) => (
              <button
                key={s.key}
                onClick={() => changeStatus(s.key)}
                style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: "1px solid var(--line)", cursor: "pointer", fontFamily: "inherit",
                  background: lead.status === s.key ? "rgba(124,108,240,0.2)" : "var(--card)",
                  color: lead.status === s.key ? "var(--violet2)" : "var(--gray)",
                  borderColor: lead.status === s.key ? "var(--violet)" : "var(--line)",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Add note */}
          <div className="panel" style={{ marginBottom: 20 }}>
            <div className="panel-head">Agregar actividad</div>
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                {NOTE_TYPES.map((nt) => (
                  <button
                    key={nt.key}
                    onClick={() => setNewNote({ ...newNote, type: nt.key })}
                    style={{
                      padding: "5px 12px", borderRadius: 8, fontSize: 12, border: "1px solid var(--line)",
                      cursor: "pointer", fontFamily: "inherit",
                      background: newNote.type === nt.key ? "rgba(124,108,240,0.15)" : "var(--card)",
                      color: newNote.type === nt.key ? "var(--violet2)" : "var(--gray)",
                    }}
                  >
                    {nt.icon} {nt.label}
                  </button>
                ))}
              </div>
              <textarea
                className="input"
                rows={3}
                placeholder="Escribir nota..."
                value={newNote.body}
                onChange={(e) => setNewNote({ ...newNote, body: e.target.value })}
                style={{ width: "100%", resize: "vertical", marginBottom: 10 }}
              />
              <button className="btn-primary" onClick={addNote} disabled={saving || !newNote.body.trim()}>
                Guardar nota
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="panel">
            <div className="panel-head">Historial ({notes.length})</div>
            <div style={{ padding: 16 }}>
              {notes.length === 0 ? (
                <p style={{ color: "var(--gray)", fontSize: 14 }}>Sin actividad registrada</p>
              ) : (
                <div className="admin-timeline">
                  {notes.map((n) => {
                    const noteType = NOTE_TYPES.find((t) => t.key === n.type);
                    return (
                      <div key={n.id} className="admin-timeline-item">
                        <div className={`admin-timeline-dot ${n.type}`} />
                        <div className="admin-timeline-content">
                          <div className="admin-timeline-title">
                            {noteType?.icon} {noteType?.label || n.type}
                          </div>
                          <p style={{ fontSize: 13.5, color: "var(--ink)", margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{n.body}</p>
                          <div className="admin-timeline-time">
                            {new Date(n.created_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          {/* Info card */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-head">Información</div>
            <div style={{ padding: 16, fontSize: 13 }}>
              {[
                { label: "Instagram", val: lead.instagram },
                { label: "WhatsApp", val: lead.whatsapp },
                { label: "Ciudad", val: lead.city },
                { label: "País", val: lead.country },
                { label: "Especialidad", val: lead.specialty },
                { label: "Alumnos", val: lead.student_count },
                { label: "Origen", val: lead.origin },
                { label: "Prioridad", val: lead.priority },
              ].map((f) => (
                <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--line-soft)" }}>
                  <span style={{ color: "var(--gray)" }}>{f.label}</span>
                  <span style={{ fontWeight: 500, color: "var(--ink)" }}>{f.val || "—"}</span>
                </div>
              ))}
              {lead.notes && (
                <div style={{ marginTop: 10 }}>
                  <span style={{ color: "var(--gray)", fontSize: 12 }}>Notas:</span>
                  <p style={{ fontSize: 13, color: "var(--ink)", marginTop: 4, whiteSpace: "pre-wrap" }}>{lead.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Followup */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-head">Próximo seguimiento</div>
            <div style={{ padding: 16 }}>
              <input
                type="date"
                className="input"
                value={followup}
                onChange={(e) => setFollowup(e.target.value)}
                onBlur={saveFollowup}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Tasks */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-head">Tareas</div>
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input className="input" placeholder="Nueva tarea..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} style={{ flex: 1 }} />
                <button className="btn-primary" onClick={addTask} style={{ padding: "8px 14px" }}>+</button>
              </div>
              {tasks.map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--line-soft)" }}>
                  <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id, !t.completed)} />
                  <span style={{ fontSize: 13, color: t.completed ? "var(--gray)" : "var(--ink)", textDecoration: t.completed ? "line-through" : "none", flex: 1 }}>{t.title}</span>
                  {t.due_date && <span style={{ fontSize: 11, color: "var(--gray)" }}>{new Date(t.due_date).toLocaleDateString("es-UY", { day: "2-digit", month: "short" })}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Delete */}
          <button onClick={deleteLead} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "var(--red)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Eliminar lead
          </button>
        </div>
      </div>
    </>
  );
}
