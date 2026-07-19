"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark, LogoLockup } from "@/components/Logo";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [accountType, setAccountType] = useState<"trainer" | "gym" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [refCode, setRefCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Pre-fill referral code from URL param
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setRefCode(ref);
      setMode("signup");
    }
  }, [searchParams]);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    if (mode === "login") {
      const { error, data: signInData } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) {
        setError("Email o contraseña incorrectos.");
        return;
      }
      // Check account type to redirect correctly
      if (signInData.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("account_type")
          .eq("id", signInData.user.id)
          .single();
        router.push(prof?.account_type === "gym" ? "/gym" : "/dashboard");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } else {
      // Use server-side registration with generateLink + Nodemailer
      if (!accountType) {
        setError("Seleccioná un tipo de cuenta.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: name,
          business_name: business,
          account_type: accountType,
          referral_code: refCode.trim() || undefined,
        }),
      });
      const result = await res.json();
      setLoading(false);

      if (!res.ok && result.error) {
        setError(result.error);
        return;
      }

      setNotice(
        "Te enviamos un correo de verificación. Abrí el enlace recibido para confirmar tu cuenta. Revisá también la carpeta de correo no deseado."
      );
      setMode("login");
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <div className="auth-blob" />
        <LogoLockup size={40} color="#fff" accent="#c4b5fd" />
        <h2>
          El software todo en uno
          <br />
          para personal trainers
        </h2>
        <p>
          Administrá tus clientes, rutinas, pagos y agenda desde un solo lugar.
        </p>
      </div>

      <div className="auth-main">
        <div className="auth-card">
          <div style={{ marginBottom: 24 }}>
            <LogoMark size={44} radius={12} />
          </div>
          <h1>{mode === "login" ? "Iniciá sesión" : "Creá tu cuenta"}</h1>
          <p className="sub">
            {mode === "login"
              ? "Bienvenido de vuelta a TrainerFlow."
              : "15 días gratis. Sin tarjeta. Cancelá cuando quieras."}
          </p>

          {error && <div className="error">{error}</div>}
          {notice && <div className="notice">{notice}</div>}

          <form onSubmit={handleSubmit}>
            {mode === "signup" && (
              <>
                <div className="field">
                  <label>Tipo de cuenta</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {(["trainer", "gym"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAccountType(t)}
                        style={{
                          flex: 1,
                          padding: "14px 12px",
                          borderRadius: 10,
                          border: accountType === t ? "2px solid var(--violet)" : "2px solid var(--border)",
                          background: accountType === t ? "rgba(124,108,240,0.12)" : "var(--card)",
                          color: accountType === t ? "#fff" : "var(--gray)",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 14,
                          transition: "all .15s",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{t === "trainer" ? "🏋️" : "🏢"}</div>
                        {t === "trainer" ? "Entrenador" : "Gimnasio"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>Tu nombre</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
                <div className="field">
                  <label>{accountType === "gym" ? "Nombre del gimnasio" : "Nombre de tu negocio"}</label>
                  <input
                    value={business}
                    onChange={(e) => setBusiness(e.target.value)}
                    placeholder={accountType === "gym" ? "Fitness Center" : "JP Training"}
                    required={accountType === "gym"}
                  />
                </div>
                <div className="field">
                  <label>Código de invitación <span style={{ color: "var(--gray)", fontWeight: 400 }}>(opcional)</span></label>
                  <input
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value)}
                    placeholder="ej: juan-a1b2c3"
                  />
                </div>
              </>
            )}
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
                : mode === "login"
                ? "Entrar"
                : "Crear cuenta"}
            </button>
          </form>

          {mode === "login" && (
            <p style={{ marginTop: 12, fontSize: 13, textAlign: "center" }}>
              <a href="/recuperar-contrasena" className="link" style={{ color: "var(--gray)" }}>
                ¿Olvidaste tu contraseña?
              </a>
            </p>
          )}

          <p style={{ marginTop: 20, fontSize: 14, color: "var(--gray)" }}>
            {mode === "login" ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
            <span
              className="link"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
                setNotice(null);
              }}
            >
              {mode === "login" ? "Registrate" : "Iniciá sesión"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
