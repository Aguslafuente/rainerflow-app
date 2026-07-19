"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { NotificationPrefs } from "@/components/NotificationPrefs";

interface ProfileData {
  trial_ends_at: string | null;
  subscription_status: string | null;
  subscription_expires_at: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface SubscriptionData {
  status: string;
  plan: string | null;
  current_period_end: string | null;
}

interface MpCredData {
  mp_user_id: string | null;
  expires_at: string | null;
}

export default function GymConfigPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [gymId, setGymId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#7c6cf0");
  const [secondaryColor, setSecondaryColor] = useState("#38d9f0");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  /* Owner profile fields */
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerAvatar, setOwnerAvatar] = useState<string | null>(null);
  const [ownerSaving, setOwnerSaving] = useState(false);
  const [ownerMsg, setOwnerMsg] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [mpCred, setMpCred] = useState<MpCredData | null>(null);

  const loadAll = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    setUserEmail(user.email || "");

    // Load gym data
    const { data: gym } = await supabase
      .from("gyms")
      .select("id, name, primary_color, secondary_color")
      .eq("owner_id", user.id)
      .single();

    if (gym) {
      setGymId(gym.id);
      setName(gym.name);
      setPrimaryColor(gym.primary_color || "#7c6cf0");
      setSecondaryColor(gym.secondary_color || "#38d9f0");
    }

    // Load profile (trial + subscription info + owner data)
    const { data: prof } = await supabase
      .from("profiles")
      .select("trial_ends_at, subscription_status, subscription_expires_at, full_name, phone, avatar_url")
      .eq("id", user.id)
      .single();

    if (prof) {
      setProfile(prof);
      setOwnerName(prof.full_name || "");
      setOwnerPhone(prof.phone || "");
      setOwnerAvatar(prof.avatar_url || null);
    }

    // Load subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, plan, current_period_end")
      .eq("trainer_id", user.id)
      .maybeSingle();

    if (sub) setSubscription(sub);

    // Load MP credentials
    const { data: mp } = await supabase
      .from("mp_credentials")
      .select("mp_user_id, expires_at")
      .eq("trainer_id", user.id)
      .maybeSingle();

