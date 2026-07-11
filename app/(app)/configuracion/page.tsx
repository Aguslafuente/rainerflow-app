import { HelpButton } from "@/components/HelpButton";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TrainerProfileForm } from "@/components/ProfileForm";
import { LandingConfigForm } from "@/components/LandingConfigForm";
import { ReferralSection } from "@/components/ReferralSection";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, business_name, phone, address, bio, avatar_url, social_instagram, social_twitter, mp_connected, subscription_status, slug, public_visible, tagline, services, referral_code, trial_ends_at"
    )
    .eq("id", user!.id)
    .single();

  // Referral stats
  const { data: referrals } = await supabase
    .from("referrals")
    .select("id, status")
    .eq("referrer_id", user!.id);
  const referralCount = referrals?.length ?? 0;
  const convertedCount = referrals?.filter((r) => r.status === "converted").length ?? 0;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("trainer_id", user!.id)
    .maybeSingle();

  const { data: mpCred } = await supabase
    .from("mp_credentials")
    .select("mp_user_id, expires_at, updated_at")
    .eq("trainer_id", user!.id)
    .maybeSingle();

  const mpConnected = !!mpCred;
  const mpExpired = mpCred?.expires_at
    ? new Date(mpCred.expires_at) < new Date()
    : false;

  const subStatus = subscription?.status || "none";
  const subLabel: Record<string, string> = {
    none: "Sin suscripción",
    trial: "Período de prueba",
    pending: "Pendiente de pago",
    active: "Activa",
    paused: "Pausada",
    cancelled: "Cancelada",
  };
  const subBadge: Record<string, string> = {
    none: "",
    trial: "trial",
    pending: "pendiente",
    active: "activo",
    paused: "pausa",
    cancelled: "baja",
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h1>Configuración</h1><HelpButton page="configuracion" /></div>
          <div className="sub">Perfil, pagos y suscripción</div>
        </div>
      </div>

      {/* ── Perfil ── */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">Mi perfil</div>
        <div style={{ padding: "20px" }}>
          <TrainerProfileForm
            profile={{
              id: profile!.id,
              full_name: profile!.full_name || "",
              business_name: profile!.business_name,
              phone: profile!.phone,
              address: profile!.address,
              bio: profile!.bio,
              avatar_url: profile!.avatar_url,
              social_instagram: profile!.social_instagram,
              social_twitter: profile!.social_twitter,
              email: user!.email || "",
            }}
          />
        </div>
      </div>

      {/* ── Landing pública ── */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          Landing pública
          <span style={{ fontSize: 12, fontWeight: 400, color: "var(--gray)" }}>
            · Tu página para compartir en redes
          </span>
        </div>
        <div style={{ padding: "20px" }}>
          <LandingConfigForm
            profile={{
              id: profile!.id,
              slug: profile!.slug,
              public_visible: profile!.public_visible,
              tagline: profile!.tagline,
              services: profile!.services,
            }}
          />
        </div>
      </div>

      {/* ── Suscripción TrainerFlow ── */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">Tu suscripción TrainerFlow</div>
        <div style={{ padding: "20px" }}>
          {subStatus === "active" ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>
                    USD {subscription?.price_usd || "19.99"}
                    <span style={{ fontSize: 14, fontWeight: 400, color: "var(--gray)" }}>/mes</span>
                  </div>
                  <div style={{ fontSize: 14, color: "var(--gray)", marginTop: 2 }}>
                    Plan {subscription?.plan === "team" ? "Team" : "Pro"}
                    {subscription?.plan === "team" ? " · Hasta 5 trainers · 3% comisión" : " · Clientes ilimitados · 5% comisión"}
                  </div>
                </div>
                <span className={`badge ${subBadge[subStatus]}`}>{subLabel[subStatus]}</span>
              </div>
              <div className="config-status-ok">
                <span>✓</span> Tu suscripción está activa. Gracias por usar TrainerFlow.
              </div>
              {subscription?.plan !== "team" && (
                <a href="/api/mp/subscribe?plan=team" className="btn btn-ghost" style={{ width: "100%", marginTop: 12 }}>
                  Upgrade a Team · USD 49.99/mes
                </a>
              )}
              {subscription?.current_period_end && (
                <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 8 }}>
                  Próximo cobro: {subscription.current_period_end}
                </div>
              )}
            </>
          ) : (
            <>
              {subStatus !== "none" && (
                <div style={{ marginBottom: 16 }}>
                  <span className={`badge ${subBadge[subStatus]}`}>{subLabel[subStatus]}</span>
                </div>
              )}
              <div className="config-plans-grid">
                <div className="config-plan-card">
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--violet2)", marginBottom: 4 }}>Pro</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    USD 19.99<span style={{ fontSize: 13, fontWeight: 400, color: "var(--gray)" }}>/mes</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--gray)", margin: "8px 0 16px" }}>
                    Para entrenadores independientes. Clientes ilimitados, 5% comisión.
                  </div>
                  <a href="/api/mp/subscribe?plan=pro" className="btn btn-primary" style={{ width: "100%" }}>
                    {subStatus === "none" ? "Elegir Pro" : "Reanudar Pro"}
                  </a>
                </div>
                <div className="config-plan-card config-plan-featured">
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cyan)", marginBottom: 4 }}>Team · Más popular</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    USD 49.99<span style={{ fontSize: 13, fontWeight: 400, color: "var(--gray)" }}>/mes</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--gray)", margin: "8px 0 16px" }}>
                    Para gimnasios. Hasta 5 trainers, panel admin, 3% comisión.
                  </div>
                  <a href="/api/mp/subscribe?plan=team" className="btn btn-primary" style={{ width: "100%", background: "linear-gradient(135deg, var(--violet), var(--cyan))" }}>
                    {subStatus === "none" ? "Elegir Team" : "Reanudar Team"}
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Referidos ── */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          Programa de referidos
          <span style={{ fontSize: 12, fontWeight: 400, color: "var(--gray)" }}>
            · Invitá entrenadores y ganá comisión
          </span>
        </div>
        <div style={{ padding: "20px" }}>
          <ReferralSection
            referralCode={profile!.referral_code || "—"}
            referralCount={referralCount}
            convertedCount={convertedCount}
            totalCommission={convertedCount * 10}
          />
        </div>
      </div>

      {/* ── Trial info ── */}
      {profile?.trial_ends_at && profile?.subscription_status !== "active" && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-head">Período de prueba</div>
          <div style={{ padding: "20px" }}>
            <div style={{ fontSize: 14, color: "var(--gray)", lineHeight: 1.5 }}>
              Tu trial de 15 días {new Date(profile.trial_ends_at) > new Date() ? (
                <>termina el <strong style={{ color: "var(--ink)" }}>{new Date(profile.trial_ends_at).toLocaleDateString("es-UY", { day: "numeric", month: "long", year: "numeric" })}</strong>. Elegí un plan antes de que expire para no perder acceso.</>
              ) : (
                <>ha expirado. Suscribite a un plan para seguir usando TrainerFlow.</>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Conexión MercadoPago ── */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          MercadoPago
          <span style={{ fontSize: 12, fontWeight: 400, color: "var(--gray)" }}>
            · Para recibir pagos de tus clientes
          </span>
        </div>
        <div style={{ padding: "20px" }}>
          <div style={{ fontSize: 14, color: "var(--gray)", marginBottom: 16, lineHeight: 1.5 }}>
            Conectá tu cuenta de MercadoPago para que las cuotas de tus clientes
            lleguen directo a tu cuenta. TrainerFlow cobra una comisión del 5%
            por procesamiento.
          </div>

          {mpConnected && !mpExpired ? (
            <>
              <div className="config-status-ok">
                <span>✓</span> Cuenta conectada
                {mpCred?.mp_user_id && (
                  <span style={{ color: "var(--gray)", fontSize: 12, marginLeft: 8 }}>
                    ID: {mpCred.mp_user_id}
                  </span>
                )}
              </div>
              <a
                href="/api/mp/connect"
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 12, width: "auto", display: "inline-flex" }}
              >
                Reconectar cuenta
              </a>
            </>
          ) : mpConnected && mpExpired ? (
            <>
              <div className="config-status-warn">
                <span>⚠</span> Tu conexión con MercadoPago expiró. Reconectá tu cuenta.
              </div>
              <a
                href="/api/mp/connect"
                className="btn btn-primary"
                style={{ marginTop: 12, width: "100%" }}
              >
                Reconectar MercadoPago
              </a>
            </>
          ) : (
            <a
              href="/api/mp/connect"
              className="btn btn-primary"
              style={{
                width: "100%",
              }}
            >
              Conectar MercadoPago
            </a>
          )}
        </div>
      </div>

      {/* ── Resumen de comisiones ── */}
      <div className="panel">
        <div className="panel-head">Cómo funcionan los cobros</div>
        <div style={{ padding: "20px" }}>
          <div className="config-info-grid">
            <div className="config-info-item">
              <div className="config-info-label">Cuota del cliente</div>
              <div className="config-info-value">
                El cliente paga desde su portal. El dinero va a tu MercadoPago.
              </div>
            </div>
            <div className="config-info-item">
              <div className="config-info-label">Comisión TrainerFlow</div>
              <div className="config-info-value">
                {subscription?.plan === "team" ? "3%" : "5%"} se descuenta automáticamente de cada cobro.
                {subscription?.plan !== "team" && " Bajá a 3% con el plan Team."}
              </div>
            </div>
            <div className="config-info-item">
              <div className="config-info-label">Tu suscripción</div>
              <div className="config-info-value">
                USD {subscription?.price_usd || "19.99"}/mes ({subscription?.plan === "team" ? "Team" : "Pro"}) aparte, para usar la plataforma.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
