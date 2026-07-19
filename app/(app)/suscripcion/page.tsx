import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SuscripcionPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, trial_ends_at, subscription_expires_at, full_name")
    .eq("id", user.id)
    .single();

  const now = new Date();
  const subStatus = profile?.subscription_status ?? "none";
  const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const subExpires = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
  const inTrial = trialEnd && trialEnd > now;
  const daysLeftTrial = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000))
    : 0;
  const subActive = subStatus === "active" && subExpires && subExpires > now;
  const subExpired = subStatus === "active" && subExpires && subExpires <= now;
  const daysLeftSub = subExpires
    ? Math.max(0, Math.ceil((subExpires.getTime() - now.getTime()) / 86400000))
    : 0;

  const planCard = (
    <div
      style={{
        background: "var(--card)",
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
      }}
    >
      <div style={{ fontSize: 13, color: "var(--gray)" }}>Plan Pro</div>
      <div style={{ fontSize: 36, fontWeight: 800 }}>
        $1200<span style={{ fontSize: 16, fontWeight: 400 }}> UYU/mes</span>
      </div>
      <ul
        style={{
          textAlign: "left",
          fontSize: 14,
          color: "var(--gray)",
          marginTop: 12,
          listStyle: "none",
          padding: 0,
        }}
      >
        <li style={{ padding: "4px 0" }}>✓ Clientes ilimitados</li>
        <li style={{ padding: "4px 0" }}>✓ Rutinas y planes nutricionales</li>
        <li style={{ padding: "4px 0" }}>✓ Cobros por MercadoPago</li>
        <li style={{ padding: "4px 0" }}>✓ Chat con clientes</li>
        <li style={{ padding: "4px 0" }}>✓ Agenda y mediciones</li>
      </ul>
    </div>
  );

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "60px auto",
        textAlign: "center",
        padding: "0 20px",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Tu suscripción</h1>

      {subActive ? (
        <div className="panel" style={{ padding: 32, marginTop: 24 }}>
          <div className="badge activo" style={{ fontSize: 14, marginBottom: 16 }}>
            Suscripción activa
          </div>
          <p style={{ color: "var(--gray)", fontSize: 14 }}>
            Tenés acceso completo a TrainerFlow.
            {daysLeftSub <= 5 && (
              <span style={{ display: "block", marginTop: 8, color: "var(--amber, #f59e0b)" }}>
                Tu suscripción vence en <strong>{daysLeftSub} día{daysLeftSub !== 1 ? "s" : ""}</strong>. Renová para no perder acceso.
              </span>
            )}
          </p>
          {daysLeftSub <= 5 ? (
            <a
              href="/api/mp/subscribe?plan=pro"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 16 }}
            >
              Renovar ahora · $1200 UYU/mes
            </a>
          ) : (
            <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 16 }}>
              Ir al dashboard
            </Link>
          )}
          {subExpires && (
            <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 12 }}>
              Vence el {subExpires.toLocaleDateString("es-UY", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          )}
        </div>
      ) : subExpired ? (
        <div className="panel" style={{ padding: 32, marginTop: 24 }}>
          <div className="badge pausa" style={{ fontSize: 14, marginBottom: 16 }}>
            Suscripción vencida
          </div>
          <p style={{ color: "var(--gray)", fontSize: 14, marginBottom: 20 }}>
            Tu suscripción mensual expiró. Renová para seguir usando TrainerFlow.
          </p>
          {planCard}
          <a
            href="/api/mp/subscribe?plan=pro"
            className="btn btn-primary"
            style={{ width: "100%", fontSize: 16, padding: "12px 0" }}
          >
            Renovar · $1200 UYU/mes
          </a>
        </div>
      ) : inTrial ? (
        <div className="panel" style={{ padding: 32, marginTop: 24 }}>
          <div
            className="badge"
            style={{ fontSize: 14, marginBottom: 16, background: "var(--cyan)", color: "#000" }}
          >
            Prueba gratuita · {daysLeftTrial} días restantes
          </div>
          <p style={{ color: "var(--gray)", fontSize: 14, marginBottom: 20 }}>
            Estás disfrutando tu prueba gratuita de 15 días. Cuando termine,
            necesitarás suscribirte para seguir usando TrainerFlow.
          </p>
          {planCard}
          <a
            href="/api/mp/subscribe?plan=pro"
            className="btn btn-primary"
            style={{ width: "100%", fontSize: 16, padding: "12px 0" }}
          >
            Suscribirme ahora · $1200 UYU/mes
          </a>
          <Link
            href="/dashboard"
            className="btn btn-ghost"
            style={{ width: "100%", marginTop: 8 }}
          >
            Seguir con la prueba
          </Link>
        </div>
      ) : (
        <div className="panel" style={{ padding: 32, marginTop: 24 }}>
          <div className="badge pausa" style={{ fontSize: 14, marginBottom: 16 }}>
            Prueba finalizada
          </div>
          <p style={{ color: "var(--gray)", fontSize: 14, marginBottom: 20 }}>
            Tu prueba gratuita terminó. Suscribite para seguir usando
            TrainerFlow y gestionar tu negocio de entrenamiento.
          </p>
          {planCard}
          <a
            href="/api/mp/subscribe?plan=pro"
            className="btn btn-primary"
            style={{ width: "100%", fontSize: 16, padding: "12px 0" }}
          >
            Suscribirme · $1200 UYU/mes
          </a>
        </div>
      )}
    </div>
  );
}
