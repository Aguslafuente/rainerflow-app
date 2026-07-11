"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";

export function PaywallScreen({ name }: { name: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="paywall-wrap">
      <div className="paywall-card">
        <LogoMark size={48} radius={12} />
        <h1>Tu período de prueba terminó</h1>
        <p>
          {name ? `Hola ${name}! ` : ""}Tu prueba gratuita de 15 días expiró.
          Elegí un plan para seguir gestionando tus clientes, rutinas y pagos con TrainerFlow.
        </p>

        <div className="paywall-plans">
          <div className="paywall-plan">
            <div className="paywall-plan-name">Pro</div>
            <div className="paywall-plan-price">
              USD 19.99<span>/mes</span>
            </div>
            <div className="paywall-plan-desc">
              Clientes ilimitados · 5% comisión
            </div>
            <a href="/api/mp/subscribe?plan=pro" className="btn btn-primary" style={{ width: "100%" }}>
              Elegir Pro
            </a>
          </div>
          <div className="paywall-plan featured">
            <div className="paywall-plan-badge">Más popular</div>
            <div className="paywall-plan-name">Team</div>
            <div className="paywall-plan-price">
              USD 49.99<span>/mes</span>
            </div>
            <div className="paywall-plan-desc">
              Hasta 5 trainers · 3% comisión
            </div>
            <a
              href="/api/mp/subscribe?plan=team"
              className="btn btn-primary"
              style={{ width: "100%", background: "linear-gradient(135deg, var(--violet), var(--cyan))" }}
            >
              Elegir Team
            </a>
          </div>
        </div>

        <div className="paywall-footer">
          <p>
            ¿Tenés dudas? Escribinos a{" "}
            <a href="mailto:soporte@trainerflow.com">soporte@trainerflow.com</a>
          </p>
          <button
            onClick={handleLogout}
            style={{
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
    </div>
  );
}
