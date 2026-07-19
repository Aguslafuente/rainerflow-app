"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Prefs {
  email_new_client: boolean;
  email_payment: boolean;
  email_message: boolean;
  email_weekly_report: boolean;
}

const defaultPrefs: Prefs = {
  email_new_client: true,
  email_payment: true,
  email_message: true,
  email_weekly_report: false,
};

const labels: Record<keyof Prefs, { label: string; desc: string }> = {
  email_new_client: {
    label: "Nuevo cliente",
    desc: "Cuando un nuevo cliente se registra o es agregado",
  },
  email_payment: {
    label: "Pagos",
    desc: "Cuando un cliente realiza un pago",
  },
  email_message: {
    label: "Mensajes",
    desc: "Cuando un cliente te envía un mensaje",
  },
  email_weekly_report: {
    label: "Resumen semanal",
    desc: "Recibir un resumen de tu semana cada lunes",
  },
};

export function NotificationPrefs({ userId, role = "trainer" }: { userId: string; role?: "trainer" | "gym" | "client" }) {
  const supabase = useMemo(() => createClient(), []);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const loadPrefs = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("notification_prefs")
      .eq("id", userId)
      .single();

    if (data?.notification_prefs) {
      setPrefs({ ...defaultPrefs, ...data.notification_prefs });
    }
  }, [supabase, userId]);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  async function handleToggle(key: keyof Prefs) {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);

    await supabase
      .from("profiles")
      .update({ notification_prefs: updated })
      .eq("id", userId);

    setSaving(false);
    setMsg("Guardado");
    setTimeout(() => setMsg(""), 2000);
  }

  // Filter visible prefs based on role
  const visibleKeys = role === "client"
    ? (["email_message", "email_payment"] as (keyof Prefs)[])
    : (Object.keys(labels) as (keyof Prefs)[]);

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {visibleKeys.map((key) => (
          <div
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 0",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                {labels[key].label}
              </div>
              <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 2 }}>
                {labels[key].desc}
              </div>
            </div>
            <button
              onClick={() => handleToggle(key)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                position: "relative",
                flexShrink: 0,
                transition: "background 0.2s",
                background: prefs[key] ? "var(--violet)" : "var(--line)",
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  background: "#fff",
                  position: "absolute",
                  top: 3,
                  left: prefs[key] ? 23 : 3,
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>
        ))}
      </div>
      {msg && (
        <div style={{ fontSize: 12, color: "var(--green)", marginTop: 8 }}>{msg}</div>
      )}
    </div>
  );
}
