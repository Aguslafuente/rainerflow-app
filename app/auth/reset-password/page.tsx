"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setError(
        error.message === "New password should be different from the old password."
          ? "La nueva contraseña debe ser diferente a la anterior."
          : "No se pudo actualizar la contraseña. El enlace puede haber expirado."
      );
      return;
    }

    setSuccess(true);

    // Sign out and redirect to login after 2 seconds
    setTimeout(async () => {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    }, 2000);
  }

  return (
    <div className="auth-wrap" style={{ justifyContent: "center" }}>
      <div className="auth-main" style={{ flex: "none", width: "100%", maxWidth: 440 }}>
        <div className="auth-card">
          <div style={{ marginBottom: 24 }}>
            <LogoMark size={44} radius={12} />
          </div>
          <h1>Nueva contraseña</h1>
          <p className="sub">Elegí una nueva contraseña para tu cuenta.</p>

          {error && <div className="error">{error}</div>}

          {success ? (
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
              Tu contraseña fue actualizada correctamente. Redirigiendo al
              login...
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              <div className="field">
                <label>Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? "Actualizando..." : "Cambiar contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
