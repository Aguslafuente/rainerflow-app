"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";
import { Suspense } from "react";

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteContent />
    </Suspense>
  );
}

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const gymId = searchParams.get("gym");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"loading" | "login_required" | "accepting" | "done" | "error">("loading");
  const [gymName, setGymName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const checkAuth = useCallback(async () => {
    if (!gymId || !email) {
      setStatus("error");
      setErrorMsg("Link de invitación inválido.");
      return;
    }

    // Get gym name
    const { data: gym } = await supabase
      .from("gyms")
      .select("name")
      .eq("id", gymId)
      .single();

    if (gym) setGymName(gym.name);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("login_required");
      return;
    }

    // Check email matches
    if (user.email?.toLowerCase() !== decodeURIComponent(email).toLowerCase()) {
      setStatus("error");
      setErrorMsg(`Iniciá sesión con ${decodeURIComponent(email)} para aceptar la invitación.`);
      return;
    }

    setStatus("accepting");
  }, [email, gymId, supabase]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  async function acceptInvite() {
    setStatus("loading");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("error");
      setErrorMsg("No se pudo verificar tu sesión.");
      return;
    }

    // Update gym_trainers record
    const { error } = await supabase
      .from("gym_trainers")
      .update({
        trainer_id: user.id,
        status: "active",
        joined_at: new Date().toISOString(),
      })
      .eq("gym_id", gymId!)
      .eq("email", decodeURIComponent(email!).toLowerCase());

    if (error) {
      setStatus("error");
      setErrorMsg("No se pudo aceptar la invitación. Puede que ya haya expirado.");
      return;
    }

    setStatus("done");
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  }

  return (
    <div className="auth-wrap" style={{ justifyContent: "center" }}>
      <div className="auth-main" style={{ flex: "none", width: "100%", maxWidth: 440 }}>
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 24 }}>
            <LogoMark size={44} radius={12} />
          </div>

          {status === "loading" && <p style={{ color: "var(--gray)" }}>Cargando...</p>}

          {status === "login_required" && (
            <>
              <h1>Invitación de {gymName || "un gimnasio"}</h1>
              <p className="sub" style={{ marginBottom: 24 }}>
                Necesitás iniciar sesión o crear una cuenta para aceptar la invitación.
              </p>
              <a
                href={`/login?ref_gym=${gymId}&ref_email=${encodeURIComponent(email || "")}`}
                className="btn btn-primary"
                style={{ display: "inline-block", textDecoration: "none" }}
              >
                Iniciar sesión / Registrarse
              </a>
            </>
          )}

          {status === "accepting" && (
            <>
              <h1>Unirte a {gymName}</h1>
              <p className="sub" style={{ marginBottom: 24 }}>
                {gymName} te invitó como entrenador. ¿Aceptás la invitación?
              </p>
              <button className="btn btn-primary" onClick={acceptInvite}>
                Aceptar invitación
              </button>
            </>
          )}

          {status === "done" && (
            <>
              <h1>Listo</h1>
              <p className="sub">
                Te uniste a {gymName}. Redirigiendo a tu dashboard...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <h1>Error</h1>
              <p className="sub" style={{ color: "#ef4444" }}>{errorMsg}</p>
              <a href="/login" className="btn btn-ghost" style={{ marginTop: 16, display: "inline-block", textDecoration: "none" }}>
                Ir al login
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
