"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";

export function MobileHeader() {
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="mobile-header">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LogoMark size={30} radius={8} />
        <span style={{ fontWeight: 700, fontSize: 17, color: "#fff" }}>
          Trainer<span style={{ color: "#8b5cf6" }}>Flow</span>
        </span>
      </div>
      <button
        onClick={logout}
        aria-label="Cerrar sesión"
        style={{
          background: "transparent",
          border: "none",
          color: "#94a3b8",
          cursor: "pointer",
          padding: 6,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </header>
  );
}
