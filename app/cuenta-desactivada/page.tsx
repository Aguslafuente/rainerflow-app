"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";

export default function CuentaDesactivadaPage() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="paywall-wrap">
      <div className="paywall-card" style={{ maxWidth: 440 }}>
        <LogoMark size={48} radius={12} />
        <h1 style={{ marginTop: 16 }}>Tu acceso está temporalmente desactivado</h1>
        <p
          style={{
            color: "var(--gray)",
            fontSize: 14,
            lineHeight: 1.6,
            marginTop: 8,
          }}
        >
          Contactá a tu entrenador para consultar el estado de tu cuenta.
        </p>
        <p
          style={{
            color: "var(--gray)",
            fontSize: 13,
            marginTop: 8,
          }}
        >
          Tus rutinas y datos permanecen guardados.
        </p>
        <button
          onClick={handleLogout}
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 24 }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
