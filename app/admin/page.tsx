import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "Agustin10";
const ADMIN_TOKEN = "tf-admin-" + Buffer.from(ADMIN_EMAIL + ADMIN_PASSWORD).toString("base64");

export default async function AdminPage() {
  // Check admin cookie
  const cookieStore = cookies();
  const token = cookieStore.get("tf_admin")?.value;
  if (token !== ADMIN_TOKEN) redirect("/admin/login");

  // Use anon client — the admin_stats() function is SECURITY DEFINER so it bypasses RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: stats, error } = await supabase.rpc("admin_stats");

  if (error || !stats) {
    return (
      <div className="admin-wrap">
        <div className="admin-header">
          <h1>Panel de Admin</h1>
          <p className="sub" style={{ color: "#f87171" }}>Error cargando datos: {error?.message || "sin datos"}</p>
        </div>
      </div>
    );
  }

  // ── Parse data from RPC ──
  const allTrainers: any[] = stats.trainers ?? [];
  const allClients: any[] = stats.clients ?? [];
  const allPayments: any[] = stats.payments ?? [];
  const allSubscriptions: any[] = stats.subscriptions ?? [];
  const allReferrals: any[] = stats.referrals ?? [];
  const routinesCount = Number(stats.routines_count ?? 0);

  // ── Trainer KPIs ──
  const totalTrainers = allTrainers.length;
  const activeTrainers = allTrainers.filter((t: any) => t.subscription_status === "active").length;
  const trialTrainers = allTrainers.filter(
    (t: any) => t.subscription_status === "trial" && t.trial_ends_at && new Date(t.trial_ends_at) > new Date()
  ).length;
  const expiredTrainers = allTrainers.filter(
    (t: any) =>
      t.trial_ends_at &&
      new Date(t.trial_ends_at) < new Date() &&
      t.subscription_status !== "active"
  ).length;

  // ── Client KPIs ──
  const activeClients = allClients.filter((c: any) => c.status === "activo").length;

  // ── Payment KPIs ──
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const paymentsThisMonth = allPayments.filter((p: any) => p.period === currentPeriod);
  const revenueThisMonth = paymentsThisMonth.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const totalRevenue = allPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  // Comisión TrainerFlow (5% de cada pago)
  const commissionThisMonth = Math.round(revenueThisMonth * 0.05);
  const totalCommission = Math.round(totalRevenue * 0.05);

  // ── Subscriptions (SaaS revenue) ──
  const activeSubs = allSubscriptions.filter((s: any) => s.status === "active");
  const mrrSubs = activeSubs.reduce((s: number, sub: any) => s + Number(sub.price_usd || 0), 0);

  // ── Recent signups (last 30 days) ──
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recentSignups = allTrainers.filter((t: any) => t.created_at >= thirtyDaysAgo).length;

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <h1>Panel de Admin</h1>
        <p className="sub">Métricas generales de TrainerFlow</p>
      </div>

      {/* ── KPIs principales ── */}
      <div className="admin-kpis">
        <div className="admin-kpi">
          <div className="admin-kpi-val">{totalTrainers}</div>
          <div className="admin-kpi-label">Trainers registrados</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val green">{activeTrainers}</div>
          <div className="admin-kpi-label">Suscripción activa</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val violet">{trialTrainers}</div>
          <div className="admin-kpi-label">En trial</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val amber">{expiredTrainers}</div>
          <div className="admin-kpi-label">Trial expirado</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val">{allClients.length}</div>
          <div className="admin-kpi-label">Clientes totales</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-val cyan">{activeClients}</div>
          <div className="admin-kpi-label">Clientes activos</div>
        </div>
      </div>

      {/* ── Ingresos ── */}
      <div className="admin-section">
        <h2>Ingresos</h2>
        <div className="admin-kpis">
          <div className="admin-kpi wide">
            <div className="admin-kpi-val green">USD {mrrSubs.toFixed(2)}</div>
            <div className="admin-kpi-label">MRR suscripciones</div>
          </div>
          <div className="admin-kpi wide">
            <div className="admin-kpi-val">${revenueThisMonth.toLocaleString()}</div>
            <div className="admin-kpi-label">Cobros de trainers este mes</div>
          </div>
          <div className="admin-kpi wide">
            <div className="admin-kpi-val violet">${commissionThisMonth.toLocaleString()}</div>
            <div className="admin-kpi-label">Comisión TF este mes (5%)</div>
          </div>
          <div className="admin-kpi wide">
            <div className="admin-kpi-val">${totalCommission.toLocaleString()}</div>
            <div className="admin-kpi-label">Comisión TF total</div>
          </div>
        </div>
      </div>

      {/* ── Uso de la plataforma ── */}
      <div className="admin-section">
        <h2>Uso</h2>
        <div className="admin-kpis">
          <div className="admin-kpi">
            <div className="admin-kpi-val">{routinesCount ?? 0}</div>
            <div className="admin-kpi-label">Rutinas creadas</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-val">{allPayments.length}</div>
            <div className="admin-kpi-label">Pagos procesados</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-val cyan">{recentSignups}</div>
            <div className="admin-kpi-label">Signups últimos 30d</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-val">{allReferrals.length}</div>
            <div className="admin-kpi-label">Referidos</div>
          </div>
        </div>
      </div>

      {/* ── Lista de trainers ── */}
      <div className="admin-section">
        <h2>Trainers</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Negocio</th>
                <th>Estado</th>
                <th>Trial hasta</th>
                <th>Código</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {allTrainers.map((t) => {
                const status = t.subscription_status || "none";
                const trialEnd = t.trial_ends_at ? new Date(t.trial_ends_at) : null;
                const trialExpired = trialEnd && trialEnd < new Date();
                let badge = status;
                if (status === "trial" && trialExpired) badge = "expired";

                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.full_name || "—"}</td>
                    <td style={{ color: "var(--gray)" }}>{t.business_name || "—"}</td>
                    <td>
                      <span
                        className={`badge ${
                          badge === "active"
                            ? "activo"
                            : badge === "trial"
                            ? "trial"
                            : badge === "expired"
                            ? "baja"
                            : "pausa"
                        }`}
                      >
                        {badge === "active"
                          ? "Activo"
                          : badge === "trial"
                          ? "Trial"
                          : badge === "expired"
                          ? "Expirado"
                          : status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--gray)" }}>
                      {trialEnd
                        ? trialEnd.toLocaleDateString("es-UY", {
                            day: "2-digit",
                            month: "short",
                          })
                        : "—"}
                    </td>
                    <td>
                      <code style={{ fontSize: 12, color: "var(--violet2)" }}>
                        {t.referral_code || "—"}
                      </code>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--gray)" }}>
                      {new Date(t.created_at).toLocaleDateString("es-UY", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Referidos ── */}
      {allReferrals.length > 0 && (
        <div className="admin-section">
          <h2>Referidos</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Código usado</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {allReferrals.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <code style={{ color: "var(--violet2)" }}>{r.code_used}</code>
                    </td>
                    <td>
                      <span className={`badge ${r.status === "converted" ? "activo" : "trial"}`}>
                        {r.status === "converted" ? "Convertido" : "Registrado"}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--gray)" }}>
                      {new Date(r.created_at).toLocaleDateString("es-UY")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
