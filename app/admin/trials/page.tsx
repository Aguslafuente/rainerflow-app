"use client";

import { useEffect, useState } from "react";
import { loadAdminStats } from "@/lib/admin-client";

export default function TrialsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"activos" | "expirados" | "convertidos">("activos");

  useEffect(() => {
    loadAdminStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-page-head"><p style={{ color: "var(--gray)" }}>Cargando...</p></div>;
  if (!stats) return null;

  const trainers: any[] = stats.trainers ?? [];
  const now = new Date();

  // Categorize
  const activeTrial = trainers.filter((t) => t.subscription_status === "trial" && t.trial_ends_at && new Date(t.trial_ends_at) > now);
  const expiredTrial = trainers.filter((t) => t.trial_ends_at && new Date(t.trial_ends_at) < now && t.subscription_status !== "active");
  const converted = trainers.filter((t) => t.subscription_status === "active");

  // Expiring soon (within 3 days)
  const expiringNear = activeTrial.filter((t) => {
    const daysLeft = Math.ceil((new Date(t.trial_ends_at).getTime() - now.getTime()) / 86400000);
    return daysLeft <= 3;
  });

  // Conversion rate
  const totalTrialed = activeTrial.length + expiredTrial.length + converted.length;
  const convRate = totalTrialed > 0 ? Math.round((converted.length / totalTrialed) * 100) : 0;

  const currentList = tab === "activos" ? activeTrial : tab === "expirados" ? expiredTrial : converted;

  return (
    <>
      <div className="admin-page-head">
        <h1>Trials</h1>
        <p className="sub">Monitoreo de períodos de prueba</p>
      </div>

      <div className="admin-kpis" style={{ marginBottom: 24 }}>
        <div className="admin-kpi">
          <div className="admin-kpi-val violet">{activeTrial.length}</div>
          <div className="admin-kpi-label">Trials activos</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val amber">{expiringNear.length}</div>
          <div className="admin-kpi-label">Expiran en 3 días</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val red">{expiredTrial.length}</div>
          <div className="admin-kpi-label">Expirados sin conv.</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val green">{converted.length}</div>
          <div className="admin-kpi-label">Convertidos</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val cyan">{convRate}%</div>
          <div className="admin-kpi-label">Tasa conversión</div>
        </div>
      </div>

      {/* Alert for expiring soon */}
      {expiringNear.length > 0 && (
        <div style={{
          padding: "14px 18px", borderRadius: 12, marginBottom: 20,
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
          fontSize: 14, color: "var(--amber)"
        }}>
          <strong>Atención:</strong> {expiringNear.length} trial{expiringNear.length > 1 ? "s" : ""} expira{expiringNear.length > 1 ? "n" : ""} en menos de 3 días. Contactar para convertir.
        </div>
      )}

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === "activos" ? "active" : ""}`} onClick={() => setTab("activos")}>Activos ({activeTrial.length})</button>
        <button className={`admin-tab ${tab === "expirados" ? "active" : ""}`} onClick={() => setTab("expirados")}>Expirados ({expiredTrial.length})</button>
        <button className={`admin-tab ${tab === "convertidos" ? "active" : ""}`} onClick={() => setTab("convertidos")}>Convertidos ({converted.length})</button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Negocio</th>
              <th>{tab === "convertidos" ? "Suscripción" : "Trial hasta"}</th>
              <th>{tab === "activos" ? "Días restantes" : tab === "expirados" ? "Días expirado" : "Fecha conv."}</th>
              <th>Último acceso</th>
            </tr>
          </thead>
          <tbody>
            {currentList.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--gray)" }}>Sin resultados</td></tr>
            ) : currentList.map((t) => {
              const trialEnd = t.trial_ends_at ? new Date(t.trial_ends_at) : null;
              const daysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000) : 0;

              return (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.full_name || "—"}</td>
                  <td style={{ color: "var(--gray)", fontSize: 13 }}>{t.email || "—"}</td>
                  <td style={{ color: "var(--gray)" }}>{t.business_name || "—"}</td>
                  <td style={{ fontSize: 13 }}>
                    {trialEnd ? trialEnd.toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                  </td>
                  <td>
                    {tab === "activos" && (
                      <span style={{
                        fontWeight: 600,
                        color: daysLeft <= 3 ? "var(--red)" : daysLeft <= 7 ? "var(--amber)" : "var(--green)"
                      }}>
                        {daysLeft}d
                      </span>
                    )}
                    {tab === "expirados" && (
                      <span style={{ fontWeight: 600, color: "var(--red)" }}>
                        {Math.abs(daysLeft)}d
                      </span>
                    )}
                    {tab === "convertidos" && (
                      <span style={{ color: "var(--green)" }}>
                        {t.subscription_expires_at ? new Date(t.subscription_expires_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short" }) : "—"}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 13, color: "var(--gray)" }}>
                    {t.last_sign_in_at ? new Date(t.last_sign_in_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short" }) : "Nunca"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
