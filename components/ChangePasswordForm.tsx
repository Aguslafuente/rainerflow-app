"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordForm() {
  const supabase = createClient();
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    if (newPass.length < 6) {
      setMsg("La contraseña debe tener al menos 6 caracteres.");
      setIsError(true);
      return;
    }
    if (newPass !== confirm) {
      setMsg("Las contraseñas no coinciden.");
      setIsError(true);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setLoading(false);

    if (error) {
      setMsg(error.message || "Error al cambiar la contraseña.");
      setIsError(true);
    } else {
      setMsg("Contraseña actualizada correctamente.");
      setIsError(false);
      setCurrent("");
      setNewPass("");
      setConfirm("");
    }
    setTimeout(() => setMsg(""), 4000);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="profile-fields">
        <div className="profile-field">
          <label>Nueva contraseña</label>
          <input
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
          />
        </div>
        <div className="profile-field">
          <label>Confirmar contraseña</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repetí la contraseña"
            required
          />
        </div>
      </div>
      <div className="profile-actions">
        {msg && (
          <span className={`profile-msg ${isError ? "error" : "ok"}`}>{msg}</span>
        )}
        <button type="submit" className="btn btn-primary btn-sm" disabled={loading} style={{ width: "auto" }}>
          {loading ? "Cambiando..." : "Cambiar contraseña"}
        </button>
      </div>
    </form>
  );
}
