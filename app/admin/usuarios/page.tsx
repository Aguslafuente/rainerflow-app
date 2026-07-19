"use client";

import { useEffect, useState } from "react";
import { loadAdminStats } from "@/lib/admin-client";

type Tab = "trainers" | "clients" | "gyms";

export default function UsuariosPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("trainers");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  useEffect(() => {
    loadAdminStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-page-head"><p style={{ color: "var(--gray)" }}>Cargando...</p></div>;
  if (!stats) return null;

  const trainers: any[] = stats.trainers ?? [];
  const clients: any[] = stats.clients ?? [];
  const gyms: any[] = stats.gyms ?? [];
  const now = new Date();

  function getTrainerBadge(t: any) {
    const s = t.subscription_status || "none";
    const trialEnd = t.trial_ends_at ? new Date(t.trial_ends_at) : null;
    if (s === "active") return { label: "Activo", cls: "activo" };
    if (s === "trial" && trialEnd && trialEnd > now) return { label: "Trial", cls: "trial" };
    if (trialEnd && trialEnd < now) return { label: "Expirado", cls: "baja" };
    return { label: s, cls: "pausa" };
  }

  // Filter trainers
  let filteredTrainers = trainers.filter((t) => {
    const q = search.toLowerCase();
    if (q && !(t.full_name || "").toLowerCase().includes(q) && !(t.email || "").toLowerCase().includes(q) && !(t.business_name || "").toLowerCase().includes(q)) return false;
    if (statusFilter !== "todos") {
      const badge = getTrainerBadge(t);
      if (statusFilter === "activo" && badge.cls !== "activo") return false;
      if (statusFilter === "trial" && badge.cls !== "trial") return false;
      if (statusFilter === "expirado" && badge.cls !== "baja") return false;
    }
    return true;
  });

  let filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    if (q && !(c.full_name || "").toLowerCase().includes(q) && !(c.email || "").toLowerCase().includes(q)) return false;
    if (statusFilter !== "todos" && statusFilter !== c.status) return false;
    return true;
  });

  let filteredGyms = gyms.filter((g) => {
    const q = search.toLowerCase();
    if (q && !(g.gym_name || "").toLowerCase().includes(q) && !(g.owner_name || "").toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <>
      <div className="admin-page-head">
        <h1>Usuarios</h1>
        <p className="sub">{trainers.length} trainers, {clients.length} clientes, {gyms.length} gimnasios</p>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === "trainers" ? "active" : ""}`} onClick={() => { setTab("trainers"); setStatusFilter("todos"); }}>Trainers ({trainers.length})</button>
        <button className={`admin-tab ${tab === "clients" ? "active" : ""}`} onClick={() => { setTab("clients"); setStatusFilter("todos"); }}>Clientes ({clients.length})</button>
        <button className={`admin-tab ${tab === "gyms" ? "active" : ""}`} onClick={() => { setTab("gyms"); setStatusFilter("todos"); }}>Gimnasios ({gyms.length})</button>
      </div>

      <div className="admin-filters">
        <input placeholder="Buscar por nombre, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {tab === "trainers" && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="activo">Activos</option>
            <option value="trial">En trial</option>
            <option value="expirado">Expirados</option>
          </select>
        )}
        {tab === "clients" && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        )}
      </div>

      {/* Trainers table */}
      {tab === "trainers" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Negocio</th>
                <th>Estado</th>
                <th>Trial hasta</th>
                <th>Clientes</th>
                <th>Último acceso</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrainers.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--gray)" }}>Sin resultados</td></tr>
              ) : filteredTrainers.map((t) => {
                const badge = getTrainerBadge(t);
                const trainerClients = clients.filter((c) => c.trainer_id === t.id).length;
                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.full_name || "—"}</td>
                    <td style={{ color: "var(--gray)", fontSize: 13 }}>{t.email || "—"}</td>
                    <td style={{ color: "var(--gray)" }}>{t.business_name || "—"}</td>
                    <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                    <td style={{ fontSize: 13, color: "var(--gray)" }}>
                      {t.trial_ends_at ? new Date(t.trial_ends_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short" }) : "—"}
                    </td>
                    <td style={{ textAlign: "center" }}>{trainerClients}</td>
                    <td style={{ fontSize: 13, color: "var(--gray)" }}>
                      {t.last_sign_in_at ? new Date(t.last_sign_in_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short" }) : "—"}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--gray)" }}>
                      {new Date(t.created_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Clients table */}
      {tab === "clients" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Trainer</th>
                <th>Estado</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--gray)" }}>Sin resultados</td></tr>
              ) : filteredClients.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.full_name || "—"}</td>
                  <td style={{ color: "var(--gray)", fontSize: 13 }}>{c.email || "—"}</td>
                  <td style={{ color: "var(--gray)" }}>{c.trainer_name || "—"}</td>
                  <td>
                    <span className={`badge ${c.status === "activo" ? "activo" : "pausa"}`}>
                      {c.status === "activo" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--gray)" }}>
                    {new Date(c.created_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Gyms table */}
      {tab === "gyms" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Gimnasio</th>
                <th>Propietario</th>
                <th>Estado</th>
                <th>Trainers</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {filteredGyms.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--gray)" }}>Sin resultados</td></tr>
              ) : filteredGyms.map((g) => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 600 }}>{g.gym_name || "—"}</td>
                  <td style={{ color: "var(--gray)" }}>{g.owner_name || "—"}</td>
                  <td>
                    <span className={`badge ${g.subscription_status === "active" ? "activo" : "pausa"}`}>
                      {g.subscription_status === "active" ? "Activo" : g.subscription_status || "—"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>{g.trainer_count ?? "—"}</td>
                  <td style={{ fontSize: 13, color: "var(--gray)" }}>
                    {new Date(g.created_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
