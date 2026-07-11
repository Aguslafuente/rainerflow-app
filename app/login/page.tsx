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
      // ── Admin shortcut ──
      if (email.toLowerCase() === "admin@admin.com") {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase(), password }),
        });
        setLoading(false);
        if (!res.ok) {
          setError("Email o contraseña incorrectos.");
          return;
        }
        router.push("/admin");
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) {
        setError("Email o contraseña incorrectos.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, business_name: business } },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }

      // If referral code was provided, record it
      if (data.user && refCode.trim()) {
        const code = refCode.trim().toLowerCase();
        // Look up the referrer by code
        const { data: referrer } = await supabase
          .from("profiles")
          .select("id")
          .eq("referral_code", code)
          .maybeSingle();
        if (referrer) {
          await supabase.from("profiles").update({ referred_by: referrer.id }).eq("id", data.user.id);
          await supabase.from("referrals").insert({
            referrer_id: referrer.id,
            referred_id: data.user.id,
            code_used: code,
          });
        }
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setNotice(
          "Cuenta creada. Revisá tu email para confirmar y después iniciá sesión."
        );
        setMode("login");
      }
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
                  <label>Tu nombre</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
                <div className="field">
                  <label>Nombre de tu negocio</label>
                  <input
                    value={business}
                    onChange={(e) => setBusiness(e.target.value)}
                    placeholder="JP Training"
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
