"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Trainer {
  id: string;
  email: string;
  status: string;
  invited_at: string;
  joined_at: string | null;
  trainer_id: string | null;
  profiles?: { full_name: string | null } | null;
}

export default function GymTrainersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTrainers = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: gym } = await supabase
      .from("gyms")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!gym) return;

    const { data } = await supabase
      .from("gym_trainers")
      .select("id, email, status, invited_at, joined_at, trainer_id, profiles:trainer_id(full_name, avatar_url)")
      .eq("gym_id", gym.id)
      .neq("status", "removed")
      .order("invited_at", { ascending: false });

    setTrainers((data as any) || []);
  }, [supabase]);

  useEffect(() => {
    loadTrainers();
  }, [loadTrainers]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const res = await fetch("/api/gym/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(result.error);
      return;
    }

    setMessage("Invitación enviada.");
    setEmail("");
    loadTrainers();
  }

  async function handleRemove(id: string) {
    if (!confirm("¿Seguro que querés remover este entrenador?")) return;

    await supabase
      .from("gym_trainers")
      .update({ status: "removed" })
      .eq("id", id);

    loadTrainers();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Entrenadores</h1>
          <p className="sub">Invitá y gestioná entrenadores de tu gimnasio</p>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-head">
          <span>Invitar entrenador</span>
        </div>
        <div style={{ padding: "18px 22px" }}>
          {error && <div className="error">{error}</div>}
          {message && <div className="notice">{message}</div>}
          <form onSubmit={handleInvite} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Email del entrenador</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@entrenador.com"
                required
              />
            </div>
            <button
              className="btn btn-primary"
              disabled={loading}
              style={{ width: "auto", padding: "11px 24px", marginBottom: 0, flexShrink: 0 }}
            >
              {loading ? "Enviando..." : "Invitar"}
            </button>
          </form>
        </div>
      </div>

      {trainers.length === 0 ? (
        <div className="panel">
          <div className="empty">
            <div className="empty-ico">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="big">Sin entrenadores</div>
            Invitá al primero con su email usando el formulario de arriba.
          </div>
        </div>
      ) : (
        <div className="panel">
          <table className="list">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 600, color: "var(--violet2)",
                        background: (t.profiles as any)?.avatar_url
                          ? `url(${(t.profiles as any).avatar_url}) center/cover no-repeat`
                          : "var(--violet-bg)",
                        border: "1px solid rgba(124,108,240,0.15)",
                      }}>
                        {!(t.profiles as any)?.avatar_url && (
                          ((t.profiles as any)?.full_name || t.email)
                            .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <span style={{ color: "var(--ink)", fontWeight: 500 }}>{t.email}</span>
                    </div>
                  </td>
                  <td>{(t.profiles as any)?.full_name || "—"}</td>
                  <td>
                    <span className={`badge ${t.status === "active" ? "activo" : "trial"}`}>
                      {t.status === "active" ? "Activo" : "Pendiente"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemove(t.id)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
