"use client";

import { useState } from "react";

export function ReferralSection({
  referralCode,
  referralCount,
  convertedCount,
  totalCommission,
}: {
  referralCode: string;
  referralCount: number;
  convertedCount: number;
  totalCommission: number;
}) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyLink() {
    const link = `${window.location.origin}/login?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div style={{ fontSize: 14, color: "var(--gray)", marginBottom: 16, lineHeight: 1.5 }}>
        Compartí tu código con otros entrenadores. Cuando se registren con tu código,
        los trackearemos como referidos tuyos.
      </div>

      <div className="referral-code-box">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--gray)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Tu código
          </div>
          <div className="referral-code-value">{referralCode}</div>
        </div>
        <button className="referral-copy-btn" onClick={copyCode}>
          {copied ? "✓ Copiado" : "Copiar"}
        </button>
        <button className="referral-copy-btn" onClick={copyLink}>
          Copiar link
        </button>
      </div>

      <div className="referral-stats">
        <div className="referral-stat">
          <div className="referral-stat-val">{referralCount}</div>
          <div className="referral-stat-label">Registrados</div>
        </div>
        <div className="referral-stat">
          <div className="referral-stat-val">{convertedCount}</div>
          <div className="referral-stat-label">Suscriptos</div>
        </div>
        <div className="referral-stat">
          <div className="referral-stat-val">{totalCommission}%</div>
          <div className="referral-stat-label">Tu comisión</div>
        </div>
      </div>
    </>
  );
}
