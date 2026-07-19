"use client";

import { useEffect, useState } from "react";
import { adminRequest } from "@/lib/admin-client";

export default function SoportePage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", body: "", reporter_name: "Admin", reporter_email: "admin@trainerflow.uy", priority: "media" });

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      setTickets(await adminRequest<any[]>("tickets_list"));
    } finally {
      setLoading(false);
    }
  }

  async function selectTicket(ticket: any) {
    setSelectedTicket(ticket);
    setMessages(
      await adminRequest<any[]>("ticket_messages", { ticketId: ticket.id })
    );
  }

  async function sendReply() {
    if (!reply.trim() || !selectedTicket) return;
    await adminRequest("ticket_reply", {
      ticketId: selectedTicket.id,
      body: reply,
    });
    setReply("");
    await selectTicket({ ...selectedTicket, status: "pendiente" });
    await loadTickets();
  }

  async function resolveTicket() {
    if (!selectedTicket) return;
    await adminRequest("ticket_resolve", { ticketId: selectedTicket.id });
    setSelectedTicket({ ...selectedTicket, status: "resuelto" });
    await loadTickets();
  }

  async function createTicket() {
    await adminRequest("ticket_create", { ticket: newTicket });
    setShowNew(false);
    setNewTicket({ subject: "", body: "", reporter_name: "Admin", reporter_email: "admin@trainerflow.uy", priority: "media" });
    await loadTickets();
  }

  if (loading) return <div className="admin-page-head"><p style={{ color: "var(--gray)" }}>Cargando...</p></div>;

  const open = tickets.filter((t) => t.status === "abierto").length;
  const pending = tickets.filter((t) => t.status === "pendiente").length;
  const resolved = tickets.filter((t) => t.status === "resuelto").length;

  let filtered = tickets.filter((t) => {
    if (statusFilter !== "todos" && t.status !== statusFilter) return false;
    return true;
  });

  return (
    <>
      <div className="admin-page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Soporte</h1>
          <p className="sub">{tickets.length} tickets</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>+ Nuevo ticket</button>
      </div>

      <div className="admin-kpis" style={{ marginBottom: 20 }}>
        <div className="admin-kpi">
          <div className="admin-kpi-val red">{open}</div>
          <div className="admin-kpi-label">Abiertos</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val amber">{pending}</div>
          <div className="admin-kpi-label">Pendientes</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val green">{resolved}</div>
          <div className="admin-kpi-label">Resueltos</div>
        </div>
      </div>

      <div className="admin-filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="abierto">Abiertos</option>
          <option value="pendiente">Pendientes</option>
          <option value="resuelto">Resueltos</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedTicket ? "1fr 1fr" : "1fr", gap: 20 }}>
        {/* Tickets list */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Asunto</th>
                <th>De</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--gray)" }}>Sin tickets</td></tr>
              ) : filtered.map((t) => (
                <tr key={t.id} className="clickable" onClick={() => selectTicket(t)} style={{ background: selectedTicket?.id === t.id ? "var(--card)" : undefined }}>
                  <td style={{ fontWeight: 600 }}>{t.subject}</td>
                  <td style={{ color: "var(--gray)", fontSize: 13 }}>{t.reporter_name || t.reporter_email || "—"}</td>
                  <td>
                    <span className={`badge ${t.status === "resuelto" ? "activo" : t.status === "abierto" ? "baja" : "trial"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                      background: t.priority === "alta" ? "rgba(239,68,68,0.15)" : t.priority === "media" ? "rgba(245,158,11,0.15)" : "rgba(107,114,128,0.15)",
                      color: t.priority === "alta" ? "var(--red)" : t.priority === "media" ? "var(--amber)" : "var(--gray)"
                    }}>
                      {t.priority || "media"}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--gray)" }}>
                    {new Date(t.created_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ticket detail panel */}
        {selectedTicket && (
          <div className="panel">
            <div className="panel-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{selectedTicket.subject}</span>
              <button className="admin-modal-close" onClick={() => setSelectedTicket(null)}>&times;</button>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 13, color: "var(--gray)", marginBottom: 8 }}>
                De: {selectedTicket.reporter_name || "—"} ({selectedTicket.reporter_email || "—"})
              </div>
              <div style={{ fontSize: 14, color: "var(--ink)", marginBottom: 16, padding: 12, borderRadius: 10, background: "var(--card)", border: "1px solid var(--line)" }}>
                {selectedTicket.body || "Sin descripción"}
              </div>

              {/* Messages */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, maxHeight: 300, overflowY: "auto" }}>
                {messages.map((m) => (
                  <div key={m.id} style={{
                    padding: "10px 14px", borderRadius: 10, fontSize: 13,
                    background: m.sender === "admin" ? "rgba(124,108,240,0.1)" : "var(--card)",
                    border: "1px solid var(--line)", alignSelf: m.sender === "admin" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                  }}>
                    <div style={{ fontSize: 11, color: "var(--gray)", marginBottom: 4 }}>
                      {m.sender === "admin" ? "Admin" : "Usuario"} · {new Date(m.created_at).toLocaleString("es-UY")}
                    </div>
                    <div style={{ color: "var(--ink)", whiteSpace: "pre-wrap" }}>{m.body}</div>
                  </div>
                ))}
              </div>

              {/* Reply */}
              {selectedTicket.status !== "resuelto" && (
                <>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Responder..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    style={{ width: "100%", resize: "vertical", marginBottom: 10 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-primary" onClick={sendReply} disabled={!reply.trim()}>Responder</button>
                    <button className="btn-ghost" onClick={resolveTicket}>Marcar resuelto</button>
                  </div>
                </>
              )}
              {selectedTicket.status === "resuelto" && (
                <div style={{ padding: 12, borderRadius: 10, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", fontSize: 13, color: "var(--green)" }}>
                  Ticket resuelto {selectedTicket.resolution ? `— ${selectedTicket.resolution}` : ""}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New ticket modal */}
      {showNew && (
        <div className="admin-modal-overlay" onClick={() => setShowNew(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h3>Nuevo ticket</h3>
              <button className="admin-modal-close" onClick={() => setShowNew(false)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>Asunto *</label>
                <input className="input" value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} style={{ width: "100%" }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>Descripción</label>
                <textarea className="input" rows={4} value={newTicket.body} onChange={(e) => setNewTicket({ ...newTicket, body: e.target.value })} style={{ width: "100%", resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>Nombre reportador</label>
                  <input className="input" value={newTicket.reporter_name} onChange={(e) => setNewTicket({ ...newTicket, reporter_name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--gray)", display: "block", marginBottom: 4 }}>Prioridad</label>
                  <select className="input" value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="btn-ghost" onClick={() => setShowNew(false)}>Cancelar</button>
              <button className="btn-primary" onClick={createTicket} disabled={!newTicket.subject}>Crear ticket</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
