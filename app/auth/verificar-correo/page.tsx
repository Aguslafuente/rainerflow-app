"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";

export default function VerificarCorreoPage() {
  const router = useRouter();
  const supabase = createClient();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setSending(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setError("No se pudo obtener tu email.");
      setSending(false);
      return;
    }

    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    });

    setSending(false);
    if (res.ok) {
      setSent(true);
    } else {
      setError("No se pudo reenviar el correo. Intentá de nuevo en unos minutos.");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="paywall-wrap">
      <div className="paywall-card" style={{ maxWidth: 440 }}>
        <LogoMark size={48} radius={12} />
        <h1 style={{ marginTop: 16 }}>Verificá tu correo electrónico</h1>
        <p style={{ color: "var(--gray)", fontSize: 14, lineHeight: 1.6 }}>
          Te enviamos un enlace de verificación a tu correo. Abrí el enlace para
          activar tu cuenta.
        </p>
        <p style={{ color: "var(--gray)", fontSize: 13, marginTop: 8 }}>
          Revisá también la carpeta de correo no deseado (spam).
        </p>

        {error && (
          <div className="error" style={{ marginTop: 16 }}>
            {error}
          </div>
        )}

        {sent ? (
          <div
            className="notice"
            style={{ marginTop: 16, background: "rgba(124,108,240,0.1)", padding: 12, borderRadius: 8, fontSize: 14 }}
          >
            Correo reenviado. Revisá tu bandeja de entrada.
          </div>
        ) : (
          <button
            onClick={handleResend}
            disabled={sending}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 20 }}
          >
            {sending ? "Enviando..." : "Reenviar correo de verificación"}
          </button>
        )}

        <button
          onClick={handleLogout}
          style={{
            marginTop: 16,
            fontSize: 13,
            color: "var(--gray)",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
