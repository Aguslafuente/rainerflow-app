"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";

export function PortalHeader() {
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="portal-header">
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <LogoMark size={32} radius={8} />
        <span style={{ fontWeight: 700, fontSize: 18 }}>
          Trainer<span style={{ color: "var(--violet)" }}>Flow</span>
        </span>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={logout}>
        Cerrar sesión
      </button>
    </header>
  );
}
