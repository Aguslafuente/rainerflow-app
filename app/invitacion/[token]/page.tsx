"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark, LogoLockup } from "@/components/Logo";

export default function InvitacionPage() {
  const router = useRouter();
  const params = useParams();
  const token = String(params.token ?? "");
  const supabase = createClient();

  const [info, setInfo] = useState<{ client_name: string; trainer_name: string } | null>(null);
  const [checked, setChecked] = useState(false);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .rpc("invite_info", { p_token: token })
      .then(({ data }) => {
        if (data && data.length) setInfo(data[0]);
        setChecked(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function claimAndGo() {
    const { data, error } = await supabase.rpc("claim_client", { p_token: token });
    if (error || !data) {
      setError(
        "No pudimos vincular tu cuenta a la invitación. Puede que el link ya se haya usado."
      );
      return;
    }
    router.push("/portal");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setLoading(false);
        setError(error.message);
        return;
      }
      if (data.session) {
        await claimAndGo();
      } else {
        setNotice(
          "Cuenta creada. Revisá tu email para confirmar y después volvé a abrir este mismo link."
        );
        setMode("login");
      }
      setLoading(false);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        setError("Email o contraseña incorrectos.");
        return;
      }
      await claimAndGo();
      setLoading(false);
    }
  }

  const firstName = info?.client_name?.split(" ")[0];

  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <LogoLockup size={40} color="#fff" accent="#c4b5fd" />
        <h2>
          {firstName ? `¡Hola, ${firstName}!` : "¡Bienvenido/a!"}
          <br />
          Activá tu acceso
        </h2>
        <p>
          {info?.trainer_name ?? "Tu entrenador"} te invitó a TrainerFlow. Creá tu
          cuenta para ver tu plan, seguir tu progreso y estar en contacto directo.
        </p>
      </div>

      <div className="auth-main">
        <div className="auth-card">
          <div style={{ marginBottom: 24 }}>
            <LogoMark size={44} radius={12} />
          </div>
          <h1>{mode === "signup" ? "Creá tu cuenta" : "Iniciá sesión"}</h1>
          <p className="sub">
            {checked && !info
              ? "Esta invitación no es válida o ya fue utilizada."
              : mode === "signup"
              ? "Elegí un email y contraseña para acceder."
              : "Ingresá con tu cuenta para continuar."}
          </p>

          {error && <div className="error">{error}</div>}
          {notice && <div className="notice">{notice}</div>}

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
            <div className="field">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <button className="btn btn-primary" disabled={loading}>
              {loading
                ? "Un momento…"
                : mode === "signup"
                ? "Crear cuenta y entrar"
                : "Entrar"}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: 14, color: "var(--gray)" }}>
            {mode === "signup" ? "¿Ya tenés cuenta? " : "¿No tenés cuenta? "}
            <span
              className="link"
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setError(null);
                setNotice(null);
              }}
            >
              {mode === "signup" ? "Iniciá sesión" : "Registrate"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