    if (mp) setMpCred(mp);
  }, [supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleOwnerSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setOwnerSaving(true);
    setOwnerMsg("");
    await supabase
      .from("profiles")
      .update({ full_name: ownerName, phone: ownerPhone })
      .eq("id", userId);
    setOwnerSaving(false);
    setOwnerMsg("Guardado");
    setTimeout(() => setOwnerMsg(""), 3000);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 5 * 1024 * 1024) {
      setOwnerMsg("La imagen no puede superar 5 MB");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("role", "trainer");
    formData.append("entityId", userId);
    const response = await fetch("/api/upload-avatar", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    if (!response.ok || !result.url) {
      setOwnerMsg(result.error || "No se pudo subir la imagen");
      return;
    }
    setOwnerAvatar(result.url);
    setOwnerMsg("Foto actualizada");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!gymId) return;
    setLoading(true);
    setSaved(false);

    await supabase
      .from("gyms")
      .update({
        name,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      })
      .eq("id", gymId);

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const subStatus = subscription?.status || "none";
  const mpConnected = !!mpCred;
  const mpExpired = mpCred?.expires_at
    ? new Date(mpCred.expires_at) < new Date()
    : false;

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
          <h1>Configuración</h1>
          <p className="sub">Gimnasio, suscripción y pagos</p>
        </div>
      </div>

      {/* ── Datos del gimnasio ── */}
      <div className="panel" style={{ maxWidth: 560, marginBottom: 20 }}>
        <div className="panel-head">
          <span>Datos del gimnasio</span>
        </div>
        <div style={{ padding: "22px 22px" }}>
          <form onSubmit={handleSave}>
            <div className="field">
              <label>Nombre del gimnasio</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mi Gimnasio"
                required
              />
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Color primario</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{
                      width: 44,
                      height: 44,
                      padding: 3,
                      cursor: "pointer",
                      border: "1px solid var(--line)",
                      borderRadius: 10,
                      background: "var(--card)",
                    }}
                  />
                  <input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Color secundario</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    style={{
                      width: 44,
                      height: 44,
                      padding: 3,
                      cursor: "pointer",
                      border: "1px solid var(--line)",
                      borderRadius: 10,
                      background: "var(--card)",
                    }}
                  />
                  <input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
              <button
                className="btn btn-primary"
                disabled={loading}
                style={{ width: "auto", padding: "11px 28px" }}
              >
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
              {saved && (
                <span style={{ color: "var(--green)", fontSize: 14, fontWeight: 500 }}>
                  Guardado correctamente
                </span>
              )}
            </div>
          </form>
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
                    $2500
                    <span style={{ fontSize: 14, fontWeight: 400, color: "var(--gray)" }}> UYU/mes</span>
                  </div>
                  <div style={{ fontSize: 14, color: "var(--gray)", marginTop: 2 }}>
                    Plan Team · Hasta 5 trainers · 3% comisión
                  </div>
                </div>
                <span className={`badge ${subBadge[subStatus]}`}>{subLabel[subStatus]}</span>
              </div>
              <div className="config-status-ok">
                <span>✓</span> Tu suscripción está activa. Gracias por usar TrainerFlow.
              </div>
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
                <div className="config-plan-card config-plan-featured">
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cyan)", marginBottom: 4 }}>Team · Para gimnasios</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    $2500<span style={{ fontSize: 13, fontWeight: 400, color: "var(--gray)" }}> UYU/mes</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--gray)", margin: "8px 0 16px" }}>
                    Hasta 5 trainers, panel admin, 3% comisión.
                  </div>
                  <a
                    href="/api/mp/subscribe?plan=team"
                    className="btn btn-primary"
                    style={{ width: "100%", background: "linear-gradient(135deg, var(--violet), var(--cyan))" }}
                  >
                    {subStatus === "none" ? "Suscribirme" : "Reanudar suscripción"}
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Trial info ── */}
      {profile?.trial_ends_at && profile?.subscription_status !== "active" && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-head">Período de prueba</div>
          <div style={{ padding: "20px" }}>
            <div style={{ fontSize: 14, color: "var(--gray)", lineHeight: 1.5 }}>
              Tu trial de 15 días{" "}
              {new Date(profile.trial_ends_at) > new Date() ? (
                <>
                  termina el{" "}
                  <strong style={{ color: "var(--ink)" }}>
                    {new Date(profile.trial_ends_at).toLocaleDateString("es-UY", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                  . Elegí un plan antes de que expire para no perder acceso.
                </>
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
            {" "}· Para recibir pagos de los clientes
          </span>
        </div>
        <div style={{ padding: "20px" }}>
          <div style={{ fontSize: 14, color: "var(--gray)", marginBottom: 16, lineHeight: 1.5 }}>
            Conectá tu cuenta de MercadoPago para que las cuotas de los clientes
            de tu gym lleguen directo a tu cuenta. TrainerFlow cobra una comisión
            del {subscription?.plan === "team" ? "3%" : "5%"} por procesamiento.
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
              style={{ width: "100%" }}
            >
              Conectar MercadoPago
            </a>
          )}
        </div>
      </div>

      {/* ── Perfil del propietario ── */}
      <div className="panel" style={{ maxWidth: 560, marginBottom: 20 }}>
        <div className="panel-head">Perfil del propietario</div>
        <div style={{ padding: "22px" }}>
          <div className="profile-avatar-section" style={{ marginBottom: 18 }}>
            <div
              style={{
                width: 72, height: 72, borderRadius: 14, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 600, color: "var(--violet2)",
                background: ownerAvatar ? `url(${ownerAvatar}) center/cover no-repeat` : "var(--violet-bg)",
                border: "1px solid rgba(124,108,240,0.15)",
              }}
            >
              {!ownerAvatar && (ownerName?.[0]?.toUpperCase() || "?")}
            </div>
            <div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ width: "auto" }}
                onClick={() => avatarInput.current?.click()}
              >
                Cambiar foto
              </button>
              <input
                ref={avatarInput}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarUpload}
              />
              <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 4 }}>
                JPG o PNG, máximo 2 MB
              </div>
            </div>
          </div>
          <form onSubmit={handleOwnerSave}>
            <div className="profile-fields">
              <div className="profile-field">
                <label>Nombre completo</label>
                <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Tu nombre" />
              </div>
              <div className="profile-field">
                <label>Teléfono</label>
                <input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="+598 99 123 456" />
              </div>
              <div className="profile-field">
                <label>Email</label>
                <input value={userEmail} disabled style={{ opacity: 0.6 }} />
              </div>
            </div>
            <div className="profile-actions">
              {ownerMsg && <span className="profile-msg ok">{ownerMsg}</span>}
              <button type="submit" className="btn btn-primary btn-sm" disabled={ownerSaving} style={{ width: "auto" }}>
                {ownerSaving ? "Guardando..." : "Guardar perfil"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Notificaciones ── */}
      {userId && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-head">Notificaciones por email</div>
          <div style={{ padding: "12px 20px" }}>
            <NotificationPrefs userId={userId} role="gym" />
          </div>
        </div>
      )}

      {/* ── Seguridad ── */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">Seguridad</div>
        <div style={{ padding: "20px" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "var(--gray)", marginBottom: 4 }}>Email de la cuenta</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{userEmail}</div>
          </div>
          <ChangePasswordForm />
        </div>
      </div>

      {/* ── Cómo funcionan los cobros ── */}
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
                ${subscription?.plan === "team" ? "2500" : "1200"} UYU/mes (
                {subscription?.plan === "team" ? "Team" : "Pro"}) aparte, para usar la plataforma.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
