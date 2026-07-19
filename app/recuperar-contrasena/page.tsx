"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Ocurrió un error. Intentá de nuevo.");
      return;
    }

    setSent(true);
  }

  return (
    <div className="auth-wrap" style={{ justifyContent: "center" }}>
      <div className="auth-main" style={{ flex: "none", width: "100%", maxWidth: 440 }}>
        <div className="auth-card">
          <div style={{ marginBottom: 24 }}>
            <LogoMark size={44} radius={12} />
          </div>
          <h1>Recuperar contraseña</h1>
          <p className="sub">
            Ingresá tu email y te enviaremos un enlace para cambiar tu
            contraseña.
          </p>

          {error && <div className="error">{error}</div>}

          {sent ? (
            <div
              className="notice"
              style={{
                marginTop: 16,
                background: "rgba(124,108,240,0.1)",
                padding: 16,
                borderRadius: 8,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Si existe una cuenta asociada a ese correo, recibirás un enlace
              para cambiar la contraseña. Revisá tu bandeja de entrada y la
              carpeta de spam.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vos@email.com"
                  required
                />
              </div>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
          )}

          <p style={{ marginTop: 20, fontSize: 14, color: "var(--gray)" }}>
            <Link href="/login" className="link">
              Volver al login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
