"use client";

import { useState, useEffect } from "react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = document.cookie.includes("cookies_accepted=1");
    if (!accepted) setVisible(true);
  }, []);

  function accept() {
    document.cookie = "cookies_accepted=1; path=/; max-age=31536000; SameSite=Lax";
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: "16px 24px",
        background: "var(--card, #1c1c28)",
        borderTop: "1px solid var(--line, #2a2a3a)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        flexWrap: "wrap",
        fontSize: 14,
        color: "var(--gray, #888)",
      }}
    >
      <span>
        Usamos cookies para mejorar tu experiencia. Al continuar, aceptás nuestro uso de cookies.
      </span>
      <button
        onClick={accept}
        style={{
          padding: "8px 20px",
          borderRadius: 8,
          border: "none",
          background: "var(--violet, #7c6cf0)",
          color: "#fff",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        Aceptar
      </button>
    </div>
  );
}
