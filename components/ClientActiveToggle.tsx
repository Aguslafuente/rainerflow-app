"use client";

import { useState, useTransition } from "react";

export function ClientActiveToggle({
  clientId,
  initialActive,
  toggleAction,
}: {
  clientId: string;
  initialActive: boolean;
  toggleAction: (clientId: string, isActive: boolean) => Promise<void>;
}) {
  const [isActive, setIsActive] = useState(initialActive);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const newValue = !isActive;
    setIsActive(newValue);
    startTransition(async () => {
      try {
        await toggleAction(clientId, newValue);
      } catch {
        setIsActive(!newValue); // revert on error
      }
    });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        onClick={handleToggle}
        disabled={isPending}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          cursor: isPending ? "wait" : "pointer",
          background: isActive ? "var(--violet, #7c6cf0)" : "var(--gray, #666)",
          position: "relative",
          transition: "background 0.2s",
          opacity: isPending ? 0.6 : 1,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: "block",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            position: "absolute",
            top: 3,
            left: isActive ? 23 : 3,
            transition: "left 0.2s",
          }}
        />
      </button>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>
          {isActive ? "Cliente habilitado" : "Cliente deshabilitado"}
        </div>
        <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 2 }}>
          {isActive
            ? "El cliente puede acceder al portal."
            : "Desactivá esta opción si el cliente no tiene el acceso al día. Sus datos y rutinas no serán eliminados."}
        </div>
      </div>
    </div>
  );
}
