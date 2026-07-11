"use client";

import Link from "next/link";

export function TrialBanner({
  trialEndsAt,
  subscriptionStatus,
}: {
  trialEndsAt: string | null;
  subscriptionStatus: string;
}) {
  // Don't show if active subscriber or no trial
  if (subscriptionStatus === "active" || !trialEndsAt) return null;

  const now = new Date();
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
      <Link href="/configuracion" className="trial-banner-btn">
        {expired ? "Ver planes" : "Elegir plan"}
      </Link>
    </div>
  );
}
