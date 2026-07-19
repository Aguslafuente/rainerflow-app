"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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

const ORIGINS = ["instagram", "tiktok", "google", "referido", "evento", "otro"];

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "kanban">("kanban");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);
  const dragRef = useRef<{ id: string; status: string } | null>(null);

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    try {
      setLeads(await adminRequest<any[]>("leads_list"));
    } finally {
      setLoading(false);
    }
  }

  async function saveLead(lead: any) {
    await adminRequest("lead_save", { lead });
    setShowModal(false);
    setEditLead(null);
    await loadLeads();
  }

  async function updateStatus(id: string, status: string) {
    await adminRequest("lead_status", { id, status });
    await loadLeads();
  }

  function openNew() {
    setEditLead({ first_name: "", last_name: "", email: "", phone: "", instagram: "", whatsapp: "", city: "", country: "Uruguay", specialty: "", student_count: "", trainer_count: "", origin: "instagram", status: "nuevo", priority: "media", notes: "" });
    setShowModal(true);
  }

  function openEdit(lead: any) {
    setEditLead({ ...lead });
    setShowModal(true);
  }

  // Filter
  let filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const name = `${l.first_name || ""} ${l.last_name || ""}`.toLowerCase();
    if (q && !name.includes(q) && !(l.email || "").toLowerCase().includes(q)) return false;
    if (statusFilter !== "todos" && l.status !== statusFilter) return false;
    return true;
  });

  // Drag handlers
  function handleDragStart(id: string, status: string) { dragRef.current = { id, status }; }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); }
  function handleDrop(newStatus: string) {
    if (dragRef.current && dragRef.current.status !== newStatus) {
      updateStatus(dragRef.current.id, newStatus);
    }
    dragRef.current = null;
  }

  if (loading) return <div className="admin-page-head"><p style={{ color: "var(--gray)" }}>Cargando...</p></div>;

  // Pipeline KPIs
  const openLeads = leads.filter((l) => !["cliente", "perdido", "embajador"].includes(l.status)).length;
  const wonLeads = leads.filter((l) => l.status === "cliente").length;
  const lostLeads = leads.filter((l) => l.status === "perdido").length;

  return (
    <>
      <div className="admin-page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Leads CRM</h1>
          <p className="sub">{leads.length} leads en pipeline</p>
        </div>
        <button className="btn-primary" onClick={openNew} style={{ marginTop: 4 }}>+ Nuevo lead</button>
      </div>

      <div className="admin-kpis" style={{ marginBottom: 20 }}>
        <div className="admin-kpi">
          <div className="admin-kpi-val">{leads.length}</div>
          <div className="admin-kpi-label">Total leads</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val violet">{openLeads}</div>
          <div className="admin-kpi-label">En pipeline</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val green">{wonLeads}</div>
          <div className="admin-kpi-label">Convertidos</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val red">{lostLeads}</div>
          <div className="admin-kpi-label">Perdidos</div>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${view === "kanban" ? "active" : ""}`} onClick={() => setView("kanban")}>Pipeline</button>
        <button className={`admin-tab ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>Lista</button>
      </div>

      {view === "list" && (
        <>
          <div className="admin-filters">
            <input placeholder="Buscar lead..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="todos">Todos</option>
              {PIPELINE_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Origen</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Próx. seguimiento</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--gray)" }}>Sin leads</td></tr>
                ) : filtered.map((l) => (
                  <tr key={l.id} className="clickable" onClick={() => router.push(`/admin/leads/${l.id}`)}>
                    <td style={{ fontWeight: 600 }}>{l.first_name} {l.last_name}</td>
                    <td style={{ color: "var(--gray)", fontSize: 13 }}>{l.email || "—"}</td>
                    <td style={{ fontSize: 13 }}>{l.origin || "—"}</td>
                    <td>
                      <span className={`badge ${l.status === "cliente" ? "activo" : l.status === "perdido" ? "baja" : "trial"}`}>
                        {PIPELINE_STATUSES.find((s) => s.key === l.status)?.label || l.status}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                        background: l.priority === "alta" ? "rgba(239,68,68,0.15)" : l.priority === "media" ? "rgba(245,158,11,0.15)" : "rgba(107,114,128,0.15)",
                        color: l.priority === "alta" ? "var(--red)" : l.priority === "media" ? "var(--amber)" : "var(--gray)"
                      }}>
                        {l.priority || "—"}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--gray)" }}>
                      {l.next_followup_at ? new Date(l.next_followup_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === "kanban" && (
        <div className="admin-kanban">
          {PIPELINE_STATUSES.map((col) => {
            const colLeads = leads.filter((l) => l.status === col.key);
            return (
              <div
                key={col.key}
                className="admin-kanban-col"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.key)}
              >
                <div className="admin-kanban-col-head">
                  <span>{col.label}</span>
                  <span className="admin-kanban-col-count">{colLeads.length}</span>
                </div>
                <div className="admin-kanban-col-body">
                  {colLeads.map((l) => (
                    <div
                      key={l.id}
                      className="admin-kanban-card"
                      draggable
                      onDragStart={() => handleDragStart(l.id, l.status)}
                      onClick={() => router.push(`/admin/leads/${l.id}`)}
                    >
                      <div className="admin-kanban-card-name">{l.first_name} {l.last_name}</div>
                      <div className="admin-kanban-card-meta">
                        {l.origin && <span>{l.origin}</span>}
                        {l.city && <span> · {l.city}</span>}
                      </div>
                      {l.next_followup_at && (
                        <div className="admin-kanban-card-meta" style={{ marginTop: 4, color: new Date(l.next_followup_at) < new Date() ? "var(--red)" : "var(--gray)" }}>
                          Seguimiento: {new Date(l.next_followup_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short" })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal crear/editar lead */}
      {showModal && editLead && (
        <div className="admin-modal-overlay" onClick={() => { setShowModal(false); setEditLead(null); }}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h3>{editLead.id ? "Editar lead" : "Nuevo lead"}</h3>
              <button className="admin-modal-close" onClick={() => { setShowModal(false); setEditLead(null); }}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>Nombre *</label>
                  <input className="input" value={editLead.first_name} onChange={(e) => setEditLead({ ...editLead, first_name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>Apellido</label>
                  <input className="input" value={editLead.last_name} onChange={(e) => setEditLead({ ...editLead, last_name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>Email</label>
                  <input className="input" type="email" value={editLead.email} onChange={(e) => setEditLead({ ...editLead, email: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>Teléfono</label>
                  <input className="input" value={editLead.phone} onChange={(e) => setEditLead({ ...editLead, phone: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>Instagram</label>
                  <input className="input" value={editLead.instagram} onChange={(e) => setEditLead({ ...editLead, instagram: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>WhatsApp</label>
                  <input className="input" value={editLead.whatsapp} onChange={(e) => setEditLead({ ...editLead, whatsapp: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>Ciudad</label>
                  <input className="input" value={editLead.city} onChange={(e) => setEditLead({ ...editLead, city: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>País</label>
                  <input className="input" value={editLead.country} onChange={(e) => setEditLead({ ...editLead, country: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>Especialidad</label>
                  <input className="input" value={editLead.specialty} onChange={(e) => setEditLead({ ...editLead, specialty: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>Cant. alumnos</label>
                  <input className="input" type="number" value={editLead.student_count} onChange={(e) => setEditLead({ ...editLead, student_count: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>Origen</label>
                  <select className="input" value={editLead.origin} onChange={(e) => setEditLead({ ...editLead, origin: e.target.value })}>
                    {ORIGINS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>Prioridad</label>
                  <select className="input" value={editLead.priority} onChange={(e) => setEditLead({ ...editLead, priority: e.target.value })}>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>Notas</label>
                <textarea className="input" rows={3} value={editLead.notes} onChange={(e) => setEditLead({ ...editLead, notes: e.target.value })} style={{ width: "100%", resize: "vertical" }} />
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="btn-ghost" onClick={() => { setShowModal(false); setEditLead(null); }}>Cancelar</button>
              <button className="btn-primary" onClick={() => saveLead(editLead)} disabled={!editLead.first_name}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
