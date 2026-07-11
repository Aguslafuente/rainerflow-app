"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LandingConfigForm({
  profile,
}: {
  profile: {
    id: string;
    slug: string | null;
    public_visible: boolean | null;
    tagline: string | null;
    services: string | null;
  };
}) {
  const supabase = createClient();
  const [slug, setSlug] = useState(profile.slug || "");
  const [visible, setVisible] = useState(profile.public_visible || false);
  const [tagline, setTagline] = useState(profile.tagline || "");
  const [services, setServices] = useState(profile.services || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://trainerflow-uy.netlify.app";
  const landingUrl = `${baseUrl}/t/${slug}`;

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);

    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const { error: err } = await supabase
      .from("profiles")
      .update({
        slug: cleanSlug,
        public_visible: visible,
        tagline,
        services,
      })
      .eq("id", profile.id);

    if (err) {
      setError(
        err.message.includes("unique")
          ? "Ese slug ya está en uso, elegí otro."
          : err.message
      );
    } else {
      setSlug(cleanSlug);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Toggle visible */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
        }}
      >
        <div
          onClick={() => setVisible(!visible)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            background: visible
              ? "var(--violet)"
              : "rgba(255,255,255,0.1)",
            position: "relative",
            transition: "background 0.2s",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#fff",
              position: "absolute",
              top: 3,
              left: visible ? 23 : 3,
              transition: "left 0.2s",
            }}
          />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            Landing pública activa
          </div>
          <div style={{ fontSize: 12, color: "var(--gray)" }}>
            Cualquier persona con el link puede ver tu perfil
          </div>
        </div>
      </label>

      {/* Slug */}
      <div className="field" style={{ marginBottom: 0 }}>
        <label>URL de tu landing</label>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <div
            style={{
              padding: "11px 12px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--line)",
              borderRight: "none",
              borderRadius: "12px 0 0 12px",
              fontSize: 14,
              color: "var(--gray)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "50%",
            }}
          >
            .../t/
          </div>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="tu-nombre"
            style={{
              borderRadius: "0 12px 12px 0",
              borderLeft: "none",
              flex: 1,
            }}
          />
        </div>
      </div>

      {/* Tagline */}
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Tagline</label>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Ej: Entrenamiento personalizado para resultados reales"
        />
      </div>

      {/* Services */}
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Servicios (uno por línea)</label>
        <textarea
          value={services}
          onChange={(e) => setServices(e.target.value)}
          placeholder={"Entrenamiento presencial\nEntrenamiento online\nPlan de nutrición\nSeguimiento semanal"}
          style={{ minHeight: 80 }}
        />
      </div>

      {error && <div className="error">{error}</div>}
      {saved && (
        <div className="notice">
          ✓ Guardado.{" "}
          {visible && (
            <a
              href={landingUrl}
              target="_blank"
              rel="noopener"
              style={{ color: "var(--violet2)", textDecoration: "underline" }}
            >
              Ver tu landing →
            </a>
          )}
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Guardando..." : "Guardar landing"}
      </button>

      {visible && slug && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--card)",
            borderRadius: 12,
            border: "1px solid var(--line)",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: "var(--gray)" }}>Tu link público:</span>
          <a
            href={landingUrl}
            target="_blank"
            rel="noopener"
            style={{
              color: "var(--violet2)",
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            {landingUrl.replace("https://", "")}
          </a>
        </div>
      )}
    </div>
  );
}
