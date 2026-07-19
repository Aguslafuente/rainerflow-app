"use client";

import Link from "next/link";

export function TrialBanner({
  trialEndsAt,
  subscriptionStatus,
  subscriptionExpiresAt,
  configPath = "/configuracion",
}: {
  trialEndsAt: string | null;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  configPath?: string;
}) {
  const now = new Date();

  // Banner de suscripción por vencer (5 días o menos)
  if (subscriptionStatus === "active" && subscriptionExpiresAt) {
    const expires = new Date(subscriptionExpiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    if (daysLeft <= 5) {
      return (
        <div className={`trial-banner ${daysLeft <= 2 ? "expired" : "urgent"}`}>
          <div className="trial-banner-text">
            {daysLeft === 0 ? (
              <>Tu suscripción vence <strong>hoy</strong>. Renová para no perder acceso.</>
            ) : (
              <>
                Te {daysLeft === 1 ? "queda" : "quedan"}{" "}
                <strong>{daysLeft} día{daysLeft !== 1 ? "s" : ""}</strong> para
                renovar tu suscripción o se bloqueará la interfaz.
              </>
            )}
          </div>
          <Link href={configPath} className="trial-banner-btn">
            Renovar ahora
          </Link>
        </div>
      );
    }

    return null;
  }

  // Banner de trial
  if (subscriptionStatus === "active" || !trialEndsAt) return null;

  const ends = new Date(trialEndsAt);
  const diffMs = ends.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const expired = daysLeft <= 0;

  return (
    <div className={`trial-banner ${expired ? "expired" : daysLeft <= 3 ? "urgent" : ""}`}>
      <div className="trial-banner-text">
        {expired ? (
          <>Tu período de prueba terminó. Suscribite para seguir usando TrainerFlow.</>
        ) : (
          <>
            Te quedan <strong>{daysLeft} día{daysLeft !== 1 ? "s" : ""}</strong> de prueba gratis.
          </>
        )}
      </div>
      <Link href={configPath} className="trial-banner-btn">
        {expired ? "Ver planes" : "Elegir plan"}
      </Link>
    </div>
  );
}
